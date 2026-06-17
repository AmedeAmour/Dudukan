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

import { Sparkles, Wallet, Settings, X, Plus } from 'lucide-react';
import './PremiumStyles.css';
import { supabase } from '../supabaseClient';

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
    loading,
    projects = [],
    coachInsights = [],
    transactions: premiumTransactions = [],
    financeSavings = 0,
    latestAllocationReport = null,
    fetchData,
  } = premium || {};


  const handleDownloadReport = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      // Define colors used for cards and accents
      const goldColor = [245, 158, 11]; // Dudukan orange accent
      const navyColor = [18, 30, 49]; // Dark Navy
      // Debug log to verify data availability
      console.log('PDF generation context:', { financeSavings, projects, currency });
      
      const clean = (str) => {
        if (!str) return '';
        return String(str).replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ').replace(/[^\x00-\x7F]/g, (c) => {
          const map = {
            'é':'e', 'è':'e', 'ê':'e', 'à':'a', 'â':'a',
            'î':'i', 'ï':'i', 'ô':'o', 'û':'u', 'ù':'u',
            'Ç':'C', 'ç':'c', ' ':' ', 'É':'E', 'È':'E'
          };
          return map[c] || c;
        });
      };
      // Helper to format monetary amounts with French locale (space as thousand separator)
      const formatAmount = (value) => {
        const num = parseFloat(value || 0);
        return num.toLocaleString('fr-FR').replace(/\u202F/g, ' ') + (currency?.code ? ` ${currency.code}` : ' XOF');
      };

      if (premium && premium.loading) {
        alert('Les données sont encore en cours de chargement, veuillez réessayer dans quelques secondes.');
        return;
      }
      // Ensure we have the latest premium data before generating the PDF
      await fetchData();
      const loadLogo = () => new Promise((resolve) => {
        const img = new Image();
        img.src = '/sampa-electro (15).png';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
      const logo = await loadLogo();

      // 1. Header Background (Emerald Green)
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, 210, 50, 'F');

      // 2. Logo & App Title
      if (logo) {
        doc.addImage(logo, 'PNG', 20, 10, 20, 20);
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.text("Dudukan", 45, 22);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(clean("Bilan financier stratégique Dudukan Plus"), 45, 28);

      // 3. Right side header info
      doc.setFontSize(20);
      doc.text("RAPPORT PLUS", 195, 25, { align: 'right' });

      doc.setFontSize(9);
      const today = new Date().toLocaleDateString('fr-FR');
      doc.text(`Généré le : ${today}`, 195, 33, { align: 'right' });

      // Client Name
      const clientName = user?.user_metadata?.full_name || 'Membre Dudukan Plus';
      doc.text(`Client : ${clean(clientName)}`, 195, 38, { align: 'right' });

      // ----- Synthèse globale -----
// Ensure we have the freshest data for accurate calculations
        let freshProjects = [];
        let freshSavings = financeSavings;
        if (user?.id) {
          // Fetch latest projects with allocations
          const { data: projData, error: projErr } = await supabase
            .from('projects')
            .select(`*, milestones(*)`)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (!projErr && projData) freshProjects = projData;

          // Fetch latest total savings from profile
          const { data: profileData, error: profErr } = await supabase
            .from('profiles')
            .select('savings')
            .eq('id', user.id)
            .single();
          if (!profErr && profileData) freshSavings = profileData.savings;
        }
        const safeProjects = Array.isArray(freshProjects) ? freshProjects : [];
        const totalAllocated = safeProjects.reduce((acc, p) => acc + parseFloat(p.current_amount || 0), 0);
        const totalTarget = safeProjects.reduce((acc, p) => acc + parseFloat(p.target_amount || 0), 0);
        const unallocatedSavings = Math.max(0, parseFloat(freshSavings || 0) - totalAllocated);
        const globalProgress = totalTarget > 0 ? Math.round((totalAllocated / totalTarget) * 100) : 0;
        const resteAFinancer = Math.max(0, totalTarget - totalAllocated);
        let besoinPrevisionnel = 0;
        if (premium && typeof premium.calculateMonthlyNeed === 'function') {
          besoinPrevisionnel = safeProjects.reduce((acc, p) => acc + premium.calculateMonthlyNeed(p), 0);
        }
        // Note : le besoinPrevisionnel est la somme des besoins mensuels par projet
        // (reste / mois restants). Il ne correspond pas au reste à financer global.
        console.log('PDF allocation metrics', { totalSavings: freshSavings, totalAllocated, totalTarget, unallocatedSavings, globalProgress, resteAFinancer, besoinPrevisionnel });

      // 4. Clean Summary Section
      let y = 70;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.text(clean('RÉSUMÉ STRATÉGIQUE'), 20, y);
      doc.line(20, y + 2, 40, y + 2); // Underline
      y += 12;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);

      const resume = [
        { label: "Objectif global :", value: formatAmount(totalTarget) },
        { label: "Montant financé :", value: formatAmount(totalAllocated) },
        { label: "Reste à financer :", value: formatAmount(resteAFinancer) },
        { label: "Besoin prévisionnel :", value: formatAmount(besoinPrevisionnel) },
        { label: "Épargne disponible :", value: formatAmount(unallocatedSavings) },
        { label: "Progression globale :", value: `${globalProgress}%` }
      ];

      resume.forEach(item => {
        doc.text(clean(item.label), 25, y);
        doc.text(clean(item.value), 185, y, { align: 'right' });
        y += 8;
      });

      // 5. PROJETS DE VIE Section (Replacing DERNIÈRES OPÉRATIONS)
      y += 15;
      doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("PROJETS DE VIE", 20, y);
      doc.line(20, y + 2, 80, y + 2); // Underline
      
      y += 12;
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      
      // Table Header
      doc.text("Nom du projet", 20, y);
      doc.text("Type", 75, y);
      doc.text("Progression", 120, y);
      doc.text("Financement", 190, y, { align: 'right' });
      
      y += 4;
      doc.setDrawColor(220, 220, 220);
      doc.line(20, y, 195, y);
      y += 8;
      
      doc.setTextColor(50, 50, 50);
      if (safeProjects && safeProjects.length > 0) {
        safeProjects.forEach((p) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
            // Redraw small header
            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            doc.text("Nom du projet", 20, y);
            doc.text("Type", 75, y);
            doc.text("Progression", 120, y);
            doc.text("Financement", 190, y, { align: 'right' });
            y += 4;
            doc.line(20, y, 195, y);
            y += 8;
            doc.setTextColor(50, 50, 50);
          }
          const nameStr = clean(p.name);
          const typeStr = p.is_recurring ? 'Récurrent' : (p.is_complex ? 'Complexe' : 'Simple');
          const progressVal = p.target_amount > 0 ? Math.round(((p.current_amount || 0) / p.target_amount) * 100) : 0;
          const progressStr = `${progressVal}%`;
          const financeStr = `${formatAmount(p.current_amount || 0)} / ${formatAmount(p.target_amount || 0)}`;
          
          doc.text(nameStr.length > 30 ? nameStr.substring(0, 27) + '...' : nameStr, 20, y);
          doc.text(clean(typeStr), 75, y);
          doc.text(progressStr, 120, y);
          doc.text(clean(financeStr), 190, y, { align: 'right' });
          
          y += 7;
        });
      } else {
        doc.text("Aucun projet de vie enregistré.", 20, y);
      }
      // 6. DERNIÈRES OPÉRATIONS Section
      y += 15;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("DERNIÈRES OPÉRATIONS", 20, y);
      doc.line(20, y + 2, 80, y + 2); // Underline
      
      y += 12;
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      
      // Table Header
      doc.text("Date", 20, y);
      doc.text("Catégorie", 45, y);
      doc.text("Description", 90, y);
      doc.text("Montant", 190, y, { align: 'right' });
      
      y += 4;
      doc.setDrawColor(220, 220, 220);
      doc.line(20, y, 195, y);
      y += 8;
      
      doc.setTextColor(50, 50, 50);
      
      // Only show Premium transactions — free-version transactions are excluded
      const mergedTransactions = (premiumTransactions || []).map(ptx => ({
        ...ptx,
        date: ptx.date || ptx.created_at,
        categoryId: ptx.type,
        note: ptx.note || ptx.description || ptx.title || `Opération Dudukan Plus (${ptx.type})`
      }));
      
      // Sort by date descending
      mergedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      if (mergedTransactions.length > 0) {
        mergedTransactions.slice(0, 15).forEach((tx) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
            // Redraw small header
            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            doc.text("Date", 20, y);
            doc.text("Catégorie", 45, y);
            doc.text("Description", 90, y);
            doc.text("Montant", 190, y, { align: 'right' });
            y += 4;
            doc.line(20, y, 195, y);
            y += 8;
            doc.setTextColor(50, 50, 50);
          }
          const dateStr = tx.date ? new Date(tx.date).toLocaleDateString('fr-FR') : '-';
          const category = categories.find(c => c.id === tx.categoryId);
          let catStr = '';
          if (category) {
            catStr = category.name;
          } else {
            // Map known transaction types to readable categories
            const typeMap = {
              allocation: 'Allocation',
              completion: 'Réalisé',
              income: 'Revenu',
              expense: 'Dépense',
            };
            catStr = typeMap[tx.type] || 'Autre';
          }
          let rawNote = tx.note || '';
          if (tx.projectName) {
            // Include project name prefix for clarity
            rawNote = `[${tx.projectName}] ${rawNote}`;
          }
          const noteStr = clean(rawNote);
          const isIncome = tx.type === 'income';
          const isAllocation = tx.type === 'allocation';
          const prefix = (isIncome || isAllocation) ? '+' : '-';
          const amountStr = `${prefix}${formatAmount(tx.amount)}`;
          
          doc.text(dateStr, 20, y);
          doc.text(clean(catStr).length > 20 ? clean(catStr).substring(0, 17) + '...' : clean(catStr), 45, y);
          doc.text(noteStr.length > 45 ? noteStr.substring(0, 42) + '...' : noteStr, 90, y);
          doc.text(clean(amountStr), 190, y, { align: 'right' });
          
          y += 7;
        });
      } else {
        doc.text("Aucune opération enregistrée.", 20, y);
      }
      
      // Save PDF
      doc.save(`Bilan_Dudukan_Plus_${new Date().toISOString().split('T')[0]}.pdf`);
      alert('Rapport PDF Dudukan Plus généré avec succès !');
    } catch (err) {
      console.error('Erreur PDF', err);
      alert('Erreur lors de la génération du rapport PDF : ' + (err && err.message ? err.message : err));
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

    return () => {
      root.classList.remove('dark-mode');
    };
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
    if (isAddingProject) return 'Planifier un projet';
    if (selectedProject) return 'Détail du projet';

    switch (activeTab) {
      case 'dashboard': return 'Tableau de Bord';
      case 'projects': return 'Mes Projets de Vie';
      case 'funding': return 'Financement';
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
      <PremiumTopBar title={getScreenTitle()} onBellClick={handleBellClick} theme={theme} onToggleTheme={handleThemeToggle} onDownloadReport={handleDownloadReport} />
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
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Sparkles size={18} color="var(--zenith-accent-gold)" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)', margin: 0 }}>
                  Actions Dudukan Plus
                </h3>
              </div>
              <button 
                type="button"
                aria-label="Fermer les actions Dudukan Plus"
                onClick={() => setShowQuickActions(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--zenith-on-surface-variant)' }}
              >
                <X size={20} />
              </button>
            </div>

            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {/* Option 1 */}
              <button 
                type="button"
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
                  backgroundColor: 'var(--zenith-surface)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--zenith-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--zenith-surface)'}
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
                type="button"
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
                  backgroundColor: 'var(--zenith-surface)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--zenith-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--zenith-surface)'}
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
                type="button"
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
                  backgroundColor: 'var(--zenith-surface)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--zenith-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--zenith-surface)'}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
