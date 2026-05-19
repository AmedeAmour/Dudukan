import React, { useState, useEffect } from 'react';
import { NotificationService } from '../NotificationService';
import NotificationObserver from '../components/NotificationObserver';
import PremiumTopBar from './components/PremiumTopBar';
import PremiumBottomNav from './components/PremiumBottomNav';
import { PremiumProvider } from './context/PremiumContext';
import PremiumDashboard from './views/PremiumDashboard';
import PremiumProjects from './views/PremiumProjects';
import AddProject from './views/AddProject';
import PremiumFunding from './views/PremiumFunding';
import ProjectDetail from './views/ProjectDetail';
import Profile from './views/Profile';
import { Sparkles, Briefcase, Wallet, Settings, X, Plus } from 'lucide-react';
import './PremiumStyles.css';

const PremiumAppContent = ({ onSwitchMode }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Request notification permission on mount
  useEffect(() => {
    NotificationService.requestPermission();
  }, []);

  // Handler for bell click – send a test notification
  const handleBellClick = () => {
    NotificationService.sendNotification('Rappel', "Ceci est une notification de test depuis Dudukan.");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsAddingProject(false);
    setSelectedProject(null);
  };

  // Define screen layout titles dynamically
  const getScreenTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Tableau de Bord';
      case 'projects': return 'Mes Projets de Vie';
      case 'funding': return 'Plan de Financement';
      case 'profile': return 'Profil';
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
        if (selectedProject) {
          return <ProjectDetail project={selectedProject} onBack={() => setSelectedProject(null)} />;
        }
        return <PremiumProjects onAddProject={() => setIsAddingProject(true)} onSelectProject={setSelectedProject} />;
      case 'funding':
        return <PremiumFunding />;
      case 'profile':
        return <Profile onSwitchMode={onSwitchMode} />;
      default:
        return null;
    }
  };

  return (
    <div className="premium-app-shell">
      <PremiumTopBar title={getScreenTitle()} onBellClick={handleBellClick} />
      <NotificationObserver />
      
      <main style={{ flex: 1, paddingBottom: '96px', overflowY: 'auto' }}>
        {renderScreen()}
      </main>

      {!isAddingProject && (
        <PremiumBottomNav 
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
          onAddClick={() => setShowQuickActions(true)}
        />
      )}

      {/* Intelligent Quick Actions Sheet */}
      {showQuickActions && (
        <div className="action-sheet-overlay" onClick={() => setShowQuickActions(false)}>
          <div className="action-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--zenith-accent-gold)" />
                <h3 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)', margin: 0 }}>
                  Actions Dudukan Premium
                </h3>
              </div>
              <button 
                onClick={() => setShowQuickActions(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--zenith-on-surface-variant)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Option 1 */}
              <button 
                onClick={() => {
                  setShowQuickActions(false);
                  setIsAddingProject(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  width: '100%',
                  border: '1px solid var(--zenith-outline-variant)',
                  backgroundColor: 'white',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--zenith-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(6, 182, 212, 0.1)', color: 'var(--zenith-data-complex)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={18} />
                </div>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--zenith-on-surface)', display: 'block' }}>Créer un projet de vie</span>
                  <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)' }}>Planifier un nouvel objectif financier ou matériel</span>
                </div>
              </button>

              {/* Option 2 */}
              <button 
                onClick={() => {
                  setShowQuickActions(false);
                  handleTabChange('funding');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  width: '100%',
                  border: '1px solid var(--zenith-outline-variant)',
                  backgroundColor: 'white',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--zenith-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--zenith-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wallet size={18} />
                </div>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--zenith-on-surface)', display: 'block' }}>Répartir mon épargne réelle</span>
                  <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)' }}>Allouer vos économies courantes vers vos priorités</span>
                </div>
              </button>

              {/* Option 3 */}
              <button 
                onClick={() => {
                  setShowQuickActions(false);
                  handleTabChange('profile');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  width: '100%',
                  border: '1px solid var(--zenith-outline-variant)',
                  backgroundColor: 'white',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--zenith-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(212, 175, 55, 0.1)', color: '#B59410', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Settings size={18} />
                </div>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--zenith-on-surface)', display: 'block' }}>Paramétrer le Coach</span>
                  <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)' }}>Changer le ton, la stratégie dominante et les alertes</span>
                </div>
              </button>

            </div>
          </div>
        </div>
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
