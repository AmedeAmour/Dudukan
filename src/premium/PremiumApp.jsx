import React, { useState } from 'react';
import { PremiumProvider } from './context/PremiumContext';
import PremiumDashboard from './views/PremiumDashboard';
import BottomNav from '../components/BottomNav'; // Reusing nav but will adapt

const PremiumAppContent = ({ onSwitchMode }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <PremiumDashboard />;
      case 'settings':
        // A placeholder for now to allow switching back
        return (
          <div className="premium-container" style={{ padding: '40px 20px' }}>
            <h2>Paramètres Premium</h2>
            <div className="premium-card" style={{ marginTop: '20px' }}>
              <p>Souhaitez-vous repasser en version gratuite ?</p>
              <button 
                className="premium-btn premium-btn-outline" 
                style={{ marginTop: '16px' }}
                onClick={() => onSwitchMode('free')}
              >
                Passer en mode Gratuit
              </button>
            </div>
          </div>
        );
      default:
        return <PremiumDashboard />;
    }
  };

  return (
    <>
      {renderScreen()}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
};

const PremiumApp = ({ onSwitchMode }) => {
  return (
    <PremiumProvider>
      <PremiumAppContent onSwitchMode={onSwitchMode} />
    </PremiumProvider>
  );
};

export default PremiumApp;
