import React from 'react';
import { usePremium } from '../context/PremiumContext';
import { 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  ArrowRight, 
  PiggyBank, 
  Receipt,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const PremiumDashboard = () => {
  const { 
    profile, 
    projects, 
    availableFunds, 
    alerts, 
    priorities, 
    calculateMonthlyNeed,
    executePriorityAction 
  } = usePremium();

  // 1. Calculations for global progress card
  const totalTarget = projects.reduce((acc, p) => acc + parseFloat(p.target_amount || 0), 0);
  const totalSaved = projects.reduce((acc, p) => acc + parseFloat(p.current_amount || 0), 0);
  const globalProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  // 2. Calculations for monthly needs card
  const monthlyNeed = projects.reduce((acc, p) => acc + calculateMonthlyNeed(p), 0);

  // 3. Viability Score (Mocked or calculated ratio of income vs monthly need)
  const salary = parseFloat(profile?.salary || 0);
  let viability = 100;
  if (salary > 0 && monthlyNeed > 0) {
    const ratio = monthlyNeed / salary;
    // If monthly need is <= 40% of salary, viability is high. If > 80%, viability is low.
    if (ratio <= 0.4) {
      viability = 95;
    } else if (ratio <= 0.7) {
      viability = 80;
    } else {
      viability = Math.max(30, Math.round(100 - (ratio * 50)));
    }
  } else if (projects.length > 0 && monthlyNeed > 0) {
    viability = 50; // no income registered but has needs
  }

  // Circular gauge settings (radius=88, circumference ~553)
  const radius = 88;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (viability / 100) * circumference;

  return (
    <div style={{ padding: '24px 20px', maxWidth: '500px', margin: '0 auto' }}>
      {/* Hello Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 className="font-heading" style={{ fontSize: '28px', color: 'var(--zenith-on-surface)', margin: '0 0 4px 0' }}>
          Bonjour, {profile?.full_name?.split(' ')[0] || 'Investisseur'}
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--zenith-on-surface-variant)', margin: 0 }}>
          Voici l'état actuel de votre trajectoire financière.
        </p>
      </div>

      {/* Bento Grid: Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
        
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
              <span className="font-data" style={{ fontSize: '28px', color: 'var(--zenith-primary)' }}>
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

          <div style={{ marginTop: '24px' }}>
            <div style={{ 
              width: '100%', 
              backgroundColor: 'var(--zenith-bg)', 
              borderRadius: 'var(--radius-pill)', 
              height: '10px', 
              marginBottom: '8px',
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
              fontWeight: 600
            }}>
              <span className="font-data">{totalSaved.toLocaleString()} {profile?.currency?.code || 'XOF'}</span>
              <span>Cible : {totalTarget.toLocaleString()} {profile?.currency?.code || 'XOF'}</span>
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
            <span className="font-data" style={{ fontSize: '28px', color: 'var(--zenith-on-surface)' }}>
              {Math.round(monthlyNeed).toLocaleString()} {profile?.currency?.code || 'XOF'}
            </span>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Visual breakdown items placeholder */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {projects.map((p, idx) => (
                <div key={p.id || idx} style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: p.is_recurring ? 'var(--zenith-data-recurring)' : p.is_complex ? 'var(--zenith-data-complex)' : 'var(--zenith-primary)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {p.name.substring(0, 1).toUpperCase()}
                </div>
              )).slice(0, 4)}
              {projects.length > 4 && (
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--zenith-outline-variant)',
                  color: 'var(--zenith-on-surface-variant)',
                  fontSize: '10px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  +{projects.length - 4}
                </div>
              )}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--zenith-primary)', fontWeight: 700, cursor: 'pointer' }}>
              Détails flux
            </span>
          </div>
        </div>

        {/* Feasibility circular Gauge */}
        <div style={{
          backgroundColor: '#F8FAFC',
          padding: '32px 24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--zenith-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div style={{ position: 'relative', width: '176px', height: '176px', marginBottom: '20px' }}>
            <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle 
                cx="88" 
                cy="88" 
                r={radius} 
                fill="transparent" 
                stroke="var(--zenith-bg)" 
                strokeWidth={stroke} 
              />
              <circle 
                cx="88" 
                cy="88" 
                r={radius} 
                fill="transparent" 
                stroke="var(--zenith-secondary)" 
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
              <span className="font-heading" style={{ fontSize: '28px', color: 'var(--zenith-on-surface)' }}>
                {viability}%
              </span>
              <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', fontWeight: 600 }}>
                Viabilité
              </span>
            </div>
          </div>

          <h3 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)', margin: '0 0 8px 0' }}>
            {viability >= 75 ? 'Plan en bonne voie' : viability >= 50 ? 'Optimisation possible' : 'Ajustement requis'}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--zenith-on-surface-variant)', margin: 0, lineHeight: '1.5' }}>
            {viability >= 75 
              ? "Votre stratégie d'épargne actuelle permet de couvrir confortablement vos projets dans les temps."
              : "Quelques ajustements mineurs aideraient à stabiliser les délais de vos projets prioritaires."}
          </p>
        </div>

      </div>

      {/* Alerts & Critical notifications (Ready to Realize) */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <AlertTriangle size={20} color="var(--zenith-status-alert)" />
          <h3 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)', margin: 0 }}>
            Alertes critiques
          </h3>
        </div>

        {alerts.length === 0 ? (
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--zenith-white)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--zenith-outline-variant)',
            textAlign: 'center',
            fontSize: '14px',
            color: 'var(--zenith-on-surface-variant)'
          }}>
            Aucune alerte critique pour le moment.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.map(alert => (
              <div 
                key={alert.id}
                style={{
                  padding: '16px',
                  backgroundColor: alert.type === 'ready_to_realize' ? '#E8F5E9' : 'var(--zenith-error-container)',
                  border: `1px solid ${alert.type === 'ready_to_realize' ? 'rgba(0, 110, 28, 0.15)' : 'rgba(186, 26, 26, 0.15)'}`,
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}
              >
                {alert.type === 'ready_to_realize' ? (
                  <CheckCircle size={20} color="var(--zenith-secondary)" style={{ shrink: 0, marginTop: '2px' }} />
                ) : (
                  <Calendar size={20} color="var(--zenith-on-error-container)" style={{ shrink: 0, marginTop: '2px' }} />
                )}
                <div>
                  <p className="font-heading" style={{ 
                    fontSize: '13px', 
                    margin: '0 0 4px 0', 
                    color: alert.type === 'ready_to_realize' ? 'var(--zenith-secondary)' : 'var(--zenith-on-error-container)',
                    fontWeight: 800
                  }}>
                    {alert.title}
                  </p>
                  <p style={{ 
                    fontSize: '13px', 
                    margin: 0, 
                    color: alert.type === 'ready_to_realize' ? 'var(--zenith-on-surface-variant)' : 'rgba(147, 0, 10, 0.8)' 
                  }}>
                    {alert.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Priorities and executables */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)', margin: 0 }}>
            Priorités immédiates
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--zenith-primary)', fontWeight: 700, cursor: 'pointer' }}>
            Voir tout
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {priorities.map(priority => (
            <div 
              key={priority.id}
              style={{
                backgroundColor: 'var(--zenith-white)',
                padding: '20px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--zenith-outline-variant)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: 'var(--zenith-shadow-soft)',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--zenith-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--zenith-outline-variant)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: priority.type === 'realize' ? 'var(--zenith-secondary-container)' : 'var(--zenith-primary-container)',
                  color: priority.type === 'realize' ? 'var(--zenith-secondary)' : 'var(--zenith-white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {priority.type === 'realize' ? <CheckCircle size={20} /> : <PiggyBank size={20} />}
                </div>
                <div>
                  <h4 className="font-heading" style={{ fontSize: '15px', margin: '0 0 2px 0', color: 'var(--zenith-on-surface)' }}>
                    {priority.title}
                  </h4>
                  <p style={{ fontSize: '13px', margin: 0, color: 'var(--zenith-on-surface-variant)' }}>
                    {priority.description}
                  </p>
                </div>
              </div>

              {priority.actionLabel && (
                <button
                  onClick={() => executePriorityAction(priority)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: priority.type === 'realize' ? 'var(--zenith-secondary)' : 'var(--zenith-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-pill)',
                    fontFamily: 'var(--font-headings)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'transform 0.1s'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {priority.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PremiumDashboard;
