import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator
from typing import Optional
from routers.auth import get_current_user_id
from database import db_manager
from services.github_service import analyze_github_repo
from services.pipeline_service import pipeline_service

logger = logging.getLogger("InsightX.GitHubRouter")
router = APIRouter(prefix="/api/github", tags=["GitHub Repository Analysis"])


class GitHubAnalyzeRequest(BaseModel):
    repo_url: str
    github_token: Optional[str] = None

    @field_validator("repo_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("repo_url must not be empty")
        return v


@router.post("/analyze")
async def analyze_repository(req: GitHubAnalyzeRequest, user_id: str = Depends(get_current_user_id)):
    try:
        github_data = await analyze_github_repo(req.repo_url, req.github_token)
    except Exception as e:
        logger.error(f"GitHub analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"GitHub API error: {str(e)}")

    if "error" in github_data:
        raise HTTPException(status_code=400, detail=github_data["error"])

    metrics = github_data["metrics"]
    hotspots = github_data.get("hotspots", [])
    file_tree = github_data.get("file_tree", [])
    parsed_files = github_data.get("parsed_files", [])
    raw_files = github_data.get("raw_files_with_content", [])
    commits = github_data.get("raw_commits", [])
    sbom_packages = github_data.get("sbom_packages", [])

    project_id = str(uuid.uuid4())
    project_name = github_data.get("full_name", req.repo_url)

    # Save initial project document
    project_doc = {
        "id": project_id,
        "_id": project_id,
        "user_id": user_id,
        "name": project_name,
        "filename": req.repo_url,
        "source_type": "GITHUB_REPO",
        "upload_time": datetime.now(timezone.utc).isoformat(),
        "metrics": metrics,
        "hotspots": hotspots,
        "file_tree": file_tree,
        "parsed_files": parsed_files,
        "raw_files_with_content": raw_files,
        "commits": commits,
        "declared_packages": sbom_packages,
        "detected_secrets": github_data.get("detected_secrets", []),
        "blocked_files": github_data.get("blocked_files", []),
        "github_data": {k: v for k, v in github_data.items() if k not in ("metrics", "raw_commits", "raw_files_with_content")},
        "status": "PARSED",
    }
    projects_col = db_manager.get_collection("projects")
    await projects_col.insert_one(project_doc)

    preds_col = db_manager.get_collection("predictions")
    db_hist = await preds_col.find_many({"user_id": user_id})
    db_hist_filtered = [h for h in db_hist if h.get("project_id") != project_id]

    # Run unified pipeline
    github_summary = {
        "owner": github_data.get("owner", ""),
        "repo": github_data.get("repo", ""),
        "language": github_data.get("language", "Unknown"),
        "stars": github_data.get("stars", 0),
        "forks": github_data.get("forks", 0),
        "open_prs": github_data.get("open_prs", 0),
        "merged_prs": github_data.get("merged_prs", 0),
        "open_issues": github_data.get("open_issues", 0),
        "contributors": github_data.get("contributors", []),
        "ci_status": github_data.get("ci_status", "NO_CI"),
        "last_ci_conclusion": github_data.get("last_ci_conclusion"),
        "commit_frequency_per_week": github_data.get("commit_frequency_per_week", 0.0),
        "sbom_package_count": github_data.get("sbom_package_count", 0),
    }

    prediction_doc = pipeline_service.run_pipeline(
        project_id=project_id,
        user_id=user_id,
        project_name=project_name,
        filename=req.repo_url,
        source_type="GITHUB_REPO",
        raw_files_with_content=raw_files,
        commits=commits,
        declared_packages=sbom_packages,
        github_summary=github_summary,
        historical_projects=db_hist_filtered,
        base_metrics_override=metrics
    )

    await preds_col.insert_one(prediction_doc)

    return {
        "project_id": project_id,
        "repo": project_name,
        "language": github_data.get("language", "Unknown"),
        "risk_score": prediction_doc["ml_results"]["overall_risk_score"],
        "primary_failure": prediction_doc["ml_results"]["primary_failure_type"],
        "quality_fusion_grade": prediction_doc["quality_fusion"]["grade"],
        "architecture_risk_index": prediction_doc["architecture_risk"]["architecture_risk_index"],
        "ci_status": github_data.get("ci_status", "NO_CI"),
        "compliance_score": prediction_doc.get("compliance_report", {}).get("compliance_score", 90.0),
        "release_blocking": prediction_doc.get("provenance_gate", {}).get("gate_status") == "BLOCKED"
    }
