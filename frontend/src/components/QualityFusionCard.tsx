import React from 'react';
import { Award, Shield, Cpu, Layers, Activity, CheckCircle2 } from 'lucide-react';
import { QualityFusionScore } from '../types';

interface QualityFusionCardProps {
  qualityFusion?: QualityFusionScore;
}

export const QualityFusionCard: React.FC<QualityFusionCardProps> = ({ qualityFusion }) => {
  if (!qualityFusion) return null;

  const { composite_score, grade, grade_label, dimensions, summary_radar } = qualityFusion;

  const getGradeColor = (g: string) => {
    switch (g) {
      case 'A+':
      case 'A':
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
      case 'B':
        return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
      case 'C':
        return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
      case 'D':
      case 'F':
      default:
        return 'text-red-400 border-red-500/40 bg-red-500/10';
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-5 border border-slate-800 bg-slate-950/60 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              Quality Fusion Score
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Multi-Dimensional Index
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic fusion of Maintainability (MI), Halstead Volume, Complexity, Security & Cohesion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border ${getGradeColor(grade)}`}>
            <span className="text-xl font-black font-mono">{grade}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider">{grade_label.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      {/* Main Score & Dimensional Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Composite Score Circle / Badge */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col items-center justify-center text-center gap-2">
          <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">Composite Integrity</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-5xl font-black font-mono text-cyan-400">{composite_score}</span>
            <span className="text-xs font-mono text-slate-500">/ 100</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Calibrated against AST metrics</span>
          </div>
        </div>

        {/* 5 Dimensional Breakdown */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {summary_radar.map((item, idx) => {
            const isAbove = item.score >= item.benchmark;
            return (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-semibold">{item.dimension}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px]">Benchmark: {item.benchmark}</span>
                    <span className={`font-bold ${isAbove ? 'text-cyan-400' : 'text-amber-400'}`}>
                      {item.score}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.score >= 80 ? 'bg-emerald-500' : item.score >= 60 ? 'bg-cyan-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
