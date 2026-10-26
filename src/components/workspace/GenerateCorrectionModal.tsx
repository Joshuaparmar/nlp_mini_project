import React from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  FileText, 
  ShieldCheck, 
  Loader2, 
  X, 
  Server
} from 'lucide-react';
import { useAudit } from '../../context/useAudit';

export const GenerateCorrectionModal: React.FC = () => {
  const { 
    currentSession, 
    isCorrectionModalOpen, 
    closeCorrectionModal, 
    generateCorrection, 
    isGeneratingCorrection,
    correctionError,
    clearCorrectionError,
    backendHealth
  } = useAudit();

  if (!isCorrectionModalOpen) return null;

  const claims = currentSession.verificationResult?.claims || [];
  const summary = currentSession.verificationResult?.summary;
  const docs = currentSession.documents;

  const totalClaims = claims.length;
  const supportedCount = summary?.supportedCount ?? claims.filter(c => c.verdict === 'supported').length;
  const refutedCount = summary?.refutedCount ?? claims.filter(c => c.verdict === 'refuted').length;
  const insufficientCount = summary?.insufficientCount ?? claims.filter(c => c.verdict === 'insufficient_evidence').length;
  const isBackendOnline = backendHealth?.status === 'ok';

  const handleConfirmGenerate = async () => {
    await generateCorrection({ forceSimulation: false });
  };

  const handlePreviewSampleFixture = async () => {
    await generateCorrection({ forceSimulation: true });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 m-0">Generate Corrected Answer</h3>
              <p className="text-xs text-slate-500 m-0">Powered strictly by Google Gemini via backend pipeline</p>
            </div>
          </div>
          <button 
            onClick={closeCorrectionModal}
            disabled={isGeneratingCorrection}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Audit Verification Metric Summary */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
              Completed Audit Findings Summary
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-medium text-slate-400">Total Claims</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{totalClaims}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Supported</span>
                </span>
                <div className="text-lg font-bold text-emerald-900 mt-0.5">{supportedCount}</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80">
                <span className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>Refuted</span>
                </span>
                <div className="text-lg font-bold text-rose-900 mt-0.5">{refutedCount}</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-amber-600" />
                  <span>Insufficient</span>
                </span>
                <div className="text-lg font-bold text-amber-900 mt-0.5">{insufficientCount}</div>
              </div>
            </div>
          </div>

          {/* Supporting Evidence Documents attached */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Supporting PDF Ground Truth Documents ({docs.length})</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Source Evidence</span>
            </div>
            <div className="space-y-1.5 max-h-24 overflow-y-auto">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px]">
                  <span className="truncate max-w-[280px] font-medium text-slate-800">{doc.name}</span>
                  <span className="text-slate-400 shrink-0">{doc.pageCount ? `${doc.pageCount} pages` : 'Parsed'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gemini System Instruction Summary */}
          <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/70 text-xs text-blue-900 space-y-1.5">
            <div className="font-semibold text-blue-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Evidence Grounding Protocol</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed m-0">
              Gemini will ground the corrected response strictly on supplied document excerpts and audited claim verdicts:
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
              <li><strong>Retains</strong> supported statements with preserved citations.</li>
              <li><strong>Corrects</strong> refuted statements using primary evidence from the PDF.</li>
              <li><strong>Omits/Qualifies</strong> unsupported claims without assuming they are false.</li>
              <li><strong>Discloses</strong> evidence gaps and material document limitations.</li>
            </ul>
          </div>

          {/* Honest Error State (if backend failed or returned error) */}
          {correctionError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-rose-950">
                    {correctionError.isOffline 
                      ? 'Backend Gemini Service Offline' 
                      : correctionError.isRateLimited 
                        ? 'Gemini API Rate Limit Reached' 
                        : 'Correction Service Error'}
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed m-0">
                    {correctionError.message}
                  </p>
                  {correctionError.isOffline && (
                    <div className="mt-2 p-2 bg-white/70 rounded-md border border-rose-200 font-mono text-[10px] text-slate-700">
                      Teammate Dependency: Run backend on port 8000 with <span className="font-bold text-blue-700">GEMINI_API_KEY</span>. Target endpoint: <span className="font-bold">POST /api/audits/correct</span>.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-rose-200/60 justify-end">
                <button
                  onClick={clearCorrectionError}
                  className="px-2.5 py-1 text-[11px] font-medium text-rose-700 hover:text-rose-900 cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  onClick={handlePreviewSampleFixture}
                  className="px-3 py-1 rounded-md bg-white border border-rose-300 text-[11px] font-semibold text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Preview with Verified Sample Fixture
                </button>
              </div>
            </div>
          )}

          {/* Backend Connection Indicator */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span>Target: <code className="font-mono text-slate-700">POST /api/audits/correct</code></span>
            </span>
            <span className={`inline-flex items-center gap-1 font-semibold ${isBackendOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isBackendOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{isBackendOnline ? 'Backend Online' : 'Backend Standby (Local Dev)'}</span>
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={closeCorrectionModal}
            disabled={isGeneratingCorrection}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {!isBackendOnline && (
              <button
                type="button"
                onClick={handlePreviewSampleFixture}
                disabled={isGeneratingCorrection}
                className="px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                title="Preview results using verified clinical trial sample fixture"
              >
                Preview with Sample Fixture
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirmGenerate}
              disabled={isGeneratingCorrection}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingCorrection ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Contacting Backend Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Grounded Correction</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
