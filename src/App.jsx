import React, { useState, useCallback, useEffect } from 'react';
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
import PremiumApp from './premium/PremiumApp';
import Payment from './screens/Payment';
import { supabase } from './supabaseClient';

const AppContent = () => {
  const { onboarded, isInitialized, profile } = useFinance();
  const { session, loading, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appMode, setAppMode] = useState('free');
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [premiumAccessLoading, setPremiumAccessLoading] = useState(false);
  const [paymentReturnInfo, setPaymentReturnInfo] = useState(null);

  const refreshPremiumAccess = useCallback(async () => {
    if (!user?.id) {
      setHasPremiumAccess(false);
      return false;
    }

    const hasLegacyAccess = user?.user_metadata?.is_premium === true;
    try {
      const { data, error } = await supabase.rpc('has_premium_access', { target_user_id: user.id });
      const hasAccess = (!error && data === true) || hasLegacyAccess;
      setHasPremiumAccess(hasAccess);
      return hasAccess;
    } catch (error) {
      setHasPremiumAccess(hasLegacyAccess);
      return hasLegacyAccess;
    }
  }, [user]);

  useEffect(() => {
    if (profile?.app_mode) {
      setAppMode(profile.app_mode);
    }
  }, [profile]);

  useEffect(() => {
    let cancelled = false;

    const checkAccess = async () => {
      if (!user?.id) {
        setHasPremiumAccess(false);
        return;
      }

      setPremiumAccessLoading(true);
      const hasAccess = await refreshPremiumAccess();
      if (!cancelled) {
        setHasPremiumAccess(hasAccess);
        setPremiumAccessLoading(false);
      }
    };

    checkAccess();
    return () => {
      cancelled = true;
    };
  }, [refreshPremiumAccess, user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment') || params.get('status');
    const transactionId = params.get('transaction_id') || params.get('id');

    if (!paymentStatus) return;

    setPaymentReturnInfo({ status: paymentStatus, transactionId });
    setAppMode('premium');
    refreshPremiumAccess();
  }, [refreshPremiumAccess]);

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
    const isPremiumUser = hasPremiumAccess || user?.user_metadata?.is_premium === true;
    if (isPremiumUser) {
      return <PremiumApp onSwitchMode={setAppMode} />;
    } else {
      return (
        <Payment
          onBack={() => setAppMode('free')}
          onUnlock={() => setAppMode('premium')}
          onRefreshAccess={refreshPremiumAccess}
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
