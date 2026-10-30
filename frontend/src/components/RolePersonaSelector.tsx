import React from 'react';
import { Briefcase, Compass, ShieldAlert, Code2, Sparkles } from 'lucide-react';

export type RolePersona = 'executive' | 'architect' | 'security' | 'developer';

interface RolePersonaSelectorProps {
  activeRole: RolePersona;
  onSelectRole: (role: RolePersona) => void;
}

export const RolePersonaSelector: React.FC<RolePersonaSelectorProps> = ({
  activeRole,
  onSelectRole
}) => {
  const roles: Array<{ id: RolePersona; label: string; icon: React.FC<{ className?: string }>; description: string; badge: string }> = [
    {
      id: 'executive',
      label: 'Executive & VP Eng',
      icon: Briefcase,
      description: 'Overall risk, failure forecast, intervention ROI & delivery confidence',
      badge: 'Strategic & Financial'
    },
    {
      id: 'architect',
      label: 'Tech Lead & Architect',
      icon: Compass,
      description: 'Architecture risk index, circular cycles, modularity & Quality Fusion',
      badge: 'Structural & System'
    },
    {
      id: 'security',
      label: 'Security & Compliance',
      icon: ShieldAlert,
      description: 'Deep SAST taints, reachability, AI provenance & Policy-as-Code',
      badge: 'Zero-Trust & Policy'
    },
    {
      id: 'developer',
      label: 'Software Developer',
      icon: Code2,
      description: 'AST complexity hotspots, verified fix PRs & auto-triage backlog items',
      badge: 'Code & Remediation'
    }
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          Role-Based Intelligence Perspective:
        </span>
        <span className="text-[11px] font-mono text-cyan-400">
          Showing tailored insights for {roles.find(r => r.id === activeRole)?.label}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {roles.map((r) => {
          const Icon = r.icon;
          const isSelected = activeRole === r.id;
          return (
            <button
              key={r.id}
              onClick={() => onSelectRole(r.id)}
              className={`rounded-2xl p-4 flex flex-col text-left transition-all duration-200 border ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-500/50 shadow-lg shadow-cyan-500/10 scale-[1.02]'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800/80 text-slate-500'
                }`}>
                  {r.badge}
                </span>
              </div>

              <h4 className={`mt-3 text-xs font-extrabold ${isSelected ? 'text-slate-100' : 'text-slate-300'}`}>
                {r.label}
              </h4>
              <p className="mt-1 text-[11px] text-slate-400 leading-snug line-clamp-2">
                {r.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
