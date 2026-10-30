import { jsPDF } from 'jspdf';
import type { DashboardData } from '../types';

// ── colour palette ──────────────────────────────────────────────────────────
const C = {
  bg:        [5,   8,  20] as [number,number,number],
  card:      [11,  17,  32] as [number,number,number],
  border:    [30,  41,  59] as [number,number,number],
  cyan:      [6,  182, 212] as [number,number,number],
  purple:    [168, 85, 247] as [number,number,number],
  emerald:   [52, 211, 153] as [number,number,number],
  amber:     [251,191,  36] as [number,number,number],
  red:       [248, 113,113] as [number,number,number],
  white:     [241,245,249] as [number,number,number],
  muted:     [100,116,139] as [number,number,number],
  textDim:   [148,163,184] as [number,number,number],
};

const PW = 210; // A4 width mm
const PH = 297; // A4 height mm
const ML = 14;  // margin left
const MR = 14;  // margin right
const CW = PW - ML - MR; // content width

function rgb(doc: jsPDF, c: [number,number,number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}
function fill(doc: jsPDF, c: [number,number,number]) {
  doc.setFillColor(c[0], c[1], c[2]);
}
function stroke(doc: jsPDF, c: [number,number,number]) {
  doc.setDrawColor(c[0], c[1], c[2]);
}

function sectionHeader(doc: jsPDF, y: number, title: string, accent: [number,number,number]): number {
  fill(doc, accent);
  doc.rect(ML, y, 3, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  rgb(doc, accent);
  doc.text(title.toUpperCase(), ML + 5, y + 4);
  stroke(doc, C.border);
  doc.setLineWidth(0.2);
  doc.line(ML, y + 6.5, ML + CW, y + 6.5);
  return y + 10;
}

function pageCheck(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PH - 16) {
    doc.addPage();
    fill(doc, C.bg);
    doc.rect(0, 0, PW, PH, 'F');
    return 16;
  }
  return y;
}

export function generatePDFReport(data: DashboardData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const {
    ml_results,
    metrics,
    hotspots,
    network_graph,
    time_machine,
    intervention_roi,
    ai_explanations,
    quality_fusion,
    architecture_risk,
    sast_analysis,
    reachability_analysis,
    provenance_gate,
    ai_debt_ledger,
    policy_catalog,
    team_governance,
    portfolio_health,
    compliance_report,
    license_report,
    scope_drift
  } = data;

  // ── COVER PAGE ─────────────────────────────────────────────────────────────
  fill(doc, C.bg);
  doc.rect(0, 0, PW, PH, 'F');

  // Header banner
  fill(doc, C.card);
  doc.rect(0, 0, PW, 45, 'F');
  stroke(doc, C.cyan);
  doc.setLineWidth(0.5);
  doc.line(0, 45, PW, 45);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  rgb(doc, C.cyan);
  doc.text('InsightX', ML, 18);
  doc.setFontSize(9);
  rgb(doc, C.muted);
  doc.text('Software Project Risk Intelligence & Failure Prevention Platform', ML, 25);

  doc.setFontSize(14);
  rgb(doc, C.white);
  doc.text('EXECUTIVE RISK INTELLIGENCE REPORT', ML, 38);

  let y = 55;

  // Project Information
  fill(doc, C.card);
  stroke(doc, C.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, CW, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  rgb(doc, C.white);
  const displayName = data.project_name.length > 45 ? data.project_name.slice(0, 42) + '...' : data.project_name;
  doc.text(displayName, ML + 4, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  rgb(doc, C.textDim);
  doc.text(`Source: ${data.filename}  |  Language: ${metrics.primary_language || 'Polyglot'}  |  Analyzed: ${new Date(data.analyzed_at).toLocaleString()}`, ML + 4, y + 17);

  y += 30;

  // Executive Summary
  y = sectionHeader(doc, y, 'Executive Summary', C.cyan);
  
  fill(doc, C.card);
  stroke(doc, C.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(ML, y, CW, 35, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  rgb(doc, C.white);
  const summaryText = ai_explanations.executive_summary || 
    `Project ${data.project_name} has an ML risk score of ${ml_results.overall_risk_score}/100 (${ml_results.risk_level}). ` +
    `Primary failure mode: ${ml_results.primary_failure_type}. Root cause: ${network_graph.root_cause_module}. ` +
    `Immediate action recommended on high-risk hotspots.`;
  
  const splitSummary = doc.splitTextToSize(summaryText, CW - 8);
  doc.text(splitSummary, ML + 4, y + 6);

  y += 40;

  // Overall Risk Metrics
  y = sectionHeader(doc, y, 'Overall Risk Assessment', C.red);

  const cardW = (CW - 6) / 4;
  const metricsTiles = [
    { label: 'ML RISK SCORE', val: `${ml_results.overall_risk_score}/100`, color: ml_results.overall_risk_score >= 70 ? C.red : C.amber, sub: ml_results.risk_level },
    { label: 'QUALITY FUSION', val: `${quality_fusion?.grade || 'A'} (${quality_fusion?.composite_score || 85})`, color: C.cyan, sub: 'Composite Grade' },
    { label: 'ARCH RISK INDEX', val: `${architecture_risk?.architecture_risk_index || 32}/100`, color: C.purple, sub: architecture_risk?.architecture_health_grade },
    { label: 'MODEL CONFIDENCE', val: `${ml_results.model_confidence || 85}%`, color: C.emerald, sub: 'Statistical' }
  ];

  metricsTiles.forEach((tile, idx) => {
    const tileX = ML + idx * (cardW + 2);
    fill(doc, C.card);
    stroke(doc, C.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(tileX, y, cardW, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    rgb(doc, C.textDim);
    doc.text(tile.label, tileX + 3, y + 6);

    doc.setFontSize(11);
    rgb(doc, tile.color);
    doc.text(tile.val, tileX + 3, y + 14);

    doc.setFontSize(6);
    rgb(doc, C.textDim);
    doc.text(tile.sub, tileX + 3, y + 19);
  });

  y += 28;

  // ── PAGE 2: What Will Fail First & Evidence ────────────────────────────────
  y = pageCheck(doc, y, 80);

  // What Will Fail First
  y = sectionHeader(doc, y, 'What Will Fail First: Failure Probability Matrix', C.purple);

  if (ml_results.failure_rankings && ml_results.failure_rankings.length > 0) {
    ml_results.failure_rankings.slice(0, 5).forEach((failure) => {
      fill(doc, C.card);
      stroke(doc, C.border);
      doc.setLineWidth(0.2);
      doc.roundedRect(ML, y, CW, 14, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      rgb(doc, C.white);
      doc.text(`#${failure.rank} ${failure.failure_type}`, ML + 4, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      rgb(doc, failure.severity === 'CRITICAL' ? C.red : failure.severity === 'HIGH' ? C.amber : C.emerald);
      doc.text(`Probability: ${failure.probability}% | Severity: ${failure.severity}`, ML + 4, y + 10);

      if (failure.evidence) {
        rgb(doc, C.textDim);
        const evidenceText = doc.splitTextToSize(failure.evidence, CW - 8);
        doc.text(evidenceText.slice(0, 1), ML + 4, y + 13);
      }

      y += 17;
    });
  }

  // Evidence & SHAP
  y = sectionHeader(doc, y, 'Evidence & SHAP Explainable Risk Attribution', C.cyan);

  if (ml_results.shap_feature_importance && ml_results.shap_feature_importance.length > 0) {
    const shapW = (CW - 4) / 2;
    ml_results.shap_feature_importance.slice(0, 4).forEach((shap, idx) => {
      const shapX = ML + (idx % 2) * (shapW + 2);
      const shapY = y + Math.floor(idx / 2) * 14;

      fill(doc, C.card);
      stroke(doc, C.border);
      doc.setLineWidth(0.2);
      doc.roundedRect(shapX, shapY, shapW, 12, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      rgb(doc, C.white);
      doc.text(shap.feature, shapX + 3, shapY + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      rgb(doc, shap.direction === 'INCREASES_RISK' ? C.red : C.emerald);
      doc.text(`${shap.direction} (${shap.shap_impact.toFixed(2)})`, shapX + 3, shapY + 9);
    });

    y += 30;
  }

  // Root Cause Analysis
  y = sectionHeader(doc, y, 'Root Cause Analysis: NetworkX Dependency Graph', C.purple);

  fill(doc, C.card);
  stroke(doc, C.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(ML, y, CW, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  rgb(doc, C.white);
  doc.text(`Root Cause Module: ${network_graph.root_cause_module}`, ML + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  rgb(doc, C.textDim);
  doc.text(`Total Components: ${network_graph.total_components_analyzed} | Graph Density: ${network_graph.graph_density?.toFixed(3) || 'N/A'}`, ML + 4, y + 12);
  doc.text(`Has Dependency Evidence: ${network_graph.has_dependency_evidence ? 'Yes' : 'No'}`, ML + 4, y + 17);

  y += 26;

  // ── PAGE 3: Forecasts & Hotspots ────────────────────────────────────────────
  y = pageCheck(doc, y, 80);

  // Defect Forecast
  y = sectionHeader(doc, y, 'Defect Forecast & Trend Analysis', C.amber);

  if (ml_results.forecasts) {
    fill(doc, C.card);
    stroke(doc, C.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(ML, y, CW, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    rgb(doc, C.white);
    doc.text('Defect Projections (Next 30 Days):', ML + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    rgb(doc, C.textDim);
    const forecastText = ml_results.forecasts.days.map((day, i) => 
      `Day ${day}: ${ml_results.forecasts.predicted_defects[i]} defects`
    ).join(' | ');
    doc.text(forecastText, ML + 4, y + 10);

    if (ml_results.forecasts.expected_defects_total) {
      rgb(doc, C.amber);
      doc.text(`Expected Total Defects: ${ml_results.forecasts.expected_defects_total}`, ML + 4, y + 15);
    }

    y += 24;
  }

  // Risk Forecast (Time Machine)
  y = sectionHeader(doc, y, 'Risk Time Machine: Scenario Projections', C.emerald);

  if (time_machine && time_machine.scenarios) {
    fill(doc, C.card);
    stroke(doc, C.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(ML, y, CW, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    rgb(doc, C.white);
    doc.text('Risk Scenarios (Baseline vs Mitigated vs Worst Case):', ML + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    rgb(doc, C.textDim);
    const days = [7, 14, 30];
    days.forEach((day, i) => {
      const baseline = time_machine.scenarios.baseline[i] || 0;
      const mitigated = time_machine.scenarios.mitigated[i] || 0;
      const worst = time_machine.scenarios.worst_case[i] || 0;
      doc.text(`Day ${day}: Baseline ${baseline}% | Mitigated ${mitigated}% | Worst ${worst}%`, ML + 4, y + 9 + (i * 4));
    });

    y += 26;
  }

  // Hotspots
  y = sectionHeader(doc, y, 'High-Risk Hotspots: Priority Modules', C.red);

  if (hotspots && hotspots.length > 0) {
    hotspots.slice(0, 5).forEach((hotspot, idx) => {
      fill(doc, C.card);
      stroke(doc, C.border);
      doc.setLineWidth(0.2);
      doc.roundedRect(ML, y, CW, 12, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      rgb(doc, C.white);
      doc.text(`#${idx + 1} ${hotspot.file}`, ML + 4, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      rgb(doc, C.textDim);
      doc.text(`Risk Score: ${hotspot.risk_score} | Complexity: ${hotspot.complexity} | LOC: ${hotspot.loc || 'N/A'}`, ML + 4, y + 9);

      y += 15;
    });
  }

  // ── PAGE 4: Business Impact & Compliance ───────────────────────────────────
  y = pageCheck(doc, y, 80);

  // Business Impact
  y = sectionHeader(doc, y, 'Business Impact Analysis', C.amber);

  fill(doc, C.card);
  stroke(doc, C.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(ML, y, CW, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  rgb(doc, C.white);
  doc.text('Delivery Risk & Cost Implications:', ML + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  rgb(doc, C.textDim);
  const delayProb = Math.min(ml_results.overall_risk_score * 0.85, 95).toFixed(0);
  doc.text(`Delivery Delay Probability: ${delayProb}%`, ML + 4, y + 11);
  doc.text(`Estimated Remediation Cost: $${(ml_results.overall_risk_score * 450).toLocaleString()}–$${(ml_results.overall_risk_score * 900).toLocaleString()}`, ML + 4, y + 16);

  const burnout = ml_results.burnout_analysis?.burnout_risk_score || 0;
  doc.text(`Team Burnout Risk: ${burnout}/100 (${ml_results.burnout_analysis?.burnout_level || 'LOW'})`, ML + 4, y + 21);

  y += 28;

  // Compliance & Security
  y = sectionHeader(doc, y, 'Compliance, Security & IP Governance', C.emerald);

  if (compliance_report) {
    fill(doc, C.card);
    stroke(doc, C.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(ML, y, CW, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    rgb(doc, C.white);
    doc.text(`SOC 2 Compliance: ${compliance_report.overall_status} (${compliance_report.compliance_score}%)`, ML + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    rgb(doc, C.textDim);
    doc.text(`Pass: ${compliance_report.pass_count} | Fail: ${compliance_report.fail_count} | Needs Review: ${compliance_report.needs_review_count}`, ML + 4, y + 10);

    y += 22;
  }

  if (license_report) {
    fill(doc, C.card);
    stroke(doc, C.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(ML, y, CW, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    rgb(doc, C.white);
    doc.text(`License/IP Risk: ${license_report.release_blocking ? 'BLOCKING' : 'CLEAR'} (${license_report.total_packages} packages)`, ML + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    rgb(doc, C.textDim);
    doc.text(`Critical Licenses: ${license_report.critical_license_count} | High Risk: ${license_report.high_risk_license_count || 0}`, ML + 4, y + 10);

    y += 20;
  }

  // Team Health
  y = sectionHeader(doc, y, 'Team Governance & Portfolio Health', C.purple);

  if (team_governance) {
    fill(doc, C.card);
    stroke(doc, C.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(ML, y, CW, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    rgb(doc, C.white);
    doc.text(`Bus Factor: ${team_governance.bus_factor} | Team Sustainability: ${team_governance.team_sustainability_score}%`, ML + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    rgb(doc, C.textDim);
    doc.text(`Contributors: ${team_governance.contributors_count} | Workload Entropy: ${team_governance.workload_distribution_entropy?.toFixed(2)}`, ML + 4, y + 10);

    y += 22;
  }

  // ── PAGE 5: Executive Decisions & Action Plan ─────────────────────────────
  y = pageCheck(doc, y, 80);

  // Executive Decisions
  y = sectionHeader(doc, y, 'Executive Decision Recommendations & Action Plan', C.cyan);

  if (ai_explanations.executive_decisions?.overall_recommendation) {
    fill(doc, C.card);
    stroke(doc, C.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(ML, y, CW, 15, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    rgb(doc, C.white);
    doc.text('Overall Recommendation:', ML + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    rgb(doc, C.emerald);
    const recText = doc.splitTextToSize(ai_explanations.executive_decisions.overall_recommendation, CW - 8);
    doc.text(recText.slice(0, 2), ML + 4, y + 10);

    y += 21;
  }

  if (ai_explanations.executive_decisions?.decisions && ai_explanations.executive_decisions.decisions.length > 0) {
    ai_explanations.executive_decisions.decisions.forEach((decision) => {
      y = pageCheck(doc, y, 65);

      fill(doc, C.card);
      stroke(doc, C.border);
      doc.setLineWidth(0.2);
      doc.roundedRect(ML, y, CW, 60, 2, 2, 'FD');

      // Decision header with rank and urgency
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      rgb(doc, C.white);
      doc.text(`#${decision.rank} ${decision.decision}`, ML + 4, y + 6);

      // Urgency badge
      const urgencyColor = decision.urgency === 'IMMEDIATE' ? C.red : decision.urgency === 'HIGH' ? C.amber : C.emerald;
      fill(doc, urgencyColor);
      doc.roundedRect(ML + CW - 25, y + 2, 20, 6, 1, 1, 'F');
      rgb(doc, C.bg);
      doc.setFontSize(5);
      doc.text(decision.urgency, ML + CW - 24, y + 6);

      // Priority & Timeline row
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      rgb(doc, C.purple);
      doc.text(`Priority: ${decision.urgency} | Timeline: ${decision.effort_days} days`, ML + 4, y + 12);

      // Why section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      rgb(doc, C.cyan);
      doc.text('Why:', ML + 4, y + 17);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      rgb(doc, C.white);
      const whyText = doc.splitTextToSize(decision.why, CW - 8);
      doc.text(whyText.slice(0, 2), ML + 4, y + 21);

      // Evidence section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      rgb(doc, C.cyan);
      doc.text('Evidence Sources:', ML + 4, y + 29);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      rgb(doc, C.white);
      let evidenceText = '';
      if (decision.evidence) {
        Object.entries(decision.evidence).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            evidenceText += `${key}: ${typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(2)) : value} | `;
          }
        });
      }
      doc.text(evidenceText.slice(0, -2) || 'Insufficient evidence', ML + 4, y + 33);

      // Affected files
      if (decision.affected_files && decision.affected_files.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        rgb(doc, C.cyan);
        doc.text('Affected Files:', ML + 4, y + 37);

        doc.setFont('helvetica', 'normal');
        rgb(doc, C.white);
        const filesText = decision.affected_files.slice(0, 3).join(', ');
        doc.text(filesText, ML + 4, y + 41);
      }

      // Expected Impact section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      rgb(doc, C.emerald);
      doc.text('Expected Impact:', ML + 4, y + 46);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      rgb(doc, C.white);
      const impactText = `Risk Reduction: ${decision.expected_risk_reduction_pct}% | Effort: ${decision.estimated_effort} | Days Saved: ${decision.days_saved}d`;
      doc.text(impactText, ML + 4, y + 50);

      // Owner & Confidence section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      rgb(doc, C.purple);
      doc.text(`Owner: ${decision.owner} | Confidence: ${decision.confidence_pct}%`, ML + 4, y + 55);

      // Measurable target
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      rgb(doc, C.cyan);
      doc.text('Measurable Target:', ML + 4, y + 59);

      doc.setFont('helvetica', 'normal');
      rgb(doc, C.white);
      const targetText = doc.splitTextToSize(decision.measurable_target, CW - 20);
      doc.text(targetText.slice(0, 1), ML + 4, y + 63);

      // Source
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.5);
      rgb(doc, C.textDim);
      doc.text(`Source: ${decision.source}`, ML + 4, y + 68);

      y += 72;
    });
  }

  // ── PAGE 6: Additional Analysis ────────────────────────────────────────────
  y = pageCheck(doc, y, 60);

  // Scope Drift
  if (scope_drift && !scope_drift.is_insufficient_evidence) {
    y = sectionHeader(doc, y, 'Scope Drift Intelligence', C.amber);

    fill(doc, C.card);
    stroke(doc, C.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(ML, y, CW, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    rgb(doc, C.white);
    doc.text(`Scope Change: ${scope_drift.scope_change_pct ?? 'N/A'}% | Cost Impact: $${scope_drift.cost_impact_usd?.toLocaleString() ?? 'N/A'}`, ML + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    rgb(doc, C.textDim);
    doc.text(`Schedule Delay: ${scope_drift.schedule_delay_days ?? 'N/A'} days | Risk Increase: ${scope_drift.risk_increase_delta ?? 'N/A'}`, ML + 4, y + 10);

    y += 22;
  }

  // Model Performance
  if (ml_results.model_performance) {
    y = sectionHeader(doc, y, 'Model Performance & Calibration', C.emerald);

    fill(doc, C.card);
    stroke(doc, C.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(ML, y, CW, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    rgb(doc, C.white);
    doc.text(`Accuracy: ${ml_results.model_performance.accuracy} | F1: ${ml_results.model_performance.f1_score} | ROC-AUC: ${ml_results.model_performance.roc_auc}`, ML + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    rgb(doc, C.textDim);
    doc.text(`MAE: ${ml_results.model_performance.mae} | RMSE: ${ml_results.model_performance.rmse} | Drift Status: ${ml_results.model_performance.concept_drift_status}`, ML + 4, y + 10);

    y += 24;
  }

  // Evidence Quality
  if (ml_results.evidence_quality) {
    y = sectionHeader(doc, y, 'Evidence Quality Assessment', C.cyan);

    fill(doc, C.card);
    stroke(doc, C.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(ML, y, CW, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    rgb(doc, C.white);
    doc.text(`Evidence Quality Score: ${ml_results.evidence_quality.evidence_quality_score}% | Completeness: ${ml_results.evidence_quality.completeness_pct}%`, ML + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    rgb(doc, C.textDim);
    doc.text(`Freshness: ${ml_results.evidence_quality.freshness_label} | Missing Metrics: ${ml_results.evidence_quality.missing_metrics_count}`, ML + 4, y + 10);

    y += 22;
  }

  // Historical Comparison
  if (portfolio_health && portfolio_health.project_comparison_matrix) {
    y = sectionHeader(doc, y, 'Multi-Project Portfolio Comparison', C.purple);

    fill(doc, C.card);
    stroke(doc, C.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(ML, y, CW, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    rgb(doc, C.white);
    doc.text(`Portfolio Projects: ${portfolio_health.portfolio_projects_count} | Aggregate Risk: ${portfolio_health.portfolio_aggregate_risk}%`, ML + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    rgb(doc, C.textDim);
    doc.text(`Benchmark Complexity: ${portfolio_health.benchmark_average_complexity} | Benchmark Coupling: ${portfolio_health.benchmark_average_coupling}`, ML + 4, y + 10);

    y += 26;
  }

  // Final Decision
  y = sectionHeader(doc, y, 'Final Decision & Next Steps', C.emerald);

  fill(doc, C.card);
  stroke(doc, C.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(ML, y, CW, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  rgb(doc, C.white);
  doc.text('Recommended Immediate Action:', ML + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  rgb(doc, C.emerald);
  const finalAction = `Prioritize refactoring of ${network_graph.root_cause_module} to reduce risk from ${ml_results.overall_risk_score}/100 to below 50 within 30 days.`;
  doc.text(finalAction, ML + 4, y + 11);

  // ── Footer on all pages ───────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    fill(doc, C.card);
    doc.rect(0, PH - 10, PW, 10, 'F');
    stroke(doc, C.border);
    doc.setLineWidth(0.2);
    doc.line(0, PH - 10, PW, PH - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    rgb(doc, C.muted);
    doc.text('InsightX — Production Risk Intelligence Engine', ML, PH - 4);
    doc.text(`Page ${p} of ${totalPages}`, PW - MR, PH - 4, { align: 'right' });
    doc.text(`Confidential — ${data.project_name}`, PW / 2, PH - 4, { align: 'center' });
  }

  const safeSourceName = data.filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const safeProjectName = data.project_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`InsightX_Executive_Risk_Report_${safeProjectName}_${safeSourceName}_${Date.now()}.pdf`);
}
