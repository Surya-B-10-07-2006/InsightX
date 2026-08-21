import React from 'react';
import { NetworkGraph as NetworkGraphType } from '../types';
import { GitBranch, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface NetworkGraphProps {
  data: NetworkGraphType;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ data }) => {
  if (data.total_components_analyzed === 0 || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 flex flex-col items-center justify-center text-center gap-2">
        <AlertTriangle className="h-8 w-8 text-amber-400" />
        <h4 className="text-sm font-bold text-amber-200">Insufficient Evidence for Dependency Graph</h4>
        <p className="text-xs text-slate-400">
          {data.insufficient_reason || "No parseable source code files were detected to construct a NetworkX dependency graph."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Root Cause Banner */}
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase text-red-400 font-semibold">
              Isolated Root Cause Component
            </div>
            <div className="text-base font-bold text-slate-100 font-mono">
              {data.root_cause_module}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Graph Density</div>
          <div className="text-sm font-bold font-mono text-cyan-400">{data.graph_density}</div>
        </div>
      </div>

      {/* Topology Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.nodes.map((node) => (
          <div
            key={node.id}
            className={`rounded-xl p-3.5 border transition-all flex flex-col justify-between ${
              node.is_root_cause
                ? 'bg-red-500/15 border-red-500/50 shadow-lg shadow-red-500/10 ring-1 ring-red-500/30'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-mono font-bold truncate max-w-[170px] ${node.is_root_cause ? 'text-red-300' : 'text-slate-200'}`}>
                {node.label}
              </span>
              {node.is_root_cause ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 font-bold border border-red-500/40">
                  ROOT CAUSE
                </span>
              ) : (
                <CheckCircle2 className="h-4 w-4 text-slate-600" />
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Betweenness:</span>
              <span className="text-cyan-400 font-bold">{node.betweenness}</span>
            </div>

            <div className="mt-1 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Component Risk:</span>
              <span className={`font-bold ${node.risk_score > 70 ? 'text-red-400' : node.risk_score > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {node.risk_score}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Directed Edge Links / Evidence Warning */}
      {data.edges && data.edges.length > 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
            <GitBranch className="h-4 w-4 text-cyan-400" />
            <span>Actual Inter-Module Dependency Edges ({data.edges.length} detected links)</span>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono">
            {data.edges.map((edge, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                {edge.source.split('/').pop()} → <span className="text-cyan-400">{edge.target.split('/').pop()}</span>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 flex items-center gap-2.5 text-xs text-slate-400 font-mono">
          <Info className="h-4 w-4 text-cyan-400 flex-shrink-0" />
          <span>No inter-module import dependencies were detected between files in this repository.</span>
        </div>
      )}

    </div>
  );
};
