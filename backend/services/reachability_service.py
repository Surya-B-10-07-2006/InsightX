import re
import logging
from typing import Dict, Any, List, Set

logger = logging.getLogger("InsightX.Reachability")

# Known High-Risk Vulnerability Database for popular packages (CVE benchmark references)
KNOWN_CVE_LOOKUP = {
    "requests": {"cve": "CVE-2023-32681", "severity": "MEDIUM", "desc": "Unintended leak of Proxy-Authorization header on redirect."},
    "urllib3": {"cve": "CVE-2023-45803", "severity": "HIGH", "desc": "Request body strip on cross-origin redirect."},
    "axios": {"cve": "CVE-2023-45857", "severity": "HIGH", "desc": "Cross-site request forgery and header leakage."},
    "lodash": {"cve": "CVE-2021-23337", "severity": "HIGH", "desc": "Prototype pollution via template function."},
    "jsonwebtoken": {"cve": "CVE-2022-23529", "severity": "HIGH", "desc": "Insecure key object validation leading to RCE."},
    "express": {"cve": "CVE-2024-29041", "severity": "MEDIUM", "desc": "Open redirect in malformed request URI handling."},
    "fastapi": {"cve": "CVE-2024-24762", "severity": "MEDIUM", "desc": "ReDoS in form-data boundary parser."},
    "jinja2": {"cve": "CVE-2024-22195", "severity": "MEDIUM", "desc": "HTML attribute injection vulnerability in xmlattr filter."},
    "pillow": {"cve": "CVE-2023-50447", "severity": "CRITICAL", "desc": "Arbitrary code execution via environment keys."},
    "cryptography": {"cve": "CVE-2023-49083", "severity": "MEDIUM", "desc": "NULL-pointer dereference in PKCS7 parsing."},
    "pydantic": {"cve": "CVE-2021-29510", "severity": "LOW", "desc": "Infinite loop in email parsing regex."},
    "numpy": {"cve": "CVE-2021-33430", "severity": "HIGH", "desc": "Buffer overflow in array manipulation functions."},
    "torch": {"cve": "CVE-2024-31584", "severity": "HIGH", "desc": "Out-of-bounds write in tensor operation kernel."},
}

class DependencyReachabilityService:
    """Evaluates whether declared dependencies are actively imported/reachable in code or ghost baggage."""

    @staticmethod
    def analyze_reachability(
        declared_packages: List[Dict[str, Any]],
        parsed_files: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        # Collect all unique imported module names from parsed files
        all_code_imports: Set[str] = set()
        file_import_map: Dict[str, List[str]] = {}

        for f in parsed_files:
            fname = f.get("file", "")
            f_imports = f.get("imports", [])
            for imp in f_imports:
                clean_imp = imp.split(".")[0].split("/")[0].replace("@", "").lower().strip()
                if clean_imp:
                    all_code_imports.add(clean_imp)
                    if clean_imp not in file_import_map:
                        file_import_map[clean_imp] = []
                    file_import_map[clean_imp].append(fname)

        # If no declared packages provided, extract from files that look like manifests or use detected imports
        packages = list(declared_packages)
        if not packages:
            for imp in sorted(all_code_imports)[:20]:
                packages.append({"name": imp, "version": "latest", "license": "MIT"})

        reachable_packages: List[Dict[str, Any]] = []
        ghost_packages: List[Dict[str, Any]] = []
        vulnerable_reachable_count = 0
        total_dependencies = len(packages)

        for pkg in packages:
            name = pkg.get("name", "").lower().strip().replace("@", "")
            root_name = name.split("/")[0].split("-")[0].replace("_", "")
            version = pkg.get("version", "1.0.0")
            license_name = pkg.get("license", "UNKNOWN")

            # Check if package name or root prefix appears in active imports
            is_directly_imported = False
            calling_files: List[str] = []

            for imp, files in file_import_map.items():
                imp_norm = imp.replace("-", "").replace("_", "")
                if imp == name or imp_norm == root_name or root_name in imp_norm or imp in name:
                    is_directly_imported = True
                    calling_files.extend(files)

            calling_files = list(dict.fromkeys(calling_files))

            # CVE lookup
            cve_info = KNOWN_CVE_LOOKUP.get(name) or KNOWN_CVE_LOOKUP.get(root_name)
            has_cve = cve_info is not None
            cve_severity = cve_info["severity"] if cve_info else "NONE"
            cve_id = cve_info["cve"] if cve_info else None
            cve_desc = cve_info["desc"] if cve_info else None

            if is_directly_imported:
                reachability_status = "DIRECT_REACHABLE"
                call_depth = 1
                risk_impact = "ACTIVE_EXECUTION_PATH"
                if has_cve and cve_severity in ("CRITICAL", "HIGH"):
                    vulnerable_reachable_count += 1
            else:
                reachability_status = "UNREACHABLE_GHOST"
                call_depth = 0
                risk_impact = "UNUSED_SURFACE_BAGGAGE"

            record = {
                "package_name": pkg.get("name", name),
                "version": version,
                "license": license_name,
                "reachability_status": reachability_status,
                "call_depth": call_depth,
                "calling_files_count": len(calling_files),
                "sample_calling_files": calling_files[:3],
                "has_known_cve": has_cve,
                "cve_id": cve_id,
                "cve_severity": cve_severity,
                "cve_description": cve_desc,
                "risk_impact": risk_impact,
                "exploitability_rating": "EXPLOITABLE_IN_PATH" if (is_directly_imported and has_cve) else "LATENT" if is_directly_imported else "INERT_BAGGAGE"
            }

            if is_directly_imported:
                reachable_packages.append(record)
            else:
                ghost_packages.append(record)

        reachable_pct = round((len(reachable_packages) / max(total_dependencies, 1)) * 100, 1)
        ghost_pct = round((len(ghost_packages) / max(total_dependencies, 1)) * 100, 1)

        # Reachability Health Score
        reachability_score = round(max(10.0, 100.0 - (vulnerable_reachable_count * 20.0) - (len(ghost_packages) * 1.5)), 1)

        return {
            "total_dependencies_audited": total_dependencies,
            "reachable_count": len(reachable_packages),
            "ghost_count": len(ghost_packages),
            "reachable_percentage": reachable_pct,
            "ghost_percentage": ghost_pct,
            "vulnerable_reachable_count": vulnerable_reachable_count,
            "reachability_health_score": reachability_score,
            "attack_surface_status": "HIGH_EXPLOITABILITY_RISK" if vulnerable_reachable_count > 0 else "OPTIMAL_USAGE" if ghost_pct < 20 else "BLOATED_DEPENDENCY_SURFACE",
            "reachable_packages": reachable_packages[:15],
            "ghost_packages": ghost_packages[:15]
        }
