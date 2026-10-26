import React from 'react';

export const ClaimLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
      <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-semibold text-[11px] uppercase tracking-wider">
        <span>Verdict Colors:</span>
      </div>

      <div className="flex flex-wrap items-center gap-3.5 text-xs">
        {/* Supported / Factual */}
        <div className="flex items-center gap-1.5" title="Evidence directly corroborates the claim.">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">Supported</span>
        </div>

        {/* Refuted / Non-factual */}
        <div className="flex items-center gap-1.5" title="Evidence explicitly contradicts or refutes the claim.">
          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs" />
          <span className="font-semibold text-rose-700 dark:text-rose-400">Refuted</span>
        </div>

        {/* Insufficient Evidence */}
        <div className="flex items-center gap-1.5" title="Supplied documents do not contain enough data to verify or disprove.">
          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs" />
          <span className="font-semibold text-amber-700 dark:text-amber-400">Insufficient</span>
        </div>

        {/* Ambiguous / Conflicting */}
        <div className="flex items-center gap-1.5" title="Sources disagree or evidence contains unresolved ambiguity.">
          <span className="w-2 h-2 rounded-full bg-purple-500 shadow-xs" />
          <span className="font-semibold text-purple-700 dark:text-purple-400">Ambiguous</span>
        </div>
      </div>
    </div>
  );
};
