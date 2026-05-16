import React, { useState, useEffect } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './screens/Dashboard';
import Budget from './screens/Budget';
import Expenses from './screens/Expenses';
import Debts from './screens/Debts';
import Savings from './screens/Savings';
import Onboarding from './screens/Onboarding';
import Settings from './screens/Settings';
import Auth from './screens/Auth';
import BottomNav from './components/BottomNav';
import NotificationObserver from './components/NotificationObserver';
import InstallPWA from './components/InstallPWA';
import Portal from './screens/Portal';
import Projects from './screens/Projects';
import Analytics from './screens/Analytics';

const AppContent = () => {
  const { onboarded, isInitialized, appMode } = useFinance();
  const { session, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading || !isInitialized) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)', color: 'var(--navy)', fontWeight: '600' }}>Chargement de vos données...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  if (!onboarded) {
    return <Onboarding />;
  }

  if (!appMode) {
    return <Portal />;
  }

  const renderScreen = () => {
    if (appMode === 'free') {
      switch (activeTab) {
        case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
        case 'budget': return <Budget />;
        case 'expenses': return <Expenses />;
        case 'debts': return <Debts />;
        case 'savings': return <Savings />;
        case 'settings': return <Settings />;
        default: return <Dashboard setActiveTab={setActiveTab} />;
      }
    } else {
      // Premium Projects Mode
      switch (activeTab) {
        case 'dashboard': return <Projects />;
        case 'budget': return <Budget />;
        case 'expenses': return <Expenses />;
        case 'analytics': return <Analytics />;
        case 'settings': return <Settings />;
        default: return <Projects />;
      }
    }
  };

  return (
    <div className="app-container">
      <InstallPWA />
      <NotificationObserver />
      {renderScreen()}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <AppContent />
      </FinanceProvider>
    </AuthProvider>
  );
}

export default App;
