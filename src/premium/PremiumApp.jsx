import React, { useState } from 'react';
import { PremiumProvider } from './context/PremiumContext';
import PremiumDashboard from './views/PremiumDashboard';
import PremiumBottomNav from './components/PremiumBottomNav';
import AddProject from './views/AddProject';

const PremiumAppContent = ({ onSwitchMode }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddingProject, setIsAddingProject] = useState(false);

  if (isAddingProject) {
    return <AddProject onBack={() => setIsAddingProject(false)} />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <PremiumDashboard onAddProject={() => setIsAddingProject(true)} />;
      case 'projects':
        return (
          <div className="premium-container" style={{ padding: '40px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 className="font-outfit">Mes Projets</h2>
              <button onClick={() => setIsAddingProject(true)} style={{ background: 'var(--navy)', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>+ Nouveau</button>
            </div>
            <p style={{ color: 'var(--text-light)' }}>Gérez vos objectifs de vie.</p>
            {/* Project list will go here */}
          </div>
        );
      case 'history':
        return (
          <div className="premium-container" style={{ padding: '40px 20px' }}>
            <h2 className="font-outfit">Historique</h2>
            <p style={{ color: 'var(--text-light)', marginTop: '8px' }}>Suivi de vos répartitions et contributions.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="premium-container" style={{ padding: '40px 20px' }}>
            <h2 className="font-outfit">Paramètres Premium</h2>
            <div className="premium-card" style={{ marginTop: '20px' }}>
              <p>Souhaitez-vous repasser en version gratuite ?</p>
              <button 
                className="premium-btn premium-btn-outline" 
                style={{ marginTop: '16px', width: '100%' }}
                onClick={() => onSwitchMode('free')}
              >
                Passer en mode Gratuit
              </button>
            </div>
          </div>
        );
      default:
        return <PremiumDashboard onAddProject={() => setIsAddingProject(true)} />;
    }
  };

  return (
    <>
      <div style={{ minHeight: '100vh', paddingBottom: '90px' }}>
        {renderScreen()}
      </div>
      <PremiumBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
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
