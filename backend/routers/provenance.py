import logging
from fastapi import APIRouter, HTTPException, Depends
from routers.auth import get_current_user_id
from database import db_manager
from services.provenance_service import analyze_code_provenance
from services.compliance_service import analyze_license_compliance

logger = logging.getLogger("InsightX.ProvenanceRouter")
router = APIRouter(prefix="/api/provenance", tags=["AI Code Provenance & Legal Governance"])


# /sbom/{project_id} MUST be registered before /{project_id} to avoid wildcard capture
@router.get("/sbom/{project_id}")
async def get_sbom(project_id: str, user_id: str = Depends(get_current_user_id)):
    """Return SBOM packages and license analysis for a project."""
    preds_col = db_manager.get_collection("predictions")
    pred = await preds_col.find_one({"project_id": project_id})
    if not pred:
        raise HTTPException(status_code=404, detail="Project not found.")

    license_report = pred.get("license_report")
    if not license_report:
        projects_col = db_manager.get_collection("projects")
        project = await projects_col.find_one({"id": project_id})
        sbom_packages = (project or {}).get("github_data", {}).get("sbom_packages", []) if project else []
        license_report = analyze_license_compliance(sbom_packages)

    github_summary = pred.get("github_summary", {})
    return {
        "sbom_package_count": github_summary.get("sbom_package_count", 0),
        "license_report": license_report,
        "release_blocking": license_report.get("release_blocking", False),
        "release_block_reason": license_report.get("release_block_reason"),
    }


@router.get("/{project_id}")
async def get_provenance_report(project_id: str, user_id: str = Depends(get_current_user_id)):
    preds_col = db_manager.get_collection("predictions")
    pred = await preds_col.find_one({"project_id": project_id})
    if not pred:
        raise HTTPException(status_code=404, detail="Project analysis not found.")

    existing = pred.get("provenance_report")
    if existing:
        return existing

    # Regenerate from stored data
    projects_col = db_manager.get_collection("projects")
    project = await projects_col.find_one({"id": project_id})
    parsed_files = (project or {}).get("parsed_files", [])
    sbom_packages = (project or {}).get("github_data", {}).get("sbom_packages", []) if project else []

    report = analyze_code_provenance(parsed_files, [], sbom_packages)
    await preds_col.update_one({"project_id": project_id}, {"$set": {"provenance_report": report}})
    return report
