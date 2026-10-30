import re
import ast
import math
import logging
import datetime
from typing import Dict, Any, List, Optional, Tuple
import httpx
from config import settings
from security import SecurityInspector

logger = logging.getLogger("InsightX.GitHub")

GITHUB_API = "https://api.github.com"
_TIMEOUT = 20.0
_MAX_FILE_BYTES = 150_000   # 150 KB per file
_MAX_FILES_SAMPLED = 60     # cap to stay within rate limits

_ALLOWED_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".cpp", ".c",
    ".h", ".cs", ".go", ".rs", ".sql", ".html", ".css",
    ".json", ".yaml", ".yml", ".md",
}


def _headers(token: Optional[str] = None) -> Dict[str, str]:
    tok = token or settings.GITHUB_TOKEN
    h = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    if tok:
        h["Authorization"] = f"Bearer {tok}"
    return h


def _parse_repo(url: str) -> Optional[Tuple[str, str]]:
    """Extract (owner, repo) from any GitHub URL variant or 'owner/repo' string."""
    url = url.strip().rstrip("/")
    # Full URL — capture owner/repo, ignore any trailing path (/tree/main, /blob/…, etc.)
    m = re.search(r"github\.com[/:]([^/]+)/([^/\s]+?)(?:\.git)?(?:/.*)?$", url)
    if m:
        return m.group(1), m.group(2)
    # Bare owner/repo
    parts = [p for p in url.split("/") if p]
    if len(parts) == 2:
        return parts[0], parts[1]
    return None


def _parse_file_content(fname: str, raw: str) -> Dict[str, Any]:
    """Run the same AST/regex analysis used by the ZIP parser on a single file."""
    ext = "." + fname.rsplit(".", 1)[-1].lower() if "." in fname else ""
    lines = raw.splitlines()
    loc = len(lines)
    complexity = 1.0
    functions_count = 0
    classes_count = 0
    imports: List[str] = []

    if ext == ".py":
        try:
            tree = ast.parse(raw)
            for node in ast.walk(tree):
                if isinstance(node, (ast.If, ast.For, ast.While, ast.ExceptHandler, ast.With)):
                    complexity += 1.0
                elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    functions_count += 1
                    complexity += 0.5
                elif isinstance(node, ast.ClassDef):
                    classes_count += 1
                elif isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.append(node.module)
        except Exception:
            complexity += len(re.findall(r"\b(if|for|while|try|except|with)\b", raw))
    else:
        complexity += len(re.findall(r"\b(if|for|while|try|catch|switch|case)\b", raw))
        functions_count = len(re.findall(r"\b(function|def|const\s+\w+\s*=\s*\(|class)\b", raw))
        classes_count = len(re.findall(r"\bclass\s+\w+", raw))
        imports.extend(re.findall(r"""(?:import|from|require)\s*[\(]?\s*["']([^"']+)["']""", raw))

    risk_score = round(min((complexity * 2.5) + (loc / 50.0), 99.0), 1)
    return {
        "file": fname,
        "loc": loc,
        "complexity": round(complexity, 2),
        "functions": functions_count,
        "classes": classes_count,
        "imports": list(set(imports)),
        "risk_score": risk_score,
    }


async def _fetch_file_tree(
    client: httpx.AsyncClient,
    owner: str,
    repo: str,
    branch: str,
    hdrs: Dict[str, str],
) -> List[str]:
    """Return list of file paths from the git tree (recursive)."""
    r = await client.get(
        f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{branch}",
        headers=hdrs,
        params={"recursive": "1"},
    )
    if r.status_code != 200:
        return []
    items = r.json().get("tree", [])
    return [
        item["path"]
        for item in items
        if item.get("type") == "blob"
        and "." + item["path"].rsplit(".", 1)[-1].lower() in _ALLOWED_EXTENSIONS
        and item.get("size", 0) <= _MAX_FILE_BYTES
    ]


async def _fetch_file_content(
    client: httpx.AsyncClient,
    owner: str,
    repo: str,
    path: str,
    hdrs: Dict[str, str],
) -> Optional[str]:
    """Fetch raw file content via GitHub Contents API."""
    r = await client.get(
        f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}",
        headers={**hdrs, "Accept": "application/vnd.github.raw+json"},
    )
    if r.status_code == 200:
        return r.text
    return None


async def analyze_github_repo(repo_url: str, token: Optional[str] = None) -> Dict[str, Any]:
    parsed = _parse_repo(repo_url)
    if not parsed:
        return {"error": "Invalid GitHub repository URL or owner/repo format."}

    owner, repo = parsed
    hdrs = _headers(token)

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        # ── Core repo metadata ──────────────────────────────────────────────
        repo_r = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}", headers=hdrs)
        if repo_r.status_code == 404:
            return {"error": f"Repository '{owner}/{repo}' not found or is private (token required)."}
        if repo_r.status_code == 403:
            return {"error": "GitHub API rate limit exceeded or insufficient token permissions."}
        repo_r.raise_for_status()
        repo_data = repo_r.json()
        default_branch = repo_data.get("default_branch", "main")

        # ── Parallel metadata fetches ───────────────────────────────────────
        commits_r, prs_r, issues_r, contributors_r, workflows_r, runs_r, deps_r = (
            await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/commits",
                headers=hdrs, params={"per_page": 50},
            ),
            await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/pulls",
                headers=hdrs, params={"state": "all", "per_page": 50},
            ),
            await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/issues",
                headers=hdrs, params={"state": "all", "per_page": 50},
            ),
            await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/contributors",
                headers=hdrs, params={"per_page": 30},
            ),
            await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/actions/workflows", headers=hdrs
            ),
            await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/actions/runs",
                headers=hdrs, params={"per_page": 10},
            ),
            await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/dependency-graph/sbom",
                headers={**hdrs, "Accept": "application/vnd.github+json"},
            ),
        )

        commits = commits_r.json() if commits_r.status_code == 200 else []
        prs = prs_r.json() if prs_r.status_code == 200 else []
        issues_raw = issues_r.json() if issues_r.status_code == 200 else []
        issues = [i for i in issues_raw if isinstance(i, dict) and "pull_request" not in i]
        contributors = contributors_r.json() if contributors_r.status_code == 200 else []
        workflows = workflows_r.json().get("workflows", []) if workflows_r.status_code == 200 else []
        runs = runs_r.json().get("workflow_runs", []) if runs_r.status_code == 200 else []
        sbom_packages: List[Dict] = []
        if deps_r.status_code == 200:
            sbom_packages = deps_r.json().get("sbom", {}).get("packages", [])

        # ── File tree + content sampling ────────────────────────────────────
        all_paths = await _fetch_file_tree(client, owner, repo, default_branch, hdrs)

        # Prioritise high-value files; cap total
        priority_exts = {".py", ".js", ".ts", ".java", ".go", ".rs", ".cs", ".cpp"}
        priority = [p for p in all_paths if "." + p.rsplit(".", 1)[-1].lower() in priority_exts]
        rest = [p for p in all_paths if p not in priority]
        sampled_paths = (priority + rest)[:_MAX_FILES_SAMPLED]

        parsed_files: List[Dict[str, Any]] = []
        raw_files_with_content: List[Dict[str, str]] = []
        detected_secrets: List[Dict[str, str]] = []
        blocked_files: List[str] = []

        for path in sampled_paths:
            # Security gate — same rules as ZIP parser
            allowed, reason = SecurityInspector.is_file_allowed(path)
            if not allowed:
                blocked_files.append(f"{path} ({reason})")
                continue

            raw = await _fetch_file_content(client, owner, repo, path, hdrs)
            if raw is None:
                continue

            sanitized, secrets = SecurityInspector.sanitize_text_and_detect_keys(raw)
            for s in secrets:
                s["file"] = path
            detected_secrets.extend(secrets)

            parsed_files.append(_parse_file_content(path, sanitized))
            raw_files_with_content.append({"file": path, "content": sanitized})

    # ── Derived metrics ─────────────────────────────────────────────────────
    now = datetime.datetime.now(datetime.timezone.utc)

    commit_authors: Dict[str, int] = {}
    commit_dates: List[datetime.datetime] = []
    for c in commits:
        if not isinstance(c, dict):
            continue
        author = (c.get("commit", {}).get("author") or {}).get("name", "unknown")
        commit_authors[author] = commit_authors.get(author, 0) + 1
        date_str = (c.get("commit", {}).get("author") or {}).get("date")
        if date_str:
            try:
                commit_dates.append(datetime.datetime.fromisoformat(date_str.replace("Z", "+00:00")))
            except ValueError:
                pass

    commit_frequency_per_week = 0.0
    if commit_dates:
        oldest = min(commit_dates)
        weeks = max((now - oldest).days / 7.0, 1.0)
        commit_frequency_per_week = round(len(commit_dates) / weeks, 2)

    open_prs = [p for p in prs if isinstance(p, dict) and p.get("state") == "open"]
    merged_prs = [p for p in prs if isinstance(p, dict) and p.get("merged_at")]
    open_issues = [i for i in issues if isinstance(i, dict) and i.get("state") == "open"]
    closed_issues = [i for i in issues if isinstance(i, dict) and i.get("state") == "closed"]

    ci_status = "NO_CI"
    last_run_conclusion = None
    if runs:
        last_run = runs[0]
        last_run_conclusion = last_run.get("conclusion") or last_run.get("status", "unknown")
        ci_status = (
            "PASSING" if last_run_conclusion == "success"
            else "FAILING" if last_run_conclusion == "failure"
            else "RUNNING"
        )

    # Author entropy
    total_commits_count = sum(commit_authors.values()) or 1
    entropy = 0.0
    for cnt in commit_authors.values():
        p = cnt / total_commits_count
        if p > 0:
            entropy -= p * math.log2(p)
    author_entropy = round(min(entropy / 4.0, 1.0), 2)

    # Metrics from actual parsed files (preferred) or GitHub size estimate
    if parsed_files:
        total_loc = sum(f["loc"] for f in parsed_files)
        avg_complexity = round(sum(f["complexity"] for f in parsed_files) / len(parsed_files), 2)
        all_imports = [imp for f in parsed_files for imp in f["imports"]]
        unique_imports = set(all_imports)
        dependency_coupling = round(
            min(len(all_imports) / max(len(unique_imports) * len(parsed_files), 1), 0.95), 2
        ) if unique_imports else 0.25
        hotspots = sorted(parsed_files, key=lambda x: x["risk_score"], reverse=True)[:8]
    else:
        # Fallback to GitHub size heuristic when tree fetch fails
        total_loc = repo_data.get("size", 0) * 8
        avg_complexity = round(min(5.0 + repo_data.get("open_issues_count", 0) * 0.3, 45.0), 2)
        dep_count = len(sbom_packages)
        dependency_coupling = round(min(dep_count / 200.0, 0.95), 2) if dep_count else 0.25
        hotspots = []

    open_issue_count = repo_data.get("open_issues_count", len(open_issues))
    total_prs = len(prs)
    churn_rate = round(len(open_prs) / max(total_prs, 1), 2)
    defect_density = round(len(open_issues) / max(total_loc / 1000.0, 1.0), 3)

    metrics = {
        "file_count": len(parsed_files) or repo_data.get("size", 0),
        "lines_of_code": total_loc,
        "cyclomatic_complexity": avg_complexity,
        "dependency_coupling": dependency_coupling,
        "defect_density": defect_density,
        "sprint_velocity": round(commit_frequency_per_week * 5, 1),
        "churn_rate": churn_rate,
        "author_distribution_entropy": author_entropy,
        "risk_keyword_mentions": open_issue_count,
    }

    contributor_list = [
        {"login": c.get("login", ""), "contributions": c.get("contributions", 0)}
        for c in contributors if isinstance(c, dict)
    ]

    return {
        "source_type": "GITHUB_REPO",
        "repo_url": repo_url,
        "owner": owner,
        "repo": repo,
        "full_name": repo_data.get("full_name", f"{owner}/{repo}"),
        "description": repo_data.get("description") or "",
        "language": repo_data.get("language") or "Unknown",
        "stars": repo_data.get("stargazers_count", 0),
        "forks": repo_data.get("forks_count", 0),
        "default_branch": default_branch,
        "is_private": repo_data.get("private", False),
        "created_at": repo_data.get("created_at", ""),
        "updated_at": repo_data.get("updated_at", ""),
        "open_issues_count": open_issue_count,
        "commit_count_sampled": len(commits),
        "commit_frequency_per_week": commit_frequency_per_week,
        "commit_authors": commit_authors,
        "raw_commits": commits,
        "open_prs": len(open_prs),
        "merged_prs": len(merged_prs),
        "total_prs_sampled": total_prs,
        "open_issues": len(open_issues),
        "closed_issues": len(closed_issues),
        "contributors": contributor_list,
        "ci_workflows": [{"name": w.get("name"), "state": w.get("state")} for w in workflows],
        "ci_status": ci_status,
        "last_ci_conclusion": last_run_conclusion,
        "sbom_package_count": len(sbom_packages),
        "sbom_packages": [
            {
                "name": p.get("name", ""),
                "version": p.get("versionInfo", ""),
                "spdx_id": p.get("SPDXID", ""),
                "license": p.get("licenseConcluded", "UNKNOWN"),
            }
            for p in sbom_packages[:60]
        ],
        "metrics": metrics,
        "hotspots": hotspots,
        "file_tree": [f["file"] for f in parsed_files],
        "parsed_files": parsed_files,
        "raw_files_with_content": raw_files_with_content,
        "detected_secrets": detected_secrets,
        "blocked_files": blocked_files,
        "is_insufficient_evidence": total_loc == 0,
        "insufficient_reason": "No parseable source files found in repository." if total_loc == 0 else None,
    }
