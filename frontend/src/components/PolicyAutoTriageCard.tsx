import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, ListTodo, Clock, ChevronRight } from 'lucide-react';
import { PolicyCatalogReport, AutoTriageItem } from '../types';

interface PolicyAutoTriageCardProps {
  policyCatalog?: PolicyCatalogReport;
  autoTriageBacklog?: AutoTriageItem[];
}

export const PolicyAutoTriageCard: React.FC<PolicyAutoTriageCardProps> = ({
  policyCatalog,
  autoTriageBacklog
}) => {
  const [activeTab, setActiveTab] = useState<'policy' | 'triage'>('policy');

  if (!policyCatalog && !autoTriageBacklog) return null;

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-6 border border-slate-800 bg-slate-950/60 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              Policy-as-Code & Auto-Triage Backlog
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Rule Evaluation & Prioritization
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic organizational quality gates + ML-triaged work items with effort estimates
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-900/80 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('policy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'policy' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Policy Catalog ({policyCatalog?.passed_rules_count || 0}/{policyCatalog?.total_rules_evaluated || 0} Passed)
          </button>
          <button
            onClick={() => setActiveTab('triage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'triage' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Auto-Triage Backlog ({autoTriageBacklog?.length || 0} Items)
          </button>
        </div>
      </div>

      {/* Policy Catalog View */}
      {activeTab === 'policy' && policyCatalog && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>Overall Catalog Status: <strong className="text-emerald-400">{policyCatalog.overall_status}</strong></span>
            <span>Compliance Rate: <strong className="text-cyan-400">{policyCatalog.policy_compliance_pct}%</strong></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {policyCatalog.policy_rules.map((rule) => {
              const isPass = rule.status === 'PASS';
              return (
                <div
                  key={rule.rule_id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 ${
                    isPass
                      ? 'border-slate-800 bg-slate-900/50'
                      : 'border-red-500/30 bg-red-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isPass ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                      )}
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{rule.rule_id} • {rule.category}</span>
                        <div className="text-xs font-bold text-slate-200">{rule.title}</div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      isPass ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {rule.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    <span>Threshold: {rule.threshold}</span>
                    <span className={isPass ? 'text-emerald-400' : 'text-red-400 font-bold'}>Actual: {rule.actual_value}</span>
                  </div>

                  {!isPass && (
                    <div className="text-[11px] text-red-300/90 leading-tight">
                      <span className="font-mono text-red-400">Action:</span> {rule.remediation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Auto-Triage Backlog View */}
      {activeTab === 'triage' && autoTriageBacklog && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2.5">
            {autoTriageBacklog.map((item) => {
              const getPriorityColor = (p: string) => {
                switch (p) {
                  case 'P0': return 'bg-red-500/20 text-red-300 border-red-500/40';
                  case 'P1': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                  case 'P2': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
                  default: return 'bg-slate-800 text-slate-300 border-slate-700';
                }
              };

              return (
                <div key={item.ticket_id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black border ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                        <span>{item.ticket_id}</span>
                        <span>•</span>
                        <span className="text-cyan-400">{item.category}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                      <p className="text-[11px] text-slate-400">{item.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-xs">
                    <div className="flex items-center gap-1 text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                      <Clock className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{item.estimated_effort_hours}h effort</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
