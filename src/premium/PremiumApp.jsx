import React, { useState } from 'react';
import PremiumTopBar from './components/PremiumTopBar';
import PremiumBottomNav from './components/PremiumBottomNav';
import { PremiumProvider } from './context/PremiumContext';
import PremiumDashboard from './views/PremiumDashboard';
import PremiumProjects from './views/PremiumProjects';
import AddProject from './views/AddProject';
import PremiumFunding from './views/PremiumFunding';
import './PremiumStyles.css';

const PremiumAppContent = ({ onSwitchMode }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddingProject, setIsAddingProject] = useState(false);

  // Define screen layout titles dynamically
  const getScreenTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Tableau de Bord';
      case 'projects': return 'Mes Projets de Vie';
      case 'funding': return 'Plan de Financement';
      case 'profile': return 'Profil Investisseur';
      default: return 'Financial Assistant';
    }
  };

  const renderScreen = () => {
    if (isAddingProject) {
      return <AddProject onBack={() => setIsAddingProject(false)} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <PremiumDashboard />;
      case 'projects':
        return <PremiumProjects onAddProject={() => setIsAddingProject(true)} />;
      case 'funding':
        return <PremiumFunding />;
      case 'profile':
        return (
          <div style={{ padding: '24px' }}>
            <div style={{
              backgroundColor: 'var(--zenith-white)',
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--zenith-outline-variant)',
              textAlign: 'center'
            }}>
              <h3 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-primary)', marginBottom: '12px' }}>
                Options du Profil
              </h3>
              <p style={{ color: 'var(--zenith-on-surface-variant)', marginBottom: '20px' }}>
                Souhaitez-vous repasser en version gratuite ?
              </p>
              <button 
                onClick={() => onSwitchMode('free')}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'none',
                  border: '1.5px solid var(--zenith-primary)',
                  color: 'var(--zenith-primary)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontWeight: '700'
                }}
              >
                Passer en mode Gratuit
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="premium-app-shell">
      <PremiumTopBar title={getScreenTitle()} />
      
      <main style={{ flex: 1, paddingBottom: '96px', overflowY: 'auto' }}>
        {renderScreen()}
      </main>

      {!isAddingProject && (
        <PremiumBottomNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onAddClick={() => setIsAddingProject(true)}
        />
      )}
    </div>
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
