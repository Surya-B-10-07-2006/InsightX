import React, { useState } from 'react';
import { ShieldAlert, Bug, Link2, Ghost, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import { DeepHybridSASTReport, ReachabilityReport } from '../types';

interface SASTReachabilityCardProps {
  sastAnalysis?: DeepHybridSASTReport;
  reachabilityAnalysis?: ReachabilityReport;
}

export const SASTReachabilityCard: React.FC<SASTReachabilityCardProps> = ({
  sastAnalysis,
  reachabilityAnalysis
}) => {
  const [activeTab, setActiveTab] = useState<'sast' | 'reachability'>('sast');

  if (!sastAnalysis && !reachabilityAnalysis) return null;

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-6 border border-slate-800 bg-slate-950/60 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              Deep SAST Taint & Dependency Reachability
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                Source-to-Sink Tracing
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              AST taint propagation analysis + Call-path dependency reachability and ghost baggage detection
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-900/80 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('sast')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'sast' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SAST Taints ({sastAnalysis?.total_findings || 0})
          </button>
          <button
            onClick={() => setActiveTab('reachability')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'reachability' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Reachability ({reachabilityAnalysis?.reachable_count || 0} active)
          </button>
        </div>
      </div>

      {/* SAST View */}
      {activeTab === 'sast' && sastAnalysis && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] uppercase font-mono text-slate-400">Security Score</span>
              <div className="mt-1 text-2xl font-black font-mono text-emerald-400">{sastAnalysis.security_score}%</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] uppercase font-mono text-slate-400">Critical Sinks</span>
              <div className="mt-1 text-2xl font-black font-mono text-red-400">{sastAnalysis.critical_count}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] uppercase font-mono text-slate-400">High Sinks</span>
              <div className="mt-1 text-2xl font-black font-mono text-amber-400">{sastAnalysis.high_count}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] uppercase font-mono text-slate-400">Taint Flows</span>
              <div className="mt-1 text-2xl font-black font-mono text-cyan-400">{sastAnalysis.taint_flows_detected}</div>
            </div>
          </div>

          {/* Finding Cards */}
          <div className="flex flex-col gap-3">
            {sastAnalysis.findings.length > 0 ? (
              sastAnalysis.findings.slice(0, 5).map((f) => (
                <div key={f.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{f.id}</span>
                      <span className="font-bold text-slate-200">{f.category}</span>
                      <span className="text-slate-400">({f.cwe})</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {f.severity}
                    </span>
                  </div>

                  <div className="text-xs font-mono bg-slate-950 px-3 py-2 rounded-xl border border-slate-800/80 text-slate-300 overflow-x-auto">
                    <span className="text-slate-500">{f.file}:{f.line_number} ➜ </span>
                    <span className="text-red-300 font-bold">{f.code_snippet}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-1">
                    <div><span className="text-slate-500 font-mono">Taint Flow:</span> {f.taint_source} ➜ {f.taint_sink}</div>
                    <div className="text-cyan-400"><span className="text-slate-500 font-mono">Fix:</span> {f.remediation}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center text-xs font-mono text-emerald-300 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Zero open taint propagation vulnerabilities detected in static AST sweep.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reachability View */}
      {activeTab === 'reachability' && reachabilityAnalysis && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] uppercase font-mono text-slate-400">Direct Reachable Packages</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-cyan-400">{reachabilityAnalysis.reachable_count}</span>
                <span className="text-xs text-slate-500 font-mono">({reachabilityAnalysis.reachable_percentage}%)</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Actively imported in source code</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] uppercase font-mono text-slate-400">Ghost Dependencies (Baggage)</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-amber-400">{reachabilityAnalysis.ghost_count}</span>
                <span className="text-xs text-slate-500 font-mono">({reachabilityAnalysis.ghost_percentage}%)</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Declared in manifest but never imported</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] uppercase font-mono text-slate-400">Vulnerable in Execution Path</span>
              <div className="mt-1 text-2xl font-black font-mono text-red-400">
                {reachabilityAnalysis.vulnerable_reachable_count}
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Directly exploitable call paths</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Package</th>
                  <th className="p-3">Version</th>
                  <th className="p-3">Reachability Status</th>
                  <th className="p-3">Call Depth</th>
                  <th className="p-3">CVE Exploitability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {reachabilityAnalysis.reachable_packages.concat(reachabilityAnalysis.ghost_packages).slice(0, 6).map((pkg, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 text-slate-200 font-bold">{pkg.package_name}</td>
                    <td className="p-3 text-slate-400">{pkg.version}</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        pkg.reachability_status === 'DIRECT_REACHABLE'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {pkg.reachability_status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{pkg.call_depth}</td>
                    <td className="p-3">
                      {pkg.has_known_cve ? (
                        <span className="text-red-400 font-bold">{pkg.cve_id} ({pkg.cve_severity})</span>
                      ) : (
                        <span className="text-emerald-400">CLEAN</span>
                      )}
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
