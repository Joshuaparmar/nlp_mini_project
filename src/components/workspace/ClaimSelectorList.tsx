import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertOctagon,
  BrainCircuit,
  ShieldAlert
} from 'lucide-react';
import { useAudit } from '../../context/useAudit';
import type { ClaimVerdict } from '../../types/audit';

export const ClaimSelectorList: React.FC = () => {
  const { 
    currentSession, 
    selectedClaimId, 
    setSelectedClaimId, 
    claimFilter 
  } = useAudit();

  const claims = currentSession.verificationResult?.claims || [];

  const filteredClaims = claims.filter(c => {
    if (claimFilter === 'all') return true;
    if (claimFilter === 'hallucinations') return c.errorCategory === 'hallucinated_fact';
    if (claimFilter === 'reasoning_flaws') return Boolean(c.reasoningCheck?.hasLogicalFlaw || c.errorCategory === 'logical_inconsistency');
    if (claimFilter === 'safety_risks') return c.safetyRisk === 'critical' || c.safetyRisk === 'moderate' || c.errorCategory === 'unsafe_recommendation';
    return c.verdict === claimFilter;
  });

  const getVerdictIcon = (verdict: ClaimVerdict) => {
    switch (verdict) {
      case 'supported':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'refuted':
        return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
      case 'insufficient_evidence':
        return <HelpCircle className="w-3.5 h-3.5 text-amber-600" />;
      case 'ambiguous':
        return <AlertOctagon className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  const getVerdictBadge = (verdict: ClaimVerdict) => {
    switch (verdict) {
      case 'supported':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            SUPPORTED
          </span>
        );
      case 'refuted':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            REFUTED
          </span>
        );
      case 'insufficient_evidence':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            INSUFFICIENT
          </span>
        );
      case 'ambiguous':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
            AMBIGUOUS
          </span>
        );
    }
  };

  if (claims.length === 0) {
    return null;
  }

  return (
    <div className="surface-card rounded-2xl p-4 sm:p-5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xs">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border-subtle)]">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Claims Index ({filteredClaims.length} of {claims.length})
        </span>
        <span className="text-[11px] text-[var(--text-muted)]">
          Click any claim to jump & inspect
        </span>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {filteredClaims.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--text-muted)]">
            No claims matching filter "{claimFilter.replace(/_/g, ' ')}".
          </div>
        ) : (
          filteredClaims.map((claim) => {
            const isSelected = claim.id === selectedClaimId;
            const evCount = claim.supportingEvidence.length + claim.contradictingEvidence.length;

            return (
              <button
                key={claim.id}
                onClick={() => setSelectedClaimId(claim.id)}
                className={`
                  w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3
                  ${isSelected 
                    ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/40 shadow-xs' 
                    : 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] border-[var(--border-subtle)]'
                  }
                `}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] shrink-0 mt-0.5">
                    C{claim.claimNumber}
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {getVerdictBadge(claim.verdict)}
                      
                      {claim.errorCategory === 'hallucinated_fact' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                          Hallucination
                        </span>
                      )}

                      {claim.reasoningCheck?.hasLogicalFlaw && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-0.5">
                          <BrainCircuit className="w-2.5 h-2.5" />
                          <span>Logic Flaw</span>
                        </span>
                      )}

                      {claim.safetyRisk === 'critical' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 flex items-center gap-0.5 animate-pulse">
                          <ShieldAlert className="w-2.5 h-2.5" />
                          <span>Safety Alert</span>
                        </span>
                      )}

                      {evCount > 0 && (
                        <span className="text-[10px] text-[var(--text-muted)]">
                          • {evCount} citation{evCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-primary)] font-medium truncate m-0">
                      {claim.text}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  {getVerdictIcon(claim.verdict)}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
