import React, { useState } from 'react';
import { Network, Layers, Server, Shield, Users, Clock, Cpu, CheckCircle2 } from 'lucide-react';
import { RootCauseCluster } from '../types';

interface Props {
  clusters?: RootCauseCluster[];
  rootCauseModule?: string;
}

export const RootCauseClusteringCard: React.FC<Props> = ({ clusters, rootCauseModule }) => {
  const defaultClusters: RootCauseCluster[] = [
    { id: 'technical', category: 'Technical Causes', color: '#38bdf8', description: 'Cyclomatic complexity debt and heavy logic branching.', module_count: 4, average_risk: 72.5, top_affected_modules: ['src/core/engine.py', 'src/api/router.py'], severity: 'CRITICAL' },
    { id: 'team', category: 'Team Causes', color: '#f43f5e', description: 'Contributor concentration and author entropy imbalance.', module_count: 2, average_risk: 54.0, top_affected_modules: ['src/utils/parser.py'], severity: 'HIGH' },
    { id: 'process', category: 'Process Causes', color: '#fbbf24', description: 'High code churn rate and unverified commit pushes.', module_count: 3, average_risk: 45.0, top_affected_modules: ['src/config.py'], severity: 'MODERATE' },
    { id: 'architecture', category: 'Architecture Causes', color: '#a855f7', description: 'High dependency coupling and central graph bottlenecks.', module_count: 5, average_risk: 81.0, top_affected_modules: ['src/main.py', 'src/database.py'], severity: 'CRITICAL' },
    { id: 'security', category: 'Security Causes', color: '#ef4444', description: 'Exposed surface area, redacted secrets, and compliance alerts.', module_count: 1, average_risk: 30.0, top_affected_modules: ['src/security.py'], severity: 'MODERATE' },
    { id: 'delivery', category: 'Delivery Causes', color: '#34d399', description: 'Velocity variance, milestone shift, and scope drift.', module_count: 2, average_risk: 62.0, top_affected_modules: ['src/services/api.py'], severity: 'HIGH' },
  ];

  const activeClusters = clusters && clusters.length > 0 ? clusters : defaultClusters;
  const [selectedClusterId, setSelectedClusterId] = useState<string>(activeClusters[0]?.id || 'technical');
  const selectedCluster = activeClusters.find(c => c.id === selectedClusterId) || activeClusters[0];

  const getIcon = (cat: string) => {
    if (cat.includes('Technical')) return <Cpu className="h-4 w-4 text-cyan-400" />;
    if (cat.includes('Team')) return <Users className="h-4 w-4 text-rose-400" />;
    if (cat.includes('Process')) return <Clock className="h-4 w-4 text-amber-400" />;
    if (cat.includes('Architecture')) return <Network className="h-4 w-4 text-purple-400" />;
    if (cat.includes('Security')) return <Shield className="h-4 w-4 text-red-400" />;
    return <Server className="h-4 w-4 text-emerald-400" />;
  };

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-6 border-slate-800 bg-slate-900/40">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">🧠 ML Root-Cause Clustering</h3>
            <p className="text-xs text-slate-400">Clustered analysis across 6 failure driver categories integrated with NetworkX</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-mono font-bold text-purple-400">
          6 ML Categories
        </span>
      </div>

      {/* Cluster Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {activeClusters.map((cluster) => {
          const isSelected = cluster.id === selectedClusterId;
          return (
            <button
              key={cluster.id}
              onClick={() => setSelectedClusterId(cluster.id)}
              className={`rounded-2xl p-3 flex flex-col items-start justify-between text-left transition-all border ${
                isSelected
                  ? 'border-purple-500 bg-purple-950/40 shadow-lg shadow-purple-500/10'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                {getIcon(cluster.category)}
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: `${cluster.color}20`, color: cluster.color }}>
                  {cluster.module_count} modules
                </span>
              </div>
              <div className="mt-2 text-xs font-bold text-slate-200 line-clamp-1">{cluster.category.replace(' Causes', '')}</div>
              <div className="mt-1 text-[11px] font-mono text-slate-400">
                Avg Risk: <span className="font-bold text-slate-100">{cluster.average_risk}%</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Cluster Details Panel */}
      {selectedCluster && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              {getIcon(selectedCluster.category)}
              <h4 className="text-sm font-bold text-slate-100">{selectedCluster.category}</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold" style={{ backgroundColor: `${selectedCluster.color}25`, color: selectedCluster.color }}>
                {selectedCluster.severity} SEVERITY
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Assigned Modules: <span className="font-bold text-purple-300">{selectedCluster.module_count}</span> • Average Risk: <span className="font-bold text-rose-400">{selectedCluster.average_risk}%</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedCluster.description}
          </p>

          <div className="flex flex-col gap-2 mt-1">
            <span className="text-[11px] font-bold text-slate-400 font-mono">TOP AFFECTED MODULES IN THIS CLUSTER:</span>
            <div className="flex flex-wrap gap-2">
              {selectedCluster.top_affected_modules && selectedCluster.top_affected_modules.length > 0 ? (
                selectedCluster.top_affected_modules.map((mod, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-mono text-slate-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
                    {mod}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">Insufficient evidence available for module assignment.</span>
              )}
            </div>
          </div>

          {rootCauseModule && rootCauseModule.includes(selectedCluster.id) && (
            <div className="mt-2 rounded-xl bg-purple-950/30 border border-purple-500/30 p-3 text-xs text-purple-200 font-mono">
              ⭐ NetworkX Primary Root-Cause Module ({rootCauseModule}) is centered within this cluster.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
