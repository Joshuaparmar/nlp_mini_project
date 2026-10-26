import React from 'react';
import { 
  Menu, 
  Plus, 
  RefreshCw, 
  FileCheck2,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { useAudit } from '../../context/useAudit';

interface TopNavProps {
  onToggleSidebar: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleSidebar }) => {
  const { 
    currentScreen, 
    setScreen, 
    backendHealth, 
    isCheckingBackend, 
    checkBackendStatus,
    currentSession,
    createNewSession,
    theme,
    toggleTheme
  } = useAudit();

  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'dashboard': return 'Operational Intelligence Dashboard';
      case 'new-audit': return 'New Audit Intake';
      case 'workspace': return 'Evidence & Claims Workspace';
      case 'correction': return 'Evidence-Grounded AI Correction';
      case 'history': return 'Audit History & Archives';
      case 'settings': return 'System Settings & API Contract';
      default: return 'SecondOpinion';
    }
  };

  const isConnected = backendHealth?.status === 'ok';

  return (
    <header className="sticky top-0 z-20 h-16 bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] px-4 sm:px-6 flex items-center justify-between transition-colors duration-200">
      {/* Left: Mobile Toggle & Editorial Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-2 -ml-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] lg:hidden cursor-pointer transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-serif italic text-[var(--text-muted)] hidden sm:inline text-xs tracking-wider uppercase">SecondOpinion</span>
          <ChevronRight className="w-3.5 h-3.5 text-[var(--border-strong)] hidden sm:inline" />
          <h1 className="font-semibold text-[var(--text-primary)] text-sm sm:text-base m-0 tracking-tight font-sans">
            {getScreenTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Theme Switcher, Backend Indicator & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Visible Theme Switcher */}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          title={`Switch to ${theme === 'light' ? 'dark (Graphite + Cyan)' : 'light (Ivory + Cobalt)'} theme`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors cursor-pointer"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden md:inline text-[11px] font-semibold text-slate-700">Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline text-[11px] font-semibold text-amber-300">Light</span>
            </>
          )}
        </button>

        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
          <span className="text-[var(--text-secondary)] font-medium text-[11px]">
            {isConnected ? 'API :8000 Online' : 'Backend Standby (Client Engine)'}
          </span>
          <button
            onClick={checkBackendStatus}
            disabled={isCheckingBackend}
            title="Refresh backend status"
            className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isCheckingBackend ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Action Button */}
        {currentScreen !== 'new-audit' && (
          <button
            onClick={() => {
              createNewSession();
              setScreen('new-audit');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Audit</span>
          </button>
        )}

        {/* Go to Workspace if documents exist */}
        {currentScreen === 'new-audit' && currentSession.documents.length > 0 && (
          <button
            onClick={() => setScreen('workspace')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] text-xs font-semibold border border-[var(--border-subtle)] transition-colors cursor-pointer"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Open Workspace</span>
          </button>
        )}
      </div>
    </header>
  );
};
