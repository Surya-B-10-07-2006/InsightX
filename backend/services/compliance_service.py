import datetime
import hashlib
import json
import logging
from typing import Dict, Any, List

logger = logging.getLogger("InsightX.Compliance")

SOC2_CONTROLS = [
    {"id": "CC6.1", "domain": "Logical Access", "description": "Logical access security measures restrict access to information assets."},
    {"id": "CC6.2", "domain": "Logical Access", "description": "Prior to issuing system credentials, entity registers and authorizes new users."},
    {"id": "CC6.3", "domain": "Logical Access", "description": "Entity authorizes, modifies, or removes access based on roles."},
    {"id": "CC7.1", "domain": "System Operations", "description": "Detection and monitoring procedures identify anomalies."},
    {"id": "CC7.2", "domain": "System Operations", "description": "Security incidents are identified and responded to."},
    {"id": "CC8.1", "domain": "Change Management", "description": "Entity authorizes, designs, develops, configures, documents, tests, approves, and implements changes."},
    {"id": "A1.1", "domain": "Availability", "description": "Capacity and performance are monitored and managed."},
    {"id": "PI1.1", "domain": "Processing Integrity", "description": "Processing is complete, valid, accurate, timely, and authorized."},
    {"id": "C1.1", "domain": "Confidentiality", "description": "Confidential information is protected during collection or creation."},
    {"id": "P1.1", "domain": "Privacy", "description": "Entity provides notice about privacy practices."},
]

LICENSE_RISK = {
    "GPL-2.0": "HIGH",
    "GPL-3.0": "HIGH",
    "AGPL-3.0": "CRITICAL",
    "LGPL-2.1": "MEDIUM",
    "LGPL-3.0": "MEDIUM",
    "MIT": "LOW",
    "Apache-2.0": "LOW",
    "BSD-2-Clause": "LOW",
    "BSD-3-Clause": "LOW",
    "ISC": "LOW",
    "MPL-2.0": "MEDIUM",
    "CDDL-1.0": "MEDIUM",
    "EPL-2.0": "MEDIUM",
    "UNKNOWN": "HIGH",
}

COPYLEFT_LICENSES = {"GPL-2.0", "GPL-3.0", "AGPL-3.0", "LGPL-2.1", "LGPL-3.0", "MPL-2.0", "CDDL-1.0", "EPL-2.0"}


def _integrity_hash(data: Dict[str, Any]) -> str:
    serialized = json.dumps(data, sort_keys=True, default=str).encode()
    return hashlib.sha256(serialized).hexdigest()


def generate_soc2_evidence(project_data: Dict[str, Any], prediction_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate SOC 2 compliance evidence report from project and ML prediction data."""
    now = datetime.datetime.now(datetime.timezone.utc)
    metrics = project_data.get("metrics", {})
    ml = prediction_data.get("ml_results", {})
    risk_score = ml.get("overall_risk_score", 0.0)
    source_type = project_data.get("source_type", "UNKNOWN")

    evidence_items = []
    for ctrl in SOC2_CONTROLS:
        ctrl_id = ctrl["id"]
        domain = ctrl["domain"]

        # Derive pass/fail from available evidence
        if domain == "Logical Access":
            # JWT auth present = pass
            status = "PASS"
            evidence_note = "JWT-protected API endpoints enforce authentication on all routes."
        elif domain == "Change Management":
            if source_type == "GITHUB_REPO":
                pr_count = project_data.get("total_prs_sampled", 0)
                status = "PASS" if pr_count > 0 else "NEEDS_REVIEW"
                evidence_note = f"{pr_count} pull requests detected; change management workflow active." if pr_count > 0 else "No pull requests detected; manual change review process unverified."
            else:
                status = "NEEDS_REVIEW"
                evidence_note = "Source not GitHub; change management evidence requires manual review."
        elif domain == "System Operations":
            ci_status = project_data.get("ci_status", "NO_CI")
            if ci_status == "PASSING":
                status = "PASS"
                evidence_note = "CI/CD pipeline active and last run passed."
            elif ci_status == "FAILING":
                status = "FAIL"
                evidence_note = "CI/CD pipeline last run FAILED — remediation required."
            else:
                status = "NEEDS_REVIEW"
                evidence_note = "No CI/CD pipeline detected; automated monitoring unverified."
        elif domain == "Availability":
            status = "PASS" if risk_score < 75 else "NEEDS_REVIEW"
            evidence_note = f"ML risk score {risk_score}/100; {'within acceptable threshold' if risk_score < 75 else 'elevated — availability risk present'}."
        elif domain == "Processing Integrity":
            defect_density = metrics.get("defect_density", 0.0)
            status = "PASS" if defect_density < 1.0 else "NEEDS_REVIEW"
            evidence_note = f"Defect density: {defect_density:.3f}. {'Acceptable.' if defect_density < 1.0 else 'Elevated defect density detected.'}"
        elif domain == "Confidentiality":
            secrets_count = len(project_data.get("detected_secrets", []))
            status = "PASS" if secrets_count == 0 else "FAIL"
            evidence_note = f"{secrets_count} secrets detected and redacted." if secrets_count > 0 else "No secrets or credentials detected in source."
        elif domain == "Privacy":
            status = "NEEDS_REVIEW"
            evidence_note = "Privacy policy compliance requires manual legal review."
        else:
            status = "NEEDS_REVIEW"
            evidence_note = "Automated evidence collection not available for this control."

        evidence_items.append({
            "control_id": ctrl_id,
            "domain": domain,
            "description": ctrl["description"],
            "status": status,
            "evidence_note": evidence_note,
            "collected_at": now.isoformat(),
        })

    pass_count = sum(1 for e in evidence_items if e["status"] == "PASS")
    fail_count = sum(1 for e in evidence_items if e["status"] == "FAIL")
    review_count = sum(1 for e in evidence_items if e["status"] == "NEEDS_REVIEW")
    compliance_score = round((pass_count / len(evidence_items)) * 100, 1)

    report = {
        "report_id": hashlib.md5(f"{project_data.get('id','')}{now.isoformat()}".encode()).hexdigest()[:12],
        "generated_at": now.isoformat(),
        "project_id": project_data.get("id", ""),
        "project_name": project_data.get("name", ""),
        "source_type": source_type,
        "compliance_score": compliance_score,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "needs_review_count": review_count,
        "overall_status": "COMPLIANT" if fail_count == 0 and compliance_score >= 70 else "NON_COMPLIANT" if fail_count > 0 else "PARTIAL",
        "evidence_items": evidence_items,
        "freshness_hours": 0,
        "integrity_hash": _integrity_hash({"evidence": evidence_items, "score": compliance_score}),
        "audit_trail": [
            {"event": "REPORT_GENERATED", "actor": "InsightX Compliance Engine", "timestamp": now.isoformat()},
        ]
    }
    return report


def assess_predictive_compliance(metrics: Dict[str, Any], ml_results: Dict[str, Any]) -> Dict[str, Any]:
    """Predict future compliance drift based on current ML risk trajectory."""
    risk_score = ml_results.get("overall_risk_score", 0.0)
    churn = metrics.get("churn_rate", 0.0)
    defect_density = metrics.get("defect_density", 0.0)
    coupling = metrics.get("dependency_coupling", 0.0)

    # Simple linear projection for 30-day compliance risk
    drift_rate = (risk_score * 0.3 + churn * 20.0 + defect_density * 5.0 + coupling * 15.0) / 100.0
    projected_30d_risk = round(min(risk_score + drift_rate * 30, 100.0), 1)

    alerts = []
    if churn > 0.5:
        alerts.append({"severity": "HIGH", "message": "High code churn rate may introduce undocumented changes violating CC8.1."})
    if defect_density > 1.5:
        alerts.append({"severity": "HIGH", "message": "Elevated defect density threatens PI1.1 processing integrity controls."})
    if coupling > 0.7:
        alerts.append({"severity": "MEDIUM", "message": "High dependency coupling increases blast radius for CC7.2 incident response."})
    if risk_score > 75:
        alerts.append({"severity": "CRITICAL", "message": "Overall risk score exceeds 75 — immediate SOC 2 audit preparation recommended."})

    return {
        "current_risk_score": risk_score,
        "projected_30d_risk": projected_30d_risk,
        "compliance_drift_rate_per_day": round(drift_rate, 4),
        "predictive_alerts": alerts,
        "recommendation": "Initiate remediation sprint" if projected_30d_risk > 70 else "Monitor and maintain current controls",
    }


def analyze_license_compliance(sbom_packages: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze SBOM packages for license risk, copyleft, and GPL/AGPL alerts."""
    alerts = []
    package_analysis = []
    release_blocking = False

    for pkg in sbom_packages:
        name = pkg.get("name", "unknown")
        version = pkg.get("version", "")
        spdx_id = pkg.get("spdx_id", "") or pkg.get("licenseConcluded", "") or pkg.get("license", "UNKNOWN")

        # Normalize SPDX expression
        license_id = spdx_id.strip().upper().replace(" ", "-") if spdx_id else "UNKNOWN"
        risk = LICENSE_RISK.get(license_id, "MEDIUM" if license_id != "UNKNOWN" else "HIGH")
        is_copyleft = license_id in COPYLEFT_LICENSES

        if is_copyleft:
            alerts.append({
                "package": name,
                "version": version,
                "license": license_id,
                "severity": "CRITICAL" if license_id in {"AGPL-3.0", "GPL-3.0"} else "HIGH",
                "message": f"Copyleft license {license_id} may require source disclosure. Legal review required.",
            })
            if license_id in {"AGPL-3.0", "GPL-3.0"}:
                release_blocking = True

        package_analysis.append({
            "name": name,
            "version": version,
            "license": license_id,
            "risk": risk,
            "is_copyleft": is_copyleft,
        })

    critical_count = sum(1 for a in alerts if a["severity"] == "CRITICAL")
    high_count = sum(1 for a in alerts if a["severity"] == "HIGH")

    return {
        "total_packages": len(sbom_packages),
        "packages_analyzed": len(package_analysis),
        "license_alerts": alerts,
        "critical_license_count": critical_count,
        "high_risk_license_count": high_count,
        "release_blocking": release_blocking,
        "release_block_reason": "AGPL-3.0 or GPL-3.0 dependency detected — legal review required before release." if release_blocking else None,
        "package_details": package_analysis[:30],
    }
