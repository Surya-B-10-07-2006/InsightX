import React from 'react';
import { InterventionROI } from '../types';
import { DollarSign, Clock, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

interface InterventionROICardProps {
  data: InterventionROI;
}

export const InterventionROICard: React.FC<InterventionROICardProps> = ({ data }) => {
  // Handle insufficient evidence from uploaded source
  if (data.is_insufficient_evidence || !data.interventions || data.interventions.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 flex flex-col items-center justify-center text-center gap-2">
        <AlertTriangle className="h-7 w-7 text-amber-400" />
        <h4 className="text-sm font-bold text-amber-200">Insufficient Evidence for ROI Calculation</h4>
        <p className="text-xs text-slate-400">
          No code hotspots were detected in the uploaded repository. Upload a source code ZIP archive with parseable files to enable Intervention ROI analysis.
        </p>
      </div>
    );
  }

  const { aggregated_impact, interventions } = data;

  return (
    <div className="flex flex-col gap-5">
      {/* Aggregated Impact Header Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Estimated Cost Savings</div>
            <div className="text-xl font-extrabold font-mono text-emerald-400">
              {typeof aggregated_impact.total_estimated_savings_usd === 'number'
                ? `$${aggregated_impact.total_estimated_savings_usd.toLocaleString()}`
                : 'Not available from analyzed data.'}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Delay Days Saved</div>
            <div className="text-xl font-extrabold font-mono text-cyan-400">
              {aggregated_impact.total_delay_days_saved} Days
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Estimated ROI Multiplier</div>
            <div className="text-xl font-extrabold font-mono text-purple-400">
              {aggregated_impact.estimated_roi_multiplier}
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Interventions List — titles bound to actual hotspot filenames */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-mono font-semibold uppercase text-slate-400 tracking-wider">
          Evidence-Based Actionable Interventions ({interventions.length} Strategies from Detected Hotspots)
        </h4>

        {interventions.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
              item.recommended
                ? 'bg-slate-900/80 border-cyan-500/30 shadow-lg shadow-cyan-500/5'
                : 'bg-slate-950/60 border-slate-800 opacity-70'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-1 p-1 rounded-full ${item.recommended ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                <CheckCircle className="h-4 w-4" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-100">{item.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {item.category}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  Effort: <span className="font-semibold text-slate-200">{item.effort_level}</span> • Est. Savings: <span className="font-semibold text-emerald-400">{typeof item.cost_savings_usd === 'number' ? `$${item.cost_savings_usd.toLocaleString()}` : 'Not available from analyzed data.'}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <div className="text-right">
                <div className="text-xs text-slate-400">Risk Reduction</div>
                <div className="text-sm font-bold font-mono text-emerald-400">-{item.risk_reduction_pct}%</div>
              </div>
              <div className="text-right pl-3 border-l border-slate-800">
                <div className="text-xs text-slate-400">Days Saved</div>
                <div className="text-sm font-bold font-mono text-cyan-400">+{item.delay_days_saved}d</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
