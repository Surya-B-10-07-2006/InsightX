import React from 'react';
import { Bot, CheckCircle2, AlertTriangle, ShieldCheck, Cpu, Code2, Users2, FileCheck } from 'lucide-react';
import { AICodeGovernance, ProvenanceReport } from '../types';

interface Props {
  provenanceReport?: ProvenanceReport & { ai_code_governance?: AICodeGovernance };
}

export const AICodeGovernanceCard: React.FC<Props> = ({ provenanceReport }) => {
  const gov = provenanceReport?.ai_code_governance;
  const humanPct = provenanceReport?.human_contribution_pct ?? 65.0;
  const aiPct = provenanceReport?.ai_contribution_pct ?? 35.0;

  const toolAttribution = gov?.tool_attribution || [
    { tool: 'GitHub Copilot', usage_count: 14, percentage: 51.9 },
    { tool: 'Cursor AI', usage_count: 8, percentage: 29.6 },
    { tool: 'Claude Code', usage_count: 5, percentage: 18.5 },
  ];

  const genStats = gov?.generation_stats || {
    primary_model: 'Claude 3.5 Sonnet / Copilot GPT-4o',
    estimated_generation_time_minutes: 94.5,
    total_prompts_executed: 162,
  };

  const devEvents = gov?.developer_events || {
    accepted_suggestions: 113,
    rejected_suggestions: 22,
    acceptance_rate_pct: 83.7,
  };

  const humanReview = gov?.human_review || {
    confirmed_human_reviews: 18,
    unreviewed_ai_files: 2,
    review_status: 'NEEDS_CONFIRMATION' as const,
  };

  const policy = gov?.policy_enforcement || {
    max_allowed_ai_pct: 50.0,
    current_ai_pct: aiPct,
    policy_status: aiPct <= 50.0 ? ('COMPLIANT' as const) : ('POLICY_WARNING' as const),
    release_blocked: false,
    policy_note: 'AI code policy enforces mandatory human review for all modules exceeding 50% AI generation.',
  };

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-6 border-slate-800 bg-slate-900/40">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">🤖 Real-Time AI Code Governance</h3>
            <p className="text-xs text-slate-400">Copilot / Cursor / Claude Code Attribution & Policy Enforcement</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
          policy.policy_status === 'COMPLIANT'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          {policy.policy_status}
        </span>
      </div>

      {/* Contribution Ratio Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-200">
          <span className="flex items-center gap-1.5 text-indigo-300">
            <Users2 className="h-4 w-4" /> Human vs AI Code Contribution
          </span>
          <span className="font-mono text-slate-400">
            {humanPct}% Human • {aiPct}% AI
          </span>
        </div>
        <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden flex">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500" 
            style={{ width: `${humanPct}%` }}
            title={`Human Authored: ${humanPct}%`}
          />
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500" 
            style={{ width: `${aiPct}%` }}
            title={`AI Generated: ${aiPct}%`}
          />
        </div>
      </div>

      {/* Tool Attribution & Model Generation Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tool Attribution */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Code2 className="h-4 w-4 text-cyan-400" /> AI Tool Attribution Breakdown
          </div>
          <div className="flex flex-col gap-2.5 mt-1">
            {toolAttribution.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-semibold">{item.tool}</span>
                  <span className="font-mono text-cyan-400">{item.percentage}% ({item.usage_count} events)</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model & Developer Events */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between gap-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <span className="text-slate-400 flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5 text-purple-400" /> Primary AI Model
            </span>
            <span className="font-mono font-bold text-slate-200">{genStats.primary_model}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <span className="text-slate-400">Accept / Reject Events</span>
            <span className="font-mono font-bold text-emerald-400">
              {devEvents.accepted_suggestions} Acc. / {devEvents.rejected_suggestions} Rej. ({devEvents.acceptance_rate_pct}% rate)
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <span className="text-slate-400">Estimated Generation Time</span>
            <span className="font-mono font-bold text-cyan-300">~{genStats.estimated_generation_time_minutes} min</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <FileCheck className="h-3.5 w-3.5 text-blue-400" /> Human Review Status
            </span>
            <span className={`font-mono font-bold ${
              humanReview.review_status === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {humanReview.confirmed_human_reviews} Verified / {humanReview.unreviewed_ai_files} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Policy Enforcement Alert */}
      <div className={`rounded-xl p-4 border text-xs flex items-start gap-3 ${
        policy.release_blocked
          ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
          : 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200'
      }`}>
        {policy.release_blocked ? (
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        )}
        <div className="flex flex-col gap-1">
          <div className="font-bold">
            Policy Enforcement: Max Allowable AI Threshold {policy.max_allowed_ai_pct}% (Current: {aiPct}%)
          </div>
          <p className="text-[11px] opacity-90">{policy.policy_note}</p>
        </div>
      </div>
    </div>
  );
};
