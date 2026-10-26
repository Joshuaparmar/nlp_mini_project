import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type {
  AuditSession,
  AuditDocument,
  AuditHistorySummary,
  BackendHealthResponse,
  AuditVerificationResult,
} from '../types/audit';
import { api } from '../services/api';
import { SAMPLE_PRESETS } from '../data/sampleAnswers';
import {
  AuditContext,
  type ScreenType,
  type ClaimFilterType,
  type CorrectionErrorState,
} from './auditContextDef';

const STORAGE_KEY_HISTORY = 'secondopinion_history_v2';
const STORAGE_KEY_CURRENT = 'secondopinion_current_session_v2';
const STORAGE_KEY_THEME = 'secondopinion_theme_v1';

export const AuditProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentScreen, setCurrentScreen] =
    useState<ScreenType>('dashboard');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isGeneratingCorrection, setIsGeneratingCorrection] =
    useState<boolean>(false);
  const [correctionError, setCorrectionError] =
    useState<CorrectionErrorState | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] =
    useState<boolean>(false);
  const [claimFilter, setClaimFilter] =
    useState<ClaimFilterType>('all');

  // Theme: light or dark.
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);

      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }

      if (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        return 'dark';
      }
    } catch {
      // Use the default theme if localStorage is unavailable.
    }

    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);

      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch {
      // Ignore theme persistence errors.
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((previousTheme) =>
      previousTheme === 'light' ? 'dark' : 'light'
    );
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  // Restore the current session or initialize the default sample session.
  const [currentSession, setCurrentSession] = useState<AuditSession>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT);

      if (saved) {
        return JSON.parse(saved) as AuditSession;
      }
    } catch {
      // Initialize a default session if saved data is invalid.
    }

    const defaultPreset = SAMPLE_PRESETS[0];
    const words = defaultPreset.originalAnswer.trim()
      ? defaultPreset.originalAnswer.trim().split(/\s+/).length
      : 0;

    return {
      id: 'session-demo-emp',
      title: defaultPreset.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      originalAnswer: defaultPreset.originalAnswer,
      wordCount: words,
      charCount: defaultPreset.originalAnswer.length,
      documents: [
        {
          id: 'doc-sample-1',
          name: defaultPreset.documentName,
          size: defaultPreset.documentSize,
          type: 'application/pdf',
          uploadedAt: new Date().toISOString(),
          uploadProgress: 100,
          status: 'ready',
          statusMessage: 'Ready for audit verification',
          pageCount: defaultPreset.documentPages,
          extractedText: defaultPreset.extractedText,
          pages: [
            {
              pageNumber: 1,
              text: defaultPreset.extractedText.slice(0, 400),
              charCount: defaultPreset.extractedText.slice(0, 400).length,
            },
            {
              pageNumber: 2,
              text: defaultPreset.extractedText.slice(400, 1000),
              charCount: defaultPreset.extractedText.slice(400, 1000).length,
            },
          ],
          isSimulated: true,
        },
      ],
      status: 'completed',
      sampleType: defaultPreset.domain,
      verificationResult: defaultPreset.verificationResult,
      correctionResult: defaultPreset.correctionResult,
      selectedClaimId: defaultPreset.verificationResult.claims[0]?.id,
    };
  });

  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(
    () => currentSession.verificationResult?.claims[0]?.id ?? null
  );

  // Restore audit history.
  const [history, setHistory] = useState<AuditHistorySummary[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);

      if (saved) {
        return JSON.parse(saved) as AuditHistorySummary[];
      }
    } catch {
      // Use the initial sample history if saved data is invalid.
    }

    return [
      {
        id: 'hist-clinical-1',
        title: 'EMPEROR-Preserved HFpEF Clinical Audit',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        documentCount: 1,
        wordCount: 172,
        status: 'completed',
        verifiedClaimsCount: 6,
        flaggedClaimsCount: 3,
        truthfulnessScore: 33,
        hasCorrection: true,
      },
      {
        id: 'hist-regulatory-2',
        title: 'EU AI Act High-Risk Requirements Audit',
        createdAt: new Date(Date.now() - 3600000 * 16).toISOString(),
        documentCount: 1,
        wordCount: 114,
        status: 'completed',
        verifiedClaimsCount: 5,
        flaggedClaimsCount: 1,
        truthfulnessScore: 60,
        hasCorrection: true,
      },
      {
        id: 'hist-demo-3',
        title: 'NVIDIA Q3 FY25 SEC 10-Q Financial Audit',
        createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
        documentCount: 1,
        wordCount: 145,
        status: 'completed',
        verifiedClaimsCount: 5,
        flaggedClaimsCount: 3,
        truthfulnessScore: 40,
        hasCorrection: true,
      },
    ];
  });

  const [backendHealth, setBackendHealth] =
    useState<BackendHealthResponse | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] =
    useState<boolean>(false);

  // Check the backend when requested.
  const checkBackendStatus = useCallback(async () => {
    setIsCheckingBackend(true);

    try {
      const health = await api.checkHealth();
      setBackendHealth(health);
    } catch {
      setBackendHealth({
        status: 'error',
        service: 'secondopinion-backend',
        version: '0.1.0',
        parserAvailable: false,
        provider: 'unconfigured',
      });
    } finally {
      setIsCheckingBackend(false);
    }
  }, []);

  // Automatically check backend health on mount.
  useEffect(() => {
    let isMounted = true;

    api
      .checkHealth()
      .then((health) => {
        if (isMounted) {
          setBackendHealth(health);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBackendHealth({
            status: 'error',
            service: 'secondopinion-backend',
            version: '0.1.0',
            parserAvailable: false,
            provider: 'unconfigured',
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Persist the current session.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_CURRENT,
        JSON.stringify(currentSession)
      );
    } catch {
      // Ignore persistence errors.
    }
  }, [currentSession]);

  // Persist audit history.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch {
      // Ignore persistence errors.
    }
  }, [history]);

  const updateOriginalAnswer = (text: string) => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;

    setCurrentSession((previousSession) => ({
      ...previousSession,
      originalAnswer: text,
      wordCount: words,
      charCount: text.length,
      updatedAt: new Date().toISOString(),
      title:
        previousSession.title === 'Untitled Audit' && words > 3
          ? `${trimmed.slice(0, 48)}...`
          : previousSession.title,
      status:
        previousSession.documents.some(
          (document) => document.status === 'ready'
        ) && words > 10
          ? previousSession.verificationResult
            ? 'completed'
            : 'ready_for_audit'
          : 'draft',
    }));
  };

  const addDocument = (document: AuditDocument) => {
    setCurrentSession((previousSession) => {
      const updatedDocuments = [
        ...previousSession.documents,
        document,
      ];

      return {
        ...previousSession,
        documents: updatedDocuments,
        updatedAt: new Date().toISOString(),
        status:
          updatedDocuments.some((item) => item.status === 'ready') &&
          previousSession.wordCount > 10
            ? previousSession.verificationResult
              ? 'completed'
              : 'ready_for_audit'
            : previousSession.status,
      };
    });
  };

  const updateDocument = (
    id: string,
    updates: Partial<AuditDocument>
  ) => {
    setCurrentSession((previousSession) => {
      const updatedDocuments = previousSession.documents.map(
        (document) =>
          document.id === id
            ? { ...document, ...updates }
            : document
      );

      return {
        ...previousSession,
        documents: updatedDocuments,
        updatedAt: new Date().toISOString(),
        status:
          updatedDocuments.some((document) => document.status === 'ready') &&
          previousSession.wordCount > 10
            ? previousSession.verificationResult
              ? 'completed'
              : 'ready_for_audit'
            : previousSession.status,
      };
    });
  };

  const removeDocument = (id: string) => {
    setCurrentSession((previousSession) => {
      const updatedDocuments = previousSession.documents.filter(
        (document) => document.id !== id
      );

      return {
        ...previousSession,
        documents: updatedDocuments,
        updatedAt: new Date().toISOString(),
        status:
          updatedDocuments.some((document) => document.status === 'ready') &&
          previousSession.wordCount > 10
            ? previousSession.status
            : 'draft',
      };
    });
  };

  const loadSamplePreset = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find((item) => item.id === presetId);

    if (!preset) {
      return;
    }

    const words = preset.originalAnswer.trim()
      ? preset.originalAnswer.trim().split(/\s+/).length
      : 0;
    const chars = preset.originalAnswer.length;
    const now = new Date().toISOString();

    const sampleDocument: AuditDocument = {
      id: `doc-sample-${Date.now()}`,
      name: preset.documentName,
      size: preset.documentSize,
      type: 'application/pdf',
      uploadedAt: now,
      uploadProgress: 100,
      status: 'ready',
      statusMessage: 'Ready for audit verification',
      pageCount: preset.documentPages,
      extractedText: preset.extractedText,
      pages: [
        {
          pageNumber: 1,
          text: preset.extractedText.slice(0, 400),
          charCount: preset.extractedText.slice(0, 400).length,
        },
        {
          pageNumber: 2,
          text: preset.extractedText.slice(400, 1000),
          charCount: preset.extractedText.slice(400, 1000).length,
        },
      ],
      isSimulated: true,
    };

    const firstClaimId =
      preset.verificationResult.claims[0]?.id ?? null;

    const newSession: AuditSession = {
      id: `session-${Date.now()}`,
      title: preset.name,
      createdAt: now,
      updatedAt: now,
      originalAnswer: preset.originalAnswer,
      wordCount: words,
      charCount: chars,
      documents: [sampleDocument],
      status: 'completed',
      sampleType: preset.domain,
      verificationResult: preset.verificationResult,
      correctionResult: preset.correctionResult,
      selectedClaimId: firstClaimId ?? undefined,
    };

    setCurrentSession(newSession);
    setSelectedClaimId(firstClaimId);
    setCorrectionError(null);

    const historyEntry: AuditHistorySummary = {
      id: newSession.id,
      title: newSession.title,
      createdAt: newSession.createdAt,
      documentCount: 1,
      wordCount: words,
      status: 'completed',
      verifiedClaimsCount: preset.verificationResult.summary.totalClaims,
      flaggedClaimsCount: preset.verificationResult.summary.refutedCount,
      truthfulnessScore: preset.verificationResult.summary.truthfulnessScore,
      hasCorrection: Boolean(preset.correctionResult),
    };

    setHistory((previousHistory) => {
      const filteredHistory = previousHistory.filter(
        (item) => item.id !== newSession.id
      );

      return [historyEntry, ...filteredHistory].slice(0, 20);
    });
  };

  const clearCurrentAnswer = () => {
    setCurrentSession((previousSession) => ({
      ...previousSession,
      originalAnswer: '',
      wordCount: 0,
      charCount: 0,
      status: 'draft',
      updatedAt: new Date().toISOString(),
      verificationResult: undefined,
      correctionResult: undefined,
    }));

    setSelectedClaimId(null);
    setCorrectionError(null);
  };

  const createNewSession = () => {
    const now = new Date().toISOString();

    const newSession: AuditSession = {
      id: `session-${Date.now()}`,
      title: 'Untitled Audit',
      createdAt: now,
      updatedAt: now,
      originalAnswer: '',
      wordCount: 0,
      charCount: 0,
      documents: [],
      status: 'draft',
    };

    setCurrentSession(newSession);
    setSelectedClaimId(null);
    setCorrectionError(null);
    setCurrentScreen('new-audit');
  };

  // Open a history item. Full details are available for the current
  // saved session and for matching sample presets.
  const loadSessionFromHistory = (id: string) => {
    setCorrectionError(null);

    if (currentSession.id === id) {
      setSelectedClaimId(
        currentSession.verificationResult?.claims[0]?.id ?? null
      );
      setCurrentScreen('dashboard');
      return;
    }

    const historyItem = history.find((item) => item.id === id);

    if (!historyItem) {
      setCorrectionError({
        message: 'This audit could not be found in your history.',
        status: 404,
        isOffline: false,
        isRateLimited: false,
      });
      return;
    }

    const matchingPreset = SAMPLE_PRESETS.find(
      (preset) => preset.name === historyItem.title
    );

    if (matchingPreset) {
      loadSamplePreset(matchingPreset.id);
      setCurrentScreen('dashboard');
      return;
    }

    setCorrectionError({
      message:
        'This history entry contains summary information only. Its full answer, documents, and verification results are not saved, so it cannot be reopened.',
      status: 404,
      isOffline: false,
      isRateLimited: false,
    });
  };

  const deleteSessionFromHistory = (id: string) => {
    setHistory((previousHistory) =>
      previousHistory.filter((item) => item.id !== id)
    );
  };

  const openCorrectionModal = () => {
    setCorrectionError(null);
    setIsCorrectionModalOpen(true);
  };

  const closeCorrectionModal = () => {
    setIsCorrectionModalOpen(false);
  };

  const clearCorrectionError = () => {
    setCorrectionError(null);
  };

  const generateCorrection = async (options?: {
    forceSimulation?: boolean;
  }) => {
    if (
      !currentSession.originalAnswer ||
      !currentSession.verificationResult
    ) {
      setCorrectionError({
        message: 'Verify the answer before generating a correction.',
        status: 400,
        isOffline: false,
        isRateLimited: false,
      });
      return;
    }

    setCorrectionError(null);

    if (options?.forceSimulation) {
      const fixture = api.getSampleFixtureCorrection(
        currentSession.originalAnswer,
        currentSession.id
      );

      setCurrentSession((previousSession) => ({
        ...previousSession,
        correctionResult: fixture,
        updatedAt: new Date().toISOString(),
      }));

      setIsCorrectionModalOpen(false);
      setCurrentScreen('correction');
      return;
    }

    setIsGeneratingCorrection(true);

    try {
      const correctionResult = await api.correctAnswer(
        currentSession.id,
        currentSession.originalAnswer,
        currentSession.documents,
        currentSession.verificationResult.claims
      );

      setCurrentSession((previousSession) => ({
        ...previousSession,
        correctionResult,
        updatedAt: new Date().toISOString(),
      }));

      setIsCorrectionModalOpen(false);
      setCurrentScreen('correction');
    } catch (error: unknown) {
      const err = error as {
        status?: number;
        message?: string;
        details?: unknown;
      };

      const status = err?.status ?? 500;
      const message =
        err?.message ??
        'Failed to generate an evidence-grounded correction.';

      setCorrectionError({
        message,
        status,
        isOffline:
          status === 0 ||
          message.toLowerCase().includes('fetch') ||
          message.toLowerCase().includes('network'),
        isRateLimited: status === 429,
        details:
          err?.details != null ? String(err.details) : undefined,
      });
    } finally {
      setIsGeneratingCorrection(false);
    }
  };

  // Verify the answer using the FastAPI backend.
  const runVerification = async () => {
    if (!currentSession.originalAnswer.trim()) {
      setCorrectionError({
        message: 'Please enter an answer before verifying.',
        status: 400,
        isOffline: false,
        isRateLimited: false,
      });
      return;
    }

    const hasUploadedFile = currentSession.documents.some(
      (document) => document.file instanceof File
    );

    if (!hasUploadedFile) {
      setCorrectionError({
        message:
          'Please upload a PDF file. Sample documents cannot be sent to the backend as uploaded files.',
        status: 400,
        isOffline: false,
        isRateLimited: false,
      });
      return;
    }

    setIsVerifying(true);
    setCorrectionError(null);

    try {
      const result: AuditVerificationResult = await api.verifyClaims(
        currentSession.id,
        currentSession.originalAnswer,
        currentSession.documents
      );

      const firstClaimId = result.claims[0]?.id ?? null;
      const updatedAt = new Date().toISOString();

      setCurrentSession((previousSession) => ({
        ...previousSession,
        verificationResult: result,
        correctionResult: undefined,
        selectedClaimId: firstClaimId ?? undefined,
        status: 'completed',
        updatedAt,
      }));

      setSelectedClaimId(firstClaimId);

      setHistory((previousHistory) => {
        const updatedEntry: AuditHistorySummary = {
          id: currentSession.id,
          title: currentSession.title,
          createdAt: currentSession.createdAt,
          documentCount: currentSession.documents.length,
          wordCount: currentSession.wordCount,
          status: 'completed',
          verifiedClaimsCount: result.summary.totalClaims,
          flaggedClaimsCount: result.summary.refutedCount,
          truthfulnessScore: result.summary.truthfulnessScore,
          hasCorrection: false,
        };

        return [
          updatedEntry,
          ...previousHistory.filter(
            (item) => item.id !== currentSession.id
          ),
        ].slice(0, 20);
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Verification failed because of an unexpected error.';

      const status =
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        typeof error.status === 'number'
          ? error.status
          : message.toLowerCase().includes('fetch')
            ? 0
            : 500;

      setCorrectionError({
        message,
        status,
        isOffline:
          status === 0 ||
          message.toLowerCase().includes('fetch') ||
          message.toLowerCase().includes('network'),
        isRateLimited: status === 429,
        details: undefined,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Claim navigation.
  const claims = currentSession.verificationResult?.claims ?? [];
  const currentClaimIndex = claims.findIndex(
    (claim) => claim.id === selectedClaimId
  );

  const goToNextClaim = () => {
    if (claims.length === 0) {
      return;
    }

    const nextIndex =
      currentClaimIndex < claims.length - 1
        ? currentClaimIndex + 1
        : 0;

    setSelectedClaimId(claims[nextIndex].id);
  };

  const goToPrevClaim = () => {
    if (claims.length === 0) {
      return;
    }

    const previousIndex =
      currentClaimIndex > 0
        ? currentClaimIndex - 1
        : claims.length - 1;

    setSelectedClaimId(claims[previousIndex].id);
  };

  return (
    <AuditContext.Provider
      value={{
        currentScreen,
        setScreen: setCurrentScreen,
        theme,
        toggleTheme,
        setTheme,
        currentSession,
        history,
        backendHealth,
        isCheckingBackend,
        isVerifying,
        isGeneratingCorrection,
        correctionError,
        isCorrectionModalOpen,
        openCorrectionModal,
        closeCorrectionModal,
        clearCorrectionError,
        selectedClaimId,
        setSelectedClaimId,
        claimFilter,
        setClaimFilter,
        goToNextClaim,
        goToPrevClaim,
        checkBackendStatus,
        updateOriginalAnswer,
        addDocument,
        updateDocument,
        removeDocument,
        loadSamplePreset,
        clearCurrentAnswer,
        createNewSession,
        loadSessionFromHistory,
        deleteSessionFromHistory,
        runVerification,
        generateCorrection,
      }}
    >
      {children}
    </AuditContext.Provider>
  );
};

export type {
  ScreenType,
  ClaimFilterType,
  CorrectionErrorState,
  AuditContextType,
} from './auditContextDef';
