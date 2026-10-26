import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Copy, 
  Check, 
  Search,
  ShieldAlert
} from 'lucide-react';
import type { AuditDocument } from '../../types/audit';

interface ExtractedTextModalProps {
  document: AuditDocument | null;
  onClose: () => void;
}

export const ExtractedTextModal: React.FC<ExtractedTextModalProps> = ({ document, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!document) return null;

  const handleCopy = () => {
    if (!document.extractedText) return;
    navigator.clipboard.writeText(document.extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayText = document.extractedText || 'No text extracted from this document.';

  const filteredText = searchQuery.trim()
    ? displayText.split('\n').filter(line => line.toLowerCase().includes(searchQuery.toLowerCase())).join('\n')
    : displayText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 leading-tight m-0">
                {document.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                <span>{(document.size / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span>{document.pageCount || 1} pages</span>
                {document.isSimulated && (
                  <>
                    <span>•</span>
                    <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium text-[11px]">
                      Client Preview / Local Parser Mode
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational banner if simulated */}
        {document.isSimulated && (
          <div className="bg-amber-50/80 px-6 py-2.5 border-b border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="m-0 leading-relaxed">
              This preview reflects client-side extracted/preset evidence. In production, your teammate's backend PDF parser will parse native tables, vector coordinates, and page ranges via <code className="bg-amber-100/80 px-1 py-0.5 rounded text-[11px] font-mono">POST /api/documents/upload</code>.
            </p>
          </div>
        )}

        {/* Search & Actions Bar */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search extracted passages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>
        </div>

        {/* Text Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/40 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap selection:bg-blue-100">
          {filteredText}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
          <span>{displayText.length.toLocaleString()} total characters extracted</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
