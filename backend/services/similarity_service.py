import numpy as np
from scipy.spatial.distance import cosine
from typing import Dict, Any, List

class ProjectSimilarityService:
    """Computes project vector similarity strictly against actual historical uploaded projects in MongoDB."""

    @staticmethod
    def find_similar_projects(metrics: Dict[str, Any], db_historical_projects: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        curr_vec = np.array([
            float(metrics.get("cyclomatic_complexity", 0.0)),
            float(metrics.get("dependency_coupling", 0.0)),
            float(metrics.get("lines_of_code", 0.0)),
            float(metrics.get("defect_density", 0.0)),
            float(metrics.get("churn_rate", 0.0)),
            float(metrics.get("author_distribution_entropy", 0.0)) * 15.0
        ])

        db_historical_projects = db_historical_projects or []

        if not db_historical_projects:
            return {
                "has_historical_comparison": False,
                "message": "No historical projects stored in MongoDB database yet for vector distance comparison.",
                "top_matching_project": None,
                "similar_projects": [],
                "multi_project_comparison": {
                    "current_project_complexity": curr_vec[0],
                    "benchmark_average_complexity": 0.0,
                    "current_project_coupling": curr_vec[1],
                    "benchmark_average_coupling": 0.0
                }
            }

        matches = []
        for hist in db_historical_projects:
            hist_metrics = hist.get("metrics", {})
            hist_vec = np.array([
                float(hist_metrics.get("cyclomatic_complexity", 0.0)),
                float(hist_metrics.get("dependency_coupling", 0.0)),
                float(hist_metrics.get("lines_of_code", 0.0)),
                float(hist_metrics.get("defect_density", 0.0)),
                float(hist_metrics.get("churn_rate", 0.0)),
                float(hist_metrics.get("author_distribution_entropy", 0.0)) * 15.0
            ])

            norm_curr = np.linalg.norm(curr_vec)
            norm_hist = np.linalg.norm(hist_vec)
            
            if norm_curr > 0 and norm_hist > 0:
                sim = 1.0 - cosine(curr_vec, hist_vec)
                match_pct = round(max(0.0, float(sim)) * 100.0, 1)
            else:
                match_pct = 50.0

            matches.append({
                "id": hist.get("project_id", "hist_01"),
                "name": hist.get("project_name", "Historical Project"),
                "domain": "Uploaded Repository",
                "similarity_score": match_pct,
                "historical_outcome": f"Recorded Risk Score: {hist.get('ml_results', {}).get('overall_risk_score', 'N/A')}",
                "recommended_resolution": f"Primary Failure: {hist.get('ml_results', {}).get('primary_failure_type', 'N/A')}"
            })

        matches.sort(key=lambda x: x["similarity_score"], reverse=True)

        avg_comp = round(float(np.mean([float(h.get("metrics", {}).get("cyclomatic_complexity", 0)) for h in db_historical_projects])), 1)
        avg_coup = round(float(np.mean([float(h.get("metrics", {}).get("dependency_coupling", 0)) for h in db_historical_projects])), 2)

        # Build Multi-Project Portfolio Comparison table
        project_comparison_matrix = []
        portfolio_risk_scores = []
        for hist in db_historical_projects:
            p_name = hist.get("project_name", "Portfolio Repository")
            p_risk = float(hist.get("ml_results", {}).get("overall_risk_score", 50.0))
            portfolio_risk_scores.append(p_risk)
            p_burnout = float(hist.get("ml_results", {}).get("burnout_analysis", {}).get("burnout_risk_score", 45.0))
            p_failure = hist.get("ml_results", {}).get("primary_failure_type", "Architecture Drift")
            p_comp_score = float(hist.get("compliance_report", {}).get("compliance_score", 80.0))
            p_hotspots = len(hist.get("hotspots", []))
            
            project_comparison_matrix.append({
                "project_id": hist.get("project_id", ""),
                "project_name": p_name,
                "risk_score": p_risk,
                "failure_probability": f"{p_failure} (High Risk)" if p_risk > 60 else f"{p_failure} (Moderate Risk)",
                "team_health_score": round(100.0 - p_burnout, 1),
                "compliance_score": p_comp_score,
                "hotspots_count": p_hotspots,
                "recommended_intervention": "Refactor Coupling" if p_risk > 65 else "Maintain Sprint Pace"
            })

        portfolio_avg_risk = round(float(np.mean(portfolio_risk_scores)), 1) if portfolio_risk_scores else curr_vec[0] * 1.5

        return {
            "has_historical_comparison": True,
            "top_matching_project": matches[0] if matches else None,
            "similar_projects": matches[:4],
            "multi_project_comparison": {
                "current_project_complexity": curr_vec[0],
                "benchmark_average_complexity": avg_comp,
                "current_project_coupling": curr_vec[1],
                "benchmark_average_coupling": avg_coup,
                "portfolio_aggregate_risk": portfolio_avg_risk,
                "portfolio_risk_grade": "ELEVATED" if portfolio_avg_risk > 60 else "HEALTHY",
                "portfolio_projects_count": len(db_historical_projects) + 1,
                "project_comparison_matrix": project_comparison_matrix[:6]
            }
        }

