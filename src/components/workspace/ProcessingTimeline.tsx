import React from 'react';
import { 
  UploadCloud, 
  FileSearch, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import type { DocumentProcessingStatus, TimelineStepKey } from '../../types/audit';

interface ProcessingTimelineProps {
  status: DocumentProcessingStatus;
  progress: number;
  errorMessage?: string;
}

export const ProcessingTimeline: React.FC<ProcessingTimelineProps> = ({ 
  status, 
  progress, 
  errorMessage 
}) => {
  const steps: { key: TimelineStepKey; label: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'uploading', label: '1. Uploading', desc: 'Sending PDF stream', icon: UploadCloud },
    { key: 'parsing', label: '2. Parsing PDF', desc: 'Layout & tables', icon: FileSearch },
    { key: 'extracting', label: '3. Extracting Evidence', desc: 'Text & metadata', icon: Layers },
    { key: 'ready', label: '4. Ready for Audit', desc: 'Evidence indexed', icon: CheckCircle2 },
  ];

  const getStepState = (stepKey: TimelineStepKey): 'done' | 'current' | 'waiting' | 'failed' => {
    if (status === 'error') {
      if (stepKey === 'uploading') return 'failed';
      return 'waiting';
    }

    if (status === 'ready') return 'done';

    if (status === 'idle') return 'waiting';

    const order: DocumentProcessingStatus[] = ['uploading', 'parsing', 'extracting', 'ready'];
    const currentIndex = order.indexOf(status);
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'current';
    return 'waiting';
  };

  return (
    <div className="w-full py-2">
      <div className="grid grid-cols-4 gap-2 relative">
        {steps.map((step) => {
          const state = getStepState(step.key);
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center text-center">
              {/* Step Icon Badge */}
              <div className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 mb-1.5
                ${state === 'done' ? 'bg-emerald-600 text-white shadow-xs' : ''}
                ${state === 'current' ? 'bg-blue-600 text-white shadow-xs ring-4 ring-blue-100' : ''}
                ${state === 'waiting' ? 'bg-slate-100 text-slate-400 border border-slate-200' : ''}
                ${state === 'failed' ? 'bg-rose-600 text-white shadow-xs' : ''}
              `}>
                {state === 'current' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : state === 'done' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : state === 'failed' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Step Label */}
              <span className={`text-[11px] font-semibold leading-tight line-clamp-1 ${
                state === 'current' ? 'text-blue-700' : 
                state === 'done' ? 'text-slate-800' : 
                state === 'failed' ? 'text-rose-700' : 'text-slate-400'
              }`}>
                {step.label}
              </span>

              {/* Step Description */}
              <span className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                {state === 'current' ? `${progress}%` : step.desc}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error message banner if failed */}
      {status === 'error' && errorMessage && (
        <div className="mt-2 p-2 rounded bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
