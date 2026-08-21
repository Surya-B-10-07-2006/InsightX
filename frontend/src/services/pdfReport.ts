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

// ── helpers ─────────────────────────────────────────────────────────────────
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

function kv(doc: jsPDF, y: number, label: string, value: string, valColor?: [number,number,number]): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  rgb(doc, C.textDim);
  doc.text(label + ':', ML + 2, y);
  doc.setFont('helvetica', 'bold');
  rgb(doc, valColor ?? C.white);
  doc.text(value, ML + 52, y);
  return y + 5;
}

function wrappedText(doc: jsPDF, text: string, x: number, y: number, maxW: number, lineH: number): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  rgb(doc, C.textDim);
  const lines = doc.splitTextToSize(text, maxW);
  doc.text(lines, x, y);
  return y + lines.length * lineH;
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

// ── main export ─────────────────────────────────────────────────────────────
export function generatePDFReport(data: DashboardData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { ml_results, metrics, hotspots, network_graph, time_machine, intervention_roi, ai_explanations } = data;

  // ── PAGE 1: Executive Title Page ─────────────────────────────────────────────
  fill(doc, C.bg);
  doc.rect(0, 0, PW, PH, 'F');

  // Executive header bar
  fill(doc, C.card);
  doc.rect(0, 0, PW, 50, 'F');
  stroke(doc, C.cyan);
  doc.setLineWidth(0.5);
  doc.line(0, 50, PW, 50);

  // Logo / platform name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  rgb(doc, C.cyan);
  doc.text('InsightX', ML, 20);
  doc.setFontSize(10);
  rgb(doc, C.muted);
  doc.text('Project Intelligence & Risk Analytics Platform', ML, 28);

  // Report title with source context
  doc.setFontSize(16);
  rgb(doc, C.white);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE RISK INTELLIGENCE REPORT', ML, 42);

  // Dynamic source display
  let y = 65;
  
  // Source type badge
  const sourceType = data.source_type ?? 'PROJECT_ZIP';
  const sourceLabel = sourceType === 'GITHUB_REPO' ? 'GitHub Repository Analysis' 
                    : sourceType === 'PDF_PHR' ? 'PHR Document Analysis'
                    : 'Project ZIP Analysis';
  
  fill(doc, C.cyan);
  doc.roundedRect(ML, y, CW, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  rgb(doc, C.bg);
  doc.text(sourceLabel.toUpperCase(), ML + 4, y + 6.5);
  y += 14;

  // Use actual source name (filename for ZIP/PHR, repo URL/name for GitHub)
  const actualSourceName = data.filename;
  const displayName = data.project_name.length > 50 ? data.project_name.slice(0, 47) + '...' : data.project_name;
  
  // Project name prominently displayed
  fill(doc, C.card);
  stroke(doc, C.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, CW, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  rgb(doc, C.white);
  doc.text(displayName, ML + 4, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  rgb(doc, C.muted);
  doc.text(`Analyzed Source: ${actualSourceName}`, ML + 4, y + 18);
  doc.text(`Analysis Timestamp: ${new Date(data.analyzed_at).toLocaleString()}`, ML + 4, y + 24);

  // Risk score badge - more prominent
  const riskColor = ml_results.risk_level === 'CRITICAL' ? C.red
    : ml_results.risk_level === 'HIGH' ? C.amber
    : ml_results.risk_level === 'MODERATE' ? C.cyan : C.emerald;
  fill(doc, riskColor);
  doc.roundedRect(ML + CW - 40, y + 4, 36, 20, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  rgb(doc, C.bg);
  doc.text(String(ml_results.overall_risk_score), ML + CW - 32, y + 16, { align: 'center' });
  doc.setFontSize(7);
  doc.text(ml_results.risk_level + ' RISK', ML + CW - 32, y + 22, { align: 'center' });

  y += 38;

  // Executive summary block
  y = sectionHeader(doc, y, 'Executive Risk Summary', C.purple);
  fill(doc, C.card);
  stroke(doc, C.border);
  doc.setLineWidth(0.2);
  const summaryLines = doc.splitTextToSize(ai_explanations.executive_summary, CW - 6);
  doc.roundedRect(ML, y, CW, summaryLines.length * 4.5 + 8, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  rgb(doc, C.white);
  doc.text(summaryLines, ML + 3, y + 6);
  y += summaryLines.length * 4.5 + 12;

  // ── Key Risk Metrics Grid ─────────────────────────────────────────────────
  y = sectionHeader(doc, y, 'Risk Assessment Metrics', C.cyan);

  const metricCols = [
    ['ML Risk Score',        `${ml_results.overall_risk_score}/100`,          riskColor],
    ['Model Confidence',     `${ml_results.model_confidence ?? 70}%`,         C.cyan],
    ['Risk Level',           ml_results.risk_level,                            riskColor],
    ['Primary Failure',      ml_results.primary_failure_type,                  C.amber],
    ['Burnout Index',        `${ml_results.burnout_analysis.burnout_risk_score}/100`, C.amber],
    ['Burnout Level',        ml_results.burnout_analysis.burnout_level,         C.amber],
    ['Root Cause Module',    network_graph.root_cause_module,                  C.cyan],
    ['Graph Density',        String(network_graph.graph_density),              C.textDim],
    ['Lines of Code',        String(metrics.lines_of_code ?? '—'),             C.white],
    ['Cyclomatic Complexity',String(metrics.cyclomatic_complexity ?? '—'),     C.white],
    ['Dependency Coupling',  String(metrics.dependency_coupling ?? '—'),       C.white],
    ['Defect Density',       String(metrics.defect_density ?? '—'),            C.white],
    ['Churn Rate',           String((metrics as any).churn_rate ?? '—'),       C.white],
    ['Sprint Velocity',      String((metrics as any).sprint_velocity ?? '—'),  C.white],
  ] as [string, string, [number,number,number]][];

  const colW = CW / 2;
  metricCols.forEach(([label, value, color], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const mx = ML + col * colW;
    const my = y + row * 7;
    fill(doc, C.card);
    stroke(doc, C.border);
    doc.setLineWidth(0.2);
    doc.rect(mx, my - 1, colW - 1, 6.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    rgb(doc, C.muted);
    doc.text(label, mx + 2, my + 3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    rgb(doc, color);
    const valStr = String(value).length > 28 ? String(value).slice(0, 26) + '..' : String(value);
    doc.text(valStr, mx + colW - 3, my + 3, { align: 'right' });
  });

  y += Math.ceil(metricCols.length / 2) * 7 + 6;

  // ── PAGE 2: Detailed Report Sections ──────────────────────────────────────
  if (ai_explanations.report_sections && ai_explanations.report_sections.length > 0) {
    const sectionAccents: Record<string, [number,number,number]> = {
      'Risk Overview':          C.red,
      'Root Cause Analysis':    C.amber,
      'Predicted Failure Modes':C.amber,
      'Evidence & Metrics':     C.cyan,
      'Business Impact':        C.red,
      'Priority Action Plan':   C.emerald,
    };

    for (const sec of ai_explanations.report_sections) {
      const accent = sectionAccents[sec.section] ?? C.cyan;
      const contentLines = doc.splitTextToSize(sec.content, CW - 6);
      const blockH = contentLines.length * 4.2 + 14;
      y = pageCheck(doc, y, blockH + 4);

      fill(doc, C.card);
      stroke(doc, accent);
      doc.setLineWidth(0.3);
      doc.roundedRect(ML, y, CW, blockH, 2, 2, 'FD');

      // Section title bar
      fill(doc, accent);
      doc.roundedRect(ML, y, CW, 7, 2, 2, 'F');
      doc.rect(ML, y + 4, CW, 3, 'F'); // square bottom corners
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      rgb(doc, C.bg);
      doc.text(sec.section.toUpperCase(), ML + 3, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      rgb(doc, C.textDim);
      doc.text(contentLines, ML + 3, y + 12);
      y += blockH + 4;
    }
  }

  // ── Failure Rankings ───────────────────────────────────────────────────────
  if (ml_results.failure_rankings && ml_results.failure_rankings.length > 0) {
    y = pageCheck(doc, y, 10 + ml_results.failure_rankings.length * 8);
    y = sectionHeader(doc, y, 'Failure Mode Probability Rankings', C.amber);

    ml_results.failure_rankings.forEach((item, i) => {
      y = pageCheck(doc, y, 8);
      const barColor = item.severity === 'CRITICAL' ? C.red : item.severity === 'HIGH' ? C.amber : C.cyan;
      fill(doc, C.card);
      stroke(doc, C.border);
      doc.setLineWidth(0.2);
      doc.rect(ML, y, CW, 7, 'FD');

      // Rank badge
      fill(doc, barColor);
      doc.rect(ML, y, 7, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      rgb(doc, C.bg);
      doc.text(`#${item.rank}`, ML + 3.5, y + 4.5, { align: 'center' });

      // Failure name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      rgb(doc, C.white);
      doc.text(item.failure_type, ML + 10, y + 4.5);

      // Probability bar
      const barW = (item.probability / 100) * 40;
      fill(doc, C.border);
      doc.rect(ML + CW - 55, y + 2, 40, 3, 'F');
      fill(doc, barColor);
      doc.rect(ML + CW - 55, y + 2, barW, 3, 'F');

      // Probability label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      rgb(doc, barColor);
      doc.text(`${item.probability}%`, ML + CW - 13, y + 4.5);

      // Severity badge
      doc.setFontSize(6.5);
      rgb(doc, barColor);
      doc.text(item.severity, ML + CW - 3, y + 4.5, { align: 'right' });

      y += 8;
    });
    y += 4;
  }

  // ── Code Hotspots ──────────────────────────────────────────────────────────
  if (hotspots && hotspots.length > 0) {
    y = pageCheck(doc, y, 10 + hotspots.length * 8);
    y = sectionHeader(doc, y, 'Code Hotspot Risk Analysis', C.amber);

    hotspots.forEach((hs, i) => {
      y = pageCheck(doc, y, 8);
      fill(doc, C.card);
      stroke(doc, C.border);
      doc.setLineWidth(0.2);
      doc.rect(ML, y, CW, 7, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      rgb(doc, C.white);
      const fname = hs.file.length > 45 ? '...' + hs.file.slice(-42) : hs.file;
      doc.text(fname, ML + 2, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      rgb(doc, C.amber);
      doc.text(`Complexity: ${hs.complexity}`, ML + CW - 50, y + 4.5);
      rgb(doc, C.red);
      doc.text(`Risk: ${hs.risk_score}%`, ML + CW - 20, y + 4.5);
      y += 8;
    });
    y += 4;
  }

  // ── Risk Time Machine ──────────────────────────────────────────────────────
  if (time_machine && !time_machine.is_insufficient_evidence) {
    y = pageCheck(doc, y, 40);
    y = sectionHeader(doc, y, '7/14/30-Day Risk Trajectory', C.cyan);

    const { days, scenarios, milestone_projections } = time_machine;
    const scenarioColors: [string, [number,number,number]][] = [
      ['Baseline',   C.amber],
      ['Mitigated',  C.emerald],
      ['Worst Case', C.red],
    ];

    // Table header
    fill(doc, C.border);
    doc.rect(ML, y, CW, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    rgb(doc, C.white);
    doc.text('Scenario', ML + 2, y + 4);
    days.forEach((d, i) => doc.text(`Day ${d}`, ML + 30 + i * 22, y + 4));
    y += 6;

    scenarioColors.forEach(([label, color]) => {
      const vals = label === 'Baseline' ? scenarios.baseline
        : label === 'Mitigated' ? scenarios.mitigated : scenarios.worst_case;
      fill(doc, C.card);
      stroke(doc, C.border);
      doc.setLineWidth(0.2);
      doc.rect(ML, y, CW, 6, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      rgb(doc, color);
      doc.text(label, ML + 2, y + 4);
      doc.setFont('helvetica', 'normal');
      rgb(doc, C.white);
      vals.forEach((v, i) => doc.text(String(v), ML + 30 + i * 22, y + 4));
      y += 6;
    });

    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    rgb(doc, C.emerald);
    doc.text(
      `30-Day Risk Reduction with Intervention: -${milestone_projections.day_30_risk_reduction} points`,
      ML + 2, y,
    );
    y += 8;
  }

  // ── Intervention ROI ───────────────────────────────────────────────────────
  if (intervention_roi && !intervention_roi.is_insufficient_evidence && intervention_roi.interventions.length > 0) {
    y = pageCheck(doc, y, 14 + intervention_roi.interventions.length * 10);
    y = sectionHeader(doc, y, 'Intervention ROI & Cost Savings', C.emerald);

    intervention_roi.interventions.forEach((item) => {
      y = pageCheck(doc, y, 10);
      const recColor = item.recommended ? C.emerald : C.muted;
      fill(doc, C.card);
      stroke(doc, item.recommended ? C.emerald : C.border);
      doc.setLineWidth(0.2);
      doc.rect(ML, y, CW, 9, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      rgb(doc, C.white);
      const titleStr = item.title.replace(/`/g, '');
      doc.text(titleStr.length > 55 ? titleStr.slice(0, 53) + '..' : titleStr, ML + 2, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      rgb(doc, C.emerald);
      doc.text(`-${item.risk_reduction_pct}% risk`, ML + 2, y + 7.5);
      rgb(doc, C.cyan);
      doc.text(`${item.delay_days_saved}d saved`, ML + 28, y + 7.5);
      rgb(doc, C.amber);
      doc.text(
        typeof item.cost_savings_usd === 'number'
          ? `$${item.cost_savings_usd.toLocaleString()}`
          : 'N/A',
        ML + 52,
        y + 7.5,
      );
      rgb(doc, recColor);
      doc.text(item.effort_level, ML + CW - 20, y + 7.5);
      if (item.recommended) {
        doc.setFont('helvetica', 'bold');
        rgb(doc, C.emerald);
        doc.text('RECOMMENDED', ML + CW - 3, y + 4, { align: 'right' });
      }
      y += 10;
    });

    const agg = intervention_roi.aggregated_impact;
    y += 2;
    fill(doc, C.emerald);
    doc.setLineWidth(0.3);
    doc.rect(ML, y, CW, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    rgb(doc, C.bg);
    doc.text(
      `Total Impact: -${agg.total_risk_reduction_pct}% risk  |  ${agg.total_delay_days_saved}d saved  |  ${typeof agg.total_estimated_savings_usd === 'number' ? `$${agg.total_estimated_savings_usd.toLocaleString()}` : 'Savings N/A'}  |  ROI ${agg.estimated_roi_multiplier}`,
      ML + 2, y + 5.5,
    );
    y += 12;
  }

  // ── Preventive Recommendations ─────────────────────────────────────────────
  if (ai_explanations.preventive_recommendations && ai_explanations.preventive_recommendations.length > 0) {
    y = pageCheck(doc, y, 14 + ai_explanations.preventive_recommendations.length * 10);
    y = sectionHeader(doc, y, 'Priority Preventive Actions', C.purple);

    ai_explanations.preventive_recommendations.forEach((rec, i) => {
      const recLines = doc.splitTextToSize(rec, CW - 14);
      const blockH = recLines.length * 4.2 + 6;
      y = pageCheck(doc, y, blockH + 2);

      fill(doc, C.card);
      stroke(doc, C.border);
      doc.setLineWidth(0.2);
      doc.rect(ML, y, CW, blockH, 'FD');

      // Number badge
      fill(doc, C.purple);
      doc.circle(ML + 5, y + blockH / 2, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      rgb(doc, C.bg);
      doc.text(String(i + 1), ML + 5, y + blockH / 2 + 2.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      rgb(doc, C.white);
      doc.text(recLines, ML + 11, y + 5);
      y += blockH + 3;
    });
    y += 4;
  }

  // ── Compliance & Legal Findings ─────────────────────────────────────────────
  if (data.compliance_report || data.predictive_compliance) {
    y = pageCheck(doc, y, 30);
    y = sectionHeader(doc, y, 'Compliance & Legal Assessment', C.emerald);
    
    fill(doc, C.card);
    stroke(doc, C.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(ML, y, CW, 25, 2, 2, 'FD');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    rgb(doc, C.emerald);
    doc.text('SOC2 Compliance Status', ML + 3, y + 5);
    
    const complianceStatus = data.compliance_report?.overall_status || 'ASSESSMENT_PENDING';
    const complianceColor = complianceStatus === 'COMPLIANT' ? C.emerald 
                         : complianceStatus === 'PARTIAL' ? C.amber 
                         : C.red;
    
    fill(doc, complianceColor);
    doc.roundedRect(ML + CW - 35, y + 2, 30, 6, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    rgb(doc, C.bg);
    doc.text(complianceStatus, ML + CW - 20, y + 5.5, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    rgb(doc, C.textDim);
    const complianceText = `Compliance Score: ${data.compliance_report?.compliance_score ?? 'N/A'}/100 | Pass: ${data.compliance_report?.pass_count ?? 0} | Fail: ${data.compliance_report?.fail_count ?? 0}`;
    const complianceLines = doc.splitTextToSize(complianceText, CW - 10);
    doc.text(complianceLines, ML + 3, y + 12);
    
    if (data.predictive_compliance) {
      const predComp = data.predictive_compliance;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      rgb(doc, C.cyan);
      doc.text(`Predictive Risk Score: ${predComp.current_risk_score ?? 'N/A'}/100`, ML + 3, y + 20);
    }
    
    y += 29;
  }

  // ── Provenance & Legal Findings ─────────────────────────────────────────────
  if (data.provenance_report) {
    y = pageCheck(doc, y, 25);
    y = sectionHeader(doc, y, 'Code Provenance & Legal Analysis', C.purple);
    
    fill(doc, C.card);
    stroke(doc, C.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(ML, y, CW, 20, 2, 2, 'FD');
    
    const prov = data.provenance_report;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    rgb(doc, C.textDim);
    
    let provY = y + 5;
    if (prov.license_summary) {
      doc.setFont('helvetica', 'bold');
      rgb(doc, C.white);
      doc.text('License Summary:', ML + 3, provY);
      provY += 4;
      doc.setFont('helvetica', 'normal');
      rgb(doc, C.textDim);
      const licenseLines = doc.splitTextToSize(prov.license_summary, CW - 6);
      doc.text(licenseLines, ML + 3, provY);
      provY += licenseLines.length * 3.5 + 3;
    }
    
    if (prov.authorship_attribution) {
      doc.setFont('helvetica', 'bold');
      rgb(doc, C.white);
      doc.text('Authorship Attribution:', ML + 3, provY);
      provY += 4;
      doc.setFont('helvetica', 'normal');
      rgb(doc, C.textDim);
      const authorLines = doc.splitTextToSize(prov.authorship_attribution, CW - 6);
      doc.text(authorLines, ML + 3, provY);
    }
    
    y += 24;
  }

  // ── Strategic Recommendations ───────────────────────────────────────────────
  y = pageCheck(doc, y, 20);
  y = sectionHeader(doc, y, 'Strategic Recommendations & Next Steps', C.emerald);
  
  fill(doc, C.card);
  stroke(doc, C.emerald);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, CW, 18, 2, 2, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  rgb(doc, C.emerald);
  doc.text('Immediate Actions (0-7 Days)', ML + 3, y + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  rgb(doc, C.white);
  const immediateActions = [
    'Review and address top 3 code hotspots identified in this report',
    'Implement automated testing for critical modules',
    'Establish technical debt monitoring dashboard'
  ];
  immediateActions.forEach((action, i) => {
    doc.text(`• ${action}`, ML + 3, y + 9 + (i * 3));
  });
  
  y += 22;
  
  fill(doc, C.card);
  stroke(doc, C.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(ML, y, CW, 15, 2, 2, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  rgb(doc, C.cyan);
  doc.text('Long-term Strategy (30-90 Days)', ML + 3, y + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  rgb(doc, C.white);
  const longTermActions = [
    'Refactor root cause modules to reduce technical debt',
    'Implement continuous compliance monitoring',
    'Establish developer wellness and burnout prevention programs'
  ];
  longTermActions.forEach((action, i) => {
    doc.text(`• ${action}`, ML + 3, y + 9 + (i * 3));
  });
  
  y += 19;

  // ── Footer on every page ───────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    fill(doc, C.card);
    doc.rect(0, PH - 12, PW, 12, 'F');
    stroke(doc, C.border);
    doc.setLineWidth(0.2);
    doc.line(0, PH - 12, PW, PH - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    rgb(doc, C.muted);
    doc.text('InsightX — Executive Risk Intelligence Report', ML, PH - 8);
    doc.text(`Source: ${data.filename}`, ML, PH - 4);
    doc.text(`Page ${p} of ${totalPages}`, PW - MR, PH - 8, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, PW - MR, PH - 4, { align: 'right' });
    doc.text(`Confidential — ${data.project_name}`, PW / 2, PH - 6, { align: 'center' });
  }

  // Use actual source name for filename
  const safeSourceName = data.filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const safeProjectName = data.project_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`InsightX_Executive_Report_${safeProjectName}_${safeSourceName}_${Date.now()}.pdf`);
}
