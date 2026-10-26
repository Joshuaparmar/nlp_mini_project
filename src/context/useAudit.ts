import { useContext } from 'react';
import { AuditContext } from './auditContextDef';
import type { AuditContextType } from './auditContextDef';

export const useAudit = (): AuditContextType => {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
};

export type { ScreenType, ClaimFilterType, CorrectionErrorState, AuditContextType } from './auditContextDef';
