import React from 'react';
import { Building2, ShieldCheck, Heart, AlertTriangle, Layers, ArrowUpRight } from 'lucide-react';
import { MultiProjectComparisonData, SimilarityProject } from '../types';

interface Props {
  multiProjectData?: MultiProjectComparisonData;
  similarProjects?: SimilarityProject[];
}

export const MultiProjectComparisonCard: React.FC<Props> = ({ multiProjectData, similarProjects }) => {
  const portfolioRisk = multiProjectData?.portfolio_aggregate_risk ?? 58.4;
  const portfolioGrade = multiProjectData?.portfolio_risk_grade ?? "HEALTHY";
  const portfolioCount = multiProjectData?.portfolio_projects_count ?? 5;

  const comparisonTable = multiProjectData?.project_comparison_matrix || [
    { project_id: 'p1', project_name: 'Payment Processing Service', risk_score: 78.5, failure_probability: 'Architecture Drift (High Risk)', team_health_score: 52.0, compliance_score: 75.0, hotspots_count: 3, recommended_intervention: 'Refactor Coupling' },
    { project_id: 'p2', project_name: 'Customer Portal Frontend', risk_score: 42.0, failure_probability: 'Tech Debt Surge (Moderate)', team_health_score: 82.0, compliance_score: 95.0, hotspots_count: 1, recommended_intervention: 'Maintain Pace' },
    { project_id: 'p3', project_name: 'Core Auth Infrastructure', risk_score: 64.2, failure_probability: 'API Bottleneck (High Risk)', team_health_score: 68.0, compliance_score: 88.0, hotspots_count: 2, recommended_intervention: 'Automate Tests' },
  ];

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-6 border-slate-800 bg-slate-900/40">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">🏗️ Multi-Project Portfolio Comparison</h3>
            <p className="text-xs text-slate-400">Portfolio Risk, Team Health, Failure Probabilities & Cross-Project Hotspots</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-xs font-mono font-bold text-teal-400">
          {portfolioCount} Portfolio Projects
        </span>
      </div>

      {/* Portfolio Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-xs font-medium text-slate-400">Portfolio Aggregate Risk Index</div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-teal-400">{portfolioRisk} / 100</div>
          <div className="mt-1 text-[11px] text-slate-500">Weighted cross-project average</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-xs font-medium text-slate-400">Portfolio Risk Grade</div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-emerald-400">{portfolioGrade}</div>
          <div className="mt-1 text-[11px] text-slate-500">Cross-project health status</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-xs font-medium text-slate-400">Benchmark Complexity / Coupling</div>
          <div className="mt-2 text-base font-extrabold font-mono text-slate-200">
            {multiProjectData?.current_project_complexity ?? 18.5} vs {multiProjectData?.benchmark_average_complexity ?? 22.1} avg
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Current vs benchmark repository</div>
        </div>
      </div>

      {/* Portfolio Projects Comparison Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
          <span>Portfolio Cross-Project Health & Interventions Matrix</span>
          <span className="text-[11px] text-slate-400 font-mono">MongoDB Historical Comparison</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Project Name</th>
                <th className="p-3">Risk Score</th>
                <th className="p-3">Primary Failure Mode</th>
                <th className="p-3">Team Health</th>
                <th className="p-3">Compliance</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {comparisonTable.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3 font-sans font-bold text-slate-100">{item.project_name}</td>
                  <td className="p-3">
                    <span className={`font-bold ${item.risk_score > 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {item.risk_score}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300 font-sans">{item.failure_probability}</td>
                  <td className="p-3 text-cyan-300">{item.team_health_score}%</td>
                  <td className="p-3 text-emerald-400">{item.compliance_score}%</td>
                  <td className="p-3 text-amber-300 font-sans text-[11px] font-semibold">{item.recommended_intervention}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
