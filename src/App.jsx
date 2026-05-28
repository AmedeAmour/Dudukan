import { useState, useCallback, useEffect } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './supabaseClient';
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
import PremiumApp from './premium/PremiumApp';
import Payment from './screens/Payment';

const AppContent = () => {
  const { onboarded, isInitialized, profile } = useFinance();
  const { session, loading, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appMode, setAppMode] = useState('free');
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [premiumAccessLoading, setPremiumAccessLoading] = useState(false);
  const [paymentReturnInfo, setPaymentReturnInfo] = useState(null);
  const canUsePlusPreview = import.meta.env.DEV || import.meta.env.VITE_ENABLE_PLUS_PREVIEW === 'true';
  const [isPlusPreviewEnabled, setIsPlusPreviewEnabled] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const previewRequested = params.get('plus_preview') === '1';
    return canUsePlusPreview && (previewRequested || localStorage.getItem('dudukan_plus_preview') === 'true');
  });

  const refreshPremiumAccess = useCallback(async () => {
    if (!user) {
      setHasPremiumAccess(false);
      return false;
    }

    setPremiumAccessLoading(true);
    try {
      const { data, error } = await supabase.rpc('has_premium_access', { target_user_id: user.id });
      const hasAccess = (!error && data === true) || user?.user_metadata?.is_premium === true;
      setHasPremiumAccess(hasAccess);
      return hasAccess;
    } catch {
      const hasLegacyAccess = user?.user_metadata?.is_premium === true;
      setHasPremiumAccess(hasLegacyAccess);
      return hasLegacyAccess;
    } finally {
      setPremiumAccessLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (profile?.app_mode) {
      setAppMode(profile.app_mode);
    }
  }, [profile]);

  useEffect(() => {
    refreshPremiumAccess();
  }, [refreshPremiumAccess]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      const fedapayStatus = params.get('status');
      setPaymentReturnInfo({
        status: fedapayStatus || 'pending',
      });
      setAppMode('premium');
      window.history.replaceState({}, document.title, window.location.pathname);
      refreshPremiumAccess();
    } else if (isPlusPreviewEnabled) {
      setAppMode('premium');
    }
  }, [refreshPremiumAccess, isPlusPreviewEnabled]);

  const enablePlusPreview = useCallback(() => {
    if (!canUsePlusPreview) return;
    localStorage.setItem('dudukan_plus_preview', 'true');
    setIsPlusPreviewEnabled(true);
    setAppMode('premium');
  }, [canUsePlusPreview]);

  // Scroll to top when the active view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  if (loading || !isInitialized || premiumAccessLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)', color: 'var(--navy)', fontWeight: '600' }}>Chargement de vos données...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  if (!onboarded) {
    return <Onboarding />;
  }

  // Switching between independent apps
  if (appMode === 'premium') {
    if (hasPremiumAccess || isPlusPreviewEnabled) {
      return <PremiumApp onSwitchMode={setAppMode} />;
    } else {
      return (
        <Payment
          onBack={() => setAppMode('free')}
          onUnlock={() => setAppMode('premium')}
          onRefreshAccess={refreshPremiumAccess}
          canPreviewPlus={canUsePlusPreview}
          onPreviewPlus={enablePlusPreview}
          paymentReturnInfo={paymentReturnInfo}
        />
      );
    }
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'budget': return <Budget />;
      case 'expenses': return <Expenses />;
      case 'debts': return <Debts />;
      case 'savings': return <Savings />;
      case 'settings': return <Settings onSwitchToPremium={() => setAppMode('premium')} />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
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
