import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Eye, 
  Sparkles, 
  Download, 
  FileText,
  ListFilter,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import { useAudit } from '../context/useAudit';
import { api } from '../services/api';
import { ClaimNavigationHeader } from '../components/workspace/ClaimNavigationHeader';
import { AnnotatedAnswerReader } from '../components/workspace/AnnotatedAnswerReader';
import { ClaimEvidenceInspector } from '../components/workspace/ClaimEvidenceInspector';
import { ClaimSelectorList } from '../components/workspace/ClaimSelectorList';
import { ExtractedTextModal } from '../components/workspace/ExtractedTextModal';
import { animatePageEntry } from '../utils/animations';
import { CorrectionResultView } from '../components/workspace/CorrectionResultView';
import { GenerateCorrectionModal } from '../components/workspace/GenerateCorrectionModal';

export const AuditWorkspaceView: React.FC = () => {
  const { 
    currentSession, 
    setScreen, 
    createNewSession, 
    selectedClaimId, 
    isVerifying,
    runVerification,
    openCorrectionModal,
    goToNextClaim,
    goToPrevClaim
  } = useAudit();

  const containerRef = useRef<HTMLDivElement>(null);
  const [showRawPdfModal, setShowRawPdfModal] = useState(false);
  const [isMobileInspectorOpen, setIsMobileInspectorOpen] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<'annotated' | 'list'>('annotated');

  useEffect(() => {
    return animatePageEntry(containerRef.current);
  }, []);

  // Keyboard navigation shortcuts (J = next, K = prev)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA'].includes(activeTag)) return;

      if (e.key === 'j') {
        goToNextClaim();
      } else if (e.key === 'k') {
        goToPrevClaim();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextClaim, goToPrevClaim]);

  // Auto-verify if session has inputs but no results
  useEffect(() => {
    if (
      currentSession.originalAnswer && 
      currentSession.documents.length > 0 && 
      !currentSession.verificationResult &&
      !isVerifying
    ) {
      void runVerification();
    }
  }, [currentSession.originalAnswer, currentSession.documents.length, currentSession.verificationResult, isVerifying, runVerification]);

  const activeDoc = currentSession.documents[0] || null;

  const handleDownloadReport = () => {
    if (!currentSession.verificationResult) return;
    const reportData = {
      reportId: `rep-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      session: currentSession,
      verification: currentSession.verificationResult,
      correction: currentSession.correctionResult || undefined,
    };
    api.downloadReport(reportData, 'markdown');
  };

  const claims = currentSession.verificationResult?.claims || [];
  const currentClaim = claims.find(c => c.id === selectedClaimId) || claims[0];

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Top Header & Navigation */}
      <div className="surface-card rounded-2xl p-4 sm:p-5 border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScreen('new-audit')}
              className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Intake</span>
            </button>
            <span className="text-[var(--border-strong)]">•</span>
            <span className="text-xs text-[var(--text-muted)]">
              {currentSession.documents[0]?.name || 'No document'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 mt-1">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight m-0 font-sans">
              {currentSession.title}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
              {currentSession.wordCount} words
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {activeDoc && (
            <button
              onClick={() => setShowRawPdfModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors cursor-pointer"
              title="Inspect raw extracted PDF text"
            >
              <Eye className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>View Source PDF</span>
            </button>
          )}

          {currentSession.verificationResult && (
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors cursor-pointer"
              title="Download full Markdown Audit Report"
            >
              <Download className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Export</span>
            </button>
          )}

          {currentSession.verificationResult && (
            <button
              onClick={openCorrectionModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentSession.correctionResult ? 'Re-correct with Gemini' : 'Correct with Gemini'}</span>
            </button>
          )}

          {currentSession.correctionResult && (
            <button
              onClick={() => setScreen('correction')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>View Diff</span>
            </button>
          )}

          <button
            onClick={() => {
              createNewSession();
              setScreen('new-audit');
            }}
            className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors cursor-pointer"
          >
            New Audit
          </button>
        </div>
      </div>

      {/* Claim Navigation Header (Compact & High-Signal) */}
      <ClaimNavigationHeader />

      {/* Main Split-Panel Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PANEL: The AI Answer Canvas (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-3">
          {/* View Tab Switcher: Annotated Reader vs Structured Claims List */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-subtle)]">
              <button
                onClick={() => setActiveLeftTab('annotated')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeLeftTab === 'annotated'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Annotated Text</span>
              </button>

              <button
                onClick={() => setActiveLeftTab('list')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeLeftTab === 'list'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Claims List ({claims.length})</span>
              </button>
            </div>

            <div className="text-[11px] text-[var(--text-muted)] hidden sm:block">
              Use keys <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-mono font-semibold">J</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-mono font-semibold">K</kbd> to cycle claims
            </div>
          </div>

          {/* Render selected view */}
          {activeLeftTab === 'annotated' ? (
            <AnnotatedAnswerReader />
          ) : (
            <ClaimSelectorList />
          )}
        </div>

        {/* RIGHT PANEL: Claim Evidence Inspector (5 cols on desktop) */}
        <div className="hidden lg:block lg:col-span-5 h-[680px] sticky top-20">
          <ClaimEvidenceInspector />
        </div>
      </div>

      {/* Mobile Floating Action Pill to inspect currently active claim */}
      <div className="lg:hidden fixed bottom-4 right-4 left-4 z-30">
        <button
          onClick={() => setIsMobileInspectorOpen(true)}
          className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700 text-xs font-semibold cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono bg-blue-600 px-1.5 py-0.5 rounded text-[11px]">
              C{currentClaim?.claimNumber || 1}
            </span>
            <span className="truncate max-w-[200px]">
              Inspect Evidence & Citations
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-300">
            <span>View Inspector</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Mobile Drawer/Modal for Claim Evidence Inspector */}
      {isMobileInspectorOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 lg:hidden"
          onClick={() => setIsMobileInspectorOpen(false)}
        >
          <div 
            className="w-full max-w-lg h-[85vh] bg-[var(--bg-surface)] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <ClaimEvidenceInspector 
              isMobileModal={true} 
              onCloseMobile={() => setIsMobileInspectorOpen(false)} 
            />
          </div>
        </div>
      )}

      {/* Evidence-Grounded Correction Result Preview (when generated) */}
      {currentSession.correctionResult && (
        <div className="mt-6">
          <CorrectionResultView correction={currentSession.correctionResult} />
        </div>
      )}

      {/* Raw Extracted PDF Text Modal */}
      {showRawPdfModal && (
        <ExtractedTextModal
          document={activeDoc}
          onClose={() => setShowRawPdfModal(false)}
        />
      )}

      {/* Generate Correction Modal */}
      <GenerateCorrectionModal />
    </div>
  );
};
