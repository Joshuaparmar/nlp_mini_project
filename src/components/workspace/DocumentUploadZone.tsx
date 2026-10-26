import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  RefreshCw, 
  Eye, 
  AlertCircle, 
  FileUp, 
  Layers
} from 'lucide-react';
import { useAudit } from '../../context/useAudit';
import type { AuditDocument } from '../../types/audit';
import { api } from '../../services/api';
import { ProcessingTimeline } from './ProcessingTimeline';
import { ExtractedTextModal } from './ExtractedTextModal';

export const DocumentUploadZone: React.FC = () => {
  const { currentSession, addDocument, updateDocument, removeDocument } = useAudit();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<AuditDocument | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);

  
  const processFile = async (file: File) => {
    setUploadError(null);

    if (
      !file.name.toLowerCase().endsWith('.pdf') &&
      file.type !== 'application/pdf'
    ) {
      setUploadError(
        `Invalid file format: "${file.name}". Only PDF documents are accepted.`
      );
      return;
    }

    if (file.size === 0) {
      setUploadError(`Empty file detected: "${file.name}" has 0 bytes.`);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadError(
        `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed is 25MB.`
      );
      return;
    }

    const docId = `doc-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 6)}`;

    const newDoc: AuditDocument = {
      id: docId,
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'application/pdf',
      uploadedAt: new Date().toISOString(),
      uploadProgress: 10,
      status: 'uploading',
      statusMessage: 'Uploading PDF to backend...',
    };

    addDocument(newDoc);

    try {
      updateDocument(docId, {
        status: 'uploading',
        uploadProgress: 25,
        statusMessage: 'Sending PDF to backend...',
      });

      // Reflect parsing while the upload request is in progress.
      updateDocument(docId, {
        status: 'parsing',
        uploadProgress: 50,
        statusMessage: 'Waiting for backend upload confirmation...',
      });

      const result = await api.uploadDocument(file, (progress) => {
        updateDocument(docId, {
          uploadProgress: Math.min(95, Math.max(50, progress)),
        });
      });

      // The upload endpoint stores the PDF. Actual evidence verification
      // happens later when the user runs the audit.
      updateDocument(docId, {
        status: 'ready',
        uploadProgress: 100,
        pageCount: result.response.pageCount,
        extractedText: result.response.extractedTextPreview,
        isSimulated: result.isSimulated,
        statusMessage: result.isSimulated
          ? 'Uploaded in preview mode'
          : 'PDF uploaded. Ready for audit verification.',
        errorMessage: undefined,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'PDF upload failed';

      updateDocument(docId, {
        status: 'error',
        uploadProgress: 0,
        errorMessage: message,
        statusMessage: 'PDF upload failed',
      });

      setUploadError(`${file.name}: ${message}`);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      processFile(files[i]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const triggerReplace = (docId: string) => {
    setReplacingDocId(docId);
    replaceInputRef.current?.click();
  };

  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && replacingDocId) {
      removeDocument(replacingDocId);
      processFile(file);
      setReplacingDocId(null);
    }
    if (e.target) e.target.value = '';
  };

  return (
    <div className="surface-card rounded-xl p-5 sm:p-6 flex flex-col h-full bg-white border border-slate-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight m-0">
              Supporting Evidence Documents
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload the source PDF documents that serve as ground truth for auditing.
          </p>
        </div>

        {/* Upload Action Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <FileUp className="w-3.5 h-3.5" />
          <span>Select PDF</span>
        </button>

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleReplaceFileChange}
        />
      </div>

      {/* Global Upload Error Alert */}
      {uploadError && (
        <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start justify-between gap-2 text-xs text-rose-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
          <button 
            onClick={() => setUploadError(null)}
            className="text-rose-500 hover:text-rose-800 font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          mt-4 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50/70 scale-[0.99]' 
            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
          }
        `}
      >
        <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3 text-blue-600">
          <UploadCloud className="w-6 h-6 stroke-[1.8]" />
        </div>
        <p className="text-sm font-semibold text-slate-800 mb-1">
          {isDragOver ? 'Drop PDF here to upload' : 'Drag & drop supporting PDF documents here'}
        </p>
        <p className="text-xs text-slate-500 mb-2">
          or <span className="text-blue-600 font-medium underline underline-offset-2">browse your computer</span>
        </p>
        <p className="text-[11px] text-slate-400">
          Supports research papers, trial reports, and contracts (PDF up to 25MB)
        </p>
      </div>

      {/* Document List Section */}
      <div className="mt-4 flex-1 flex flex-col min-h-[160px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Uploaded Sources ({currentSession.documents.length})
          </span>
          {currentSession.documents.length > 1 && (
            <span className="text-[11px] text-blue-600 font-medium">
              Multi-document synthesis ready
            </span>
          )}
        </div>

        {currentSession.documents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center rounded-lg border border-slate-100 bg-slate-50/30 text-slate-400">
            <Layers className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
            <p className="text-xs font-medium text-slate-600 mb-0.5">No evidence documents attached</p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Upload at least one PDF or load a scenario sample above to ground the AI audit.
            </p>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
            {currentSession.documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col gap-3"
              >
                {/* Document header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-800 truncate m-0 leading-tight">
                        {doc.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>{(doc.size / 1024).toFixed(1)} KB</span>
                        {doc.pageCount && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-slate-700">{doc.pageCount} pages</span>
                          </>
                        )}
                        {doc.isSimulated && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                              Client Preview
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Document Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* View Extracted Text */}
                    {doc.extractedText && (
                      <button
                        type="button"
                        onClick={() => setSelectedDocForPreview(doc)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="View extracted text"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}

                    {/* Replace Document */}
                    <button
                      type="button"
                      onClick={() => triggerReplace(doc.id)}
                      className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Replace file"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    {/* Delete Document */}
                    <button
                      type="button"
                      onClick={() => removeDocument(doc.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Processing Timeline for this document */}
                <div className="pt-2 border-t border-slate-100">
                  <ProcessingTimeline 
                    status={doc.status} 
                    progress={doc.uploadProgress} 
                    errorMessage={doc.errorMessage} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Extracted Text Viewer Modal */}
      <ExtractedTextModal
        document={selectedDocForPreview}
        onClose={() => setSelectedDocForPreview(null)}
      />
    </div>
  );
};
