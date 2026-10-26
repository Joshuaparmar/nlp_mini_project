import { createContext } from 'react';
import type { 
  AuditSession, 
  AuditDocument, 
  AuditHistorySummary, 
  BackendHealthResponse,
  ClaimVerdict
} from '../types/audit';

export type ScreenType = 'dashboard' | 'new-audit' | 'workspace' | 'report' | 'comparison' | 'correction' | 'history' | 'settings';
export type ClaimFilterType = 'all' | ClaimVerdict | 'hallucinations' | 'reasoning_flaws' | 'safety_risks';

export interface CorrectionErrorState {
  message: string;
  status: number;
  isOffline?: boolean;
  isRateLimited?: boolean;
  details?: string;
}

export interface AuditContextType {
  currentScreen: ScreenType;
  setScreen: (screen: ScreenType) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  currentSession: AuditSession;
  history: AuditHistorySummary[];
  backendHealth: BackendHealthResponse | null;
  isCheckingBackend: boolean;
  isVerifying: boolean;
  isGeneratingCorrection: boolean;
  correctionError: CorrectionErrorState | null;
  isCorrectionModalOpen: boolean;
  openCorrectionModal: () => void;
  closeCorrectionModal: () => void;
  clearCorrectionError: () => void;
  selectedClaimId: string | null;
  setSelectedClaimId: (id: string | null) => void;
  claimFilter: ClaimFilterType;
  setClaimFilter: (filter: ClaimFilterType) => void;
  goToNextClaim: () => void;
  goToPrevClaim: () => void;
  checkBackendStatus: () => Promise<void>;
  updateOriginalAnswer: (text: string) => void;
  addDocument: (doc: AuditDocument) => void;
  updateDocument: (id: string, updates: Partial<AuditDocument>) => void;
  removeDocument: (id: string) => void;
  loadSamplePreset: (presetId: string) => void;
  clearCurrentAnswer: () => void;
  createNewSession: () => void;
  loadSessionFromHistory: (id: string) => void;
  deleteSessionFromHistory: (id: string) => void;
  runVerification: () => Promise<void>;
  generateCorrection: (options?: { forceSimulation?: boolean }) => Promise<void>;
}

export const AuditContext = createContext<AuditContextType | undefined>(undefined);
