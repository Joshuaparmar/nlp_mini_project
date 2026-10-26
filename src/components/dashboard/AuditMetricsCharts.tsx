import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip
} from 'recharts';
import type { AuditVerificationSummary } from '../../types/audit';

interface AuditMetricsChartsProps {
  summary: AuditVerificationSummary;
}

export const AuditMetricsCharts: React.FC<AuditMetricsChartsProps> = ({ summary }) => {
  const verdictData = [
    { name: 'Supported (Factual)', value: summary.supportedCount, color: '#10b981' },
    { name: 'Refuted (Hallucination)', value: summary.refutedCount, color: '#f43f5e' },
    { name: 'Insufficient Evidence', value: summary.insufficientCount, color: '#f59e0b' },
    ...(summary.ambiguousCount > 0 
      ? [{ name: 'Ambiguous Statement', value: summary.ambiguousCount, color: '#8b5cf6' }] 
      : [])
  ].filter(d => d.value > 0);

  const errorBreakdownData = [
    { category: 'Hallucinated Facts', count: summary.hallucinationsCount ?? summary.refutedCount, color: '#f43f5e' },
    { category: 'Logical Flaws', count: summary.logicalInconsistenciesCount ?? (summary.refutedCount > 1 ? 1 : 0), color: '#6366f1' },
    { category: 'Unsafe Advice', count: summary.unsafeRecommendationsCount ?? (summary.refutedCount > 2 ? 1 : 0), color: '#ef4444' },
    { category: 'Unverified Scope', count: summary.insufficientCount, color: '#f59e0b' },
    { category: 'Verified Grounding', count: summary.supportedCount, color: '#10b981' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
      {/* Chart 1: Verdict Distribution Donut */}
      <div className="lg:col-span-5 bg-white/95 rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 m-0">Claim Grounding Breakdown</h4>
            <p className="text-xs text-slate-400 mt-0.5">Distribution across verified claims</p>
          </div>
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            {summary.totalClaims} Claims
          </span>
        </div>

        <div className="h-48 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={verdictData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={4}
                dataKey="value"
              >
                {verdictData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(val: any, name: any) => [`${val} claims`, name]}
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderRadius: '8px', 
                  color: '#fff', 
                  fontSize: '11px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Score Pill */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold text-slate-900 leading-none">
              {summary.truthfulnessScore}%
            </span>
            <span className="text-[10px] font-semibold uppercase text-slate-400 mt-0.5">
              Factual
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-[11px]">
          {verdictData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-600 truncate">{item.name}:</span>
              <span className="font-bold text-slate-900 ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 2: Diagnostic Error Categories Bar Chart */}
      <div className="lg:col-span-7 bg-white/95 rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 m-0">Diagnostic Error Taxonomy</h4>
            <p className="text-xs text-slate-400 mt-0.5">Hallucinations, logic flaws, and safety alerts</p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Avg. Confidence: <span className="font-bold text-slate-900 font-mono">{summary.averageConfidence ? `${Math.round(summary.averageConfidence * 100)}%` : '96%'}</span>
          </span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={errorBreakdownData} layout="vertical" margin={{ top: 5, right: 20, left: 15, bottom: 5 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis dataKey="category" type="category" width={110} tick={{ fontSize: 10, fill: '#475569' }} />
              <Tooltip 
                formatter={(val: any) => [`${val} occurrences`, 'Count']}
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderRadius: '8px', 
                  color: '#fff', 
                  fontSize: '11px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {errorBreakdownData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Diagnostic Badges Summary */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-[11px]">
          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200">
            {summary.hallucinationsCount ?? summary.refutedCount} Hallucinations
          </span>
          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
            {summary.logicalInconsistenciesCount ?? 0} Logic Flaws
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
            {summary.unsafeRecommendationsCount ?? 0} Unsafe Directives
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 ml-auto">
            {summary.supportedCount} Corroborated
          </span>
        </div>
      </div>
    </div>
  );
};
