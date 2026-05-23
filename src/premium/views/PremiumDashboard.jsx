import React, { useState } from 'react';
import { usePremium } from '../context/PremiumContext';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  CheckCircle, 
  ChevronRight,
  Sparkles,
  Building,
  Receipt,
  FileText,
  DollarSign,
  ArrowRight,
  Activity,
  Award,
  Zap,
  Info,
  TrendingDown, 
  Utensils, 
  Car, 
  Home, 
  CreditCard, 
  PiggyBank, 
  AlertCircle, 
  User
} from 'lucide-react';

const PremiumDashboard = () => {
  const {
    profile,
    projects,
    availableFunds,
    calculateMonthlyNeed,
    executePriorityAction,
    alerts,
    priorities,
    currency,
    freeSalary,
    coachInsights,
    latestAllocationReport,
    setLatestAllocationReport,
    transactions,
  } = usePremium();

  const { user } = useAuth();
  const { categories, formatCurrency } = useFinance();
  
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [hiddenReportTime, setHiddenReportTimeState] = useState(() => {
    return localStorage.getItem('dudukan_hidden_report_time') || null;
  });

  const setHiddenReportTime = (time) => {
    setHiddenReportTimeState(time);
    if (time) {
      localStorage.setItem('dudukan_hidden_report_time', time);
    } else {
      localStorage.removeItem('dudukan_hidden_report_time');
    }
  };

  const allowedTypes = ['allocation', 'completion', 'life_allocation'];
  const filteredTransactions = transactions.filter(tx => allowedTypes.includes(tx.type));
  const displayTransactions = showAllTransactions ? filteredTransactions : filteredTransactions.slice(0, 3);
  
  // Reconstruct latest operation report dynamically from the allocations in transactions history
  const allocations = transactions.filter(tx => tx.type === 'allocation');
  let latestOpReport = null;
  if (allocations.length > 0) {
    const latestTx = allocations[0];
    const latestTime = new Date(latestTx.date).getTime();
    
    // Group all allocations within 10 seconds of the latest one
    const group = allocations.filter(tx => {
      const txTime = new Date(tx.date).getTime();
      return Math.abs(latestTime - txTime) <= 10000;
    });
    
    // Build projects array for display
    const opProjects = group.map(tx => {
      const proj = projects.find(p => p.id === tx.projectId || p.name === tx.projectName);
      if (proj) {
        const targetAmount = parseFloat(proj.target_amount || 0);
        const currentAmountAfter = parseFloat(proj.current_amount || 0);
        const currentAmountBefore = Math.max(0, currentAmountAfter - tx.amount);
        
        let steps = [];
        if (proj.is_complex && proj.milestones) {
          const sortedMilestones = [...proj.milestones].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
          steps = sortedMilestones.map((m, idx) => {
            const milestoneTarget = parseFloat(m.target_amount || 0);
            let previousTargetsSum = 0;
            for (let i = 0; i < idx; i++) {
              previousTargetsSum += parseFloat(sortedMilestones[i].target_amount || 0);
            }
            const milestoneCurrentBefore = Math.max(0, Math.min(milestoneTarget, currentAmountBefore - previousTargetsSum));
            const milestoneCurrentAfter = Math.max(0, Math.min(milestoneTarget, currentAmountAfter - previousTargetsSum));
            const addedToStep = Math.max(0, milestoneCurrentAfter - milestoneCurrentBefore);
            
            let status = 'non_commencee';
            if (m.is_completed || milestoneCurrentAfter >= milestoneTarget) {
              status = 'realisee';
            } else if (milestoneCurrentAfter > 0) {
              status = 'en_cours_de_financement';
            }
            
            return {
              id: m.id,
              name: m.name,
              targetAmount: milestoneTarget,
              currentBefore: milestoneCurrentBefore,
              addedAmount: addedToStep,
              currentAfter: milestoneCurrentAfter,
              status: status
            };
          });
        }
        
        return {
          id: proj.id,
          name: proj.name,
          is_recurring: proj.is_recurring,
          is_complex: proj.is_complex,
          allocatedAmount: tx.amount,
          currentAmountBefore,
          currentAmountAfter,
          targetAmount,
          steps,
          note: tx.note
        };
      } else {
        return {
          id: tx.projectId || tx.id,
          name: tx.projectName || tx.note || 'Projet',
          is_recurring: false,
          is_complex: false,
          allocatedAmount: tx.amount,
          currentAmountBefore: 0,
          currentAmountAfter: tx.amount,
          targetAmount: tx.amount,
          steps: [],
          note: tx.note
        };
      }
    });
    
    latestOpReport = {
      timestamp: latestTx.date,
      totalAllocatedThisTime: group.reduce((sum, tx) => sum + tx.amount, 0),
      projects: opProjects,
      isManual: group.some(tx => tx.metadata?.source?.startsWith('projet_manuel') || tx.note?.toLowerCase().includes('manuel') || tx.title?.toLowerCase().includes('manuelle') || tx.description?.toLowerCase().includes('page du projet'))
    };
  }

  const iconMap = {
    Utensils, Car, Home, CreditCard, PiggyBank, AlertCircle, User
  };

  // 1. Calculations for global progress card (Real data only)
  const targetProjects = projects.filter(p => !p.is_recurring);
  const totalTarget = targetProjects.reduce((acc, p) => acc + parseFloat(p.target_amount || 0), 0);
  const totalSaved = targetProjects.reduce((acc, p) => acc + parseFloat(p.current_amount || 0), 0);
  const globalProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  // 2. Calculations for monthly needs card
  const monthlyNeed = projects.reduce((acc, p) => acc + calculateMonthlyNeed(p), 0);

  // 3. Viability Score calculation
  let viability = 100;
  if (projects.length > 0) {
    const salary = parseFloat(freeSalary || 0);
    if (salary > 0 && monthlyNeed > 0) {
      const ratio = monthlyNeed / salary;
      if (ratio <= 0.4) {
        viability = 95;
      } else if (ratio <= 0.7) {
        viability = 80;
      } else {
        viability = Math.max(30, Math.round(100 - (ratio * 50)));
      }
    } else if (monthlyNeed > 0) {
      viability = 45;
    }
  }

  // Circular gauge track settings
  const radius = 80;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (viability / 100) * circumference;

  // Gauge colors and texts based on viability states
  const getGaugeConfig = () => {
    if (viability >= 75) {
      return {
        color: 'var(--zenith-secondary)', 
        title: 'Plan en bonne voie',
        desc: "Votre stratégie d'épargne actuelle permet d'atteindre vos objectifs avec 6 mois d'avance."
      };
    } else if (viability >= 50) {
      return {
        color: 'var(--zenith-status-warning)', 
        title: 'Optimisation possible',
        desc: "Quelques ajustements mineurs aideraient à stabiliser les délais de vos projets prioritaires."
      };
    } else {
      return {
        color: 'var(--zenith-status-alert)', 
        title: 'Ajustement requis',
        desc: "Votre épargne mensuelle est insuffisante pour couvrir vos jalons. Augmentez vos entrants ou repoussez certaines échéances."
      };
    }
  };

  const gaugeConfig = getGaugeConfig();
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || profile?.full_name?.split(' ')[0] || 'Utilisateur';
  const currencyCode = currency?.code || 'XOF';

  // Dynamic status tag mappings for Coach Insights
  const getInsightTag = (type) => {
    switch (type) {
      case 'success':
        return { text: 'Progression', style: { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' } };
      case 'warning':
        return { text: 'Vigilance', style: { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' } };
      case 'danger':
        return { text: 'Alerte', style: { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' } };
      case 'info':
        return { text: 'Stabilité', style: { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' } };
      default:
        return { text: 'Équilibre', style: { backgroundColor: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.3)' } };
    }
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: '500px', margin: '0 auto', paddingBottom: '100px' }}>
      
      {/* Hello Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span className="premium-badge premium-badge-gold" style={{ fontSize: '9px', display: 'inline-block' }}>
            Accès Premium Actif
          </span>
        </div>
        <h2 className="font-heading" style={{ fontSize: '30px', color: 'var(--zenith-on-surface)', margin: 0 }}>
          Bonjour, {userName}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--zenith-on-surface-variant)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
          Voici l'état actuel de votre trajectoire de vie. Dudukan veille sur la viabilité de votre patrimoine.
        </p>
      </div>

      {/* Smart Daily Summary Card */}
      <div style={{
        padding: '16px',
        backgroundColor: 'rgba(16, 185, 129, 0.04)',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        marginBottom: '28px'
      }}>
        <div style={{
          color: 'var(--zenith-secondary)',
          marginTop: '2px'
        }}>
          <CheckCircle size={18} />
        </div>
        <div>
          <p className="font-heading" style={{ 
            fontSize: '13px', 
            margin: '0 0 4px 0', 
            color: 'var(--zenith-secondary)',
            fontWeight: 800
          }}>
            Résumé Intelligent
          </p>
          <p style={{ 
            fontSize: '12px', 
            margin: 0, 
            color: 'var(--zenith-on-surface)',
            lineHeight: '1.5'
          }}>
            Vous avez financé <strong>{globalProgress}%</strong> de vos projets ({totalSaved.toLocaleString()} {currencyCode} sur {totalTarget.toLocaleString()} {currencyCode}). Avec une viabilité estimée à <strong>{viability}%</strong>, {gaugeConfig.desc.charAt(0).toLowerCase() + gaugeConfig.desc.slice(1)}
          </p>
        </div>
      </div>
 


      {/* Bento Grid: Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
        
        {/* Global Progress Card */}
        <div className="premium-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ 
                fontFamily: 'var(--font-body)', 
                fontSize: '11px', 
                fontWeight: 800, 
                color: 'var(--zenith-on-surface-variant)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Progression Globale
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                <span className="font-data" style={{ fontSize: '32px', color: 'var(--zenith-primary)', fontWeight: '800' }}>
                  {globalProgress}%
                </span>
                <span style={{ fontSize: '12px', color: 'var(--zenith-secondary)', fontWeight: 700 }}>
                  Avancement cumulé
                </span>
              </div>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              color: 'var(--zenith-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Activity size={20} />
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ 
              width: '100%', 
              backgroundColor: '#F1F5F9', 
              borderRadius: 'var(--radius-pill)', 
              height: '8px', 
              marginBottom: '10px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                backgroundColor: 'var(--zenith-secondary)', 
                height: '100%', 
                borderRadius: 'var(--radius-pill)',
                width: `${globalProgress}%`,
                transition: 'width 0.4s ease'
              }}></div>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontFamily: 'var(--font-body)', 
              fontSize: '11px', 
              color: 'var(--zenith-on-surface-variant)',
              fontWeight: 700
            }}>
              <span className="font-data">{totalSaved.toLocaleString()} {currencyCode}</span>
              <span>Objectif global : {totalTarget.toLocaleString()} {currencyCode}</span>
            </div>
          </div>
        </div>

        {/* Monthly Needs Card */}
        <div className="premium-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ 
                fontFamily: 'var(--font-body)', 
                fontSize: '11px', 
                fontWeight: 800, 
                color: 'var(--zenith-on-surface-variant)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Besoins prévisionnels du mois
              </span>
              <div style={{ marginTop: '6px' }}>
                <span className="font-data" style={{ fontSize: '32px', color: 'var(--zenith-on-surface)', fontWeight: '800' }}>
                  {Math.round(monthlyNeed).toLocaleString()} {currencyCode}
                </span>
              </div>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(11, 25, 44, 0.05)',
              color: 'var(--zenith-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Zap size={20} />
            </div>
          </div>
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--zenith-outline-variant)', paddingTop: '16px', display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)' }}>
              Allocation optimale répartie sur {projects.length} projets
            </span>
            <div style={{ display: 'flex', gap: '-6px' }}>
              {projects.slice(0, 3).map((p, idx) => (
                <div key={idx} style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: p.is_recurring ? 'var(--zenith-data-recurring)' : p.is_complex ? 'var(--zenith-data-complex)' : 'var(--zenith-primary-container)',
                  color: 'white',
                  fontSize: '8px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid white',
                  marginLeft: idx > 0 ? '-6px' : '0'
                }}>
                  {p.name.substring(0, 1).toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Circular Viability Gauge */}
        <div className="premium-card" style={{
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '20px' }}>
            <svg viewBox="0 0 176 176" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle 
                cx="88" 
                cy="88" 
                r={radius} 
                fill="transparent" 
                stroke="#F1F5F9" 
                strokeWidth={stroke} 
              />
              <circle 
                cx="88" 
                cy="88" 
                r={radius} 
                fill="transparent" 
                stroke={gaugeConfig.color} 
                strokeWidth={stroke} 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span className="font-heading" style={{ fontSize: '28px', color: 'var(--zenith-on-surface)', fontWeight: '800' }}>
                {viability}%
              </span>
              <span style={{ fontSize: '10px', color: 'var(--zenith-on-surface-variant)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Viabilité
              </span>
            </div>
          </div>

          <h3 className="font-heading" style={{ fontSize: '17px', color: 'var(--zenith-on-surface)', margin: '0 0 6px 0' }}>
            {gaugeConfig.title}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--zenith-on-surface-variant)', margin: 0, lineHeight: '1.5' }}>
            {gaugeConfig.desc}
          </p>
        </div>

      </div>

      {/* Alerts & Critical Notifications */}
      {alerts && alerts.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={18} color="var(--zenith-status-alert)" />
            <h3 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)', margin: 0 }}>
              Alertes & Vigilance
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.map(alert => (
              <div key={alert.id} style={{
                padding: '16px',
                backgroundColor: alert.type === 'funding_delay' ? 'rgba(239, 68, 68, 0.04)' : 'rgba(16, 185, 129, 0.04)',
                border: `1px solid ${alert.type === 'funding_delay' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`,
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  color: alert.type === 'funding_delay' ? 'var(--zenith-status-alert)' : 'var(--zenith-secondary)',
                  marginTop: '2px'
                }}>
                  {alert.type === 'funding_delay' ? <Calendar size={18} /> : <CheckCircle size={18} />}
                </div>
                <div>
                  <p className="font-heading" style={{ 
                    fontSize: '13px', 
                    margin: '0 0 2px 0', 
                    color: alert.type === 'funding_delay' ? 'var(--zenith-status-alert)' : 'var(--zenith-secondary)',
                    fontWeight: 800
                  }}>
                    {alert.title}
                  </p>
                  <p style={{ 
                    fontSize: '12px', 
                    margin: 0, 
                    color: 'var(--zenith-on-surface)',
                    lineHeight: '1.4'
                  }}>
                    {alert.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priorities and Executables */}
      {priorities && priorities.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="var(--zenith-accent-gold)" />
              <h3 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)', margin: 0 }}>
                Priorités immédiates
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {priorities.map(priority => (
              <div key={priority.id} className="premium-card" style={{
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: priority.type === 'realize' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(30, 62, 98, 0.1)',
                    color: priority.type === 'realize' ? 'var(--zenith-secondary)' : 'var(--zenith-primary-container)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {priority.type === 'realize' ? <CheckCircle size={20} /> : <TrendingUp size={20} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 className="font-heading" style={{ fontSize: '14px', margin: '0 0 2px 0', color: 'var(--zenith-on-surface)' }}>
                      {priority.title}
                    </h4>
                    <p style={{ fontSize: '12px', margin: 0, color: 'var(--zenith-on-surface-variant)', lineHeight: '1.4' }}>
                      {priority.description}
                    </p>
                  </div>
                </div>

                {priority.amount ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span className="font-data" style={{ fontSize: '14px', color: 'var(--zenith-on-surface)', fontWeight: 800, display: 'block' }}>
                        {priority.amount.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>
                        {currencyCode}
                      </span>
                    </div>
                    <button 
                      onClick={() => executePriorityAction(priority)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'var(--zenith-primary-container)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontFamily: 'var(--font-headings)',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(30, 62, 98, 0.15)'
                      }}
                    >
                      {priority.actionLabel || 'Valider'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (priority.type === 'general') {
                        alert("Optimisation de surplus exécutée !");
                      } else {
                        executePriorityAction(priority);
                      }
                    }}
                    style={{
                      marginLeft: '12px',
                      padding: '10px 18px',
                      backgroundColor: 'var(--zenith-primary-container)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontFamily: 'var(--font-headings)',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(30, 62, 98, 0.15)'
                    }}
                  >
                    {priority.actionLabel || 'Exécuter'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suivi Opérationnel des Dernières Allocations */}
      {latestOpReport && latestOpReport.projects && latestOpReport.projects.length > 0 && latestOpReport.timestamp !== hiddenReportTime && (
        <div className="premium-card" style={{
          padding: '24px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} color="var(--zenith-secondary)" />
              <h3 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)', margin: 0 }}>
                {latestOpReport.isManual ? "Suivi de la dernière opération" : "Suivi de la dernière répartition"}
              </h3>
            </div>
            <button 
              onClick={() => setHiddenReportTime(latestOpReport.timestamp)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--zenith-on-surface-variant)',
                fontSize: '11px',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontWeight: 700
              }}
            >
              Masquer
            </button>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--zenith-on-surface-variant)', marginTop: '-8px', marginBottom: '20px', lineHeight: '1.4' }}>
            {latestOpReport.isManual 
              ? `Allocation manuelle effectuée le ${new Date(latestOpReport.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} pour un montant de `
              : `Répartition automatique validée le ${new Date(latestOpReport.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} pour un montant total de `
            }
            <strong>{latestOpReport.totalAllocatedThisTime.toLocaleString()} {currencyCode}</strong>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {latestOpReport.projects.map(p => {
              const allocationShare = latestOpReport.totalAllocatedThisTime > 0 
                ? ((p.allocatedAmount / latestOpReport.totalAllocatedThisTime) * 100).toFixed(1)
                : 0;
              const currentProgress = p.targetAmount > 0 
                ? Math.min(100, Math.round((p.currentAmountAfter / p.targetAmount) * 100))
                : 0;
              const prevProgress = p.targetAmount > 0
                ? Math.min(100, Math.round((p.currentAmountBefore / p.targetAmount) * 100))
                : 0;
              const progressDiff = currentProgress - prevProgress;
              const remaining = Math.max(0, p.targetAmount - p.currentAmountAfter);

              return (
                <div key={p.id} style={{
                  padding: '16px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid var(--zenith-outline-variant)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  {/* Projet Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 className="font-heading" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', margin: 0, fontWeight: 700 }}>
                        {p.name}
                      </h4>
                      <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', fontWeight: 600 }}>
                        {p.is_recurring ? 'Mensuel récurrent' : p.is_complex ? 'Projet complexe' : 'Projet cible simple'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="font-data" style={{ fontSize: '14px', color: 'var(--zenith-secondary)', fontWeight: 800, display: 'block' }}>
                        +{p.allocatedAmount.toLocaleString()} {currencyCode}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)' }}>
                        {allocationShare}% de la répartition
                      </span>
                    </div>
                  </div>

                  {/* Financement Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', padding: '10px 0', borderTop: '1px solid var(--zenith-outline-variant)', borderBottom: '1px solid var(--zenith-outline-variant)' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>Financement actuel</span>
                      <span className="font-data" style={{ fontSize: '13px', color: 'var(--zenith-on-surface)', fontWeight: 700 }}>
                        {p.currentAmountAfter.toLocaleString()} / {p.targetAmount.toLocaleString()} {currencyCode} ({currentProgress}%)
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>Reste à financer</span>
                      <span className="font-data" style={{ fontSize: '13px', color: 'var(--zenith-on-surface)', fontWeight: 700 }}>
                        {remaining.toLocaleString()} {currencyCode}
                      </span>
                    </div>
                  </div>

                  {/* Impact */}
                  {progressDiff > 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--zenith-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <TrendingUp size={14} /> Le financement a progressé de +{progressDiff}% grâce à cette allocation.
                    </div>
                  )}

                  {/* Steps details for complex projects */}
                  {p.is_complex && p.steps && p.steps.length > 0 && (
                    <div style={{ marginTop: '12px', backgroundColor: 'white', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--zenith-outline-variant)' }}>
                      <h5 className="font-heading" style={{ fontSize: '11px', color: 'var(--zenith-on-surface)', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Détail des étapes :
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {p.steps.map(step => {
                          const stepProgress = step.targetAmount > 0 
                            ? Math.min(100, Math.round((step.currentAfter / step.targetAmount) * 100))
                            : 0;
                          
                          let statusText = 'Non commencée';
                          let statusColor = '#757575';
                          let statusBg = '#EEEEEE';

                          if (step.status === 'realisee') {
                            statusText = 'Réalisée / Prête';
                            statusColor = '#2E7D32';
                            statusBg = '#E8F5E9';
                          } else if (step.status === 'en_cours_de_financement') {
                            statusText = 'En cours';
                            statusColor = '#E65100';
                            statusBg = '#FFE0B2';
                          }

                          return (
                            <div key={step.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', paddingBottom: '6px', borderBottom: '1px dashed var(--zenith-outline-variant)' }}>
                              <div>
                                <span style={{ fontWeight: 600, color: 'var(--zenith-on-surface)' }}>{step.name}</span>
                                <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>
                                  {step.currentAfter.toLocaleString()} / {step.targetAmount.toLocaleString()} {currencyCode} ({stepProgress}%)
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {step.addedAmount > 0 && (
                                  <span style={{ fontSize: '11px', color: 'var(--zenith-secondary)', fontWeight: 600 }}>
                                    +{step.addedAmount.toLocaleString()}
                                  </span>
                                )}
                                <span style={{
                                  padding: '2px 8px',
                                  fontSize: '10px',
                                  borderRadius: '10px',
                                  fontWeight: 700,
                                  color: statusColor,
                                  backgroundColor: statusBg
                                }}>
                                  {statusText}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Coach Dudukan - Insights section (Moved to bottom) */}
      {coachInsights && coachInsights.length > 0 && (
        <div className="premium-card" style={{
          padding: '24px',
          marginTop: '32px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--zenith-secondary)" />
              <h3 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)', margin: 0 }}>
                Accompagnement Stratégique
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {coachInsights.map((insight, idx) => {
              const tagConfig = getInsightTag(insight.type);

              return (
                <div key={idx} style={{
                  paddingBottom: idx < coachInsights.length - 1 ? '16px' : '0',
                  borderBottom: idx < coachInsights.length - 1 ? '1px solid var(--zenith-outline-variant)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '9px',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      ...tagConfig.style
                    }}>
                      {tagConfig.text}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '13px',
                    margin: 0,
                    lineHeight: '1.6',
                    color: 'var(--zenith-on-surface-variant)',
                    fontFamily: 'var(--font-body)'
                  }}>
                    {insight.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)', margin: 0 }}>
            {showAllTransactions ? 'Toutes les transactions (50j)' : 'Transactions récentes'}
          </h3>
          <button 
            onClick={() => setShowAllTransactions(!showAllTransactions)}
            style={{ background: 'none', border: 'none', color: 'var(--zenith-secondary)', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
          >
            {showAllTransactions ? 'Réduire' : 'Voir tout'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayTransactions && displayTransactions.length > 0 ? (
            displayTransactions.map((tx) => {
              const category = tx.type === 'expense' ? categories?.find(c => c.id === tx.categoryId) : null;
              const IconComponent = category ? (iconMap[category.icon] || Info) : (tx.type === 'income' ? TrendingUp : TrendingDown);
              
              const iconColor = tx.type === 'income' ? 'var(--zenith-secondary)' : 'var(--zenith-on-surface-variant)';
              const bgColor = 'var(--zenith-bg)';

              return (
                <div 
                  key={tx.id} 
                  className="premium-card" 
                  style={{ margin: 0, padding: '16px', border: '1px solid var(--zenith-outline-variant)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '14px', 
                        background: bgColor, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: iconColor,
                        flexShrink: 0
                      }}>
                        <IconComponent size={20} />
                      </div>
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '15px', color: 'var(--zenith-on-surface)', margin: '0 0 4px 0' }}>
                          {(() => {
                            const typeLabel = tx.type === 'allocation' ? 'Allocation' : tx.type === 'completion' ? 'Réalisé' : tx.type === 'life_allocation' ? 'Allocation Vie' : '';
                            return (
                              <>
                                {typeLabel && <span style={{ fontWeight: '500', marginRight: '4px' }}>{typeLabel}:</span>}
                                {tx.projectName || tx.note || (tx.type === 'income' ? 'Revenu' : (tx.categoryId === 'debt' ? 'Remboursement' : category?.name || 'Dépense'))}
                              </>
                            );
                          })()}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {category && (
                            <span style={{ fontSize: '11px', fontWeight: '500', color: iconColor, background: bgColor, padding: '2px 6px', borderRadius: '4px' }}>
                              {category.name}
                            </span>
                          )}
                          <p style={{ fontSize: '12px', color: 'var(--zenith-on-surface-variant)', margin: 0 }}>
                            {new Date(tx.date).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p style={{ fontWeight: '700', fontSize: '16px', color: tx.type === 'income' ? 'var(--zenith-secondary)' : 'var(--zenith-on-surface)', margin: 0 }}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency ? formatCurrency(tx.amount) : tx.amount}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--zenith-on-surface-variant)' }}>
              Aucune transaction récente.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default PremiumDashboard;
