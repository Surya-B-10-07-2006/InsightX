import React, { useState } from 'react';
import { GitBranch, DollarSign, Clock, AlertTriangle, ArrowRight, Layers, RefreshCw } from 'lucide-react';
import { ScopeDriftIntelligence } from '../types';

interface Props {
  scopeDrift?: ScopeDriftIntelligence;
  currentRisk?: number;
}

export const ScopeDriftCard: React.FC<Props> = ({ scopeDrift, currentRisk = 65 }) => {
  const [scopePct, setScopePct] = useState<number>(scopeDrift?.scope_change_pct || 15);

  const baseLoc = scopeDrift?.added_loc ? Math.round((scopeDrift.added_loc / (scopeDrift.scope_change_pct || 1)) * 100) : 12000;
  const addedLoc = Math.round(baseLoc * (scopePct / 100));
  const affectedModules = Math.max(1, Math.round(scopePct * 0.25));
  const effortDays = Math.round((addedLoc / 180) * 10) / 10;
  const costUsd = Math.round(effortDays * 650);
  const scheduleDelay = Math.round((effortDays * 0.45) * 10) / 10;
  const riskDelta = Math.round((scopePct * 0.8) * 10) / 10;
  const projectedRisk = Math.min(99, Math.round((currentRisk + riskDelta) * 10) / 10);

  const steps = [
    { name: 'Scope Change', value: `+${scopePct}% Expansion`, detail: `+${addedLoc} lines of code`, color: 'text-cyan-400' },
    { name: 'Affected Modules', value: `${affectedModules} Modules`, detail: 'High-coupling targets', color: 'text-purple-400' },
    { name: 'Effort Impact', value: `${effortDays} Person-Days`, detail: 'Engineering workload', color: 'text-amber-400' },
    { name: 'Cost Impact', value: `$${costUsd.toLocaleString()} USD`, detail: '@ $650 / person-day', color: 'text-emerald-400' },
    { name: 'Schedule Impact', value: `+${scheduleDelay} Days Delay`, detail: 'Milestone delivery shift', color: 'text-blue-400' },
    { name: 'Risk Change', value: `+${riskDelta} Risk Points`, detail: `New risk: ${projectedRisk}/100`, color: 'text-rose-400' },
  ];

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-6 border-slate-800 bg-slate-900/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <GitBranch className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">🔄 Scope-Drift Intelligence</h3>
            <p className="text-xs text-slate-400">Scope Change → Affected Modules → Effort → Cost → Schedule → Risk Change</p>
          </div>
        </div>

        {/* Interactive Scope Slider */}
        <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-300 font-mono">Scope Expansion:</span>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={scopePct}
            onChange={(e) => setScopePct(Number(e.target.value))}
            className="w-24 accent-cyan-400 cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-cyan-400">{scopePct}%</span>
        </div>
      </div>

      {/* 6-Step Pipeline Flow Visualization */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {steps.map((step, idx) => (
          <div key={idx} className="relative rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-500">STEP 0{idx + 1}</span>
              {idx < steps.length - 1 && (
                <ArrowRight className="h-3.5 w-3.5 text-slate-600 hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10" />
              )}
            </div>
            <div className="text-xs font-bold text-slate-300 mt-1">{step.name}</div>
            <div className={`text-sm font-extrabold font-mono ${step.color}`}>{step.value}</div>
            <div className="text-[10px] text-slate-500 font-mono">{step.detail}</div>
          </div>
        ))}
      </div>

      {/* Scope Impact Summary Alert */}
      <div className="rounded-2xl bg-cyan-950/30 border border-cyan-500/20 p-4 text-xs text-cyan-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>
            A <strong className="text-cyan-300">{scopePct}% scope expansion</strong> affects <strong className="text-purple-300">{affectedModules} modules</strong>, requiring <strong className="text-amber-300">{effortDays} person-days</strong> (${costUsd.toLocaleString()}), delaying delivery by <strong className="text-blue-300">{scheduleDelay} days</strong>, and increasing overall risk by <strong className="text-rose-300">+{riskDelta} points</strong> to <strong className="text-rose-400">{projectedRisk}/100</strong>.
          </span>
        </div>
      </div>
    </div>
  );
};
