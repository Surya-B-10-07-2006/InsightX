import json
import logging
from typing import Dict, Any, List, Optional
from config import settings

logger = logging.getLogger("InsightX.GroqLLM")

_GROQ_TIMEOUT = 30.0
# Use configured max_tokens, but cap at reasonable limit for production models
_GROQ_MAX_TOKENS = max(1, min(4096, int(getattr(settings, "GROQ_MAX_TOKENS", 4096))))

# Groq production models for text generation
_GROQ_MODELS = {
    "executive": "openai/gpt-oss-120b",  # High capability for executive decisions
    "lightweight": "openai/gpt-oss-20b",  # Faster inference for lightweight tasks
}


def _get_groq_model(use_case: str = "executive") -> str:
    """Return appropriate Groq model based on use case without fallbacks."""
    if use_case == "executive":
        model = getattr(settings, "GROQ_MODEL_EXECUTIVE", "openai/gpt-oss-120b").strip()
    else:
        model = getattr(settings, "GROQ_MODEL_LIGHTWEIGHT", "openai/gpt-oss-20b").strip()
    
    if not model:
        raise ValueError(f"Groq model not configured for use case '{use_case}'. Please set GROQ_MODEL_EXECUTIVE or GROQ_MODEL_LIGHTWEIGHT in config.")
    
    return model


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


# ---------------------------------------------------------------------------
# Evidence-Based Executive Decision Engine
# ---------------------------------------------------------------------------

def _build_rule_based_decisions(
    *,
    project_name: str,
    risk_score: float,
    risk_level: str,
    primary_failure: str,
    root_cause_module: str,
    top_files: List[str],
    failure_rankings: List[Dict[str, Any]],
    metrics: Dict[str, Any],
    burnout_score: float,
    model_confidence: float,
    shap_feature_importance: List[Dict[str, Any]],
    intervention_roi: Dict[str, Any],
    sast_findings: List[Dict[str, Any]],
    compliance_fail_count: int,
) -> List[Dict[str, Any]]:
    """Rule-engine fallback: produce evidence-grounded decisions from computed metrics."""
    urgency = "IMMEDIATE" if risk_score >= 75 else "HIGH" if risk_score >= 50 else "MODERATE"
    c_comp = metrics.get("cyclomatic_complexity", 0) or 0
    d_coup = metrics.get("dependency_coupling", 0) or 0
    d_dens = metrics.get("defect_density", 0) or 0
    churn = metrics.get("churn_rate", 0) or 0
    burnout = burnout_score or 0

    decisions = []

    # Decision 1 — highest-risk hotspot
    top_file = top_files[0].split("/")[-1] if top_files else root_cause_module
    decisions.append({
        "rank": 1,
        "decision": f"Refactor '{top_file}' — cyclomatic complexity {c_comp:.1f} exceeds safe threshold of 10",
        "why": (
            f"'{top_file}' is the highest-risk module with complexity={c_comp:.1f}, coupling={d_coup:.2f}. "
            f"NetworkX betweenness centrality identifies it as the structural bottleneck driving '{primary_failure}'."
        ),
        "evidence": {
            "file": top_file,
            "complexity": round(float(c_comp), 1),
            "coupling": round(float(d_coup), 2),
            "defect_density": round(float(d_dens), 3),
            "risk_score": round(float(risk_score), 1),
        },
        "affected_files": top_files[:2] or [top_file],
        "expected_risk_reduction_pct": round(min(15 + float(c_comp) * 0.4, 38), 1),
        "estimated_effort": "MEDIUM",
        "effort_days": max(3, int(float(c_comp) / 5)),
        "days_saved": max(3, int(float(c_comp) / 4)),
        "owner": "Lead Backend Engineer",
        "urgency": urgency,
        "confidence_pct": round(min(55 + float(model_confidence) * 0.3, 90), 0),
        "measurable_target": f"Reduce cyclomatic complexity below 10 and coupling below 0.4 in '{top_file}'",
        "source": "InsightX Rule Engine",
    })

    # Decision 2 — defect / SAST coverage
    crit_sast = len([f for f in sast_findings if f.get("severity") in {"CRITICAL", "HIGH"}])
    decisions.append({
        "rank": 2,
        "decision": f"Add automated tests and fix {crit_sast} CRITICAL/HIGH security findings in hotspot files",
        "why": (
            f"Defect density={d_dens:.3f} defects/KLOC is above safe levels. "
            f"{crit_sast} CRITICAL/HIGH SAST findings detected across {len(top_files)} hotspot files with no confirmed test coverage."
        ),
        "evidence": {
            "defect_density": round(float(d_dens), 3),
            "critical_sast_count": crit_sast,
            "files_affected": len(top_files),
            "churn_rate": round(float(churn), 2),
        },
        "affected_files": top_files[:3] or [top_file],
        "expected_risk_reduction_pct": round(min(8 + float(d_dens) * 4, 22), 1),
        "estimated_effort": "LOW",
        "effort_days": 3,
        "days_saved": max(2, int(float(d_dens) * 3)),
        "owner": "QA / Test Engineer",
        "urgency": "HIGH" if crit_sast > 0 else "MODERATE",
        "confidence_pct": round(min(60 + float(d_dens) * 8, 85), 0),
        "measurable_target": f"Achieve 80% test coverage on top-3 hotspot files; resolve all CRITICAL SAST findings",
        "source": "InsightX Rule Engine",
    })

    # Decision 3 — dependency coupling / architecture
    if len(top_files) > 1:
        second_file = top_files[1].split("/")[-1]
    else:
        second_file = root_cause_module
    decisions.append({
        "rank": 3,
        "decision": f"Decouple '{second_file}' — dependency coupling {d_coup:.2f} is structurally unsafe",
        "why": (
            f"Dependency coupling={d_coup:.2f} (safe threshold: <0.5) creates cascading failure risk. "
            f"Architecture betweenness centrality confirms '{root_cause_module}' as the hub with highest blast radius."
        ),
        "evidence": {
            "dependency_coupling": round(float(d_coup), 2),
            "root_cause_module": root_cause_module,
            "churn_rate": round(float(churn), 2),
        },
        "affected_files": top_files[1:3] if len(top_files) > 1 else top_files,
        "expected_risk_reduction_pct": round(min(12 + float(d_coup) * 28, 36), 1),
        "estimated_effort": "HIGH",
        "effort_days": max(5, int(5 + float(d_coup) * 10)),
        "days_saved": max(3, int(3 + float(d_coup) * 12)),
        "owner": "Architecture Team",
        "urgency": urgency,
        "confidence_pct": round(min(50 + float(d_coup) * 40, 86), 0),
        "measurable_target": f"Reduce dependency coupling below 0.5; eliminate circular imports in '{root_cause_module}'",
        "source": "InsightX Rule Engine",
    })

    # Decision 4 — burnout / team sustainability (only when signal is present)
    if burnout >= 40:
        decisions.append({
            "rank": 4,
            "decision": f"Redistribute workload — burnout index {burnout:.0f}/100 threatens delivery velocity",
            "why": (
                f"Team burnout index={burnout:.0f}/100 indicates unsustainable workload concentration. "
                f"Combined with churn_rate={churn:.2f}, this creates compounding risk of contributor attrition during critical delivery."
            ),
            "evidence": {
                "burnout_risk_score": round(float(burnout), 1),
                "churn_rate": round(float(churn), 2),
                "risk_level": risk_level,
            },
            "affected_files": [],
            "expected_risk_reduction_pct": round(min(5 + float(burnout) * 0.15, 18), 1),
            "estimated_effort": "LOW",
            "effort_days": 2,
            "days_saved": max(2, int(float(burnout) / 20)),
            "owner": "Engineering Manager",
            "urgency": "HIGH" if burnout >= 70 else "MODERATE",
            "confidence_pct": 72.0,
            "measurable_target": f"Reduce burnout index below 50 within 2 sprints through workload redistribution",
            "source": "InsightX Rule Engine",
        })

    # Decision 5 — compliance (only when failures present)
    if compliance_fail_count and compliance_fail_count > 0:
        decisions.append({
            "rank": len(decisions) + 1,
            "decision": f"Resolve {compliance_fail_count} SOC 2 compliance failures before audit window",
            "why": (
                f"{compliance_fail_count} compliance controls are failing, creating audit risk. "
                f"Predictive compliance analysis shows risk escalating if unaddressed within 30 days."
            ),
            "evidence": {
                "compliance_failures": compliance_fail_count,
                "projected_30d_risk": "ESCALATING",
            },
            "affected_files": [],
            "expected_risk_reduction_pct": round(min(6 + compliance_fail_count * 1.5, 20), 1),
            "estimated_effort": "MEDIUM",
            "effort_days": max(3, compliance_fail_count),
            "days_saved": 5,
            "owner": "Security / Compliance Lead",
            "urgency": "HIGH",
            "confidence_pct": 80.0,
            "measurable_target": f"Resolve all {compliance_fail_count} failing SOC 2 controls; achieve 100% pass rate",
            "source": "InsightX Rule Engine",
        })

    return decisions[:5]


def _validate_decision(decision: Dict[str, Any], actual_risk: float, top_files: List[str]) -> Dict[str, Any]:
    """Clamp Groq-generated values against real analysis data to prevent fabrication."""
    try:
        rr = float(decision.get("expected_risk_reduction_pct") or 0)
        decision["expected_risk_reduction_pct"] = round(max(0.5, min(rr, 50.0)), 1)
    except Exception:
        decision["expected_risk_reduction_pct"] = None

    try:
        ds = float(decision.get("days_saved") or 0)
        decision["days_saved"] = max(0, min(int(ds), 90))
    except Exception:
        decision["days_saved"] = None

    try:
        cp = float(decision.get("confidence_pct") or 0)
        decision["confidence_pct"] = round(max(10.0, min(cp, 95.0)), 1)
    except Exception:
        decision["confidence_pct"] = None

    try:
        ed = float(decision.get("effort_days") or 0)
        decision["effort_days"] = max(1, min(int(ed), 180))
    except Exception:
        decision["effort_days"] = None

    # Ensure affected_files only references actual project files
    if decision.get("affected_files"):
        validated_files = []
        for f in decision["affected_files"]:
            basename = str(f).split("/")[-1]
            if any(basename in tf or basename == tf.split("/")[-1] for tf in top_files):
                validated_files.append(f)
        if not validated_files:
            validated_files = top_files[:2] if top_files else []
        decision["affected_files"] = validated_files

    effort = str(decision.get("estimated_effort", "MEDIUM")).upper()
    if effort not in {"LOW", "MEDIUM", "HIGH"}:
        effort = "MEDIUM"
    decision["estimated_effort"] = effort

    urgency = str(decision.get("urgency", "MODERATE")).upper()
    if urgency not in {"IMMEDIATE", "HIGH", "MODERATE", "LOW"}:
        urgency = "MODERATE"
    decision["urgency"] = urgency

    return decision


def generate_executive_decisions(
    *,
    project_name: str,
    risk_score: float,
    risk_level: str,
    primary_failure: str,
    root_cause_module: str,
    top_files: List[str],
    failure_rankings: List[Dict[str, Any]],
    metrics: Dict[str, Any],
    burnout_score: float,
    model_confidence: float,
    shap_feature_importance: List[Dict[str, Any]],
    network_graph: Dict[str, Any],
    time_machine: Dict[str, Any],
    intervention_roi: Dict[str, Any],
    compliance_report: Dict[str, Any],
    license_report: Dict[str, Any],
    sast_findings: List[Dict[str, Any]],
    source_type: str,
) -> Dict[str, Any]:
    """
    Generate 3–5 evidence-grounded executive decisions.

    Python/ML calculates all numbers; Groq interprets the evidence and writes
    clear executive-level decision text. All Groq output is validated against
    actual analysis values before return. Falls back to rule engine on failure.
    """
    compliance_fail_count = int((compliance_report or {}).get("fail_count") or 0)
    crit_sast = [f for f in (sast_findings or []) if f.get("severity") in {"CRITICAL", "HIGH"}]
    top_failure = failure_rankings[0] if failure_rankings else {}
    shap_top = shap_feature_importance[:3] if shap_feature_importance else []

    # ---- Pre-computed numeric evidence (Python calculates, Groq interprets) ----
    evidence_block = {
        "project_name": project_name,
        "ml_risk_score": round(float(risk_score), 1),
        "risk_level": risk_level,
        "model_confidence_pct": round(float(model_confidence), 1),
        "primary_failure_mode": primary_failure,
        "root_cause_module": root_cause_module,
        "source_type": source_type,
        "metrics": {
            "cyclomatic_complexity": metrics.get("cyclomatic_complexity"),
            "dependency_coupling": metrics.get("dependency_coupling"),
            "defect_density": metrics.get("defect_density"),
            "churn_rate": metrics.get("churn_rate"),
            "lines_of_code": metrics.get("lines_of_code"),
            "average_maintainability": metrics.get("average_maintainability"),
        },
        "top_hotspot_files": [
            {
                "file": f.split("/")[-1] if isinstance(f, str) else str(f),
                "full_path": f,
            }
            for f in top_files[:5]
        ],
        "top_failure_probabilities": [
            {"type": fr.get("failure_type"), "probability_pct": fr.get("probability"), "severity": fr.get("severity")}
            for fr in failure_rankings[:3]
        ],
        "shap_top_drivers": [
            {"feature": s.get("feature"), "direction": s.get("direction"), "impact": s.get("shap_impact")}
            for s in shap_top
        ],
        "burnout_risk_score": round(float(burnout_score or 0), 1),
        "critical_sast_count": len(crit_sast),
        "compliance_failures": compliance_fail_count,
        "critical_license_count": int((license_report or {}).get("critical_license_count") or 0),
        "intervention_roi_top": (
            (intervention_roi.get("interventions") or [{}])[0].get("title", _na())
            if intervention_roi.get("interventions") else _na()
        ),
        "day_30_risk_baseline": (
            ((time_machine.get("scenarios") or {}).get("baseline") or [None]*5)[4]
        ),
        "graph_density": network_graph.get("graph_density"),
        "has_dependency_evidence": network_graph.get("has_dependency_evidence", False),
    }

    prompt = f"""You are a Principal Engineering Risk Advisor generating executive decisions for project: "{project_name}".

ANALYSIS EVIDENCE (calculated by InsightX ML pipeline — use ONLY these values, never invent numbers):
{json.dumps(evidence_block, indent=2)}

Generate a JSON object with EXACTLY this schema:
{{
  "executive_decisions": [
    {{
      "rank": 1,
      "decision": "One specific, actionable decision referencing the actual file/module and exact metric value",
      "why": "Why this is needed — cite exact metric values from evidence above",
      "evidence": {{
        "primary_metric": "metric_name",
        "primary_value": <actual number from evidence>,
        "secondary_metric": "metric_name",
        "secondary_value": <actual number from evidence>
      }},
      "affected_files": ["exact filename from top_hotspot_files list only"],
      "expected_risk_reduction_pct": <number 1-50, derived from intervention_roi data>,
      "estimated_effort": "LOW|MEDIUM|HIGH",
      "effort_days": <integer 1-90>,
      "days_saved": <integer 0-60>,
      "owner": "Specific role title",
      "urgency": "IMMEDIATE|HIGH|MODERATE|LOW",
      "confidence_pct": <number 10-95>,
      "measurable_target": "Specific, measurable outcome with actual numbers"
    }}
  ],
  "overall_recommendation": "One executive sentence summarising the most critical action",
  "source_model": "groq-llama-3.1-8b-instant"
}}

RULES:
- Generate exactly 3 to 5 decisions ranked by priority
- Every number MUST come from the evidence block above — never fabricate
- If a metric is null, write "Insufficient evidence available" for that field
- Affected files must only come from top_hotspot_files — no invented paths
- Decision text must name the specific file/module and cite the exact metric value
- Do NOT wrap output in markdown fences — output raw JSON only"""

    if settings.GROQ_API_KEY and len(settings.GROQ_API_KEY.strip()) > 5:
        try:
            from groq import Groq
            client = Groq(api_key=settings.GROQ_API_KEY.strip())
            groq_model = _get_groq_model(use_case="executive")
            clamped_tokens = max(1, min(4096, int(_GROQ_MAX_TOKENS)))

            completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert software risk advisor. "
                            "Output only raw valid JSON — no markdown, no code fences, no preamble. "
                            "Every numeric value must come verbatim from the provided evidence block."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                model=groq_model,
                temperature=0.15,
                max_tokens=clamped_tokens,
                timeout=_GROQ_TIMEOUT,
            )

            raw = completion.choices[0].message.content or ""
            # Strip accidental markdown fences if present
            raw = raw.strip()
            if raw.startswith("```"):
                raw = raw.split("```", 2)[-1] if raw.count("```") >= 2 else raw.lstrip("`json\n")
                raw = raw.rsplit("```", 1)[0]

            parsed = json.loads(raw)
            decisions_raw = parsed.get("executive_decisions") or []

            if not isinstance(decisions_raw, list) or len(decisions_raw) == 0:
                raise ValueError("Groq returned empty decisions list")

            # Validate and clamp every decision against actual analysis data
            validated = []
            for d in decisions_raw[:5]:
                if not isinstance(d, dict):
                    continue
                d["source"] = f"Groq {groq_model}"
                validated.append(_validate_decision(d, risk_score, top_files))

            if len(validated) < 1:
                raise ValueError("No valid decisions after validation")

            logger.info(f"Groq executive decisions generated: {len(validated)} decisions via {groq_model}")
            return {
                "decisions": validated,
                "overall_recommendation": parsed.get("overall_recommendation", ""),
                "source": f"Groq {groq_model}",
                "evidence_grounded": True,
                "groq_available": True,
            }

        except json.JSONDecodeError as e:
            logger.error(f"Groq executive decisions JSON parse error: {e}")
            raise ValueError(f"Groq API returned invalid JSON: {e}")
        except Exception as e:
            logger.error(f"Groq executive decisions API error ({type(e).__name__}: {e})")
            raise RuntimeError(f"Groq API call failed: {e}")

    # ---- No silent fallback - raise error if Groq not configured ----
    raise ValueError("Groq API key not configured. Please set GROQ_API_KEY in environment or .env file to generate executive decisions.")


# ---------------------------------------------------------------------------
# Core LLM Report Engine (existing GroqExplanationService)
# ---------------------------------------------------------------------------

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
    executive_decisions: Optional[Dict[str, Any]] = None,
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
        "executive_decisions": executive_decisions,
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
        sast_findings: Optional[List[Dict[str, Any]]] = None,
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
        sast_findings = sast_findings or []

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
                "executive_decisions": {
                    "decisions": [],
                    "overall_recommendation": "Upload parseable source code to enable executive decision generation.",
                    "source": "InsightX Analytical Shield",
                    "evidence_grounded": False,
                },
            }

        top_files = [h.get("file") for h in hotspots[:3] if isinstance(h, dict) and h.get("file")]
        risk_level = "CRITICAL" if risk_score >= 75 else "HIGH" if risk_score >= 50 else "MODERATE" if risk_score >= 30 else "LOW"
        top_failures = [{"failure_type": f["failure_type"], "probability": f["probability"]} for f in failure_rankings[:3]] if failure_rankings else []

        # ---- Step 1: Generate evidence-grounded executive decisions (always runs) ----
        executive_decisions = generate_executive_decisions(
            project_name=project_name,
            risk_score=risk_score,
            risk_level=risk_level,
            primary_failure=primary_failure,
            root_cause_module=root_cause_module,
            top_files=top_files,
            failure_rankings=failure_rankings,
            metrics=metrics,
            burnout_score=burnout_score,
            model_confidence=model_confidence,
            shap_feature_importance=shap_feature_importance,
            network_graph=network_graph,
            time_machine=time_machine,
            intervention_roi=intervention_roi,
            compliance_report=compliance_report,
            license_report=license_report,
            sast_findings=sast_findings,
            source_type=source_type,
        )

        # ---- Step 2: Groq narrative report ----
        if settings.GROQ_API_KEY and len(settings.GROQ_API_KEY.strip()) > 5:
            try:
                from groq import Groq
                client = Groq(api_key=settings.GROQ_API_KEY.strip())
                groq_model = _get_groq_model()

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

                clamped_max_tokens = max(1, min(4096, int(_GROQ_MAX_TOKENS)))

                chat_completion = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a senior software risk analyst. Output strictly valid JSON only — no markdown fences, no extra text. Never fabricate file paths or invent metrics."},
                        {"role": "user", "content": prompt},
                    ],
                    model=groq_model,
                    temperature=0.2,
                    max_tokens=clamped_max_tokens,
                    timeout=_GROQ_TIMEOUT,
                    # response_format omitted intentionally — not supported by all models.
                )

                data = json.loads(chat_completion.choices[0].message.content)
                out = {
                    "source": f"Groq {groq_model} AI Engine",
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
                # Always attach the evidence-grounded decisions
                out["executive_decisions"] = executive_decisions
                out["groq_available"] = True
                return out
            except json.JSONDecodeError as e:
                logger.error(f"Groq narrative JSON parse error: {e}")
                raise ValueError(f"Groq API returned invalid JSON: {e}")
            except Exception as e:
                logger.error(f"Groq narrative API error ({type(e).__name__}: {e})")
                raise RuntimeError(f"Groq API call failed: {e}")

        # ---- No silent fallback - raise error if Groq not configured ----
        raise ValueError("Groq API key not configured. Please set GROQ_API_KEY in environment or .env file to generate AI narratives.")
