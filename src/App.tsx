import React, { useState } from 'react';
import { AuditProvider } from './context/AuditContext';
import { useAudit } from './context/useAudit';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { DashboardView } from './views/DashboardView';
import { NewAuditView } from './views/NewAuditView';
import { AuditWorkspaceView } from './views/AuditWorkspaceView';
import { AuditHistoryView } from './views/AuditHistoryView';
import { SettingsView } from './views/SettingsView';
import { CorrectedAnswerView } from './views/CorrectedAnswerView';

const MainLayout: React.FC = () => {
  const { currentScreen } = useAudit();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardView />;
      case 'new-audit':
        return <NewAuditView />;
      case 'workspace':
        return <AuditWorkspaceView />;
      case 'correction':
        return <CorrectedAnswerView />;
      case 'history':
        return <AuditHistoryView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <NewAuditView />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex transition-colors duration-200">
      {/* Sidebar (Desktop fixed, Mobile off-canvas) */}
      <Sidebar 
        isOpen={isSidebarOpenMobile} 
        onCloseMobile={() => setIsSidebarOpenMobile(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        <TopNav onToggleSidebar={() => setIsSidebarOpenMobile(prev => !prev)} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderScreen()}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuditProvider>
      <MainLayout />
    </AuditProvider>
  );
};

export default App;
