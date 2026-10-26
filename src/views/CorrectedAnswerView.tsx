import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw, 
  ExternalLink, 
  Layers, 
  SplitSquareVertical, 
  BookOpen, 
  Scale, 
  FileCheck,
  Info
} from 'lucide-react';
import { useAudit } from '../context/useAudit';
import { api } from '../services/api';
import { animatePageEntry } from '../utils/animations';

export const CorrectedAnswerView: React.FC = () => {
  const { 
    currentSession, 
    setScreen, 
    setSelectedClaimId, 
    openCorrectionModal,
    isGeneratingCorrection 
  } = useAudit();

  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [activeTab, setActiveTab] = useState<'retained' | 'corrected' | 'omitted' | 'limitations'>('corrected');
  const [viewMode, setViewMode] = useState<'side-by-side' | 'reading'>('side-by-side');

  useEffect(() => {
    return animatePageEntry(containerRef.current);
  }, []);

  const correction = currentSession.correctionResult;
  const verification = currentSession.verificationResult;
  const originalAnswer = currentSession.originalAnswer;

  const handleCopyAnswer = () => {
    if (!correction?.correctedAnswer) return;
    navigator.clipboard.writeText(correction.correctedAnswer);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  const handleExportMarkdown = () => {
    if (!verification) return;
    const reportData = {
      reportId: `rep-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      session: currentSession,
      verification,
      correction: correction || undefined,
    };
    api.downloadReport(reportData, 'markdown');
  };

  const handleExportJson = () => {
    if (!verification) return;
    const reportData = {
      reportId: `rep-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      session: currentSession,
      verification,
      correction: correction || undefined,
    };
    api.downloadReport(reportData, 'json');
  };

  const navigateToClaim = (claimNumber: number) => {
    const claim = verification?.claims.find(c => c.claimNumber === claimNumber);
    if (claim) {
      setSelectedClaimId(claim.id);
      setScreen('workspace');
    }
  };

  // If no correction result is available yet
  if (!correction) {
    return (
      <div ref={containerRef} className="space-y-6 max-w-4xl mx-auto py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-200">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">No Corrected Answer Generated Yet</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Audit verification must be completed before generating a Gemini evidence-grounded correction.
        </p>
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setScreen('workspace')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Audit Workspace</span>
          </button>
          <button
            onClick={openCorrectionModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate with Gemini</span>
          </button>
        </div>
      </div>
    );
  }

  const retainedCount = correction.retainedClaims?.length || 0;
  const correctedCount = correction.correctedClaims?.length || 0;
  const omittedCount = correction.omittedClaims?.length || 0;
  const gapsCount = correction.evidenceGaps?.length || 0;

  return (
    <div ref={containerRef} className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={() => setScreen('workspace')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Audit Workspace</span>
          </button>

          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight m-0">
              Evidence-Grounded AI Answer Correction
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              correction.isSimulated 
                ? 'bg-amber-50 text-amber-800 border-amber-200' 
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {correction.isSimulated ? 'Sample Clinical Fixture' : 'Google Gemini 1.5 Pro'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
            <span>Audit Session: <strong className="text-slate-700">{currentSession.title}</strong></span>
            <span>•</span>
            <span>{correction.wordCount} words</span>
            <span>•</span>
            <span>{new Date(correction.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openCorrectionModal}
            disabled={isGeneratingCorrection}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Re-run correction synthesis with Gemini"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Re-run Gemini</span>
          </button>

          <button
            onClick={handleCopyAnswer}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            {copiedAnswer ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedAnswer ? 'Copied!' : 'Copy Answer'}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              title="Download audit & correction report in Markdown format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export MD</span>
            </button>

            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Download structured audit report in JSON format"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Verification Simulation Disclaimer (if fixture preview) */}
      {correction.isSimulated && (
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Verified Clinical Test Fixture Displayed: </span>
            <span>
              This correction illustrates the full evidence-grounded output format using NEJM clinical trial ground truth. Live requests are routed to your backend via <code className="bg-amber-100 px-1 py-0.2 rounded font-mono text-[11px]">POST /api/audits/correct</code> using your server-side <code className="bg-amber-100 px-1 py-0.2 rounded font-mono text-[11px]">GEMINI_API_KEY</code>.
            </span>
          </div>
        </div>
      )}

      {/* SECTION A: Corrected Answer Presentation */}
      <div className="surface-card rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 m-0">Final Grounded Answer</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Evidence Verified
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Gemini-generated, evidence-grounded correction
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setViewMode(viewMode === 'side-by-side' ? 'reading' : 'side-by-side')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              {viewMode === 'side-by-side' ? <BookOpen className="w-3.5 h-3.5" /> : <SplitSquareVertical className="w-3.5 h-3.5" />}
              <span>{viewMode === 'side-by-side' ? 'Executive Reading View' : 'Side-by-Side View'}</span>
            </button>
          </div>
        </div>

        {/* Clean, Readable Answer Typography */}
        <div className="prose prose-slate max-w-none text-slate-800 text-[15px] leading-relaxed">
          {correction.correctedAnswer.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className="mb-4 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Source References Footer Tag */}
        {correction.sourceReferences?.length > 0 && (
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Ground Truth Citations:</span>
            </span>
            {correction.sourceReferences.map((ref, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">
                {ref.documentName}{ref.pageNumber ? ` (p. ${ref.pageNumber})` : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* SECTION D: Original vs. Corrected Answer Comparison */}
      {viewMode === 'side-by-side' && (
        <div className="surface-card rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <SplitSquareVertical className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 m-0">Original vs. Corrected Comparison</h3>
            </div>
            <span className="text-xs text-slate-400">Desktop split view / Mobile stacked</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Column: Original AI Answer with audit markers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
                <span>Original AI-Generated Output</span>
                <span className="text-slate-500">{currentSession.wordCount} words</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 text-sm leading-relaxed text-slate-700 space-y-3">
                {originalAnswer ? (
                  originalAnswer.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="m-0">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="text-slate-400 italic">No original answer provided.</p>
                )}
              </div>
            </div>

            {/* Right Column: Corrected Grounded Output */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 text-xs font-semibold text-emerald-800 border border-emerald-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Evidence-Grounded Correction (Gemini)</span>
                </span>
                <span className="text-emerald-700">{correction.wordCount} words</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/20 border border-emerald-200/60 text-sm leading-relaxed text-slate-900 space-y-3">
                {correction.correctedAnswer.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="m-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: Audit Changes Breakdown */}
      <div className="surface-card rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900 m-0">Claim-Level Grounding Modifications</h3>
          </div>
          
          {/* Change Type Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('corrected')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'corrected' ? 'bg-white shadow-2xs text-rose-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              <span>Corrected ({correctedCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('retained')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'retained' ? 'bg-white shadow-2xs text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Retained ({retainedCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('omitted')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'omitted' ? 'bg-white shadow-2xs text-amber-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-3 h-3 text-amber-600" />
              <span>Omitted ({omittedCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('limitations')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'limitations' ? 'bg-white shadow-2xs text-slate-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3 h-3 text-slate-500" />
              <span>Limitations ({gapsCount})</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* TAB 1: Corrected Claims */}
          {activeTab === 'corrected' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                Claims in the original output refuted by primary source evidence. Corrected using verified trial data:
              </div>
              {correction.correctedClaims?.length > 0 ? (
                <div className="space-y-4">
                  {correction.correctedClaims.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/20 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                          Claim C{item.originalClaimNumber}
                        </span>
                        <button
                          onClick={() => navigateToClaim(item.originalClaimNumber)}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Inspect Claim in Workspace</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-white border border-rose-200/60">
                          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block mb-1">
                            Original Refuted Statement
                          </span>
                          <p className="text-slate-700 m-0 line-through decoration-rose-400">
                            "{item.originalText}"
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-white border border-emerald-200/80">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                            Evidence-Grounded Replacement
                          </span>
                          <p className="text-slate-900 font-medium m-0">
                            "{item.correctedText}"
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                        <span className="text-slate-500">
                          <strong>Reason:</strong> {item.reason}
                        </span>
                        <span className="text-slate-600 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                          Citation: {item.citation}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic p-4 text-center">
                  No claims required refutation correction.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Retained Claims */}
          {activeTab === 'retained' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                Statements preserved in the final answer because supporting PDF excerpts genuinely substantiate them:
              </div>
              {correction.retainedClaims?.length > 0 ? (
                <div className="space-y-2.5">
                  {correction.retainedClaims.map((claim, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-emerald-200/70 bg-emerald-50/20 flex items-start gap-3 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1 text-slate-800 leading-relaxed font-medium">
                        {claim}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic p-4 text-center">
                  No claims were retained.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Omitted & Qualified Claims */}
          {activeTab === 'omitted' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                Statements removed or qualified because the provided PDF documents contain insufficient evidence. Lack of evidence does not prove a claim is false, but prevents unverified assertions:
              </div>
              {correction.omittedClaims?.length > 0 ? (
                <div className="space-y-3">
                  {correction.omittedClaims.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                          Claim C{item.originalClaimNumber} Omitted
                        </span>
                        <button
                          onClick={() => navigateToClaim(item.originalClaimNumber)}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Inspect in Workspace</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-slate-700 m-0 italic bg-white p-2.5 rounded-lg border border-amber-200/50">
                        "{item.originalText}"
                      </p>
                      <p className="text-amber-900 m-0 font-medium">
                        <strong>Exclusion Reason:</strong> {item.reason}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic p-4 text-center">
                  No claims were omitted due to lack of evidence.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Evidence Gaps & Material Limitations */}
          {activeTab === 'limitations' && (
            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-800 block mb-1">Identified Evidence Gaps:</span>
                {correction.evidenceGaps?.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    {correction.evidenceGaps.map((gap, idx) => (
                      <li key={idx}>{gap}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic m-0">No specific evidence gaps noted.</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="font-bold text-slate-800 block mb-1">Document Scope & Material Limitations:</span>
                <p className="text-slate-600 leading-relaxed m-0 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {correction.limitations || 'All assertions and corrections are strictly bounded by the supplied document evidence.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION C: Source Traceability Matrix */}
      <div className="surface-card rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900 m-0">Source Traceability Matrix</h3>
          </div>
          <span className="text-xs text-slate-500">Every citation maps to an actual supplied PDF</span>
        </div>

        {correction.sourceReferences?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-medium">
                  <th className="pb-2">Document Filename</th>
                  <th className="pb-2">Page Reference</th>
                  <th className="pb-2">Section</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {correction.sourceReferences.map((ref, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-2.5 font-medium text-slate-800">{ref.documentName}</td>
                    <td className="py-2.5 text-slate-600 font-mono">
                      {ref.pageNumber ? `Page ${ref.pageNumber}` : 'Full text'}
                    </td>
                    <td className="py-2.5 text-slate-600">{ref.section || 'General'}</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => setScreen('workspace')}
                        className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                      >
                        Open Workspace
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic m-0">No source citations recorded.</p>
        )}
      </div>
    </div>
  );
};
