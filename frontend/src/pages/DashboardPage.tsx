import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Download, AlertTriangle, ShieldAlert,
  Cpu, Flame, GitBranch, Clock, DollarSign, Sparkles, CheckCircle2,
  FileCode, Layers, RefreshCw, BarChart2, Github, ShieldCheck,
  Package, Users2, Scale, Bot, TrendingUp, Target, Activity, Award, Compass
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardData } from '../types';
import { generatePDFReport } from '../services/pdfReport';

import { RolePersonaSelector, RolePersona } from '../components/RolePersonaSelector';
import { QualityFusionCard } from '../components/QualityFusionCard';
import { ArchitectureRiskCard } from '../components/ArchitectureRiskCard';
import { SASTReachabilityCard } from '../components/SASTReachabilityCard';
import { AIDebtProvenanceCard } from '../components/AIDebtProvenanceCard';
import { PolicyAutoTriageCard } from '../components/PolicyAutoTriageCard';
import { VerifiedFixPRCard } from '../components/VerifiedFixPRCard';
import { TeamPortfolioCard } from '../components/TeamPortfolioCard';

import { SHAPChart } from '../components/SHAPChart';
import { RiskTimeMachine } from '../components/RiskTimeMachine';
import { NetworkGraph } from '../components/NetworkGraph';
import { InterventionROICard } from '../components/InterventionROICard';
import { EvidenceQualityCard } from '../components/EvidenceQualityCard';
import { DefectForecastCard } from '../components/DefectForecastCard';

const NA_TEXT = 'Insufficient evidence available for this analysis.';

export const DashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project_id') || 'demo_proj';

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<RolePersona>('executive');

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
        <span className="text-sm font-mono text-slate-400">Running Master ML & Architecture Analysis Pipeline...</span>
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
    auto_triage_backlog,
    verified_fix_prs,
    team_governance,
    portfolio_health,
    polyglot_mesh
  } = data;

  return (
    <div ref={printRef} className="flex flex-col gap-8 pb-16">
      
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-100">{data.project_name}</h1>
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono font-bold text-cyan-400">
              {data.filename}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Analyzed at {new Date(data.analyzed_at).toLocaleString()} • Duration: <span className="font-mono text-cyan-400">{data.total_duration_ms}ms</span> • Polyglot Primary: <span className="font-mono text-emerald-400">{polyglot_mesh?.primary_language || metrics.primary_language || 'Python'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto print:hidden">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all shadow-md"
          >
            <Download className="h-4 w-4 text-cyan-400" />
            <span>Download Verified PDF Report</span>
          </button>
        </div>
      </div>

      {/* Insufficient Evidence Warning Banner */}
      {data.is_insufficient_evidence && (
        <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-6 flex items-center gap-4">
          <AlertTriangle className="h-8 w-8 text-amber-400 flex-shrink-0" />
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold text-amber-200">Analysis Pending Additional Data Points</h3>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              {data.insufficient_reason || "The uploaded target file does not contain enough parseable source code or health metrics. Estimates reflect preliminary signals."}
            </p>
          </div>
        </div>
      )}

      {/* Role-Based Perspective Onboarding Selector */}
      <RolePersonaSelector activeRole={activeRole} onSelectRole={setActiveRole} />

      {/* 1. EXECUTIVE RISK TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* ML Risk Score */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between border-slate-800 bg-slate-950/60 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">ML Overall Risk Score</span>
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

        {/* Quality Fusion Grade */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between border-slate-800 bg-slate-950/60 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Quality Fusion Grade</span>
            <Award className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-cyan-400">{quality_fusion?.grade || 'A'}</span>
            <span className="text-xs text-slate-400 font-mono">({quality_fusion?.composite_score || 85}/100)</span>
          </div>
          <span className="mt-2 text-[11px] text-slate-400 font-mono">Maintainability & Cohesion</span>
        </div>

        {/* Primary Predicted Failure */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between border-slate-800 bg-slate-950/60 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Primary Failure Category</span>
            <Cpu className="h-5 w-5 text-purple-400" />
          </div>
          <div className="mt-2 font-bold text-slate-100 text-xs leading-snug">
            {ml_results.primary_failure_type}
          </div>
          <span className="mt-2 text-[11px] text-slate-400">RandomForest / XGBoost Classifier</span>
        </div>

        {/* Root Cause Module */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between border-slate-800 bg-slate-950/60 shadow-lg">
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

      {/* 2. QUALITY FUSION SCORE */}
      {(activeRole === 'executive' || activeRole === 'architect') && (
        <QualityFusionCard qualityFusion={quality_fusion} />
      )}

      {/* 3. SHAP EXPLAINABILITY & FAILURE RANKINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SHAP Visualization */}
        <div className="glass-card rounded-3xl p-6 flex flex-col gap-4 border border-slate-800 bg-slate-950/60 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-cyan-400" />
              <h3 className="text-base font-bold text-slate-100">Why: SHAP Explainable Risk Attribution</h3>
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

        {/* First-Failure Probabilities */}
        <div className="glass-card rounded-3xl p-6 flex flex-col gap-4 border border-slate-800 bg-slate-950/60 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-400" />
              <h3 className="text-base font-bold text-slate-100">What Fails First: Failure Probability Matrix</h3>
            </div>
            <span className="text-[11px] font-mono text-purple-400">Calibrated Ensemble</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {ml_results.failure_rankings && ml_results.failure_rankings.length > 0 ? ml_results.failure_rankings.slice(0, 5).map((item) => (
              <div key={item.rank} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-xs font-mono font-bold text-slate-300">
                    #{item.rank}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-200">{item.failure_type}</span>
                    {item.evidence && <span className="text-[10px] text-slate-400">{item.evidence}</span>}
                  </div>
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

      {/* 4. ARCHITECTURE RISK INDEX & NETWORKX GRAPH */}
      {(activeRole === 'executive' || activeRole === 'architect' || activeRole === 'developer') && (
        <ArchitectureRiskCard architectureRisk={architecture_risk} />
      )}

      {/* NetworkX Interactive Component */}
      <div className="glass-card rounded-3xl p-6 flex flex-col gap-4 border border-slate-800 bg-slate-950/60 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">NetworkX Module Dependency & Centrality Graph</h3>
          </div>
          <span className="text-[11px] font-mono text-cyan-400">{network_graph.total_components_analyzed} Nodes Analyzed</span>
        </div>
        <NetworkGraph data={network_graph} />
      </div>

      {/* 5. DEEP SAST & REACHABILITY ANALYSIS */}
      {(activeRole === 'executive' || activeRole === 'security' || activeRole === 'developer') && (
        <SASTReachabilityCard sastAnalysis={sast_analysis} reachabilityAnalysis={reachability_analysis} />
      )}

      {/* 6. AI CODE PROVENANCE GATE & AI DEBT LEDGER */}
      {(activeRole === 'executive' || activeRole === 'security' || activeRole === 'architect') && (
        <AIDebtProvenanceCard provenanceGate={provenance_gate} aiDebtLedger={ai_debt_ledger} />
      )}

      {/* 7. POLICY-AS-CODE & AUTO-TRIAGE BACKLOG */}
      {(activeRole === 'executive' || activeRole === 'security' || activeRole === 'developer') && (
        <PolicyAutoTriageCard policyCatalog={policy_catalog} autoTriageBacklog={auto_triage_backlog} />
      )}

      {/* 8. VERIFIED FIX PRS */}
      {(activeRole === 'developer' || activeRole === 'architect') && (
        <VerifiedFixPRCard fixPrs={verified_fix_prs} />
      )}

      {/* 9. ADVANCED DEFECT FORECASTING */}
      <DefectForecastCard forecasts={ml_results.forecasts} />

      {/* 10. PRIVACY-PRESERVING TEAM GOVERNANCE & PORTFOLIO HEALTH */}
      {(activeRole === 'executive' || activeRole === 'architect') && (
        <TeamPortfolioCard teamGovernance={team_governance} portfolioHealth={portfolio_health} />
      )}

      {/* 11. INTERVENTION ROI & RISK TIME MACHINE */}
      <div className="flex flex-col gap-6">
        <div className="glass-card rounded-3xl p-6 flex flex-col gap-4 border border-slate-800 bg-slate-950/60 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-slate-100">Intervention ROI & Cost Savings Engine</h3>
            </div>
          </div>
          <InterventionROICard data={intervention_roi} />
        </div>

        <div className="glass-card rounded-3xl p-6 flex flex-col gap-4 border border-slate-800 bg-slate-950/60 shadow-lg">
          <RiskTimeMachine data={time_machine} />
        </div>
      </div>

      {/* 12. EXECUTIVE ACTION PLAN & DECISION PANEL */}
      <div className="rounded-3xl border border-purple-500/30 bg-purple-500/10 p-6 flex flex-col gap-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h3 className="text-base font-bold text-purple-200">Executive Decision Recommendations & Action Plan</h3>
          </div>
          <span className="text-[11px] font-mono text-purple-300 font-bold">
            {ai_explanations.executive_decisions?.source || ai_explanations.source}
          </span>
        </div>

        {/* Overall Recommendation */}
        {ai_explanations.executive_decisions?.overall_recommendation && (
          <div className="rounded-2xl border border-purple-500/20 bg-purple-900/20 p-4">
            <p className="text-sm font-semibold text-slate-100 leading-relaxed">
              {ai_explanations.executive_decisions.overall_recommendation}
            </p>
          </div>
        )}

        {/* Evidence-Based Executive Decisions */}
        {ai_explanations.executive_decisions?.decisions && ai_explanations.executive_decisions.decisions.length > 0 ? (
          <div className="flex flex-col gap-3 pt-1">
            <span className="text-xs font-mono font-semibold uppercase text-purple-300">
              Evidence-Based Executive Decisions ({ai_explanations.executive_decisions.decisions.length} prioritized actions):
            </span>
            {ai_explanations.executive_decisions.decisions.map((decision) => (
              <div key={decision.rank} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-3">
                {/* Decision Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/20 text-xs font-mono font-bold text-purple-300">
                      #{decision.rank}
                    </span>
                    <h4 className="text-sm font-bold text-slate-100">{decision.decision}</h4>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold whitespace-nowrap ${
                    decision.urgency === 'IMMEDIATE' ? 'bg-red-500/20 text-red-300' :
                    decision.urgency === 'HIGH' ? 'bg-amber-500/20 text-amber-300' :
                    decision.urgency === 'MODERATE' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-slate-500/20 text-slate-300'
                  }`}>
                    {decision.urgency}
                  </span>
                </div>

                {/* Why */}
                <p className="text-xs text-slate-300 leading-relaxed">{decision.why}</p>

                {/* Evidence Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg bg-slate-800/50 p-3">
                  {decision.evidence && Object.entries(decision.evidence).map(([key, value]) => (
                    value !== null && value !== undefined && (
                      <div key={key} className="flex flex-col">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{key.replace(/_/g, ' ')}</span>
                        <span className="text-xs font-mono font-bold text-cyan-300">
                          {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(2)) : value}
                        </span>
                      </div>
                    )
                  ))}
                </div>

                {/* Affected Files */}
                {decision.affected_files && decision.affected_files.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Affected Files/Modules:</span>
                    <div className="flex flex-wrap gap-1">
                      {decision.affected_files.map((file, idx) => (
                        <span key={idx} className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {file.split('/').pop()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Impact Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Risk Reduction</span>
                    <span className="text-xs font-mono font-bold text-emerald-300">
                      {decision.expected_risk_reduction_pct !== null ? `${decision.expected_risk_reduction_pct}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Effort</span>
                    <span className="text-xs font-mono font-bold text-emerald-300">{decision.estimated_effort}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Effort Days</span>
                    <span className="text-xs font-mono font-bold text-emerald-300">
                      {decision.effort_days !== null ? `${decision.effort_days}d` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Days Saved</span>
                    <span className="text-xs font-mono font-bold text-emerald-300">
                      {decision.days_saved !== null ? `${decision.days_saved}d` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Owner & Confidence */}
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-semibold text-slate-300">Owner: {decision.owner}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-mono text-cyan-300">
                      Confidence: {decision.confidence_pct !== null ? `${decision.confidence_pct}%` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Measurable Target */}
                <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-3">
                  <div className="flex items-start gap-2">
                    <Compass className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-cyan-300 uppercase">Measurable Target:</span>
                      <span className="text-xs text-slate-200">{decision.measurable_target}</span>
                    </div>
                  </div>
                </div>

                {/* Source Badge */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-slate-500">
                    Source: {decision.source}
                  </span>
                  {ai_explanations.executive_decisions.evidence_grounded && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Evidence-Grounded
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Fallback to old format if executive_decisions not available */
          <>
            <div className="rounded-2xl border border-purple-500/20 bg-purple-900/20 p-4">
              <p className="text-sm font-semibold text-slate-100 leading-relaxed">
                {ai_explanations.executive_summary}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-xs font-mono font-semibold uppercase text-purple-300">Prioritized Action Items:</span>
              {ai_explanations.preventive_recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
};
