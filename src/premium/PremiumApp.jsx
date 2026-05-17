import React, { useState } from 'react';
import PremiumTopBar from './components/PremiumTopBar';
import PremiumBottomNav from './components/PremiumBottomNav';
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
      return (
        <div style={{ padding: '24px' }}>
          <h2 className="font-heading" style={{ fontSize: '24px', color: 'var(--zenith-primary)', marginBottom: '8px' }}>
            Nouveau Projet Zenith
          </h2>
          <p style={{ color: 'var(--zenith-on-surface-variant)', marginBottom: '24px' }}>
            Formulaire de planification en cours de développement...
          </p>
          <button 
            onClick={() => setIsAddingProject(false)}
            style={{
              padding: '12px 24px',
              background: 'var(--zenith-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '700'
            }}
          >
            Retour
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <h2 className="font-heading" style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--zenith-primary)' }}>
              Bienvenue sur votre Espace Premium
            </h2>
            <p style={{ color: 'var(--zenith-on-surface-variant)', lineHeight: '1.6' }}>
              Ici commencera le développement du nouveau tableau de bord bento avec sa jauge de viabilité et d'alertes intelligentes.
            </p>
          </div>
        );
      case 'projects':
        return (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <h2 className="font-heading" style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--zenith-primary)' }}>
              Vos Projets de Vie
            </h2>
            <p style={{ color: 'var(--zenith-on-surface-variant)' }}>
              La liste de vos projets simples, complexes (milestones) et récurrents.
            </p>
          </div>
        );
      case 'funding':
        return (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <h2 className="font-heading" style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--zenith-primary)' }}>
              Gestion des Ressources
            </h2>
            <p style={{ color: 'var(--zenith-on-surface-variant)' }}>
              Optimisez l'allocation de vos revenus et économies.
            </p>
          </div>
        );
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
  return <PremiumAppContent onSwitchMode={onSwitchMode} />;
};

export default PremiumApp;
