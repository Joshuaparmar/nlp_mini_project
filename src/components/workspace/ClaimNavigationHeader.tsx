import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { useAudit } from '../../context/useAudit';

export const ClaimNavigationHeader: React.FC = () => {
  const { 
    currentSession, 
    claimFilter, 
    setClaimFilter
  } = useAudit();

  const result = currentSession.verificationResult;
  const claims = result?.claims || [];
  const summary = result?.summary;

  const totalCount = claims.length;
  const supportedCount = summary?.supportedCount ?? claims.filter(c => c.verdict === 'supported').length;
  const refutedCount = summary?.refutedCount ?? claims.filter(c => c.verdict === 'refuted').length;
  const insufficientCount = summary?.insufficientCount ?? claims.filter(c => c.verdict === 'insufficient_evidence').length;
  const safetyCount = summary?.unsafeRecommendationsCount ?? claims.filter(c => c.safetyRisk === 'critical').length;
  const reasoningCount = summary?.logicalInconsistenciesCount ?? claims.filter(c => c.reasoningCheck?.hasLogicalFlaw).length;

  const groundingScore = summary?.truthfulnessScore ?? (
    totalCount > 0 ? Math.round((supportedCount / totalCount) * 100) : 0
  );

  return (
    <div className="surface-card rounded-2xl p-3.5 sm:p-4 border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Grounding Score & Summary Counts */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
              groundingScore >= 70
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                : groundingScore >= 40
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
            }`}>
              {groundingScore}% Grounded
            </div>
            <span className="text-xs text-[var(--text-muted)] font-medium hidden sm:inline">
              Factual Grounding
            </span>
          </div>

          <div className="h-4 w-px bg-[var(--border-subtle)] hidden sm:block" />

          {/* Compact Mini-Breakdown */}
          <div className="flex items-center gap-2.5 text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{supportedCount} Supported</span>
            </span>
            <span className="text-[var(--border-strong)]">•</span>
            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
              <XCircle className="w-3.5 h-3.5" />
              <span>{refutedCount} Refuted</span>
            </span>
            {insufficientCount > 0 && (
              <>
                <span className="text-[var(--border-strong)]">•</span>
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{insufficientCount} Insufficient</span>
                </span>
              </>
            )}
          </div>

          {/* Critical Alerts Pill */}
          {(safetyCount > 0 || reasoningCount > 0) && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[11px] font-semibold border border-rose-500/20">
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              <span>
                {safetyCount > 0 ? `${safetyCount} Safety Alert${safetyCount > 1 ? 's' : ''}` : `${reasoningCount} Logic Flaw`}
              </span>
            </div>
          )}
        </div>

        {/* Right: Clean Segmented Filter Bar */}
        <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-subtle)] overflow-x-auto">
          <button
            onClick={() => setClaimFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              claimFilter === 'all'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            All ({totalCount})
          </button>

          <button
            onClick={() => setClaimFilter('supported')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              claimFilter === 'supported'
                ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                : 'text-[var(--text-muted)] hover:text-emerald-600'
            }`}
          >
            Supported ({supportedCount})
          </button>

          <button
            onClick={() => setClaimFilter('refuted')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              claimFilter === 'refuted'
                ? 'bg-rose-600 text-white shadow-2xs font-semibold'
                : 'text-[var(--text-muted)] hover:text-rose-600'
            }`}
          >
            Refuted ({refutedCount})
          </button>

          {insufficientCount > 0 && (
            <button
              onClick={() => setClaimFilter('insufficient_evidence')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                claimFilter === 'insufficient_evidence'
                  ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-amber-600'
              }`}
            >
              Insufficient ({insufficientCount})
            </button>
          )}

          {safetyCount > 0 && (
            <button
              onClick={() => setClaimFilter('safety_risks')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                claimFilter === 'safety_risks'
                  ? 'bg-red-600 text-white shadow-2xs font-semibold animate-pulse'
                  : 'text-rose-600 hover:text-rose-700'
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Risks ({safetyCount})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
