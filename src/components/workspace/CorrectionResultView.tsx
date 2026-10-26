import React, { useState } from 'react';
import { Sparkles, Copy, Check, ArrowRight } from 'lucide-react';
import type { CorrectedAnswerResult } from '../../types/audit';
import { useAudit } from '../../context/useAudit';

interface Props {
  correction: CorrectedAnswerResult;
}

export const CorrectionResultView: React.FC<Props> = ({ correction }) => {
  const { setScreen } = useAudit();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(correction.correctedAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="surface-card rounded-xl p-6 bg-white border border-slate-200 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 m-0">Evidence‑Grounded Corrected Answer</h4>
            <span className="text-[11px] text-slate-500 font-medium">Gemini-generated, evidence-grounded correction</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={() => setScreen('correction')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>Full Report</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
        {correction.correctedAnswer}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/60">
          <span className="text-[10px] font-bold text-emerald-700 uppercase">Retained</span>
          <div className="text-base font-bold text-emerald-900 mt-0.5">
            {correction.retainedClaims?.length || 0} claims
          </div>
        </div>
        <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-200/60">
          <span className="text-[10px] font-bold text-rose-700 uppercase">Corrected</span>
          <div className="text-base font-bold text-rose-900 mt-0.5">
            {correction.correctedClaims?.length || 0} claims
          </div>
        </div>
        <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/60">
          <span className="text-[10px] font-bold text-amber-700 uppercase">Omitted / Qualified</span>
          <div className="text-base font-bold text-amber-900 mt-0.5">
            {correction.omittedClaims?.length || 0} claims
          </div>
        </div>
      </div>
    </div>
  );
};
