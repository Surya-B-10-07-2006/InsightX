import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator
from typing import Optional
from routers.auth import get_current_user_id
from database import db_manager
from services.github_service import analyze_github_repo
from services.ml_engine import ml_service
from services.network_service import NetworkXGraphService
from services.simulation_service import RiskSimulationService
from services.llm_service import GroqExplanationService
from services.compliance_service import generate_soc2_evidence, assess_predictive_compliance, analyze_license_compliance
from services.provenance_service import analyze_code_provenance

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

    project_id = str(uuid.uuid4())
    project_doc = {
        "id": project_id,
        "_id": project_id,
        "user_id": user_id,
        "name": github_data.get("full_name", req.repo_url),
        "filename": req.repo_url,
        "source_type": "GITHUB_REPO",
        "upload_time": datetime.now(timezone.utc).isoformat(),
        "metrics": metrics,
        "hotspots": hotspots,
        "file_tree": file_tree,
        "detected_secrets": [],
        "blocked_files": [],
        "github_data": {k: v for k, v in github_data.items() if k not in ("metrics", "raw_commits")},
        "status": "PARSED",
    }
    projects_col = db_manager.get_collection("projects")
    await projects_col.insert_one(project_doc)

    # Run full ML pipeline
    ml_out = ml_service.predict_project_health(metrics, hotspots)
    graph_out = NetworkXGraphService.build_dependency_graph(file_tree, hotspots, parsed_files, ml_out.get("shap_feature_importance", []))

    preds_col = db_manager.get_collection("predictions")
    db_hist = await preds_col.find_many({"user_id": user_id})
    db_hist_filtered = [h for h in db_hist if h.get("project_id") != project_id]

    from services.similarity_service import ProjectSimilarityService
    similarity_out = ProjectSimilarityService.find_similar_projects(metrics, db_hist_filtered)
    time_machine_out = RiskSimulationService.run_time_machine_simulation(
        ml_out["overall_risk_score"],
        metrics,
        ml_out.get("model_confidence", 0.0),
    )
    roi_out = RiskSimulationService.calculate_intervention_roi(ml_out["overall_risk_score"], metrics, hotspots)

    # Compliance & provenance - calculate before LLM explanations
    sbom_packages = github_data.get("sbom_packages", [])
    compliance_report = generate_soc2_evidence(
        {**project_doc, "ci_status": github_data.get("ci_status", "NO_CI"), "total_prs_sampled": github_data.get("total_prs_sampled", 0)},
        {"ml_results": ml_out}
    )
    predictive_compliance = assess_predictive_compliance(metrics, ml_out)
    license_report = analyze_license_compliance(sbom_packages)
    provenance_report = analyze_code_provenance(
        parsed_files,
        commits=github_data.get("raw_commits", []),  # raw commit objects list
        sbom_packages=sbom_packages
    )

    llm_out = GroqExplanationService.generate_explanations(
        project_name=github_data.get("full_name", req.repo_url),
        risk_score=ml_out["overall_risk_score"],
        primary_failure=ml_out["primary_failure_type"],
        hotspots=hotspots,
        root_cause_module=graph_out["root_cause_module"],
        is_insufficient_evidence=github_data.get("is_insufficient_evidence", False),
        metrics=metrics,
        failure_rankings=ml_out.get("failure_rankings", []),
        burnout_score=ml_out.get("burnout_analysis", {}).get("burnout_risk_score", 0.0),
        model_confidence=ml_out.get("model_confidence", 70.0),
        shap_feature_importance=ml_out.get("shap_feature_importance", []),
        network_graph=graph_out,
        time_machine=time_machine_out,
        intervention_roi=roi_out,
        compliance_report=compliance_report,
        predictive_compliance=predictive_compliance,
        license_report=license_report,
        provenance_report=provenance_report,
        github_summary={
            "owner": github_data.get("owner"),
            "repo": github_data.get("repo"),
            "language": github_data.get("language"),
            "stars": github_data.get("stars"),
            "forks": github_data.get("forks"),
            "open_prs": github_data.get("open_prs"),
            "merged_prs": github_data.get("merged_prs"),
            "open_issues": github_data.get("open_issues"),
            "contributors": github_data.get("contributors", [])[:10],
            "ci_status": github_data.get("ci_status"),
            "last_ci_conclusion": github_data.get("last_ci_conclusion"),
            "commit_frequency_per_week": github_data.get("commit_frequency_per_week"),
            "sbom_package_count": github_data.get("sbom_package_count", 0),
        },
        source_type="GITHUB_REPO",
    )

    prediction_doc = {
        "id": project_id,
        "_id": project_id,
        "project_id": project_id,
        "user_id": user_id,
        "project_name": github_data.get("full_name", req.repo_url),
        "filename": github_data.get("full_name", req.repo_url),  # Use repo name instead of URL for better display
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
        "total_duration_ms": 0,
        "source_type": "GITHUB_REPO",
        "is_insufficient_evidence": github_data.get("is_insufficient_evidence", False),
        "insufficient_reason": github_data.get("insufficient_reason"),
        "github": {
            "stars": github_data.get("stars"),
            "forks": github_data.get("forks"),
            "open_issues": github_data.get("open_issues"),
            "last_commit": github_data.get("updated_at", "")[:10] if github_data.get("updated_at") else "—",
            "language": github_data.get("language"),
            "ci_status": github_data.get("ci_status"),
            "commit_frequency_per_week": github_data.get("commit_frequency_per_week"),
        },
        "github_summary": {
            "owner": github_data.get("owner"),
            "repo": github_data.get("repo"),
            "language": github_data.get("language"),
            "stars": github_data.get("stars"),
            "forks": github_data.get("forks"),
            "open_prs": github_data.get("open_prs"),
            "merged_prs": github_data.get("merged_prs"),
            "open_issues": github_data.get("open_issues"),
            "contributors": github_data.get("contributors", [])[:10],
            "ci_status": github_data.get("ci_status"),
            "last_ci_conclusion": github_data.get("last_ci_conclusion"),
            "commit_frequency_per_week": github_data.get("commit_frequency_per_week"),
            "sbom_package_count": github_data.get("sbom_package_count", 0),
        },
        "metrics": metrics,
        "hotspots": hotspots,
        "ml_results": ml_out,
        "network_graph": graph_out,
        "similarity": similarity_out,
        "time_machine": time_machine_out,
        "intervention_roi": roi_out,
        "ai_explanations": llm_out,
        "compliance_report": compliance_report,
        "predictive_compliance": predictive_compliance,
        "license_report": license_report,
        "provenance_report": provenance_report,
    }
    await preds_col.insert_one(prediction_doc)

    return {
        "project_id": project_id,
        "repo": github_data.get("full_name"),
        "language": github_data.get("language"),
        "risk_score": ml_out["overall_risk_score"],
        "primary_failure": ml_out["primary_failure_type"],
        "ci_status": github_data.get("ci_status"),
        "compliance_score": compliance_report["compliance_score"],
        "release_blocking": license_report["release_blocking"],
    }


@router.get("/report/{project_id}")
async def get_github_report(project_id: str, user_id: str = Depends(get_current_user_id)):
    preds_col = db_manager.get_collection("predictions")
    pred = await preds_col.find_one({"project_id": project_id, "user_id": user_id})
    if not pred or pred.get("source_type") != "GITHUB_REPO":
        raise HTTPException(status_code=404, detail="GitHub analysis report not found.")
    return pred
