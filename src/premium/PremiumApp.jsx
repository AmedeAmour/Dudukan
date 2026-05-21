import React, { useState, useEffect } from 'react';
import { NotificationService } from '../NotificationService';
import PremiumNotificationObserver from './components/PremiumNotificationObserver';
import PremiumTopBar from './components/PremiumTopBar';
import PremiumBottomNav from './components/PremiumBottomNav';
import { PremiumProvider, usePremium } from './context/PremiumContext';
import PremiumDashboard from './views/PremiumDashboard';
import PremiumProjects from './views/PremiumProjects';
import AddProject from './views/AddProject';
import PremiumFunding from './views/PremiumFunding';
import ProjectDetail from './views/ProjectDetail';
import Profile from './views/Profile';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { PremiumActions } from './components/PremiumActions';
import { Sparkles, Wallet, Settings, X, Plus } from 'lucide-react';
import './PremiumStyles.css';

const PremiumAppContent = ({ onSwitchMode }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('premium_theme') || 'light');

  const finance = useFinance();
  const { 
    salary = 0, nextMonthSalary = 0, currency = { code: 'XOF', locale: 'fr-FR' },
    formatCurrency = (v) => v, totalIncome = 0, totalExpenses = 0, balance = 0, 
    allTransactions = [], categories = []
  } = finance || {};

  const auth = useAuth();
  const { user = null } = auth || {};

  const premium = usePremium();
  const {
    projects = [],
    coachInsights = [],
    transactions: premiumTransactions = [],
    financeSavings = 0,
    latestAllocationReport = null
  } = premium || {};


  const handleDownloadReport = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      const clean = (str) => {
        if (!str) return '';
        return String(str).replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ').replace(/[^\x00-\x7F]/g, (c) => {
          const map = {'é':'e', 'è':'e', 'ê':'e', 'à':'a', 'â':'a', 'î':'i', 'ï':'i', 'ô':'o', 'û':'u', 'ù':'u', 'Ç':'C', 'ç':'c'};
          return map[c] || c;
        });
      };

      // Helper to format monetary amounts with French locale (space as thousand separator)
      const formatAmount = (value) => {
        const num = parseFloat(value || 0);
        return num.toLocaleString('fr-FR') + (currency?.code ? ` ${currency.code}` : ' XOF');
      };

      const loadLogo = () => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = '/sampa-electro (15).png';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      };
      
      const logo = await loadLogo();
      const goldColor = [212, 175, 55]; // Zenith Gold
      const navyColor = [18, 30, 49]; // Zenith Dark Slate Blue/Navy
      
      // Page 1: Synthese Financiere & Projets
      // 1. Header (Zenith style)
      doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.rect(0, 0, 210, 45, 'F');

      // Accent gold bar
      doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
      doc.rect(0, 45, 210, 3, 'F');

      if (logo) {
        doc.addImage(logo, 'PNG', 15, 8, 24, 24);
      }
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.text("Dudukan Premium", 45, 20);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text(clean("Accompagnement strategique et gestion d'epargne haut de gamme"), 45, 26);

      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("BILAN FINANCIER & STRATEGIQUE", 195, 22, { align: 'right' });
      
      doc.setFontSize(9);
      const today = new Date().toLocaleDateString('fr-FR');
      doc.text(`Date : ${today}`, 195, 30, { align: 'right' });
      const clientName = user?.user_metadata?.full_name || 'Membre Premium';
      doc.text(`Client : ${clean(clientName)}`, 195, 35, { align: 'right' });

      // 2. Synthese de l'Epargne
      let y = 62;
      doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("1. SYNTHESE DE L'EPARGNE REELLE", 15, y);
      doc.line(15, y + 2, 90, y + 2);
      
      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      const totalAllocated = projects.reduce((acc, p) => acc + parseFloat(p.current_amount || 0), 0);
      const totalTarget = projects.reduce((acc, p) => acc + parseFloat(p.target_amount || 0), 0);
      const unallocatedSavings = Math.max(0, parseFloat(financeSavings || 0) - totalAllocated);
      const globalProgress = totalTarget > 0 ? Math.round((totalAllocated / totalTarget) * 100) : 0;

      // Financial grid
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 24, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.text(clean("Epargne reelle totale"), 20, y + 8);
      doc.text(clean("Epargne allouee"), 80, y + 8);
      doc.text(clean("Epargne disponible (libre)"), 140, y + 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.text(formatAmount(financeSavings), 20, y + 18);
      doc.text(formatAmount(totalAllocated), 80, y + 18);
      doc.text(formatAmount(unallocatedSavings), 140, y + 18);
      // Global progress display
      doc.setFontSize(12);
      doc.text(`Progression globale : ${globalProgress}%`, 200, y + 18, { align: 'right' });
      // Detailed summary
      const remainingNeeded = Math.max(0, totalTarget - totalAllocated);
      doc.setFontSize(10);
      doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.text(`Objectif global : ${formatAmount(totalTarget)}`, 15, y + 30);
      doc.text(`Montant financé : ${formatAmount(totalAllocated)}`, 15, y + 38);
      doc.text(`Besoin prévisionnel du mois : ${formatAmount(remainingNeeded)}`, 15, y + 46);
      doc.text(`Reste à financer : ${formatAmount(remainingNeeded)}`, 15, y + 54);


      // 3. Projets de Vie & Financements
      y += 38;
      doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("2. ETAT DES PROJETS DE VIE", 15, y);
      doc.line(15, y + 2, 75, y + 2);

      y += 10;
      // Projects Table Header
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Projet", 18, y);
      doc.text("Objectif", 75, y);
      doc.text("Finance", 110, y);
      doc.text("Progression", 145, y);
      doc.text("Statut", 180, y);

      y += 3;
      doc.setDrawColor(200, 200, 200);
      doc.line(15, y, 195, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);

      projects.forEach((proj) => {
        if (y > 275) { doc.addPage(); y = 20; }
        const target = parseFloat(proj.target_amount || 0);
        const current = parseFloat(proj.current_amount || 0);
        const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
        
        doc.text(clean(proj.name), 18, y);
        doc.text(formatAmount(target), 75, y);
        doc.text(formatAmount(current), 110, y);
        doc.text(`${pct}%`, 145, y);
        doc.text(clean(proj.is_realized ? 'Realise' : 'En cours'), 180, y);
        
        // Render project milestones if complex
        if (proj.is_complex && proj.milestones && proj.milestones.length > 0) {
          y += 5;
          proj.milestones.forEach((ms) => {
            if (y > 275) { doc.addPage(); y = 20; }
            const msTarget = parseFloat(ms.target_amount || 0);
            const msCurrent = parseFloat(ms.current_amount || 0);
            const msStatus = ms.is_completed ? '[x] Réalisée' : `[ ] En cours (${formatAmount(msCurrent)}/${formatAmount(msTarget)})`;
            doc.setFontSize(8);
            doc.setTextColor(110, 110, 110);
            doc.text(`   - Jalon: ${clean(ms.name)} - ${clean(msStatus)}`, 18, y);
            y += 4;
          });
          doc.setFontSize(9);
          doc.setTextColor(40, 40, 40);
        } else {
          y += 6;
        }
      });

      // Page 2: Synthese Strategique et Transactions
      doc.addPage();
      let y2 = 25;
      
      // Header Page 2
      doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("DUDUKAN PREMIUM - ACCELERATEUR DE STRATEGIE FINANCIERE", 15, 10);

      // 4. Conseils du Coach / Synthese strategique
      y2 = 32;
      doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("3. CONSEILS DU COACH & SYNTHESE STRATEGIQUE", 15, y2);
      doc.line(15, y2 + 2, 115, y2 + 2);

      y2 += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);

      if (!coachInsights || coachInsights.length === 0) {
        doc.text("Aucun conseil strategique pour le moment. Votre profil est en cours de stabilisation.", 18, y2);
        y2 += 10;
      } else {
        coachInsights.forEach((insight) => {
          if (y2 > 270) { doc.addPage(); y2 = 25; }
          doc.setFont("helvetica", "bold");
          doc.text(`* ${clean(insight.title || 'Conseil')}`, 18, y2);
          y2 += 5;
          doc.setFont("helvetica", "normal");
          // Multi-line description text wrapping
          const lines = doc.splitTextToSize(clean(insight.description || ''), 175);
          doc.text(lines, 22, y2);
          y2 += (lines.length * 4) + 4;
        });
      }

      // 5. Dernieres Transactions Premium & Allocations
      y2 += 8;
      doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("4. TRANSACTIONS & ALLOCATIONS RECENTES", 15, y2);
      doc.line(15, y2 + 2, 105, y2 + 2);

      y2 += 10;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Date", 15, y2);
      doc.text("Type / Projet", 55, y2);
      doc.text("Description", 120, y2);
      doc.text("Montant", 190, y2, { align: 'right' });

      y2 += 3;
      doc.line(15, y2, 195, y2);
      y2 += 6;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);

      const displayTxs = premiumTransactions.slice(0, 20);
      if (displayTxs.length === 0) {
        doc.text("Aucune transaction premium enregistree.", 18, y2);
      } else {
        displayTxs.forEach((tx) => {
          if (y2 > 275) { doc.addPage(); y2 = 25; }
          const txDate = new Date(tx.date).toLocaleDateString('fr-FR');
          const typeLabel = tx.type === 'allocation' ? 'Allocation' :
                            tx.type === 'completion' ? 'Reussite' :
                            tx.type === 'initial' ? 'Depot Initial' : 'Ajustement';
          
          doc.text(txDate, 18, y2);
          doc.text(clean(`${typeLabel} : ${tx.projectName || ''}`), 45, y2);
          
          const desc = clean(tx.note || tx.stepName || '');
          doc.text(desc, 100, y2);
          doc.text(formatAmount(tx.amount), 190, y2, { align: 'right' });
          
          y2 += 6;
        });
      }

      doc.save(`Bilan_Premium_Dudukan_${new Date().toISOString().split('T')[0]}.pdf`);
      alert('Rapport PDF Premium généré et téléchargé avec succès !');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération du rapport PDF Premium.');
    }
  };

  // Apply theme class to root element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
    }
    localStorage.setItem('premium_theme', theme);
  }, [theme]);

  // Scroll to top when the active view changes (Premium App only)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab, isAddingProject, selectedProject]);

  // Request notification permission on mount
  useEffect(() => {
    NotificationService.requestPermission();
  }, []);

  // Handler for bell click – send a test notification
  const handleBellClick = async () => {
    // Ask for permission if not already granted
    const granted = await NotificationService.requestPermission();
    if (!granted) {
      alert('Permission de notification refusée.');
      return;
    }
    // Show a simple confirmation dialog to the user
    const ok = window.confirm('Souhaitez‑vous recevoir une notification de test ?');
    if (ok) {
      NotificationService.sendNotification('Rappel', "Ceci est une notification de test depuis Dudukan.");
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsAddingProject(false);
    setSelectedProject(null);
  };

  const handleThemeToggle = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
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
      <PremiumTopBar title={getScreenTitle()} onBellClick={handleBellClick} onToggleTheme={handleThemeToggle} onDownloadReport={handleDownloadReport} />
      <PremiumNotificationObserver />

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Sparkles size={18} color="var(--zenith-accent-gold)" strokeWidth={1.5} />
                </div>
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

                        {/* Premium Actions */}
            <PremiumActions onDownloadReport={handleDownloadReport} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
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
