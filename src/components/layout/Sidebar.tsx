import React from 'react';
import { 
  ShieldCheck, 
  PlusCircle, 
  LayoutDashboard, 
  BookOpenCheck, 
  History, 
  Settings, 
  Server,
  Sparkles
} from 'lucide-react';
import { useAudit } from '../../context/useAudit';
import type { ScreenType } from '../../context/auditContextDef';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { currentScreen, setScreen, currentSession, backendHealth, createNewSession } = useAudit();

  const navItems: { id: ScreenType; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-audit', label: 'New Audit', icon: PlusCircle },
    { id: 'workspace', label: 'Audit Workspace', icon: BookOpenCheck, badge: currentSession.documents.length > 0 ? `${currentSession.documents.length} doc` : undefined },
    { id: 'correction', label: 'Corrected Answer', icon: Sparkles, badge: currentSession.correctionResult ? 'Ready' : undefined },
    { id: 'history', label: 'Audit History', icon: History },
    { id: 'settings', label: 'Settings & Contract', icon: Settings },
  ];

  const handleNav = (screen: ScreenType) => {
    setScreen(screen);
    onCloseMobile?.();
  };

  const isBackendOnline = backendHealth?.status === 'ok';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] 
        flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[var(--text-primary)] tracking-tight text-base leading-none font-serif">SecondOpinion</span>
              </div>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] tracking-wider uppercase font-mono">Evidence Engine</span>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="p-4 pb-2">
          <button
            onClick={() => {
              createNewSession();
              handleNav('new-audit');
            }}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-medium text-sm shadow-xs transition-all duration-150 group cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
            <span>Start New Audit</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
                  ${isActive 
                    ? 'bg-[var(--brand-primary-subtle)] text-[var(--brand-primary-text)] font-semibold border border-[var(--border-subtle)]' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`
                    text-[10px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider font-mono
                    ${isActive 
                      ? 'bg-[var(--brand-primary)] text-white' 
                      : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                    }
                  `}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Current Active Audit Quick Card */}
        {currentSession.originalAnswer && (
          <div className="mx-3 mb-3 p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono">Active Audit</span>
              <span className="inline-block w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse"></span>
            </div>
            <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 leading-relaxed">
              {currentSession.title}
            </p>
            <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
              <span>{currentSession.wordCount} words</span>
              <span>{currentSession.documents.length} PDF{currentSession.documents.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}

        {/* Backend Contract Status Box */}
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="text-xs font-medium text-[var(--text-secondary)]">Backend API</span>
            </div>
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
              isBackendOnline 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' 
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isBackendOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              {isBackendOnline ? 'Online' : 'Standby'}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-tight">
            {isBackendOnline 
              ? 'PDF parser ready on :8000' 
              : 'Target: localhost:8000'}
          </p>
        </div>
      </aside>
    </>
  );
};
