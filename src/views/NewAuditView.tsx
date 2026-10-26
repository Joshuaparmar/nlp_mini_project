import React, { useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  CheckCircle2
} from 'lucide-react';
import { useAudit } from '../context/useAudit';
import { AnswerEditor } from '../components/workspace/AnswerEditor';
import { DocumentUploadZone } from '../components/workspace/DocumentUploadZone';
import { animatePageEntry } from '../utils/animations';

export const NewAuditView: React.FC = () => {
  const { currentSession, setScreen } = useAudit();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return animatePageEntry(containerRef.current);
  }, []);

  const hasValidAnswer = currentSession.wordCount >= 10;
  const hasReadyDocument = currentSession.documents.some(d => d.status === 'ready');
  const canProceed = hasValidAnswer && hasReadyDocument;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Page Title & Explanation Header */}
      <div className="surface-card rounded-2xl p-5 sm:p-6 border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xs">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2">
            Intake Workflow
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight m-0 font-sans">
            Provide Answer & Ground Truth PDF
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
            Enter the AI-generated text or pick a sample preset, then upload the reference document to begin claim-level verification.
          </p>
        </div>
      </div>

      {/* Main 2-Input Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Column 1: AI Generated Output */}
        <div className="h-full">
          <AnswerEditor />
        </div>

        {/* Column 2: Supporting Documents */}
        <div className="h-full">
          <DocumentUploadZone />
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-10 surface-card backdrop-blur-md rounded-xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Readiness Checklist */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium w-full sm:w-auto">
          <div className="flex items-center gap-2">
            {hasValidAnswer ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-[var(--border-strong)] shrink-0" />
            )}
            <span className={hasValidAnswer ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
              AI Answer ({currentSession.wordCount}/10 words)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasReadyDocument ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-[var(--border-strong)] shrink-0" />
            )}
            <span className={hasReadyDocument ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
              Evidence Source ({currentSession.documents.filter(d => d.status === 'ready').length} ready)
            </span>
          </div>
        </div>

        {/* Proceed Action Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {!canProceed && (
            <span className="text-xs text-[var(--text-muted)] hidden md:inline">
              Add both answer and PDF to proceed
            </span>
          )}

          <button
            onClick={() => setScreen('workspace')}
            disabled={!canProceed}
            className={`
              w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer
              ${canProceed 
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white hover:shadow-blue-500/20' 
                : 'bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-subtle)]'
              }
            `}
          >
            <span>Proceed to Audit Workspace</span>
            <ArrowRight className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      </div>
    </div>
  );
};
