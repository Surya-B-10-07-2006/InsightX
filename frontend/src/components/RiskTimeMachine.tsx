import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TimeMachineData } from '../types';
import { Clock, ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';

interface RiskTimeMachineProps {
  data: TimeMachineData;
}

export const RiskTimeMachine: React.FC<RiskTimeMachineProps> = ({ data }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(4); // Default to day 30

  if (data.is_insufficient_evidence || !data.days || data.days.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 flex flex-col items-center justify-center text-center gap-2">
        <AlertTriangle className="h-7 w-7 text-amber-400" />
        <h4 className="text-sm font-bold text-amber-200">Insufficient Evidence for Time Machine Simulation</h4>
        <p className="text-xs text-slate-400">
          No source code metrics were extracted from the uploaded file. Upload a parseable ZIP archive to enable 7/14/30-day risk trajectory simulation.
        </p>
      </div>
    );
  }

  const chartData = data.days.map((day, idx) => ({
    day: `Day ${day}`,
    Baseline: data.scenarios.baseline[idx],
    Mitigated: data.scenarios.mitigated[idx],
    WorstCase: data.scenarios.worst_case[idx]
  }));

  const currentBaseline = data.scenarios.baseline[selectedDayIndex];
  const currentMitigated = data.scenarios.mitigated[selectedDayIndex];
  const riskDiff = Math.round((currentBaseline - currentMitigated) * 10) / 10;

  return (
    <div className="flex flex-col gap-4">
      
      {/* Slider Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">7/14/30-Day Risk Time Machine</h4>
            <p className="text-xs text-slate-400">Simulate trajectory under baseline velocity vs mitigated speed</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-mono font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-lg">
            Projection: Day {data.days[selectedDayIndex]}
          </span>
          <input
            type="range"
            min="0"
            max={data.days.length - 1}
            value={selectedDayIndex}
            onChange={(e) => setSelectedDayIndex(parseInt(e.target.value))}
            className="w-36 accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Interactive Chart */}
      <div className="w-full h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradMitigated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradBaseline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradWorst" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
            />
            <Legend />
            <Area type="monotone" dataKey="Mitigated" stroke="#10b981" fillOpacity={1} fill="url(#gradMitigated)" strokeWidth={2} />
            <Area type="monotone" dataKey="Baseline" stroke="#06b6d4" fillOpacity={1} fill="url(#gradBaseline)" strokeWidth={2} />
            <Area type="monotone" dataKey="WorstCase" stroke="#ef4444" fillOpacity={1} fill="url(#gradWorst)" strokeWidth={2} strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Projection Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-slate-300">Mitigated Day {data.days[selectedDayIndex]}</span>
          </div>
          <span className="text-sm font-bold font-mono text-emerald-400">{currentMitigated}%</span>
        </div>

        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-slate-300">Baseline Velocity</span>
          </div>
          <span className="text-sm font-bold font-mono text-cyan-400">{currentBaseline}%</span>
        </div>

        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-slate-300">Net Risk Saved</span>
          </div>
          <span className="text-sm font-bold font-mono text-purple-400">-{riskDiff}%</span>
        </div>
      </div>

    </div>
  );
};
