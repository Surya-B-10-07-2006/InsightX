import os
import re
import ast
import math
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("InsightX.AnalysisMesh")

# Supported polyglot language extensions and metadata
LANGUAGE_CONFIGS = {
    ".py": {"language": "Python", "category": "Backend / ML"},
    ".js": {"language": "JavaScript", "category": "Frontend / Fullstack"},
    ".jsx": {"language": "JavaScript (React)", "category": "Frontend"},
    ".ts": {"language": "TypeScript", "category": "Fullstack / Typed"},
    ".tsx": {"language": "TypeScript (React)", "category": "Frontend"},
    ".java": {"language": "Java", "category": "Enterprise Backend"},
    ".go": {"language": "Go", "category": "Systems / Cloud Native"},
    ".rs": {"language": "Rust", "category": "Systems / High Performance"},
    ".cpp": {"language": "C++", "category": "Native / Core"},
    ".c": {"language": "C", "category": "Embedded / Systems"},
    ".cs": {"language": "C#", "category": "Enterprise / .NET"},
    ".rb": {"language": "Ruby", "category": "Web Backend"},
    ".php": {"language": "PHP", "category": "Web Backend"},
    ".sql": {"language": "SQL", "category": "Database / Schema"},
    ".html": {"language": "HTML", "category": "Markup"},
    ".css": {"language": "CSS", "category": "Styling"},
    ".json": {"language": "JSON", "category": "Configuration"},
    ".yaml": {"language": "YAML", "category": "DevOps / Config"},
    ".yml": {"language": "YAML", "category": "DevOps / Config"},
    ".sh": {"language": "Shell", "category": "Automation / Scripts"},
}

class PolyglotAnalysisMesh:
    """Polyglot AST & multi-language syntax analysis mesh.
    Computes Halstead volume, Maintainability Index, Defect Markers, and Language Distribution.
    """

    @staticmethod
    def analyze_file(file_path: str, content: str) -> Dict[str, Any]:
        ext = os.path.splitext(file_path)[1].lower()
        lang_info = LANGUAGE_CONFIGS.get(ext, {"language": "Other", "category": "General"})
        lang_name = lang_info["language"]

        lines = content.splitlines()
        loc = len(lines)
        blank_lines = sum(1 for line in lines if not line.strip())
        comment_lines = 0
        code_lines = loc - blank_lines

        # Comment detection by language
        if ext in (".py", ".sh", ".yaml", ".yml", ".rb"):
            comment_lines = sum(1 for line in lines if line.strip().startswith("#"))
        elif ext in (".js", ".jsx", ".ts", ".tsx", ".java", ".go", ".rs", ".cpp", ".c", ".cs", ".php"):
            comment_lines = sum(1 for line in lines if line.strip().startswith("//") or line.strip().startswith("/*") or line.strip().startswith("*"))
        elif ext in (".sql",):
            comment_lines = sum(1 for line in lines if line.strip().startswith("--"))

        # Defect markers (TODO, FIXME, BUG, HACK, XXX, TEMP)
        defect_markers = len(re.findall(r"(?i)\b(todo|fixme|bug|hack|xxx|temp_fix|workaround)\b", content))

        complexity = 1.0
        functions_count = 0
        classes_count = 0
        imports: List[str] = []
        operators_count = 0
        operands_count = 0

        # AST analysis for Python
        if ext == ".py":
            try:
                tree = ast.parse(content)
                for node in ast.walk(tree):
                    if isinstance(node, (ast.If, ast.For, ast.While, ast.ExceptHandler, ast.With, ast.Assert, ast.comprehension)):
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
                    elif isinstance(node, (ast.BinOp, ast.UnaryOp, ast.Compare, ast.BoolOp)):
                        operators_count += 1
                    elif isinstance(node, (ast.Name, ast.Constant)):
                        operands_count += 1
            except Exception:
                # Fallback regex for syntax invalid / partial python files
                complexity += len(re.findall(r"\b(if|elif|for|while|try|except|with|assert)\b", content))
                functions_count = len(re.findall(r"\bdef\s+\w+", content))
                classes_count = len(re.findall(r"\bclass\s+\w+", content))
        else:
            # Polyglot Regex Parser for JS, TS, Java, Go, Rust, C++, C#, etc.
            branch_keywords = r"\b(if|else\s+if|for|while|try|catch|switch|case|guard|defer|select)\b"
            complexity += len(re.findall(branch_keywords, content))
            
            # Function pattern matches
            fn_matches = re.findall(r"(?:function\s+(\w+)|(\w+)\s*\([^)]*\)\s*\{|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|def\s+(\w+)|fn\s+(\w+)|func\s+(\w+)|public\s+[\w<>]+\s+(\w+)\()", content)
            functions_count = len(fn_matches)
            
            class_matches = re.findall(r"\b(?:class|struct|interface|enum|type)\s+(\w+)", content)
            classes_count = len(class_matches)

            # Import pattern matches across languages
            # JS/TS imports
            js_imports = re.findall(r"""(?:import\s+.*?from\s+["']([^"']+)["']|require\s*\(\s*["']([^"']+)["']\))""", content)
            for jm in js_imports:
                pkg = jm[0] or jm[1]
                if pkg:
                    imports.append(pkg)

            # Java / C# imports
            java_imports = re.findall(r"(?:import\s+(?:static\s+)?|using\s+)([a-zA-Z0-9_.]+);", content)
            imports.extend(java_imports)

            # Go / Rust imports
            go_imports = re.findall(r"""import\s+(?:\(\s*([^)]+)\s*\)|"([^"]+)")""", content, re.DOTALL)
            for gi in go_imports:
                if gi[1]:
                    imports.append(gi[1])
                elif gi[0]:
                    imports.extend(re.findall(r'"([^"]+)"', gi[0]))

            rust_use = re.findall(r"use\s+([a-zA-Z0-9_:]+);", content)
            imports.extend(rust_use)

            # Token approximations for Halstead metrics
            operators_count = len(re.findall(r"(\+|\-|\*|\/|\%|\=\=|\!\=|\<|\>|\<\=|\>\=|\&\&|\|\||\!|\=|\:)", content))
            operands_count = len(re.findall(r"\b[a-zA-Z_]\w*\b", content))

        # Halstead Volume Calculation: V = (N1 + N2) * log2(n1 + n2)
        total_tokens = operators_count + operands_count
        vocab_size = max(4, int(total_tokens * 0.45))
        halstead_volume = round(total_tokens * math.log2(vocab_size) if total_tokens > 0 else 10.0, 2)

        # Maintainability Index (MI): 171 - 5.2 * ln(Halstead) - 0.23 * Complexity - 16.2 * ln(LOC)
        log_v = math.log(max(halstead_volume, 1.0))
        log_loc = math.log(max(code_lines, 1.0))
        raw_mi = 171.0 - (5.2 * log_v) - (0.23 * complexity) - (16.2 * log_loc)
        # Normalize to 0 - 100 range
        maintainability_index = round(max(0.0, min(100.0, (raw_mi * 100.0) / 171.0)), 1)

        # File Risk Score Calculation
        risk_score = round(min((complexity * 2.2) + (loc / 45.0) + (defect_markers * 3.5), 99.0), 1)

        return {
            "file": file_path,
            "language": lang_name,
            "category": lang_info["category"],
            "loc": loc,
            "code_lines": code_lines,
            "comment_lines": comment_lines,
            "complexity": round(complexity, 2),
            "functions": functions_count,
            "classes": classes_count,
            "imports": list(set(imports)),
            "defect_markers": defect_markers,
            "halstead_volume": halstead_volume,
            "maintainability_index": maintainability_index,
            "risk_score": risk_score
        }

    @staticmethod
    def aggregate_mesh(parsed_files: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Aggregate polyglot metrics across all parsed files."""
        if not parsed_files:
            return {
                "total_loc": 0,
                "language_distribution": [],
                "primary_language": "Unknown",
                "average_complexity": 0.0,
                "average_maintainability": 0.0,
                "total_defect_markers": 0,
                "polyglot_languages_count": 0
            }

        lang_counts: Dict[str, Dict[str, Any]] = {}
        total_loc = sum(f.get("loc", 0) for f in parsed_files)

        for f in parsed_files:
            lang = f.get("language", "Other")
            if lang not in lang_counts:
                lang_counts[lang] = {"files": 0, "loc": 0, "complexity_sum": 0.0, "mi_sum": 0.0}
            lang_counts[lang]["files"] += 1
            lang_counts[lang]["loc"] += f.get("loc", 0)
            lang_counts[lang]["complexity_sum"] += f.get("complexity", 1.0)
            lang_counts[lang]["mi_sum"] += f.get("maintainability_index", 75.0)

        distribution = []
        for lang, d in lang_counts.items():
            loc_pct = round((d["loc"] / max(total_loc, 1)) * 100, 1)
            avg_comp = round(d["complexity_sum"] / max(d["files"], 1), 1)
            avg_mi = round(d["mi_sum"] / max(d["files"], 1), 1)
            distribution.append({
                "language": lang,
                "files_count": d["files"],
                "loc": d["loc"],
                "loc_percentage": loc_pct,
                "avg_complexity": avg_comp,
                "avg_maintainability": avg_mi,
                "health_rating": "OPTIMAL" if avg_mi >= 70 else "NEEDS_REVIEW" if avg_mi >= 50 else "HIGH_DEBT"
            })

        distribution.sort(key=lambda x: x["loc"], reverse=True)
        primary_lang = distribution[0]["language"] if distribution else "Unknown"

        avg_comp_all = round(sum(f.get("complexity", 1.0) for f in parsed_files) / max(len(parsed_files), 1), 2)
        avg_mi_all = round(sum(f.get("maintainability_index", 75.0) for f in parsed_files) / max(len(parsed_files), 1), 1)
        total_defects = sum(f.get("defect_markers", 0) for f in parsed_files)

        return {
            "total_loc": total_loc,
            "language_distribution": distribution,
            "primary_language": primary_lang,
            "average_complexity": avg_comp_all,
            "average_maintainability": avg_mi_all,
            "total_defect_markers": total_defects,
            "polyglot_languages_count": len(distribution)
        }
