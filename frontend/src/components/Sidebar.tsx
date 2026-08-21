import React from 'react';
import { NavLink } from 'react-router-dom';
import { UploadCloud, PlayCircle, LayoutDashboard, Settings } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { path: '/upload', label: 'Upload File', icon: UploadCloud, description: 'PDF / ZIP Security Scan' },
    { path: '/ml-running', label: 'ML Pipeline', icon: PlayCircle, description: 'Live Step Execution' },
    { path: '/dashboard', label: 'Intelligence Dashboard', icon: LayoutDashboard, description: 'Predictions & SHAP' },
    { path: '/settings', label: 'Settings', icon: Settings, description: 'Profile & WhatsApp Config' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800/80 bg-slate-950/60 backdrop-blur-md p-4 min-h-[calc(100vh-4rem)]">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3 font-mono">
        Platform Navigation
      </div>
      <nav className="flex flex-col gap-1.5 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/10 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <div className="flex flex-col">
                  <span>{item.label}</span>
                  <span className="text-[10px] text-slate-500 font-normal">{item.description}</span>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Info Badge */}
      <div className="mt-auto pt-4 border-t border-slate-800/60 px-3">
        <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>ML Engine Status</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              ONLINE
            </span>
          </div>
          <p className="text-[11px] text-slate-500">XGBoost • SHAP • NetworkX</p>
        </div>
      </div>
    </aside>
  );
};
