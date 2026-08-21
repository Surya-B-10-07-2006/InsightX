import React from 'react';
import { TrendingUp, AlertTriangle, Calendar, Layers, Activity } from 'lucide-react';
import { DefectForecast } from '../types';

interface Props {
  forecasts: DefectForecast;
}

export const DefectForecastCard: React.FC<Props> = ({ forecasts }) => {
  const days = forecasts?.days || [7, 14, 21, 30];
  const predictedDefects = forecasts?.predicted_defects || [12, 18, 25, 34];
  const predictedDelays = forecasts?.predicted_delay_days || [1.5, 3.2, 5.0, 8.4];
  const growthCurve = forecasts?.cumulative_defect_growth || [12, 20, 31, 48];
  const expectedTotal = forecasts?.expected_defects_total ?? 48;
  const highRiskAreas = forecasts?.high_risk_defect_areas || [
    { module: "src/core/engine.py", expected_defects: 14, risk_contribution: "High Complexity & Coupling", trend: "ESCALATING" },
    { module: "src/api/router.py", expected_defects: 8, risk_contribution: "Import Coupling Peak", trend: "STABLE" }
  ];
  const trendComp = forecasts?.trend_comparison || {
    current_period_defects: expectedTotal,
    previous_period_baseline: Math.round(expectedTotal * 0.85),
    defect_velocity_change_pct: 17.6,
    trend_status: "ELEVATED_DEFECT_RISK"
  };

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-6 border-slate-800 bg-slate-900/40">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">🔬 Advanced Defect Forecasting</h3>
            <p className="text-xs text-slate-400">7/14/30-Day Defect Trajectory, Growth Curve & High-Risk Areas</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-mono font-bold text-amber-400">
          Predictive Curve
        </span>
      </div>

      {/* Primary KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-xs font-medium text-slate-400">30-Day Expected Defects</div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-amber-400">{expectedTotal} defects</div>
          <div className="mt-1 text-[11px] text-slate-500">Projected across active modules</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-xs font-medium text-slate-400">30-Day Projected Delay</div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-red-400">+{predictedDelays[3] || 8.4} days</div>
          <div className="mt-1 text-[11px] text-slate-500">Schedule impact milestone shift</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-xs font-medium text-slate-400">Defect Velocity Trend</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-rose-400">+{trendComp.defect_velocity_change_pct}%</span>
            <span className="text-xs text-slate-400">vs baseline</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-300 font-mono">{trendComp.trend_status.replace(/_/g, " ")}</div>
        </div>
      </div>

      {/* 7 / 14 / 21 / 30 Day Timeline Grid */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-cyan-400" /> Time Horizon Defect Curve
          </span>
          <span className="font-mono text-slate-400 text-[11px]">Cumulative Growth Trajectory</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {days.map((day, idx) => (
            <div key={day} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400">
                <span>DAY {day}</span>
                <span className="text-amber-400">+{predictedDelays[idx]}d delay</span>
              </div>
              <div className="text-lg font-extrabold font-mono text-slate-100">
                {predictedDefects[idx]} <span className="text-xs font-normal text-slate-400">defects</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Growth: <span className="text-cyan-300">{growthCurve[idx] || predictedDefects[idx]} cum.</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* High-Risk Areas List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-rose-400" /> Top High-Risk Defect Hotspots
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Predicted Concentration</span>
        </div>

        <div className="flex flex-col gap-2">
          {highRiskAreas.map((area, idx) => (
            <div key={idx} className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-1.5 rounded-lg bg-slate-800 text-xs font-mono font-bold text-cyan-400">
                  #{idx + 1}
                </span>
                <div>
                  <div className="text-xs font-bold font-mono text-slate-200">{area.module}</div>
                  <div className="text-[10px] text-slate-400">{area.risk_contribution}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-amber-400">~{area.expected_defects} defects</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  area.trend === 'ESCALATING' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {area.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
