import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';
import { SHAPItem } from '../types';

interface SHAPChartProps {
  data: SHAPItem[];
}

export const SHAPChart: React.FC<SHAPChartProps> = ({ data }) => {
  const formattedData = data.map((item) => ({
    name: item.feature,
    impact: item.shap_impact,
    value: item.value,
    direction: item.direction
  }));

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 120, bottom: 5 }}
        >
          <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#94a3b8"
            tick={{ fontSize: 12, fill: '#cbd5e1' }}
            width={130}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="rounded-lg bg-slate-900 border border-slate-700 p-3 shadow-xl text-xs">
                    <p className="font-bold text-slate-100">{item.name}</p>
                    <p className="text-slate-400 mt-1">Measured Value: <span className="font-mono text-cyan-400">{item.value}</span></p>
                    <p className="text-slate-400">SHAP Impact: <span className={`font-mono font-bold ${item.impact > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{item.impact > 0 ? `+${item.impact}` : item.impact}</span></p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine x={0} stroke="#475569" strokeDasharray="3 3" />
          <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
            {formattedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.impact > 0 ? '#ef4444' : '#10b981'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
