import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  PlusCircle, 
  ArrowRight, 
  FileText, 
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAudit } from '../context/useAudit';
import { SAMPLE_PRESETS } from '../data/sampleAnswers';
import { animatePageEntry } from '../utils/animations';
import { AuditMetricsCharts } from '../components/dashboard/AuditMetricsCharts';

export const DashboardView: React.FC = () => {
  const { setScreen, history, loadSamplePreset, createNewSession, backendHealth, currentSession } = useAudit();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    return animatePageEntry(containerRef.current);
  }, []);

  const isConnected = backendHealth?.status === 'ok';

  // Compute aggregate or active session metrics
  const activeSummary = currentSession.verificationResult?.summary || SAMPLE_PRESETS[0].verificationResult.summary;
  const claims = currentSession.verificationResult?.claims || SAMPLE_PRESETS[0].verificationResult.claims;

  const totalClaims = claims.length;
  const refutedClaims = claims.filter(c => c.verdict === 'refuted').length;
  const supportedClaims = claims.filter(c => c.verdict === 'supported').length;

  return (
    <div ref={containerRef} className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Clean, Minimal Executive Hero Header */}
      <div className="surface-card rounded-2xl p-6 sm:p-8 border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SecondOpinion • AI Auditing Platform</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] font-sans m-0">
              Audit AI Claims Against Source Evidence
            </h1>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed m-0 font-normal">
              Compare AI answers against PDF evidence. Localize fabricated claims, detect logical flaws, and generate cited corrections with Gemini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                createNewSession();
                setScreen('new-audit');
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Audit</span>
            </button>

            <button
              onClick={() => setScreen('workspace')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs sm:text-sm font-medium transition-all cursor-pointer"
            >
              <BookOpenCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Open Workspace</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Telemetry Overview (3 Essential Numbers Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="surface-card rounded-xl p-4 border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span className="font-medium uppercase tracking-wider text-[10px]">Factual Grounding</span>
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
            {activeSummary.truthfulnessScore}%
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 m-0">
            Active audit truthfulness index
          </p>
        </div>

        <div className="surface-card rounded-xl p-4 border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span className="font-medium uppercase tracking-wider text-[10px]">Claims Analyzed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
            {totalClaims} <span className="text-xs font-normal text-[var(--text-muted)] font-sans">({supportedClaims} supported)</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 m-0">
            Sentence-level claims mapped to evidence
          </p>
        </div>

        <div className="surface-card rounded-xl p-4 border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span className="font-medium uppercase tracking-wider text-[10px]">Flagged Errors</span>
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
            {refutedClaims} <span className="text-xs font-normal text-[var(--text-muted)] font-sans">refuted</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 m-0">
            Contradictions & hallucinations localized
          </p>
        </div>
      </div>

      {/* 3. One-Click Benchmark Scenarios */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)] m-0">
              Benchmark Demonstration Scenarios
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 m-0">
              Load and audit real-world evidence packages immediately.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {SAMPLE_PRESETS.map((preset) => (
            <div 
              key={preset.id}
              className="surface-card surface-card-hover rounded-xl p-4 border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:text-blue-300">
                    {preset.domain}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    {preset.documentPages}p PDF
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] m-0 leading-snug">
                  {preset.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-1.5 mb-3 line-clamp-2">
                  {preset.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[150px]">
                  {preset.documentName}
                </span>
                <button
                  onClick={() => {
                    loadSamplePreset(preset.id);
                    setScreen('workspace');
                  }}
                  className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <span>Audit</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Progressive Disclosure: Toggleable Analytics Drawer */}
      <div className="surface-card rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-2xs">
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{showCharts ? 'Hide Visual Charts & Telemetry' : 'Show Visual Breakdown & Diagnostics'}</span>
          </div>
          <span className="text-[11px] font-normal text-[var(--text-muted)]">
            {showCharts ? 'Collapse ▲' : 'Expand ▼'}
          </span>
        </button>

        {showCharts && (
          <div className="p-4 sm:p-5 border-t border-[var(--border-subtle)]">
            <AuditMetricsCharts summary={activeSummary} />
          </div>
        )}
      </div>

      {/* 5. Clean Recent Audits Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text-primary)] m-0">Recent Audits</h2>
          <button
            onClick={() => setScreen('history')}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            View all ({history.length})
          </button>
        </div>

        <div className="surface-card rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-medium">
              <tr>
                <th className="px-4 py-2.5">Audit Title</th>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Grounding</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
              {history.slice(0, 3).map((item) => (
                <tr key={item.id} className="hover:bg-[var(--bg-subtle)]/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)] flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="truncate max-w-sm">{item.title}</span>
                  </td>
                  <td className="px-3 py-3 text-[var(--text-muted)]">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3 font-mono font-bold">
                    <span className={
                      (item.truthfulnessScore || 0) >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
                      (item.truthfulnessScore || 0) >= 40 ? 'text-amber-600 dark:text-amber-400' :
                      'text-rose-600 dark:text-rose-400'
                    }>
                      {item.truthfulnessScore || 0}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        const presetId = item.title.includes('EMPEROR') ? 'clinical-empagliflozin' :
                          item.title.includes('EU AI') ? 'legal-eu-ai-act' : 'financial-nvidia-earnings';
                        loadSamplePreset(presetId);
                        setScreen('workspace');
                      }}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
