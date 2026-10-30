import React, { useState } from 'react';
import { GitPullRequest, CheckCircle2, Copy, Check, Sparkles, FileCode, Shield } from 'lucide-react';
import { VerifiedFixPR } from '../types';

interface VerifiedFixPRCardProps {
  fixPrs?: VerifiedFixPR[];
}

export const VerifiedFixPRCard: React.FC<VerifiedFixPRCardProps> = ({ fixPrs }) => {
  const [selectedPRIndex, setSelectedPRIndex] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!fixPrs || fixPrs.length === 0) return null;

  const currentPR = fixPrs[selectedPRIndex] || fixPrs[0];

  const handleCopyDiff = (prId: string, diffText: string) => {
    navigator.clipboard.writeText(diffText);
    setCopiedId(prId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-6 border border-slate-800 bg-slate-950/60 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <GitPullRequest className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              Verified Fix PRs & Automated Patches
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                AST Syntax Validated
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic, syntax-checked automated remediation diffs with predicted risk reduction deltas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Available Patches:</span>
          <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-cyan-400">
            {fixPrs.length} PRs Generated
          </span>
        </div>
      </div>

      {/* PR Tabs */}
      <div className="flex flex-wrap gap-2">
        {fixPrs.map((pr, idx) => (
          <button
            key={pr.pr_id}
            onClick={() => setSelectedPRIndex(idx)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              selectedPRIndex === idx
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>{pr.pr_id}: {pr.target_file.split('/').pop()}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
              -{pr.risk_reduction_pct}% Risk
            </span>
          </button>
        ))}
      </div>

      {/* Selected PR Diff Details */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
              <span className="font-bold text-slate-200">{currentPR.title}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">✓ {currentPR.verification_status}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{currentPR.explanation}</p>
          </div>

          <button
            onClick={() => handleCopyDiff(currentPR.pr_id, currentPR.diff)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200 border border-slate-700 transition-all self-end sm:self-auto"
          >
            {copiedId === currentPR.pr_id ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Patch</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Unified Diff</span>
              </>
            )}
          </button>
        </div>

        {/* Code Diff Display */}
        <div className="rounded-xl bg-slate-950 p-4 border border-slate-800/80 font-mono text-xs overflow-x-auto">
          {currentPR.diff.split('\n').map((line, lIdx) => {
            const isAdd = line.startsWith('+');
            const isDel = line.startsWith('-');
            const isHeader = line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++');

            return (
              <div
                key={lIdx}
                className={`${
                  isAdd
                    ? 'bg-emerald-500/10 text-emerald-300 font-semibold'
                    : isDel
                    ? 'bg-red-500/10 text-red-300'
                    : isHeader
                    ? 'text-cyan-400 font-bold'
                    : 'text-slate-400'
                } py-0.5 px-2 rounded`}
              >
                {line}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
          <span>Commit: <code className="text-slate-300">{currentPR.commit_message}</code></span>
          <span className="text-emerald-400 font-bold">Predicted Risk Reduction: -{currentPR.risk_reduction_pct}%</span>
        </div>
      </div>
    </div>
  );
};
