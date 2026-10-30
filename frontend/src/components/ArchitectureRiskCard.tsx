import React from 'react';
import { GitFork, RefreshCw, AlertOctagon, Box, Compass, ArrowRight } from 'lucide-react';
import { ArchitectureRiskReport } from '../types';

interface ArchitectureRiskCardProps {
  architectureRisk?: ArchitectureRiskReport;
}

export const ArchitectureRiskCard: React.FC<ArchitectureRiskCardProps> = ({ architectureRisk }) => {
  if (!architectureRisk) return null;

  const {
    architecture_risk_index,
    architecture_health_grade,
    modularity_q_score,
    circular_cycles_count,
    circular_cycles,
    god_modules,
    zone_of_pain_modules_count,
    module_metrics_sample
  } = architectureRisk;

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-6 border border-slate-800 bg-slate-950/60 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              Architecture Risk Index & Graph Structure
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                NetworkX & Tarjan SCC
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Graph-theoretic coupling analysis, circular cycles, modularity Q-score & Martin instability metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-purple-500/10 border border-purple-500/30">
          <span className="text-xs font-mono text-purple-300">Index:</span>
          <span className="text-lg font-black font-mono text-purple-400">{architecture_risk_index}</span>
          <span className="text-xs font-mono text-slate-500">/ 100</span>
        </div>
      </div>

      {/* Top Architecture Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-mono uppercase">Health Grade</span>
          <div className="mt-2 text-sm font-bold text-slate-200">{architecture_health_grade}</div>
          <span className="text-[10px] text-slate-500 mt-1">Structural cohesion rating</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-mono uppercase">Circular Cycles</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono ${circular_cycles_count > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {circular_cycles_count}
            </span>
            <span className="text-xs text-slate-500">detected</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Cyclic import loops</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-mono uppercase">Modularity Q-Score</span>
          <div className="mt-2 text-2xl font-black font-mono text-cyan-400">{modularity_q_score}</div>
          <span className="text-[10px] text-slate-500 mt-1">1.0 = optimal isolation</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-mono uppercase">Zone of Pain</span>
          <div className="mt-2 text-2xl font-black font-mono text-amber-400">{zone_of_pain_modules_count}</div>
          <span className="text-[10px] text-slate-500 mt-1">Rigid, over-coupled modules</span>
        </div>
      </div>

      {/* Circular Cycles List if any */}
      {circular_cycles_count > 0 && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-red-300 font-mono">
            <AlertOctagon className="h-4 w-4" />
            <span>Detected Circular Dependency Loops (Acyclic Violation):</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {circular_cycles.map((cycle, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2 text-xs font-mono bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800">
                <span className="text-red-400 font-bold">Loop #{idx + 1}:</span>
                {cycle.map((node, nIdx) => (
                  <React.Fragment key={nIdx}>
                    <span className="text-slate-200">{node.split('/').pop()}</span>
                    {nIdx < cycle.length - 1 && <ArrowRight className="h-3 w-3 text-slate-500" />}
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Robert C. Martin Metrics Sample Table */}
      {module_metrics_sample && module_metrics_sample.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
            Robert C. Martin Package Metrics (Coupling & Main Sequence Distance)
          </span>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Module</th>
                  <th className="p-3">In (Ca)</th>
                  <th className="p-3">Out (Ce)</th>
                  <th className="p-3">Instability (I)</th>
                  <th className="p-3">Abstract (A)</th>
                  <th className="p-3">Distance (D)</th>
                  <th className="p-3">Zone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {module_metrics_sample.slice(0, 5).map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 text-slate-200 font-semibold truncate max-w-[200px]">{m.module}</td>
                    <td className="p-3 text-slate-400">{m.afferent_coupling_ca}</td>
                    <td className="p-3 text-slate-400">{m.efferent_coupling_ce}</td>
                    <td className="p-3 text-cyan-400">{m.instability}</td>
                    <td className="p-3 text-slate-400">{m.abstractness}</td>
                    <td className="p-3 font-bold text-amber-400">{m.distance_from_main_sequence}</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        m.architecture_zone === 'ZONE_OF_PAIN'
                          ? 'bg-red-500/20 text-red-300'
                          : m.architecture_zone === 'ZONE_OF_USELESSNESS'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {m.architecture_zone.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
