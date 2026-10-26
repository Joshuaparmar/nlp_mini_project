import React, { useState } from 'react';
import { 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  AlertCircle, 
  BookOpen, 
  Info,
  ChevronDown
} from 'lucide-react';
import { useAudit } from '../../context/useAudit';
import { SAMPLE_PRESETS } from '../../data/sampleAnswers';

export const AnswerEditor: React.FC = () => {
  const { currentSession, updateOriginalAnswer, clearCurrentAnswer, loadSamplePreset } = useAudit();
  const [copied, setCopied] = useState(false);
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);

  const handleCopy = () => {
    if (!currentSession.originalAnswer) return;
    navigator.clipboard.writeText(currentSession.originalAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const readingTimeMinutes = Math.ceil(currentSession.wordCount / 200);

  return (
    <div className="surface-card rounded-xl p-5 sm:p-6 flex flex-col h-full bg-white border border-slate-200">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight m-0">
              AI-Generated Output
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Paste the LLM response to be audited against source evidence documents.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sample Presets Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Load Sample</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {showPresetsDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowPresetsDropdown(false)} 
                />
                <div className="absolute right-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Preloaded Test Scenarios
                  </div>
                  {SAMPLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        loadSamplePreset(preset.id);
                        setShowPresetsDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="font-semibold text-slate-800">{preset.name}</span>
                      <span className="text-[11px] text-slate-500 line-clamp-1">{preset.description}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Copy Button */}
          {currentSession.originalAnswer && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Copy text"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          )}

          {/* Clear Button */}
          {currentSession.originalAnswer && (
            <button
              type="button"
              onClick={clearCurrentAnswer}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Clear answer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 flex flex-col mt-4 min-h-[320px]">
        <textarea
          value={currentSession.originalAnswer}
          onChange={(e) => updateOriginalAnswer(e.target.value)}
          placeholder={`Paste your AI-generated answer here...\n\nExample:\n"According to clinical studies, Empagliflozin reduces all-cause mortality by 38% in HFpEF patients, and was proven in the EMPEROR-Preserved trial enrolling 5,988 participants..."`}
          className="w-full flex-1 p-4 rounded-lg bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900 text-sm leading-relaxed resize-none transition-all placeholder:text-slate-400 font-sans"
        />

        {/* Empty State Prompt if nothing typed */}
        {!currentSession.originalAnswer && (
          <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-normal">
              <strong className="text-slate-700">Tip:</strong> Click <span className="font-semibold text-blue-600">Load Sample</span> above to instantly test with real-world medical or regulatory AI answers, or paste your custom text.
            </div>
          </div>
        )}
      </div>

      {/* Preservation & Integrity Notice */}
      <div className="mt-3 px-3 py-2 rounded-md bg-blue-50/60 border border-blue-100/80 flex items-center justify-between text-[11px] text-blue-900">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Original answer preserved verbatim for claim extraction and diff comparisons.</span>
        </div>
        <span className="font-medium text-blue-700 hidden sm:inline">Baseline Ground Truth</span>
      </div>

      {/* Footer Metrics & Validation */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Word and Character counters */}
        <div className="flex items-center gap-4 text-slate-500 font-medium">
          <span>
            <strong className="text-slate-800 font-semibold">{currentSession.wordCount}</strong> words
          </span>
          <span>
            <strong className="text-slate-800 font-semibold">{currentSession.charCount}</strong> characters
          </span>
          {currentSession.wordCount > 0 && (
            <span className="text-slate-400 hidden sm:inline">
              ~{readingTimeMinutes} min read
            </span>
          )}
        </div>

        {/* Validation Status */}
        <div>
          {currentSession.wordCount === 0 ? (
            <span className="text-slate-400 italic">No input provided</span>
          ) : currentSession.wordCount < 15 ? (
            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
              <AlertCircle className="w-3 h-3" />
              Short answer (recommend &gt; 15 words)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
              <Check className="w-3 h-3" />
              Ready for claim extraction
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
