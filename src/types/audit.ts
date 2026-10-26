// TypeScript definitions for SecondOpinion - Evidence-Grounded AI Answer Auditing

export type DocumentProcessingStatus = 
  | 'idle' 
  | 'uploading' 
  | 'parsing' 
  | 'extracting' 
  | 'ready' 
  | 'error';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  charCount: number;
}

export interface AuditDocument {
  id: string;
  file?: File;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadProgress: number; // 0 - 100
  status: DocumentProcessingStatus;
  statusMessage?: string;
  pageCount?: number;
  extractedText?: string;
  pages?: ExtractedPage[];
  errorMessage?: string;
  isSimulated?: boolean; // indicates local test simulation when backend is offline
}

export type TimelineStepKey = 'uploading' | 'parsing' | 'extracting' | 'ready';

export interface TimelineStep {
  key: TimelineStepKey;
  label: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

// ==========================================
// PHASE 2 CLAIM VERIFICATION TYPES
// ==========================================

export type ClaimVerdict = 
  | 'supported' 
  | 'refuted' 
  | 'insufficient_evidence' 
  | 'ambiguous';

export type ClaimErrorCategory = 
  | 'none'
  | 'hallucinated_fact'
  | 'unsupported_claim'
  | 'logical_inconsistency'
  | 'unsafe_recommendation';

export type SafetyRiskLevel = 
  | 'none'
  | 'low'
  | 'moderate'
  | 'critical';

export interface ReasoningCheck {
  hasLogicalFlaw: boolean;
  flawType?: 'none' | 'non_sequitur' | 'unwarranted_generalization' | 'contradictory_premises' | 'circular_reasoning';
  explanation?: string;
}

export interface ConfidenceCalibration {
  score: number; // 0.0 - 1.0
  calibrationLevel: 'high_certainty' | 'moderate_certainty' | 'tentative' | 'uncalibrated';
  uncertaintyInterval: [number, number]; // e.g. [0.91, 0.98]
  epistemicCaveat?: string;
}

export interface SourceReference {
  documentId: string;
  documentName: string;
  pageNumber?: number;
  section?: string;
  relevanceScore?: number; // 0.0 - 1.0
}

export interface EvidenceExcerpt {
  id: string;
  type: 'supporting' | 'contradicting';
  text: string;
  source: SourceReference;
  confidence?: number;
}

export interface VerifiedClaim {
  id: string;
  claimNumber: number;
  text: string;
  startOffset: number;
  endOffset: number;
  verdict: ClaimVerdict;
  errorCategory?: ClaimErrorCategory;
  safetyRisk?: SafetyRiskLevel;
  reasoningCheck?: ReasoningCheck;
  confidenceCalibration?: ConfidenceCalibration;
  explanation: string;
  confidence?: number; // 0.0 - 1.0
  supportingEvidence: EvidenceExcerpt[];
  contradictingEvidence: EvidenceExcerpt[];
  sourceReferences: SourceReference[];
  insufficientReason?: string;
  isAmbiguous?: boolean;
  ambiguityReason?: string;
}

export type OverallAuditVerdictStatus = 
  | 'passed' 
  | 'critical_issues_found' 
  | 'insufficient_evidence' 
  | 'verified_with_caveats';

export interface AuditVerificationSummary {
  totalClaims: number;
  supportedCount: number;
  refutedCount: number;
  insufficientCount: number;
  ambiguousCount: number;
  hallucinationsCount?: number;
  logicalInconsistenciesCount?: number;
  unsafeRecommendationsCount?: number;
  overallStatus: OverallAuditVerdictStatus;
  truthfulnessScore: number; // 0 - 100
  averageConfidence?: number; // 0.0 - 1.0
  durationMs?: number;
}

export interface AuditVerificationResult {
  auditId: string;
  verifiedAt: string;
  modelUsed?: string;
  claims: VerifiedClaim[];
  summary: AuditVerificationSummary;
  isSimulated?: boolean;
}

// ==========================================
// PHASE 3 REPORT & CORRECTION TYPES
// ==========================================

export interface CorrectedClaimChange {
  originalClaimNumber: number;
  originalText: string;
  correctedText: string;
  changeType: 'refuted_correction' | 'clarification' | 'ambiguity_resolution';
  citation: string;
  reason: string;
}

export interface OmittedClaimDetail {
  originalClaimNumber: number;
  originalText: string;
  reason: string;
}

export interface CorrectedAnswerResult {
  auditId: string;
  generatedAt: string;
  modelUsed?: string;
  correctedAnswer: string;
  wordCount: number;
  retainedClaims: string[];
  correctedClaims: CorrectedClaimChange[];
  omittedClaims: OmittedClaimDetail[];
  evidenceGaps: string[];
  sourceReferences: SourceReference[];
  limitations: string;
  isSimulated?: boolean;
}

export interface AuditReportData {
  reportId: string;
  generatedAt: string;
  processingDurationMs?: number;
  session: AuditSession;
  verification: AuditVerificationResult;
  correction?: CorrectedAnswerResult;
}

export type AuditSessionStatus = 
  | 'draft' 
  | 'ready_for_audit' 
  | 'auditing' 
  | 'completed' 
  | 'failed';

export interface AuditSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  originalAnswer: string;
  wordCount: number;
  charCount: number;
  documents: AuditDocument[];
  status: AuditSessionStatus;
  sampleType?: string;
  verificationResult?: AuditVerificationResult;
  correctionResult?: CorrectedAnswerResult;
  selectedClaimId?: string;
  notes?: string;
}

export interface AuditHistorySummary {
  id: string;
  title: string;
  createdAt: string;
  documentCount: number;
  wordCount: number;
  status: AuditSessionStatus;
  verifiedClaimsCount?: number;
  flaggedClaimsCount?: number;
  truthfulnessScore?: number;
  hasCorrection?: boolean;
}

// ==========================================
// BACKEND API CONTRACT SPECIFICATION
// For coordination with Backend Developer
// ==========================================

export interface BackendHealthResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  version: string;
  parserAvailable: boolean;
  provider: 'gemini' | 'unconfigured';
}

export interface UploadDocumentResponse {
  documentId: string;
  filename: string;
  sizeBytes: number;
  pageCount: number;
  status: 'parsed' | 'processing';
  extractedTextPreview?: string;
  extractedPages?: { pageNumber: number; text: string }[];
}

export interface DocumentParseStatusResponse {
  documentId: string;
  status: 'uploading' | 'parsing' | 'extracting' | 'ready' | 'error';
  progress: number;
  pageCount?: number;
  extractedText?: string;
  error?: string;
}

export interface CreateAuditRequest {
  title?: string;
  originalAnswer: string;
  documentIds: string[];
}

export interface CreateAuditResponse {
  auditId: string;
  status: 'pending' | 'in_progress';
  claimCountEstimate?: number;
}

export interface VerifyClaimsRequest {
  auditId: string;
  originalAnswer: string;
  documentIds: string[];
}

export interface VerifyClaimsResponse {
  auditId: string;
  verifiedAt: string;
  modelUsed?: string;
  claims: VerifiedClaim[];
  summary: AuditVerificationSummary;
}

// ==========================================
// PHASE 4 GEMINI-POWERED CORRECTION CONTRACT
// ==========================================

export interface CorrectAnswerRequest {
  auditId: string;
  originalAnswer: string;
  documentIds: string[];
  documents?: {
    id: string;
    name: string;
    pageCount?: number;
    extractedText?: string;
    pages?: ExtractedPage[];
  }[];
  claims: VerifiedClaim[];
}

export interface CorrectAnswerResponse {
  auditId: string;
  generatedAt: string;
  modelUsed?: string;
  correctedAnswer: string;
  wordCount: number;
  retainedClaims: string[];
  correctedClaims: CorrectedClaimChange[];
  omittedClaims: OmittedClaimDetail[];
  evidenceGaps: string[];
  sourceReferences: SourceReference[];
  limitations: string;
  isSimulated?: boolean;
}

/**
 * Snake_case schema returned by backend when using Gemini structured JSON response
 */
export interface GeminiBackendCorrectionJson {
  corrected_answer?: string;
  retained_claims?: string[];
  corrected_claims?: {
    original_claim_number?: number;
    original_text?: string;
    corrected_text?: string;
    change_type?: 'refuted_correction' | 'clarification' | 'ambiguity_resolution';
    citation?: string;
    reason?: string;
  }[];
  omitted_claims?: {
    original_claim_number?: number;
    original_text?: string;
    reason?: string;
  }[];
  evidence_gaps?: string[];
  source_references?: {
    document_id?: string;
    document_name?: string;
    page_number?: number;
    section?: string;
    relevance_score?: number;
  }[];
  limitations?: string;
  model_used?: string;
  audit_id?: string;
}

