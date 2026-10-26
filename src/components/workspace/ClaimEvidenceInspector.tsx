import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertOctagon, 
  Copy, 
  Check, 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  ShieldAlert, 
  BrainCircuit,
  AlertTriangle,
  Scale
} from 'lucide-react';
import { useAudit } from '../../context/useAudit';
import type { EvidenceExcerpt } from '../../types/audit';

interface ClaimEvidenceInspectorProps {
  isMobileModal?: boolean;
  onCloseMobile?: () => void;
}

export const ClaimEvidenceInspector: React.FC<ClaimEvidenceInspectorProps> = ({ 
  isMobileModal, 
  onCloseMobile 
}) => {
  const { 
    currentSession, 
    selectedClaimId, 
    goToNextClaim,
    goToPrevClaim
  } = useAudit();

  const [copiedClaim, setCopiedClaim] = useState(false);
  const [copiedEvidenceId, setCopiedEvidenceId] = useState<string | null>(null);

  const claims = currentSession.verificationResult?.claims || [];
  const selectedClaim = claims.find(c => c.id === selectedClaimId) || claims[0];

  const handleCopyClaim = () => {
    if (!selectedClaim) return;
    navigator.clipboard.writeText(selectedClaim.text);
    setCopiedClaim(true);
    setTimeout(() => setCopiedClaim(false), 2000);
  };

  const handleCopyEvidence = (ev: EvidenceExcerpt) => {
    navigator.clipboard.writeText(`"${ev.text}" — Source: ${ev.source.documentName} (Page ${ev.source.pageNumber || 1})`);
    setCopiedEvidenceId(ev.id);
    setTimeout(() => setCopiedEvidenceId(null), 2000);
  };

  const currentIndex = claims.findIndex(c => c.id === selectedClaim?.id);

  if (!selectedClaim) {
    return (
      <div className="surface-card rounded-2xl p-8 border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col items-center justify-center text-center h-full text-[var(--text-muted)]">
        <FileText className="w-10 h-10 mb-3 opacity-40" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">No Claim Selected</h3>
        <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
          Select any claim in the left panel to inspect evidence passages and verification reasoning.
        </p>
      </div>
    );
  }

  const getVerdictBadge = () => {
    switch (selectedClaim.verdict) {
      case 'supported':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>SUPPORTED</span>
          </span>
        );
      case 'refuted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>REFUTED</span>
          </span>
        );
      case 'insufficient_evidence':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>INSUFFICIENT</span>
          </span>
        );
      case 'ambiguous':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>AMBIGUOUS</span>
          </span>
        );
    }
  };

  const getErrorCategoryBadge = () => {
    if (!selectedClaim.errorCategory || selectedClaim.errorCategory === 'none') return null;

    switch (selectedClaim.errorCategory) {
      case 'hallucinated_fact':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <span>Hallucination</span>
          </span>
        );
      case 'logical_inconsistency':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
            <BrainCircuit className="w-3 h-3 text-indigo-500" />
            <span>Logic Flaw</span>
          </span>
        );
      case 'unsafe_recommendation':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 animate-pulse">
            <ShieldAlert className="w-3 h-3 text-red-500" />
            <span>Safety Risk</span>
          </span>
        );
      case 'unsupported_claim':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <HelpCircle className="w-3 h-3 text-amber-500" />
            <span>Unsupported</span>
          </span>
        );
      default:
        return null;
    }
  };

  const hasSupporting = selectedClaim.supportingEvidence && selectedClaim.supportingEvidence.length > 0;
  const hasContradicting = selectedClaim.contradictingEvidence && selectedClaim.contradictingEvidence.length > 0;

  return (
    <div className={`
      surface-card rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col h-full overflow-hidden shadow-2xs
      ${isMobileModal ? 'fixed inset-4 z-50 shadow-2xl max-w-xl mx-auto my-auto max-h-[90vh]' : ''}
    `}>
      {/* 1. Header with Claim Index, Verdict, and Prev/Next */}
      <div className="p-3.5 sm:p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
            C{selectedClaim.claimNumber}
          </span>
          {getVerdictBadge()}
          {getErrorCategoryBadge()}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevClaim}
            className="p-1 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Previous claim (K)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-[var(--text-muted)] font-mono px-1">
            {currentIndex + 1}/{claims.length}
          </span>
          <button
            onClick={goToNextClaim}
            className="p-1 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Next claim (J)"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          {isMobileModal && (
            <button
              onClick={onCloseMobile}
              className="p-1 ml-1 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {/* Claim Statement Card */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] relative group">
          <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
            <span>AI Claim Statement</span>
            <button
              onClick={handleCopyClaim}
              className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              {copiedClaim ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedClaim ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)] leading-relaxed m-0 italic font-sans">
            "{selectedClaim.text}"
          </p>
        </div>

        {/* Safety Risk Alert (if present) */}
        {selectedClaim.safetyRisk && selectedClaim.safetyRisk !== 'none' && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] block text-rose-700 dark:text-rose-300">
                {selectedClaim.safetyRisk} Safety Alert
              </span>
              <p className="m-0 mt-0.5 text-xs opacity-90 leading-tight">
                Contains recommendations conflicting with primary evidence guidelines.
              </p>
            </div>
          </div>
        )}

        {/* Reasoning Consistency Check (if flawed) */}
        {selectedClaim.reasoningCheck?.hasLogicalFlaw && (
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Logic Flaw: {selectedClaim.reasoningCheck.flawType?.replace(/_/g, ' ')}</span>
            </div>
            <p className="m-0 text-xs opacity-90 leading-normal">
              {selectedClaim.reasoningCheck.explanation || 'Conclusion does not follow from the stated premises.'}
            </p>
          </div>
        )}

        {/* Evidential Justification */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
            Verification Assessment
          </span>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] m-0">
            {selectedClaim.explanation}
          </p>
        </div>

        {/* Contradicting Evidence Excerpts */}
        {hasContradicting && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>Contradicting Evidence ({selectedClaim.contradictingEvidence.length})</span>
            </span>

            {selectedClaim.contradictingEvidence.map((ev) => (
              <div 
                key={ev.id}
                className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2"
              >
                <p className="text-xs text-[var(--text-primary)] font-serif italic leading-relaxed m-0">
                  "{ev.text}"
                </p>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-rose-500/10">
                  <span className="font-medium truncate max-w-[200px]">
                    {ev.source.documentName} • p.{ev.source.pageNumber || 1}
                  </span>
                  <button
                    onClick={() => handleCopyEvidence(ev)}
                    className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    {copiedEvidenceId === ev.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedEvidenceId === ev.id ? 'Copied' : 'Cite'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Supporting Evidence Excerpts */}
        {hasSupporting && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Supporting Evidence ({selectedClaim.supportingEvidence.length})</span>
            </span>

            {selectedClaim.supportingEvidence.map((ev) => (
              <div 
                key={ev.id}
                className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2"
              >
                <p className="text-xs text-[var(--text-primary)] font-serif italic leading-relaxed m-0">
                  "{ev.text}"
                </p>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-emerald-500/10">
                  <span className="font-medium truncate max-w-[200px]">
                    {ev.source.documentName} • p.{ev.source.pageNumber || 1}
                  </span>
                  <button
                    onClick={() => handleCopyEvidence(ev)}
                    className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    {copiedEvidenceId === ev.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedEvidenceId === ev.id ? 'Copied' : 'Cite'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Insufficient Reason */}
        {selectedClaim.verdict === 'insufficient_evidence' && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold block mb-0.5">Evidence Boundary:</span>
            <p className="m-0 leading-normal opacity-90">
              {selectedClaim.insufficientReason || 'The supplied documents do not contain direct evidence to substantiate or disprove this statement.'}
            </p>
          </div>
        )}

        {/* Confidence Calibration Meter */}
        {selectedClaim.confidenceCalibration && (
          <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-[var(--text-muted)] flex items-center gap-1">
                <Scale className="w-3 h-3" />
                <span>Confidence Calibration</span>
              </span>
              <span className="font-mono font-bold text-[var(--text-primary)]">
                {Math.round(selectedClaim.confidenceCalibration.score * 100)}%
              </span>
            </div>
            <div className="w-full bg-[var(--border-subtle)] rounded-full h-1 overflow-hidden">
              <div 
                className="bg-blue-600 h-1 rounded-full"
                style={{ width: `${selectedClaim.confidenceCalibration.score * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
              <span>Range: {selectedClaim.confidenceCalibration.uncertaintyInterval[0]} - {selectedClaim.confidenceCalibration.uncertaintyInterval[1]}</span>
              <span className="capitalize">{selectedClaim.confidenceCalibration.calibrationLevel.replace(/_/g, ' ')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
