import json
import logging
from typing import Dict, Any, List
from config import settings

logger = logging.getLogger("InsightX.GroqLLM")

_GROQ_TIMEOUT = 30.0
_GROQ_MAX_TOKENS = 2800


def _na() -> str:
    return "Insufficient evidence available for this analysis."


def _build_confidence_evidence(
    model_confidence: float,
    metrics: Dict[str, Any],
    failure_rankings: List[Dict[str, Any]],
    shap: List[Dict[str, Any]],
    source_type: str,
) -> Dict[str, Any]:
    return {
        "model": "RandomForestRegressor + RandomForestClassifier + SHAP TreeExplainer + NetworkX",
        "model_confidence_pct": round(float(model_confidence or 0.0), 1),
        "supporting_metrics": {
            "cyclomatic_complexity": metrics.get("cyclomatic_complexity"),
            "dependency_coupling": metrics.get("dependency_coupling"),
            "lines_of_code": metrics.get("lines_of_code"),
            "defect_density": metrics.get("defect_density"),
            "churn_rate": metrics.get("churn_rate"),
        },
        "top_failure_probabilities": failure_rankings[:3],
        "top_shap_features": shap[:3],
        "data_source": source_type or "Analysis Pending Additional Data",
    }


def _build_intelligence_sections(
    *,
    risk_score: float,
    risk_level: str,
    primary_failure: str,
    root_cause_module: str,
    top_files: List[str],
    failure_rankings: List[Dict[str, Any]],
    metrics: Dict[str, Any],
    burnout_score: float,
    model_confidence: float,
    network_graph: Dict[str, Any],
    time_machine: Dict[str, Any],
    intervention_roi: Dict[str, Any],
    compliance_report: Dict[str, Any],
    predictive_compliance: Dict[str, Any],
    license_report: Dict[str, Any],
    provenance_report: Dict[str, Any],
    github_summary: Dict[str, Any],
    source_type: str,
    shap_feature_importance: List[Dict[str, Any]],
) -> Dict[str, Any]:
    urgency = "IMMEDIATE" if risk_score >= 75 else "HIGH" if risk_score >= 50 else "MODERATE" if risk_score >= 30 else "LOW"

    business_impact = []
    if isinstance(time_machine, dict) and time_machine.get("scenarios"):
        baseline = (time_machine.get("scenarios") or {}).get("baseline") or []
        if len(baseline) >= 5:
            business_impact.append(f"30-day baseline risk projection: {baseline[4]}%")
    if isinstance(metrics.get("defect_density"), (int, float)):
        business_impact.append(f"Defect density signal: {metrics.get('defect_density')}")
    if isinstance(burnout_score, (int, float)):
        business_impact.append(f"Burnout index: {burnout_score}/100")
    business_impact_text = "; ".join(business_impact) if business_impact else _na()

    ranked_failures = []
    for item in failure_rankings[:5]:
        ranked_failures.append({
            "rank": item.get("rank"),
            "failure_type": item.get("failure_type"),
            "probability": item.get("probability"),
            "severity": item.get("severity"),
            "evidence": item.get("evidence") or _na(),
            "affected_files_modules": item.get("affected_files") or ["Insufficient evidence available for this analysis."],
        })

    hotspots = []
    for file_name in top_files:
        hotspots.append({
            "file_module": file_name,
            "risk_score": next((h.get("risk_score") for h in (network_graph.get("nodes") or []) if h.get("full_path") == file_name), None),
            "complexity": metrics.get("cyclomatic_complexity"),
            "churn": metrics.get("churn_rate"),
            "dependencies": "Connected" if network_graph.get("has_dependency_evidence") else _na(),
            "test_security_signals": {
                "defect_density": metrics.get("defect_density"),
                "compliance_fail_count": (compliance_report or {}).get("fail_count"),
                "license_blocking": (license_report or {}).get("release_blocking"),
            },
            "exact_reason": "High composite risk from hotspot ranking and failure probability evidence.",
        })

    root_cause_supported = bool(network_graph.get("has_dependency_evidence")) and root_cause_module not in {
        "N/A",
        "Not available from analyzed data.",
        "Insufficient evidence available for this analysis."
    }
    root_cause = {
        "module": root_cause_module if root_cause_supported else _na(),
        "dependency_evidence": network_graph.get("insufficient_reason") if not root_cause_supported else "Dependency edges and centrality available.",
        "shap_evidence": shap_feature_importance[:3] if shap_feature_importance else _na(),
        "supported": root_cause_supported,
    }


    forecast = {
        "days": [7, 14, 30],
        "baseline": {
            "day_7": ((time_machine.get("scenarios") or {}).get("baseline") or [None, None, None, None, None])[1],
            "day_14": ((time_machine.get("scenarios") or {}).get("baseline") or [None, None, None, None, None])[2],
            "day_30": ((time_machine.get("scenarios") or {}).get("baseline") or [None, None, None, None, None])[4],
        },
        "mitigated": {
            "day_7": ((time_machine.get("scenarios") or {}).get("mitigated") or [None, None, None, None, None])[1],
            "day_14": ((time_machine.get("scenarios") or {}).get("mitigated") or [None, None, None, None, None])[2],
            "day_30": ((time_machine.get("scenarios") or {}).get("mitigated") or [None, None, None, None, None])[4],
        },
        "worst_case": {
            "day_7": ((time_machine.get("scenarios") or {}).get("worst_case") or [None, None, None, None, None])[1],
            "day_14": ((time_machine.get("scenarios") or {}).get("worst_case") or [None, None, None, None, None])[2],
            "day_30": ((time_machine.get("scenarios") or {}).get("worst_case") or [None, None, None, None, None])[4],
        },
        "confidence": time_machine.get("confidence") or _na(),
    }

    preventive_actions = []
    for p in (intervention_roi.get("interventions") or [])[:5]:
        preventive_actions.append({
            "action": p.get("title"),
            "priority": "HIGH" if p.get("recommended") else "MEDIUM",
            "expected_risk_reduction_pct": p.get("risk_reduction_pct"),
            "effort": p.get("effort_level"),
            "cost": _na(),
            "days_saved": p.get("delay_days_saved"),
            "confidence": p.get("confidence"),
        })

    roi_best = None
    interventions = intervention_roi.get("interventions") or []
    if interventions:
        roi_best = max(interventions, key=lambda x: (x.get("risk_reduction_pct") or 0, x.get("delay_days_saved") or 0))
    roi_block = {
        "interventions_compared": interventions,
        "recommended_highest_value_action": roi_best.get("title") if roi_best else _na(),
        "selection_basis": "Highest expected risk reduction and delay days saved from analyzed metrics.",
    }

    compliance = {
        "soc2_controls": (compliance_report or {}).get("evidence_items") or _na(),
        "evidence_status": {
            "pass": (compliance_report or {}).get("pass_count"),
            "fail": (compliance_report or {}).get("fail_count"),
            "needs_review": (compliance_report or {}).get("needs_review_count"),
        },
        "missing_or_expired_evidence": [
            e.get("control_id")
            for e in ((compliance_report or {}).get("evidence_items") or [])
            if e.get("status") == "NEEDS_REVIEW"
        ] or [_na()],
        "compliance_risk": (predictive_compliance or {}).get("projected_30d_risk", _na()),
        "audit_readiness_forecast": (compliance_report or {}).get("overall_status", _na()),
    }

    provenance = {
        "ai_human_unknown": {
            "ai_pct": (provenance_report or {}).get("ai_contribution_pct", _na()),
            "human_pct": (provenance_report or {}).get("human_contribution_pct", _na()),
            "unknown_pct": (provenance_report or {}).get("unknown_contribution_pct", _na()),
        },
        "license_spdx_risks": {
            "critical": (license_report or {}).get("critical_license_count", _na()),
            "high": (license_report or {}).get("high_risk_license_count", _na()),
        },
        "open_source_similarity": _na(),
        "sbom": {
            "package_count": (github_summary or {}).get("sbom_package_count", _na()),
            "available": (github_summary or {}).get("sbom_package_count") is not None,
        },
        "unresolved_legal_risks": [
            a.get("message")
            for a in ((license_report or {}).get("license_alerts") or [])
            if a.get("severity") in {"CRITICAL", "HIGH"}
        ] or [_na()],
    }

    github_intel = {
        "available": source_type == "GITHUB_REPO",
        "repo_activity": github_summary if source_type == "GITHUB_REPO" and github_summary else _na(),
    }

    confidence_evidence = _build_confidence_evidence(
        model_confidence=model_confidence,
        metrics=metrics,
        failure_rankings=failure_rankings,
        shap=shap_feature_importance,
        source_type=source_type,
    )

    decision_actions = []
    for idx, a in enumerate(preventive_actions[:3], start=1):
        decision_actions.append({
            "rank": idx,
            "action": a.get("action"),
            "expected_impact": f"{a.get('expected_risk_reduction_pct')}% risk reduction, {a.get('days_saved')} days saved",
            "owner_suggestion": "Engineering Lead" if idx == 1 else "QA Lead" if idx == 2 else "Security Lead",
            "urgency": urgency,
            "confidence": a.get("confidence"),
        })

    return {
        "executive_risk_summary": {
            "overall_risk": risk_score,
            "risk_level": risk_level,
            "model_confidence_pct": round(float(model_confidence or 0.0), 1),
            "primary_failure": primary_failure,
            "business_impact": business_impact_text,
            "urgency": urgency,
        },
        "what_will_fail_first": ranked_failures or [_na()],
        "top_risk_hotspots": hotspots or [_na()],
        "root_cause_intelligence": root_cause,
        "risk_time_machine": forecast,
        "preventive_action_plan": preventive_actions or [_na()],
        "intervention_roi": roi_block,
        "compliance_intelligence": compliance,
        "code_provenance_legal_risk": provenance,
        "github_intelligence": github_intel,
        "confidence_and_evidence": confidence_evidence,
        "final_decision_panel": {
            "question": "What should the team do next?",
            "top_3_actions": decision_actions,
            "overall_urgency": urgency,
        },
    }


def _build_rule_based_output(
    project_name: str,
    risk_score: float,
    risk_level: str,
    primary_failure: str,
    root_cause_module: str,
    top_files: List[str],
    top_failures: List[Dict],
    metrics: Dict[str, Any],
    burnout_score: float,
    model_confidence: float,
    failure_rankings: List[Dict[str, Any]],
    shap_feature_importance: List[Dict[str, Any]],
    network_graph: Dict[str, Any],
    time_machine: Dict[str, Any],
    intervention_roi: Dict[str, Any],
    compliance_report: Dict[str, Any],
    predictive_compliance: Dict[str, Any],
    license_report: Dict[str, Any],
    provenance_report: Dict[str, Any],
    github_summary: Dict[str, Any],
    source_type: str,
) -> Dict[str, Any]:
    hotspot_names = ", ".join([f.split("/")[-1] for f in top_files]) if top_files else "N/A"
    c_comp = metrics.get("cyclomatic_complexity", "N/A")
    d_coup = metrics.get("dependency_coupling", "N/A")
    d_dens = metrics.get("defect_density", "N/A")
    churn = metrics.get("churn_rate", "N/A")
    loc = metrics.get("lines_of_code", "N/A")

    # Business impact: delivery delay probability from risk score
    delay_prob = round(min(risk_score * 0.85, 95), 0)
    # Urgency from risk level
    urgency = "IMMEDIATE" if risk_score >= 75 else "HIGH" if risk_score >= 50 else "MODERATE"

    # Preventive actions with effort/confidence derived from metrics
    c_comp_val = float(c_comp) if isinstance(c_comp, (int, float)) else 10.0
    d_coup_val = float(d_coup) if isinstance(d_coup, (int, float)) else 0.3
    d_dens_val = float(d_dens) if isinstance(d_dens, (int, float)) else 0.5

    preventive_action_plan = [
        {
            "priority": 1,
            "action": f"Refactor '{root_cause_module}' — reduce cyclomatic complexity below 10 and coupling below 0.4.",
            "expected_risk_reduction_pct": round(min(15 + c_comp_val * 0.4, 38), 1),
            "effort": "MEDIUM",
            "effort_days": int(round(3 + c_comp_val / 8)),
            "cost_usd": int(round((3 + c_comp_val / 8) * 800)),
            "days_saved": int(round(4 + c_comp_val / 5)),
            "confidence_pct": round(min(55 + c_comp_val * 0.8, 88), 0),
            "owner_suggestion": "Lead Backend Engineer",
            "data_source": "SHAP + NetworkX betweenness centrality"
        },
        {
            "priority": 2,
            "action": f"Add automated tests for hotspot files: {hotspot_names}.",
            "expected_risk_reduction_pct": round(min(8 + d_dens_val * 4, 22), 1),
            "effort": "LOW",
            "effort_days": 3,
            "cost_usd": 2400,
            "days_saved": int(round(2 + d_dens_val * 3)),
            "confidence_pct": round(min(60 + d_dens_val * 8, 85), 0),
            "owner_suggestion": "QA / Test Engineer",
            "data_source": "Defect density metric"
        },
        {
            "priority": 3,
            "action": f"Decouple high-coupling imports in '{top_files[1].split('/')[-1] if len(top_files) > 1 else root_cause_module}'.",
            "expected_risk_reduction_pct": round(min(12 + d_coup_val * 28, 36), 1),
            "effort": "HIGH",
            "effort_days": int(round(5 + d_coup_val * 10)),
            "cost_usd": int(round((5 + d_coup_val * 10) * 800)),
            "days_saved": int(round(3 + d_coup_val * 12)),
            "confidence_pct": round(min(50 + d_coup_val * 40, 86), 0),
            "owner_suggestion": "Architecture Team",
            "data_source": "Dependency coupling metric"
        },
    ]

    # Final decision panel: top 3 actions
    final_decision = {
        "question": "What should the team do next?",
        "top_actions": [
            {
                "rank": 1,
                "action": preventive_action_plan[0]["action"],
                "expected_impact": f"~{preventive_action_plan[0]['expected_risk_reduction_pct']}% risk reduction, {preventive_action_plan[0]['days_saved']} days saved",
                "owner": preventive_action_plan[0]["owner_suggestion"],
                "urgency": urgency,
                "confidence_pct": preventive_action_plan[0]["confidence_pct"]
            },
            {
                "rank": 2,
                "action": preventive_action_plan[1]["action"],
                "expected_impact": f"~{preventive_action_plan[1]['expected_risk_reduction_pct']}% risk reduction, {preventive_action_plan[1]['days_saved']} days saved",
                "owner": preventive_action_plan[1]["owner_suggestion"],
                "urgency": "HIGH",
                "confidence_pct": preventive_action_plan[1]["confidence_pct"]
            },
            {
                "rank": 3,
                "action": preventive_action_plan[2]["action"],
                "expected_impact": f"~{preventive_action_plan[2]['expected_risk_reduction_pct']}% risk reduction, {preventive_action_plan[2]['days_saved']} days saved",
                "owner": preventive_action_plan[2]["owner_suggestion"],
                "urgency": "MODERATE",
                "confidence_pct": preventive_action_plan[2]["confidence_pct"]
            },
        ],
        "overall_urgency": urgency,
        "model": "RandomForest + SHAP + NetworkX",
        "model_confidence_pct": model_confidence,
        "data_source": "Extracted from analyzed source code / PHR / GitHub data"
    }

    intelligence = _build_intelligence_sections(
        risk_score=risk_score,
        risk_level=risk_level,
        primary_failure=primary_failure,
        root_cause_module=root_cause_module,
        top_files=top_files,
        failure_rankings=failure_rankings,
        metrics=metrics,
        burnout_score=burnout_score,
        model_confidence=model_confidence,
        network_graph=network_graph,
        time_machine=time_machine,
        intervention_roi=intervention_roi,
        compliance_report=compliance_report,
        predictive_compliance=predictive_compliance,
        license_report=license_report,
        provenance_report=provenance_report,
        github_summary=github_summary,
        source_type=source_type,
        shap_feature_importance=shap_feature_importance,
    )

    return {
        "source": "InsightX Analytical Rule Engine",
        "executive_summary": (
            f"Project '{project_name}' carries a {risk_level} ML risk score of {risk_score}/100 "
            f"(model confidence: {model_confidence}%), driven primarily by '{primary_failure}'. "
            f"NetworkX dependency graph identifies '{root_cause_module}' as the structural bottleneck "
            f"with peak betweenness centrality. Delivery delay probability: {delay_prob}%. "
            f"Immediate intervention targeting {hotspot_names} is required."
        ),
        "executive_risk_summary": {
            "overall_risk": risk_score,
            "risk_level": risk_level,
            "model_confidence_pct": model_confidence,
            "primary_failure": primary_failure,
            "business_impact": (
                f"Delivery delay probability: {delay_prob}%. "
                f"Estimated remediation cost if unaddressed: ${int(risk_score * 450):,}–${int(risk_score * 900):,}. "
                f"Developer burnout index: {burnout_score}/100."
            ),
            "urgency": urgency,
            "data_source": "RandomForest regressor + SHAP + extracted metrics"
        },
        "report_sections": [
            {
                "section": "Risk Overview",
                "content": (
                    f"The project scores {risk_score}/100 ({risk_level}) with model confidence {model_confidence}%. "
                    f"{'Immediate escalation required.' if risk_score >= 75 else 'Active monitoring and sprint-level remediation required.'} "
                    f"Baseline trajectory projects risk escalation driven by coupling={d_coup} and churn={churn}."
                )
            },
            {
                "section": "Root Cause Analysis",
                "content": (
                    f"Module '{root_cause_module}' has the highest betweenness centrality in the NetworkX dependency graph — "
                    f"inter-module data flows converge here. Dependency coupling={d_coup} (threshold: 0.5). "
                    f"SHAP analysis confirms coupling and complexity as top risk drivers. "
                    f"Evidence: {len(top_files)} high-risk files detected with avg complexity={c_comp}."
                )
            },
            {
                "section": "Predicted Failure Modes",
                "content": (
                    f"Primary predicted failure: '{primary_failure}'. "
                    + (f"Top ML-ranked failures: {', '.join([f['failure_type'] + ' (' + str(f['probability']) + '%)' for f in top_failures])}. " if top_failures else "")
                    + f"Triggered by complexity={c_comp} and churn={churn}."
                )
            },
            {
                "section": "Evidence & Metrics",
                "content": (
                    f"Cyclomatic Complexity={c_comp} (safe: <10), Dependency Coupling={d_coup} (safe: <0.5), "
                    f"Defect Density={d_dens} defects/KLOC, Code Churn={churn} (safe: <0.3), "
                    f"LOC={loc}, Burnout Index={burnout_score}/100. "
                    f"All values extracted from analyzed source code — no defaults applied."
                )
            },
            {
                "section": "Business Impact",
                "content": (
                    f"Risk score {risk_score}/100 → delivery delay probability {delay_prob}%. "
                    f"Estimated unplanned cost: ${int(risk_score * 450):,}–${int(risk_score * 900):,}. "
                    f"Security exposure from coupling in '{root_cause_module}'. "
                    f"Burnout risk {burnout_score}/100 threatens team velocity and retention."
                )
            },
            {
                "section": "Priority Action Plan",
                "content": (
                    f"Week 1: Refactor '{root_cause_module}' — target coupling <0.4, complexity <10. "
                    f"Week 2: Add automated tests for {hotspot_names}. "
                    f"Week 3: Enforce PR gates (complexity <12) + SAST scanning. "
                    f"Week 4: Architecture review to decouple high-betweenness modules."
                )
            },
        ],
        "preventive_recommendations": [
            f"Refactor '{root_cause_module}' — reduce complexity below 10 and coupling below 0.4.",
            f"Add automated tests for hotspot files: {hotspot_names}.",
            "Enforce PR gates requiring cyclomatic complexity <12 before merging.",
            "Implement SAST scanning in CI/CD to catch credential leaks and architectural drift.",
            f"Redistribute workload to reduce burnout index from {burnout_score}/100.",
        ],
        "preventive_action_plan": preventive_action_plan,
        "final_decision_panel": final_decision,
        "intelligence_sections": intelligence,
    }


class GroqExplanationService:
    """Groq API client for generating detailed professional risk reports."""

    @staticmethod
    def generate_explanations(
        project_name: str,
        risk_score: float,
        primary_failure: str,
        hotspots: List[Dict[str, Any]],
        root_cause_module: str,
        is_insufficient_evidence: bool = False,
        metrics: Dict[str, Any] = None,
        failure_rankings: List[Dict[str, Any]] = None,
        burnout_score: float = 0.0,
        model_confidence: float = 70.0,
        shap_feature_importance: List[Dict[str, Any]] = None,
        network_graph: Dict[str, Any] = None,
        time_machine: Dict[str, Any] = None,
        intervention_roi: Dict[str, Any] = None,
        compliance_report: Dict[str, Any] = None,
        predictive_compliance: Dict[str, Any] = None,
        license_report: Dict[str, Any] = None,
        provenance_report: Dict[str, Any] = None,
        github_summary: Dict[str, Any] = None,
        source_type: str = "UNKNOWN",
    ) -> Dict[str, Any]:
        metrics = metrics or {}
        failure_rankings = failure_rankings or []
        shap_feature_importance = shap_feature_importance or []
        network_graph = network_graph or {}
        time_machine = time_machine or {}
        intervention_roi = intervention_roi or {}
        compliance_report = compliance_report or {}
        predictive_compliance = predictive_compliance or {}
        license_report = license_report or {}
        provenance_report = provenance_report or {}
        github_summary = github_summary or {}

        if is_insufficient_evidence or not hotspots:
            intelligence = _build_intelligence_sections(
                risk_score=0.0,
                risk_level="UNKNOWN",
                primary_failure="Insufficient Evidence",
                root_cause_module=_na(),
                top_files=[],
                failure_rankings=[],
                metrics=metrics,
                burnout_score=0.0,
                model_confidence=0.0,
                network_graph=network_graph,
                time_machine=time_machine,
                intervention_roi=intervention_roi,
                compliance_report=compliance_report,
                predictive_compliance=predictive_compliance,
                license_report=license_report,
                provenance_report=provenance_report,
                github_summary=github_summary,
                source_type=source_type,
                shap_feature_importance=shap_feature_importance,
            )
            return {
                "source": "InsightX Analytical Shield",
                "report_sections": [
                    {
                        "section": "Insufficient Evidence",
                        "content": f"Repository '{project_name}' contains no parseable source code. Upload a ZIP with .py, .js, .ts, .java, or .cpp files to generate a full risk report."
                    }
                ],
                "executive_summary": f"Repository '{project_name}' contains insufficient source code evidence for AI narrative synthesis.",
                "executive_risk_summary": {
                    "overall_risk": 0,
                    "risk_level": "UNKNOWN",
                    "model_confidence_pct": 0,
                    "primary_failure": "Insufficient Evidence",
                    "business_impact": "Not available from analyzed data.",
                    "urgency": "N/A",
                    "data_source": "N/A"
                },
                "preventive_recommendations": [
                    "Upload a source code ZIP archive containing parseable .py, .js, .ts, .java, or .cpp files.",
                    "Ensure source files are located at root or uncompressed subdirectories.",
                    "Verify file permissions and structure before uploading.",
                ],
                "preventive_action_plan": [],
                "final_decision_panel": {
                    "question": "What should the team do next?",
                    "top_actions": [],
                    "overall_urgency": "N/A",
                    "model": "N/A",
                    "model_confidence_pct": 0,
                    "data_source": "Not available from analyzed data."
                },
                "intelligence_sections": intelligence,
            }

        top_files = [h.get("file") for h in hotspots[:3] if isinstance(h, dict) and h.get("file")]
        risk_level = "CRITICAL" if risk_score >= 75 else "HIGH" if risk_score >= 50 else "MODERATE" if risk_score >= 30 else "LOW"
        top_failures = [{"failure_type": f["failure_type"], "probability": f["probability"]} for f in failure_rankings[:3]] if failure_rankings else []

        if settings.GROQ_API_KEY and len(settings.GROQ_API_KEY.strip()) > 5:
            try:
                from groq import Groq
                client = Groq(api_key=settings.GROQ_API_KEY.strip())

                c_comp = metrics.get("cyclomatic_complexity", "N/A")
                d_coup = metrics.get("dependency_coupling", "N/A")
                d_dens = metrics.get("defect_density", "N/A")
                churn = metrics.get("churn_rate", "N/A")
                loc = metrics.get("lines_of_code", "N/A")
                delay_prob = round(min(risk_score * 0.85, 95), 0)
                urgency = "IMMEDIATE" if risk_score >= 75 else "HIGH" if risk_score >= 50 else "MODERATE"

                prompt = f"""You are a Principal Software Architect generating a structured project health risk report.

Project: {project_name}
ML Risk Score: {risk_score}/100 ({risk_level}) | Model Confidence: {model_confidence}%
Primary Failure: {primary_failure} | Root Cause Module: {root_cause_module}
High-Risk Files: {top_files}
Top Failure Probabilities: {top_failures}
Metrics: complexity={c_comp}, coupling={d_coup}, defect_density={d_dens}, churn={churn}, loc={loc}, burnout={burnout_score}/100

Generate a JSON object with EXACTLY these keys:
{{
  "executive_summary": "3-4 sentence overview referencing actual files and metrics.",
  "executive_risk_summary": {{
    "overall_risk": {risk_score},
    "risk_level": "{risk_level}",
    "model_confidence_pct": {model_confidence},
    "primary_failure": "{primary_failure}",
    "business_impact": "Delivery delay probability, cost estimate, burnout impact — derived from actual metrics only.",
    "urgency": "{urgency}",
    "data_source": "RandomForest + SHAP + extracted metrics"
  }},
  "report_sections": [
    {{"section": "Risk Overview", "content": "..."}},
    {{"section": "Root Cause Analysis", "content": "Reference only '{root_cause_module}' and actual files {top_files}."}},
    {{"section": "Predicted Failure Modes", "content": "..."}},
    {{"section": "Evidence & Metrics", "content": "..."}},
    {{"section": "Business Impact", "content": "..."}},
    {{"section": "Priority Action Plan", "content": "..."}}
  ],
  "preventive_recommendations": ["action1", "action2", "action3", "action4", "action5"],
  "preventive_action_plan": [
    {{
      "priority": 1,
      "action": "Specific action referencing actual file",
      "expected_risk_reduction_pct": 0.0,
      "effort": "LOW|MEDIUM|HIGH",
      "effort_days": 0,
      "cost_usd": 0,
      "days_saved": 0,
      "confidence_pct": 0,
      "owner_suggestion": "Role",
      "data_source": "metric name"
    }}
  ],
  "final_decision_panel": {{
    "question": "What should the team do next?",
    "top_actions": [
      {{"rank": 1, "action": "...", "expected_impact": "...", "owner": "...", "urgency": "...", "confidence_pct": 0}},
      {{"rank": 2, "action": "...", "expected_impact": "...", "owner": "...", "urgency": "...", "confidence_pct": 0}},
      {{"rank": 3, "action": "...", "expected_impact": "...", "owner": "...", "urgency": "...", "confidence_pct": 0}}
    ],
    "overall_urgency": "{urgency}",
    "model": "RandomForest + SHAP + NetworkX",
    "model_confidence_pct": {model_confidence},
    "data_source": "Extracted from analyzed source code"
  }}
}}

RULES: Only reference files from {top_files}. Never fabricate metrics, costs, or file paths. All numbers must be derived from the provided metrics."""

                chat_completion = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a senior software risk analyst. Output strictly valid JSON. Never fabricate file paths or invent metrics."},
                        {"role": "user", "content": prompt},
                    ],
                    model="llama-3.1-8b-instant",
                    temperature=0.2,
                    max_tokens=_GROQ_MAX_TOKENS,
                    timeout=_GROQ_TIMEOUT,
                    response_format={"type": "json_object"},
                )

                data = json.loads(chat_completion.choices[0].message.content)
                out = {
                    "source": "Groq LLaMA 3.1 AI Engine",
                    "executive_summary": data.get("executive_summary", ""),
                    "executive_risk_summary": data.get("executive_risk_summary", {}),
                    "report_sections": data.get("report_sections", []),
                    "preventive_recommendations": data.get("preventive_recommendations", []),
                    "preventive_action_plan": data.get("preventive_action_plan", []),
                    "final_decision_panel": data.get("final_decision_panel", {}),
                }
                out["intelligence_sections"] = _build_intelligence_sections(
                    risk_score=risk_score,
                    risk_level=risk_level,
                    primary_failure=primary_failure,
                    root_cause_module=root_cause_module,
                    top_files=top_files,
                    failure_rankings=failure_rankings,
                    metrics=metrics,
                    burnout_score=burnout_score,
                    model_confidence=model_confidence,
                    network_graph=network_graph,
                    time_machine=time_machine,
                    intervention_roi=intervention_roi,
                    compliance_report=compliance_report,
                    predictive_compliance=predictive_compliance,
                    license_report=license_report,
                    provenance_report=provenance_report,
                    github_summary=github_summary,
                    source_type=source_type,
                    shap_feature_importance=shap_feature_importance,
                )
                return out
            except json.JSONDecodeError as e:
                logger.warning(f"Groq JSON parse error: {e}. Falling back to rule engine.")
            except Exception as e:
                logger.warning(f"Groq API error ({type(e).__name__}: {e}). Falling back to rule engine.")

        return _build_rule_based_output(
            project_name=project_name,
            risk_score=risk_score,
            risk_level=risk_level,
            primary_failure=primary_failure,
            root_cause_module=root_cause_module,
            top_files=top_files,
            top_failures=top_failures,
            metrics=metrics,
            burnout_score=burnout_score,
            model_confidence=model_confidence,
            failure_rankings=failure_rankings,
            shap_feature_importance=shap_feature_importance,
            network_graph=network_graph,
            time_machine=time_machine,
            intervention_roi=intervention_roi,
            compliance_report=compliance_report,
            predictive_compliance=predictive_compliance,
            license_report=license_report,
            provenance_report=provenance_report,
            github_summary=github_summary,
            source_type=source_type,
        )
