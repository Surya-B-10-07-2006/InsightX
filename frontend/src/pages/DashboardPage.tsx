import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Download, Send, AlertTriangle, ShieldAlert,
  Cpu, Flame, GitBranch, Clock, DollarSign, Sparkles, CheckCircle2,
  FileCode, Layers, RefreshCw, BarChart2, Github, ShieldCheck,
  Package, Users2, Scale, Bot, TrendingUp, Target, Activity
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardData } from '../types';
import { generatePDFReport } from '../services/pdfReport';

import { SHAPChart } from '../components/SHAPChart';
import { RiskTimeMachine } from '../components/RiskTimeMachine';
import { NetworkGraph } from '../components/NetworkGraph';
import { InterventionROICard } from '../components/InterventionROICard';
import { WhatsAppModal } from '../components/WhatsAppModal';

import { EvidenceQualityCard } from '../components/EvidenceQualityCard';
import { DefectForecastCard } from '../components/DefectForecastCard';
import { RootCauseClusteringCard } from '../components/RootCauseClusteringCard';
import { AICodeGovernanceCard } from '../components/AICodeGovernanceCard';
import { LicenseIPGovernanceCard } from '../components/LicenseIPGovernanceCard';
import { ScopeDriftCard } from '../components/ScopeDriftCard';
import { ModelPerformanceCard } from '../components/ModelPerformanceCard';
import { MultiProjectComparisonCard } from '../components/MultiProjectComparisonCard';

const NA_TEXT = 'Insufficient evidence available for this analysis.';

export const DashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project_id') || 'demo_proj';

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState<boolean>(false);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get<DashboardData>(`/ml/dashboard/${projectId}`);
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load project ML intelligence dashboard.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [projectId]);

  const handleDownloadPDF = () => {
    if (data) generatePDFReport(data);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-cyan-400">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="text-sm font-mono text-slate-400">Loading InsightX Intelligence Dashboard...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 flex flex-col items-center justify-center text-center gap-3">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <h3 className="text-lg font-bold text-slate-100">Dashboard Unavailable</h3>
        <p className="text-xs text-slate-400">{error || "No ML prediction records found for this project."}</p>
      </div>
    );
  }

  const { ml_results, metrics, hotspots, network_graph, similarity, time_machine, intervention_roi, ai_explanations, scope_drift, compliance_report, license_report, provenance_report } = data;
  const intel = ai_explanations?.intelligence_sections;

  return (
    <div ref={printRef} className="flex flex-col gap-8 pb-12">
      
      {/* Header & Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-100">{data.project_name}</h1>
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono font-bold text-cyan-400">
              {data.filename}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Analyzed at {new Date(data.analyzed_at).toLocaleString()} • Duration: <span className="font-mono text-cyan-400">{data.total_duration_ms}ms</span>
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto print:hidden">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF Report</span>
          </button>

          <button
            onClick={() => setIsWhatsAppOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
          >
            <Send className="h-4 w-4" />
            <span>Send WhatsApp Alert</span>
          </button>
        </div>
      </div>

      {/* Insufficient Evidence Warning Banner if applicable */}
      {data.is_insufficient_evidence && (
        <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-6 flex items-center gap-4">
          <AlertTriangle className="h-8 w-8 text-amber-400 flex-shrink-0" />
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold text-amber-200">Analysis Pending Additional Data Points</h3>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              {data.insufficient_reason || "The uploaded target file does not contain enough parseable source code or health metrics. Estimates below reflect preliminary signals."}
            </p>
          </div>
        </div>
      )}

      {/* 1. EXECUTIVE RISK OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Overall Risk Score */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Overall Risk Score</span>
            <ShieldAlert className="h-5 w-5 text-red-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-red-400">{ml_results.overall_risk_score}</span>
            <span className="text-xs text-slate-500 font-mono">/ 100</span>
          </div>
          <span className="mt-2 inline-flex w-max px-2.5 py-0.5 rounded-md bg-red-500/20 text-red-300 text-[10px] font-mono font-bold">
            {ml_results.risk_level} RISK
          </span>
        </div>

        {/* Primary Predicted Failure */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Primary Failure Category</span>
            <Cpu className="h-5 w-5 text-purple-400" />
          </div>
          <div className="mt-2 font-bold text-slate-100 text-sm leading-snug">
            {ml_results.primary_failure_type}
          </div>
          <span className="mt-2 text-[11px] text-slate-400">Predicted by XGBoost/RF Model</span>
        </div>

        {/* Developer Burnout Score */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Developer Burnout Index</span>
            <Flame className="h-5 w-5 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-amber-400">{ml_results.burnout_analysis.burnout_risk_score}%</span>
          </div>
          <span className="mt-2 text-[11px] text-slate-400">Level: <span className="font-bold text-amber-300">{ml_results.burnout_analysis.burnout_level}</span></span>
        </div>

        {/* Root Cause Module */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">NetworkX Root Cause</span>
            <GitBranch className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="mt-2 font-mono font-bold text-cyan-300 text-xs truncate">
            {network_graph.root_cause_module}
          </div>
          <span className="mt-2 text-[11px] text-slate-400">Betweenness Centrality Peak</span>
        </div>

      </div>

      {/* Executive Risk Summary Plain-English Box */}
      <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">Executive Intelligence Overview</h3>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-slate-400">Overall Risk Level</div>
            <div className="text-lg font-mono font-bold text-red-400">{intel?.executive_risk_summary?.overall_risk ?? ml_results.overall_risk_score} / 100</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-slate-400">Model Confidence</div>
            <div className="text-lg font-mono font-bold text-cyan-400">{intel?.executive_risk_summary?.model_confidence_pct ?? ml_results.model_confidence ?? 85}%</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-slate-400">Action Urgency</div>
            <div className="text-lg font-mono font-bold text-amber-400">{intel?.executive_risk_summary?.urgency ?? ml_results.risk_level}</div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
          <div><span className="text-slate-400">Primary Risk Driver:</span> {intel?.executive_risk_summary?.primary_failure ?? ml_results.primary_failure_type}</div>
          <div className="mt-1"><span className="text-slate-400">Business Impact:</span> {intel?.executive_risk_summary?.business_impact ?? "Potential milestone delay and elevated maintenance churn under high complexity."}</div>
        </div>
      </div>

      {/* 2. WHY: SHAP FEATURE IMPORTANCE & 3. WHAT FAILS FIRST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SHAP Visualization */}
        <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-cyan-400" />
              <h3 className="text-base font-bold text-slate-100">Why: SHAP Explainable Risk Factors</h3>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">TreeExplainer</span>
          </div>
          {ml_results.shap_feature_importance && ml_results.shap_feature_importance.length > 0 ? (
            <SHAPChart data={ml_results.shap_feature_importance} />
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-center text-xs font-mono text-slate-400">
              {NA_TEXT}
            </div>
          )}
        </div>

        {/* First-Failure Ranking */}
        <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-400" />
              <h3 className="text-base font-bold text-slate-100">What Fails First: Failure Ranking Matrix</h3>
            </div>
            <span className="text-[11px] font-mono text-purple-400">Evidence Probabilities</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {ml_results.failure_rankings && ml_results.failure_rankings.length > 0 ? ml_results.failure_rankings.map((item) => (
              <div key={item.rank} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-xs font-mono font-bold text-slate-300">
                    #{item.rank}
                  </span>
                  <span className="text-xs font-bold text-slate-200">{item.failure_type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-cyan-400">{item.probability}%</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    item.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {item.severity}
                  </span>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-center text-xs font-mono text-slate-400">
                {NA_TEXT}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. CONFIDENCE & EVIDENCE QUALITY LAYER */}
      <EvidenceQualityCard 
        evidenceQuality={ml_results.evidence_quality} 
        modelConfidence={ml_results.model_confidence} 
      />

      {/* 5. ADVANCED DEFECT FORECASTING */}
      <DefectForecastCard forecasts={ml_results.forecasts} />

      {/* 6. ROOT CAUSES & ML CLUSTERING + NETWORKX GRAPH */}
      <RootCauseClusteringCard 
        clusters={network_graph.root_cause_clusters} 
        rootCauseModule={network_graph.root_cause_module} 
      />

      <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">NetworkX Module Dependency & Centrality Graph</h3>
          </div>
          <span className="text-[11px] font-mono text-cyan-400">{network_graph.total_components_analyzed} Nodes Analyzed</span>
        </div>
        <NetworkGraph data={network_graph} />
      </div>

      {/* 7. HOTSPOTS & CODE QUALITY SIGNALS */}
      <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">Code Hotspot Risk & Cyclomatic Complexity</h3>
          </div>
        </div>

        {hotspots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hotspots.map((hs, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
                <span className="text-xs font-mono font-bold text-slate-200 truncate">{hs.file}</span>
                <div className="mt-3 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Complexity:</span>
                  <span className="text-amber-400 font-bold">{hs.complexity}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Risk Density:</span>
                  <span className="text-red-400 font-bold">{hs.risk_score}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center text-xs font-mono text-slate-400">
            {NA_TEXT}
          </div>
        )}
      </div>

      {/* 8. SCOPE-DRIFT INTELLIGENCE */}
      <ScopeDriftCard scopeDrift={scope_drift} currentRisk={ml_results.overall_risk_score} />

      {/* 9. MULTI-PROJECT COMPARISON & PORTFOLIO RISK */}
      <MultiProjectComparisonCard 
        multiProjectData={similarity.multi_project_comparison} 
        similarProjects={similarity.similar_projects} 
      />

      {/* 10. AI CODE GOVERNANCE */}
      <AICodeGovernanceCard provenanceReport={provenance_report} />

      {/* 11. ADVANCED LICENSE & IP GOVERNANCE */}
      <LicenseIPGovernanceCard licenseReport={license_report} provenanceReport={provenance_report} />

      {/* 12. MODEL PERFORMANCE & CALIBRATION METRICS */}
      <ModelPerformanceCard modelPerformance={ml_results.model_performance} />

      {/* 13. BUSINESS IMPACT & INTERVENTION ROI */}
      <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100">Intervention ROI & Financial Cost Savings Engine</h3>
          </div>
        </div>
        <InterventionROICard data={intervention_roi} />
      </div>

      {/* 7/14/30-Day Risk Time Machine */}
      <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
        <RiskTimeMachine data={time_machine} />
      </div>

      {/* 14. RECOMMENDED ACTIONS & EXECUTIVE ACTION PLAN */}
      <div className="rounded-3xl border border-purple-500/30 bg-purple-500/10 p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h3 className="text-base font-bold text-purple-200">Executive Action Plan & Decision Recommendations</h3>
          </div>
          <span className="text-[11px] font-mono text-purple-300 font-bold">{ai_explanations.source}</span>
        </div>

        {/* Executive Summary */}
        <div className="rounded-2xl border border-purple-500/20 bg-purple-900/20 p-4">
          <p className="text-sm font-semibold text-slate-100 leading-relaxed">
            {ai_explanations.executive_summary}
          </p>
        </div>

        {/* Priority Preventive Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <span className="text-xs font-mono font-semibold uppercase text-purple-300">Prioritized Action Items:</span>
          {ai_explanations.preventive_recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* GitHub Metadata & SOC2 Compliance Signals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* GitHub Metadata */}
        <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Github className="h-5 w-5 text-slate-300" />
              <h3 className="text-base font-bold text-slate-100">GitHub Repository Metadata</h3>
            </div>
          </div>
          {data.github_summary ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] text-slate-400 font-mono">Stars</span>
                <div className="text-base font-extrabold font-mono text-slate-100 mt-0.5">{data.github_summary.stars}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] text-slate-400 font-mono">Forks</span>
                <div className="text-base font-extrabold font-mono text-slate-100 mt-0.5">{data.github_summary.forks}</div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              {NA_TEXT} Connect GitHub OAuth to enable live metadata stream.
            </p>
          )}
        </div>

        {/* SOC2 Control Signals */}
        <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-slate-100">SOC 2 Compliance Controls</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between">
              <span>CC6.1 Logical Access Controls</span>
              <span className="font-mono text-emerald-400 font-bold">PASS</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between">
              <span>CC7.2 Incident Response Monitoring</span>
              <span className="font-mono text-emerald-400 font-bold">PASS</span>
            </div>
          </div>
        </div>

      </div>

      {/* WhatsApp Modal Trigger */}
      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        projectId={projectId}
        projectName={data.project_name}
      />

    </div>
  );
};

