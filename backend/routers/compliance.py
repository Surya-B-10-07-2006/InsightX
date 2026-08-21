import hashlib
import datetime
import logging
from fastapi import APIRouter, HTTPException, Depends
from routers.auth import get_current_user_id
from database import db_manager
from services.compliance_service import (
    generate_soc2_evidence,
    assess_predictive_compliance,
    analyze_license_compliance,
)

logger = logging.getLogger("InsightX.ComplianceRouter")
router = APIRouter(prefix="/api/compliance", tags=["SOC2 Compliance & Legal"])

_FRESHNESS_HOURS = 24


@router.get("/soc2/{project_id}")
async def get_soc2_report(project_id: str, user_id: str = Depends(get_current_user_id)):
    """Return SOC 2 evidence report for a project, regenerating if stale (>24h)."""
    preds_col = db_manager.get_collection("predictions")
    pred = await preds_col.find_one({"project_id": project_id})
    if not pred:
        raise HTTPException(status_code=404, detail="Project analysis not found.")

    existing = pred.get("compliance_report")
    if existing:
        try:
            generated = datetime.datetime.fromisoformat(existing["generated_at"])
            now = datetime.datetime.now(datetime.timezone.utc)
            if generated.tzinfo is None:
                generated = generated.replace(tzinfo=datetime.timezone.utc)
            age_hours = (now - generated).total_seconds() / 3600
            existing["freshness_hours"] = round(age_hours, 1)
            existing["is_fresh"] = age_hours < _FRESHNESS_HOURS
            if existing["is_fresh"]:
                return existing
        except Exception:
            pass

    # Regenerate
    projects_col = db_manager.get_collection("projects")
    project = await projects_col.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    report = generate_soc2_evidence(project, pred)
    report["freshness_hours"] = 0.0
    report["is_fresh"] = True

    await preds_col.update_one({"project_id": project_id}, {"$set": {"compliance_report": report}})
    return report


@router.get("/predictive/{project_id}")
async def get_predictive_compliance(project_id: str, user_id: str = Depends(get_current_user_id)):
    preds_col = db_manager.get_collection("predictions")
    pred = await preds_col.find_one({"project_id": project_id})
    if not pred:
        raise HTTPException(status_code=404, detail="Project analysis not found.")

    result = assess_predictive_compliance(
        pred.get("metrics", {}),
        pred.get("ml_results", {})
    )
    return result


@router.get("/license/{project_id}")
async def get_license_report(project_id: str, user_id: str = Depends(get_current_user_id)):
    preds_col = db_manager.get_collection("predictions")
    pred = await preds_col.find_one({"project_id": project_id})
    if not pred:
        raise HTTPException(status_code=404, detail="Project analysis not found.")

    existing = pred.get("license_report")
    if existing:
        return existing

    projects_col = db_manager.get_collection("projects")
    project = await projects_col.find_one({"id": project_id})
    sbom_packages = (project or {}).get("github_data", {}).get("sbom_packages", []) if project else []

    report = analyze_license_compliance(sbom_packages)
    await preds_col.update_one({"project_id": project_id}, {"$set": {"license_report": report}})
    return report
