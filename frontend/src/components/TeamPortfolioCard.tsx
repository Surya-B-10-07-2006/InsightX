import React, { useState } from 'react';
import { Users2, Briefcase, Lock, ShieldCheck, TrendingUp, BarChart3 } from 'lucide-react';
import { TeamGovernanceReport, PortfolioHealthReport } from '../types';

interface TeamPortfolioCardProps {
  teamGovernance?: TeamGovernanceReport;
  portfolioHealth?: PortfolioHealthReport;
}

export const TeamPortfolioCard: React.FC<TeamPortfolioCardProps> = ({
  teamGovernance,
  portfolioHealth
}) => {
  const [activeTab, setActiveTab] = useState<'team' | 'portfolio'>('team');

  if (!teamGovernance && !portfolioHealth) return null;

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-6 border border-slate-800 bg-slate-950/60 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Users2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              Privacy-Preserving Governance & Portfolio Health
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                Differential Privacy
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              K-anonymized resilience metrics (Bus factor & silo index) + Cross-repository portfolio benchmarking
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-900/80 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('team')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'team' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Team Governance (Bus Factor: {teamGovernance?.bus_factor || 1})
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'portfolio' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Portfolio Matrix ({portfolioHealth?.portfolio_projects_count || 1} Repos)
          </button>
        </div>
      </div>

      {/* Team Governance View */}
      {activeTab === 'team' && teamGovernance && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] uppercase font-mono text-slate-400">Bus Factor Resilience</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className={`text-2xl font-black font-mono ${teamGovernance.bus_factor <= 1 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {teamGovernance.bus_factor}
                </span>
                <span className="text-xs text-slate-500 font-mono">key contributor(s)</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Minimum contributors for 80% code ownership</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] uppercase font-mono text-slate-400">Knowledge Silo Index</span>
              <div className="mt-1 text-2xl font-black font-mono text-amber-400">
                {teamGovernance.knowledge_silo_index}%
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Shannon entropy isolation measure</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] uppercase font-mono text-slate-400">Sustainability Score</span>
              <div className="mt-1 text-2xl font-black font-mono text-cyan-400">
                {teamGovernance.team_sustainability_score}%
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Workload balance & resilience</span>
            </div>
          </div>

          {/* Anonymized Cohorts */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
              Anonymized Contributor Cohorts (Zero Individual Surveillance)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teamGovernance.anonymized_cohorts.map((cohort, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 font-bold text-xs font-mono">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{cohort.cohort_role}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {cohort.member_count} member(s) • {cohort.ownership_share_pct}% code share
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    cohort.burnout_exposure === 'HIGH' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {cohort.burnout_exposure} BURNOUT RISK
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Health View */}
      {activeTab === 'portfolio' && portfolioHealth && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] uppercase font-mono text-slate-400">Portfolio Aggregate Risk</span>
              <div className="mt-1 text-2xl font-black font-mono text-amber-400">
                {portfolioHealth.portfolio_aggregate_risk} / 100
              </div>
              <span className="text-[10px] text-slate-500 mt-1">{portfolioHealth.portfolio_risk_grade}</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] uppercase font-mono text-slate-400">Benchmark Avg Complexity</span>
              <div className="mt-1 text-2xl font-black font-mono text-cyan-400">
                {portfolioHealth.benchmark_average_complexity}
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Cross-project baseline</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] uppercase font-mono text-slate-400">Benchmark Avg Coupling</span>
              <div className="mt-1 text-2xl font-black font-mono text-emerald-400">
                {portfolioHealth.benchmark_average_coupling}
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Cross-project coupling index</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Project Name</th>
                  <th className="p-3">Risk Score</th>
                  <th className="p-3">Avg Complexity</th>
                  <th className="p-3">Coupling</th>
                  <th className="p-3">Benchmark Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {portfolioHealth.project_comparison_matrix.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 text-slate-200 font-bold">{p.project_name}</td>
                    <td className="p-3 font-bold text-amber-400">{p.risk_score}</td>
                    <td className="p-3 text-slate-300">{p.complexity}</td>
                    <td className="p-3 text-slate-400">{p.coupling}</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        p.status === 'ACTIVE_CURRENT'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {p.status}
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
