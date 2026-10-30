import time
import math
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from services.analysis_mesh import PolyglotAnalysisMesh
from services.sast_service import DeepHybridSASTService
from services.reachability_service import DependencyReachabilityService
from services.architecture_service import ArchitectureRiskService
from services.governance_service import GovernanceService
from services.ml_engine import ml_service
from services.network_service import NetworkXGraphService
from services.simulation_service import RiskSimulationService
from services.similarity_service import ProjectSimilarityService
from services.compliance_service import generate_soc2_evidence, assess_predictive_compliance, analyze_license_compliance
from services.provenance_service import analyze_code_provenance
from services.llm_service import GroqExplanationService

logger = logging.getLogger("InsightX.Pipeline")

class UnifiedAnalysisPipeline:
    """Single master analysis pipeline powering Dashboard, PDF, and WhatsApp outputs."""

    @staticmethod
    def run_pipeline(
        project_id: str,
        user_id: str,
        project_name: str,
        filename: str,
        source_type: str,
        raw_files_with_content: List[Dict[str, str]],
        commits: Optional[List[Dict[str, Any]]] = None,
        declared_packages: Optional[List[Dict[str, Any]]] = None,
        github_summary: Optional[Dict[str, Any]] = None,
        historical_projects: Optional[List[Dict[str, Any]]] = None,
        base_metrics_override: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        start_time = time.time()
        commits_list = commits or []
        packages_list = declared_packages or []
        hist_projects = historical_projects or []

        # ---------------------------------------------------------------------
        # Step 1: Polyglot Parsing & AST Metric Feature Extraction
        # ---------------------------------------------------------------------
        parsed_files: List[Dict[str, Any]] = []
        for item in raw_files_with_content:
            f_path = item.get("file", "")
            f_content = item.get("content", "")
            if f_path and f_content:
                parsed = PolyglotAnalysisMesh.analyze_file(f_path, f_content)
                parsed_files.append(parsed)

        mesh_summary = PolyglotAnalysisMesh.aggregate_mesh(parsed_files)
        file_tree = [f["file"] for f in parsed_files]

        # Calculate Dependency Coupling & Churn Rate from AST
        all_imports = [imp for f in parsed_files for imp in f.get("imports", [])]
        unique_imports = set(all_imports)
        coupling = round(
            min(len(all_imports) / max(len(unique_imports) * len(parsed_files), 1), 0.95), 2
        ) if unique_imports else 0.22

        total_loc = mesh_summary["total_loc"]
        avg_comp = mesh_summary["average_complexity"]
        total_defects = mesh_summary["total_defect_markers"]
        defect_density = round(total_defects / max(total_loc / 1000.0, 1.0), 3)

        # Churn rate estimate from variance
        risk_scores = [f.get("risk_score", 40.0) for f in parsed_files] or [40.0]
        mean_risk = sum(risk_scores) / len(risk_scores)
        variance = sum((r - mean_risk) ** 2 for r in risk_scores) / max(len(risk_scores), 1)
        churn_rate = round(min(math.sqrt(variance) / 100.0, 0.95), 2)

        # Author distribution entropy
        commit_authors: Dict[str, int] = {}
        for c in commits_list:
            auth = (c.get("commit", {}).get("author") or {}).get("name", "unknown")
            commit_authors[auth] = commit_authors.get(auth, 0) + 1

        total_commits_cnt = sum(commit_authors.values()) or 1
        author_entropy = 0.0
        for cnt in commit_authors.values():
            p = cnt / total_commits_cnt
            if p > 0:
                author_entropy -= p * math.log2(p)
        author_entropy = round(min(author_entropy / 4.0, 1.0), 2)

        # Unified Metrics
        metrics = {
            "file_count": len(parsed_files),
            "lines_of_code": total_loc,
            "cyclomatic_complexity": avg_comp,
            "dependency_coupling": coupling,
            "defect_density": defect_density,
            "sprint_velocity": round(len(commits_list) * 2.5, 1) if commits_list else 35.0,
            "churn_rate": churn_rate,
            "author_distribution_entropy": author_entropy,
            "risk_keyword_mentions": total_defects,
            "average_maintainability": mesh_summary["average_maintainability"],
            "primary_language": mesh_summary["primary_language"]
        }
        if base_metrics_override:
            metrics.update({k: v for k, v in base_metrics_override.items() if v is not None and float(v or 0) > 0})

        hotspots = sorted(parsed_files, key=lambda x: x.get("risk_score", 0), reverse=True)[:8]

        # ---------------------------------------------------------------------
        # Step 2: Deep Hybrid SAST Taint Analysis
        # ---------------------------------------------------------------------
        sast_data = DeepHybridSASTService.analyze_repository(raw_files_with_content)

        # ---------------------------------------------------------------------
        # Step 3: Dependency Reachability Analysis
        # ---------------------------------------------------------------------
        reachability_data = DependencyReachabilityService.analyze_reachability(packages_list, parsed_files)

        # ---------------------------------------------------------------------
        # Step 4: Architecture Risk Index & Graph Theory
        # ---------------------------------------------------------------------
        arch_data = ArchitectureRiskService.analyze_architecture(file_tree, parsed_files, hotspots)

        # ---------------------------------------------------------------------
        # Step 5: Core ML Engine & SHAP Explainability
        # ---------------------------------------------------------------------
        ml_out = ml_service.predict_project_health(metrics, hotspots, sast_data=sast_data, arch_data=arch_data)

        # Quality Fusion Score
        quality_fusion = ml_service.calculate_quality_fusion_score(metrics, parsed_files, sast_data=sast_data, arch_data=arch_data)

        # NetworkX Root Cause Graph
        graph_out = NetworkXGraphService.build_dependency_graph(
            file_tree, hotspots, parsed_files, ml_out.get("shap_feature_importance", [])
        )

        # ---------------------------------------------------------------------
        # Step 6: Governance, AI Provenance, Policy, Auto-Triage & Verified Fixes
        # ---------------------------------------------------------------------
        provenance_data = GovernanceService.evaluate_ai_provenance_and_debt(parsed_files, commits_list)
        team_gov = GovernanceService.calculate_team_governance(commit_authors, github_summary.get("contributors", []) if github_summary else [])
        policy_data = GovernanceService.evaluate_policy_catalog(metrics, sast_data, arch_data, provenance_data, reachability_data)
        auto_triage = GovernanceService.generate_auto_triage_backlog(hotspots, sast_data.get("findings", []), arch_data.get("circular_cycles", []))
        verified_fix_prs = GovernanceService.generate_verified_fix_prs(sast_data.get("findings", []), hotspots, arch_data.get("circular_cycles", []))

        # ---------------------------------------------------------------------
        # Step 7: Simulations, Similarity & Compliance
        # ---------------------------------------------------------------------
        time_machine_out = RiskSimulationService.run_time_machine_simulation(
            ml_out["overall_risk_score"], metrics, ml_out.get("model_confidence", 0.0)
        )
        roi_out = RiskSimulationService.calculate_intervention_roi(ml_out["overall_risk_score"], metrics, hotspots)
        scope_drift_out = RiskSimulationService.calculate_scope_drift_intelligence(ml_out["overall_risk_score"], metrics, hotspots, 15.0)

        similarity_out = ProjectSimilarityService.find_similar_projects(metrics, hist_projects)
        portfolio_health = GovernanceService.aggregate_portfolio_health(
            project_id, project_name, ml_out["overall_risk_score"], avg_comp, coupling, hist_projects
        )

        # SOC 2 & License reports
        mock_proj_doc = {"id": project_id, "name": project_name, "metrics": metrics, "source_type": source_type, "ci_status": github_summary.get("ci_status") if github_summary else "PASSING"}
        compliance_report = generate_soc2_evidence(mock_proj_doc, {"ml_results": ml_out})
        predictive_compliance = assess_predictive_compliance(metrics, ml_out)
        license_report = analyze_license_compliance(packages_list)
        prov_full = analyze_code_provenance(parsed_files, commits=commits_list, sbom_packages=packages_list)

        # ---------------------------------------------------------------------
        # Step 8: Generative AI Explanations & Action Items
        # ---------------------------------------------------------------------
        llm_out = GroqExplanationService.generate_explanations(
            project_name=project_name,
            risk_score=ml_out["overall_risk_score"],
            primary_failure=ml_out["primary_failure_type"],
            hotspots=hotspots,
            root_cause_module=graph_out["root_cause_module"],
            is_insufficient_evidence=ml_out.get("is_insufficient_evidence", False),
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
            provenance_report=prov_full,
            github_summary=github_summary,
            source_type=source_type,
            sast_findings=sast_data.get("findings", []),
        )

        total_duration = round((time.time() - start_time) * 1000, 1)

        return {
            "id": project_id,
            "_id": project_id,
            "project_id": project_id,
            "user_id": user_id,
            "project_name": project_name,
            "filename": filename,
            "analyzed_at": datetime.now(timezone.utc).isoformat(),
            "total_duration_ms": total_duration,
            "source_type": source_type,
            "github_summary": github_summary,
            "is_insufficient_evidence": ml_out.get("is_insufficient_evidence", False),
            "insufficient_reason": None,
            "metrics": metrics,
            "hotspots": hotspots,
            "ml_results": ml_out,
            "quality_fusion": quality_fusion,
            "sast_analysis": sast_data,
            "reachability_analysis": reachability_data,
            "architecture_risk": arch_data,
            "polyglot_mesh": mesh_summary,
            "provenance_gate": provenance_data["provenance_gate"],
            "ai_debt_ledger": provenance_data["ai_debt_ledger"],
            "team_governance": team_gov,
            "policy_catalog": policy_data,
            "auto_triage_backlog": auto_triage,
            "verified_fix_prs": verified_fix_prs,
            "portfolio_health": portfolio_health,
            "network_graph": graph_out,
            "similarity": similarity_out,
            "time_machine": time_machine_out,
            "intervention_roi": roi_out,
            "scope_drift": scope_drift_out,
            "ai_explanations": llm_out,
            "compliance_report": compliance_report,
            "predictive_compliance": predictive_compliance,
            "license_report": license_report,
            "provenance_report": prov_full
        }

pipeline_service = UnifiedAnalysisPipeline()
