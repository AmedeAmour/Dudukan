import React from 'react';
import { usePremium } from '../context/PremiumContext';
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
  DollarSign
} from 'lucide-react';

const PremiumDashboard = () => {
  const { 
    profile, 
    projects, 
    availableFunds, 
    calculateMonthlyNeed,
    executePriorityAction,
    alerts,
    priorities
  } = usePremium();

  // 1. Calculations for global progress card (Real data only)
  const totalTarget = projects.reduce((acc, p) => acc + parseFloat(p.target_amount || 0), 0);
  const totalSaved = projects.reduce((acc, p) => acc + parseFloat(p.current_amount || 0), 0);
  const globalProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  // 2. Calculations for monthly needs card
  const monthlyNeed = projects.reduce((acc, p) => acc + calculateMonthlyNeed(p), 0);

  // 3. Viability Score calculation
  // Let's compute a realistic viability score based on their projects, but if projects are empty, default to 80% (mockup)
  let viability = 100;
  if (projects.length > 0) {
    const salary = parseFloat(profile?.salary || 0);
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
      viability = 45; // If no income or high need, default to warning "Ajustement requis"
    }
  }

  // Circular gauge track settings (radius=80 to prevent SVG clipping, circumference ~502)
  const radius = 80;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (viability / 100) * circumference;

  // Gauge colors and texts based on viability states
  const getGaugeConfig = () => {
    if (viability >= 75) {
      return {
        color: 'var(--zenith-secondary)', // Green (#006e1c)
        title: 'Plan en bonne voie',
        desc: "Votre stratégie d'épargne actuelle permet d'atteindre vos objectifs avec 6 mois d'avance."
      };
    } else if (viability >= 50) {
      return {
        color: 'var(--zenith-status-warning)', // Orange (#F57C00)
        title: 'Optimisation possible',
        desc: "Quelques ajustements mineurs aideraient à stabiliser les délais de vos projets prioritaires."
      };
    } else {
      return {
        color: 'var(--zenith-status-alert)', // Red (#D32F2F)
        title: 'Ajustement requis',
        desc: "Votre épargne mensuelle est insuffisante pour couvrir vos jalons. Augmentez vos entrants ou repoussez certaines échéances."
      };
    }
  };

  const gaugeConfig = getGaugeConfig();
  const userName = profile?.full_name?.split(' ')[0] || 'Marc';
  const currencyCode = profile?.currency?.code || '€';

  return (
    <div style={{ padding: '24px 20px', maxWidth: '500px', margin: '0 auto', paddingBottom: '100px' }}>
      
      {/* Hello Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 className="font-heading" style={{ fontSize: '32px', color: 'var(--zenith-on-surface)', margin: '0 0 6px 0' }}>
          Bonjour, {userName}
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--zenith-on-surface-variant)', margin: 0 }}>
          Voici l'état actuel de votre trajectoire financière.
        </p>
      </div>

      {/* Bento Grid: Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
        
        {/* Global Progress Card */}
        <div style={{
          backgroundColor: 'var(--zenith-white)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--zenith-outline-variant)',
          boxShadow: 'var(--zenith-shadow-soft)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ 
              fontFamily: 'var(--font-body)', 
              fontSize: '11px', 
              fontWeight: 700, 
              color: 'var(--zenith-on-surface-variant)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Progression Globale
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
              <span className="font-data" style={{ fontSize: '28px', color: 'var(--zenith-primary)', fontWeight: '800' }}>
                {globalProgress}%
              </span>
              <span style={{ 
                color: 'var(--zenith-secondary)', 
                fontSize: '12px', 
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <TrendingUp size={14} /> +4.2%
              </span>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ 
              width: '100%', 
              backgroundColor: '#ECEFF1', 
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
              fontSize: '12px', 
              color: 'var(--zenith-on-surface-variant)',
              fontWeight: 700
            }}>
              <span className="font-data">{totalSaved.toLocaleString()} {currencyCode}</span>
              <span>Objectif : {totalTarget.toLocaleString()} {currencyCode}</span>
            </div>
          </div>
        </div>

        {/* Monthly Needs Card */}
        <div style={{
          backgroundColor: 'var(--zenith-white)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--zenith-outline-variant)',
          boxShadow: 'var(--zenith-shadow-soft)'
        }}>
          <span style={{ 
            fontFamily: 'var(--font-body)', 
            fontSize: '11px', 
            fontWeight: 700, 
            color: 'var(--zenith-on-surface-variant)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Besoins du mois
          </span>
          <div style={{ marginTop: '8px' }}>
            <span className="font-data" style={{ fontSize: '28px', color: 'var(--zenith-on-surface)', fontWeight: '800' }}>
              {Math.round(monthlyNeed).toLocaleString()} {currencyCode}
            </span>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
            
            {/* Visual breakdown colored category items */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { label: 'L', color: '#1A4F8B' }, // Blue
                { label: 'E', color: '#7DDC7A' }, // Green
                { label: 'S', color: '#FF9E22' }  // Orange/Brown
              ].map((badge, idx) => (
                <div key={idx} style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: badge.color,
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  {badge.label}
                </div>
              ))}
            </div>
            
            <span style={{ 
              fontSize: '12px', 
              color: 'var(--zenith-primary)', 
              fontWeight: 700, 
              cursor: 'pointer',
              marginLeft: 'auto'
            }}>
              Détails flux
            </span>
          </div>
        </div>

        {/* Circular Viability Gauge */}
        <div style={{
          backgroundColor: '#F8FAFC',
          padding: '32px 24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--zenith-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: 'var(--zenith-shadow-soft)'
        }}>
          <div style={{ position: 'relative', width: '176px', height: '176px', marginBottom: '20px' }}>
            <svg viewBox="0 0 176 176" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              {/* Visible track circle matching image style */}
              <circle 
                cx="88" 
                cy="88" 
                r={radius} 
                fill="transparent" 
                stroke="#E2E2E8" 
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
              <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', fontWeight: 700 }}>
                Viabilité
              </span>
            </div>
          </div>

          <h3 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)', margin: '0 0 8px 0' }}>
            {gaugeConfig.title}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--zenith-on-surface-variant)', margin: 0, lineHeight: '1.5' }}>
            {gaugeConfig.desc}
          </p>
        </div>

      </div>

      {/* Alerts & Critical Notifications */}
      {alerts && alerts.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={20} color="var(--zenith-status-alert)" />
            <h3 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)', margin: 0 }}>
              Alertes critiques
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.map(alert => (
              <div key={alert.id} style={{
                padding: '16px',
                backgroundColor: alert.type === 'funding_delay' ? '#FFEBEE' : '#E8F5E9',
                border: `1px solid ${alert.type === 'funding_delay' ? 'rgba(211, 47, 47, 0.15)' : 'rgba(46, 125, 50, 0.15)'}`,
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  color: alert.type === 'funding_delay' ? '#D32F2F' : '#2E7D32',
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {alert.type === 'funding_delay' ? <Calendar size={20} /> : <CheckCircle size={20} />}
                </div>
                <div>
                  <p className="font-heading" style={{ 
                    fontSize: '13px', 
                    margin: '0 0 4px 0', 
                    color: alert.type === 'funding_delay' ? '#D32F2F' : '#2E7D32',
                    fontWeight: 800
                  }}>
                    {alert.title}
                  </p>
                  <p style={{ 
                    fontSize: '13px', 
                    margin: 0, 
                    color: 'var(--zenith-on-surface)'
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
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--zenith-primary)' }}>!</span>
              <h3 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)', margin: 0 }}>
                Priorités immédiates
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {priorities.map(priority => (
              <div key={priority.id} style={{
                backgroundColor: 'var(--zenith-white)',
                padding: '20px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--zenith-outline-variant)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: 'var(--zenith-shadow-soft)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: priority.type === 'realize' ? '#E8F5E9' : '#1A4F8B',
                    color: priority.type === 'realize' ? 'var(--zenith-secondary)' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {priority.type === 'realize' ? <CheckCircle size={20} /> : <TrendingUp size={20} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 className="font-heading" style={{ fontSize: '14px', margin: '0 0 4px 0', color: 'var(--zenith-on-surface)' }}>
                      {priority.title}
                    </h4>
                    <p style={{ fontSize: '13px', margin: 0, color: 'var(--zenith-on-surface-variant)', lineHeight: '1.4' }}>
                      {priority.description}
                    </p>
                  </div>
                </div>

                {priority.amount ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span className="font-data" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', fontWeight: 800, display: 'block' }}>
                        {priority.amount.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>
                        {currencyCode}
                      </span>
                    </div>
                    <button 
                      onClick={() => executePriorityAction(priority)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'var(--zenith-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontFamily: 'var(--font-headings)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {priority.actionLabel || 'Valider'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (priority.type === 'general') {
                        alert("Optimisation de surplus exécutée (Mockup) !");
                      } else {
                        executePriorityAction(priority);
                      }
                    }}
                    style={{
                      marginLeft: '12px',
                      padding: '10px 18px',
                      backgroundColor: 'var(--zenith-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontFamily: 'var(--font-headings)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
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

    </div>
  );
};

export default PremiumDashboard;
