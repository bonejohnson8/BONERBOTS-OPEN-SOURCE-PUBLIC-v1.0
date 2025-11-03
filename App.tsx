// App.tsx
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import SpectatorDashboard from './components/SpectatorDashboard';
import BroadcastPasswordGate from './components/BroadcastPasswordGate';
import ConfigurationWarning from './components/ConfigurationWarning';
import Modal from './components/Modal';
import ProjectSummary from './components/ProjectSummary';
import { AppMode } from './types';
import { isAppConfigured } from './config';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('spectator');
  const [isPaused, setIsPaused] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'broadcast') {
      setMode('broadcast');
    }
  }, []);

  const handleBroadcastingChange = (isB: boolean) => {
    setIsBroadcasting(isB);
  };

  const renderContent = () => {
    if (mode === 'broadcast') {
      if (isAuthenticated) {
        return <Dashboard isPaused={isPaused} onBroadcastingChange={handleBroadcastingChange} />;
      } else {
        return <BroadcastPasswordGate onSuccess={() => setIsAuthenticated(true)} />;
      }
    }
    return <SpectatorDashboard />;
  };

  if (!isAppConfigured) {
    return <ConfigurationWarning />;
  }
  
  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen font-sans">
      <Header 
        isPaused={isPaused} 
        onTogglePause={() => setIsPaused(!isPaused)} 
        mode={mode}
        isBroadcasting={isBroadcasting}
        onOpenSummary={() => setIsSummaryModalOpen(true)}
      />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
      <Modal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)}>
        <ProjectSummary />
      </Modal>
    </div>
  );
};

export default App;
