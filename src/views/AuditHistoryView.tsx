import React, { useState, useEffect, useRef } from 'react';
import { 
  History, 
  Search, 
  FileText, 
  Trash2, 
  Calendar, 
  FileCheck2,
  ArrowRight
} from 'lucide-react';
import { useAudit } from '../context/useAudit';
import { animatePageEntry } from '../utils/animations';

export const AuditHistoryView: React.FC = () => {
  const { history, setScreen, loadSessionFromHistory, deleteSessionFromHistory, createNewSession } = useAudit();
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return animatePageEntry(containerRef.current);
  }, []);

  const filteredHistory = history.filter(h => 
    h.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight m-0 font-sans">
            Audit Archive & History
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Access previous answers, verified source documents, and historical session logs.
          </p>
        </div>

        <button
          onClick={() => {
            createNewSession();
            setScreen('new-audit');
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>New Audit Intake</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter audits by title or domain..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs sm:text-sm bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
        />
      </div>

      {/* History Items Grid */}
      {filteredHistory.length === 0 ? (
        <div className="surface-card rounded-2xl p-12 text-center border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col items-center justify-center">
          <History className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-60" />
          <h4 className="text-sm font-semibold text-[var(--text-primary)] m-0">No historical audits found</h4>
          <p className="text-xs text-[var(--text-muted)] mt-1">Start a new audit or change your filter search terms.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="surface-card surface-card-hover rounded-2xl p-5 border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] truncate m-0">
                    {item.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>{item.wordCount} words in answer</span>
                    <span>•</span>
                    <span>{item.documentCount} PDF source{item.documentCount !== 1 ? 's' : ''}</span>
                    {item.truthfulnessScore !== undefined && (
                      <>
                        <span>•</span>
                        <span className={`font-mono font-bold ${
                          item.truthfulnessScore >= 70 ? 'text-emerald-700' :
                          item.truthfulnessScore >= 50 ? 'text-amber-700' : 'text-rose-700'
                        }`}>
                          {item.truthfulnessScore}% Factual Grounding
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => loadSessionFromHistory(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-blue-500/15 hover:text-blue-600 dark:hover:text-blue-400 text-[var(--text-secondary)] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Open in Workspace</span>
                </button>
                <button
                  onClick={() => deleteSessionFromHistory(item.id)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Delete from history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
