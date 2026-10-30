import React from 'react';
import { Bot, DollarSign, Clock, ShieldCheck, AlertTriangle, CheckCircle2, UserCheck } from 'lucide-react';
import { AIProvenanceGate, AIDebtLedger } from '../types';

interface AIDebtProvenanceCardProps {
  provenanceGate?: AIProvenanceGate;
  aiDebtLedger?: AIDebtLedger;
}

export const AIDebtProvenanceCard: React.FC<AIDebtProvenanceCardProps> = ({
  provenanceGate,
  aiDebtLedger
}) => {
  if (!provenanceGate && !aiDebtLedger) return null;

  const getGateBadge = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'WARN':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'BLOCKED':
      default:
        return 'bg-red-500/20 text-red-300 border-red-500/40';
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-6 border border-slate-800 bg-slate-950/60 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              AI Code Provenance Gate & AI Debt Ledger
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                SOC 2 & IP Compliant
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Automated lineage detection, unreviewed AI code volume, refactoring liability & remediation cost
            </p>
          </div>
        </div>

        {provenanceGate && (
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border ${getGateBadge(provenanceGate.gate_status)}`}>
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">GATE: {provenanceGate.gate_status}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: AI Provenance Gate */}
        {provenanceGate && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-slate-300">Code Authorship Split</span>
              <span className="text-xs font-mono text-cyan-400">Policy Ceiling: {provenanceGate.max_allowed_ai_pct}%</span>
            </div>

            {/* Ratio Progress Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${provenanceGate.human_contribution_pct}%` }} />
                <div className="bg-cyan-500 h-full transition-all" style={{ width: `${provenanceGate.ai_contribution_pct}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold">👤 Human: {provenanceGate.human_contribution_pct}%</span>
                <span className="text-cyan-400 font-bold">🤖 AI Generated: {provenanceGate.ai_contribution_pct}%</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300 leading-relaxed">
              <span className="text-slate-400 font-mono">Status Reason:</span> {provenanceGate.gate_reason}
            </div>

            {/* Detected AI Tools */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Detected Assistants:</span>
              {Object.entries(provenanceGate.ai_tools_detected).map(([tool, count], idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-300 border border-slate-700">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Right: AI Debt Ledger */}
        {aiDebtLedger && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-slate-300">AI Debt Liability Metrics</span>
              <span className="text-xs font-mono text-amber-400 font-bold">{aiDebtLedger.debt_risk_category.replace(/_/g, ' ')}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span>Refactor Liability</span>
                </div>
                <div className="mt-2 text-2xl font-black font-mono text-amber-400">
                  {aiDebtLedger.refactoring_liability_hours}h
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">Estimated remediation time</span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Liability Cost</span>
                </div>
                <div className="mt-2 text-2xl font-black font-mono text-emerald-400">
                  ${aiDebtLedger.estimated_remediation_cost_usd.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">Blended engineering cost</span>
              </div>
            </div>

            {aiDebtLedger.remediation_priority_modules.length > 0 && (
              <div className="flex flex-col gap-1.5 text-xs font-mono">
                <span className="text-slate-400">Priority Modules to Audit:</span>
                <div className="flex flex-wrap gap-1.5">
                  {aiDebtLedger.remediation_priority_modules.map((mod, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px] truncate max-w-[200px]">
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
