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
    executePriorityAction 
  } = usePremium();

  // 1. Calculations for global progress card
  const totalTarget = projects.length > 0 
    ? projects.reduce((acc, p) => acc + parseFloat(p.target_amount || 0), 0)
    : 200000; // Mockup default target

  const totalSaved = projects.length > 0
    ? projects.reduce((acc, p) => acc + parseFloat(p.current_amount || 0), 0)
    : 144000; // Mockup default saved

  const globalProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 72;

  // 2. Calculations for monthly needs card
  const monthlyNeed = projects.length > 0
    ? projects.reduce((acc, p) => acc + calculateMonthlyNeed(p), 0)
    : 3450; // Mockup default monthly need

  // 3. Viability Score calculation
  // Let's compute a realistic viability score based on their projects, but if projects are empty, default to 80% (mockup)
  let viability = 80;
  if (projects.length > 0) {
    const salary = parseFloat(profile?.salary || 0);
    const need = projects.reduce((acc, p) => acc + calculateMonthlyNeed(p), 0);
    if (salary > 0 && need > 0) {
      const ratio = need / salary;
      if (ratio <= 0.4) {
        viability = 95;
      } else if (ratio <= 0.7) {
        viability = 80;
      } else {
        viability = Math.max(30, Math.round(100 - (ratio * 50)));
      }
    } else {
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
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <AlertTriangle size={20} color="var(--zenith-status-alert)" />
          <h3 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)', margin: 0 }}>
            Alertes critiques
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Card 1: Underfunded project (Retard de financement) */}
          <div style={{
            padding: '16px',
            backgroundColor: '#FFEBEE',
            border: '1px solid rgba(211, 47, 47, 0.15)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <div style={{
              color: '#D32F2F',
              marginTop: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar size={20} />
            </div>
            <div>
              <p className="font-heading" style={{ 
                fontSize: '13px', 
                margin: '0 0 4px 0', 
                color: '#D32F2F',
                fontWeight: 800
              }}>
                Retard de financement
              </p>
              <p style={{ 
                fontSize: '13px', 
                margin: 0, 
                color: 'var(--zenith-on-surface)'
              }}>
                Projet "Immobilier" sous-financé de 1 200 {currencyCode} ce mois-ci.
              </p>
            </div>
          </div>

          {/* Card 2: PEA critical deadline (Optimisation fiscale) */}
          <div style={{
            padding: '16px',
            backgroundColor: '#F3F3F9',
            border: '1px solid var(--zenith-outline-variant)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <div style={{
              color: '#F57C00',
              marginTop: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building size={20} />
            </div>
            <div>
              <p className="font-heading" style={{ 
                fontSize: '13px', 
                margin: '0 0 4px 0', 
                color: '#582C00',
                fontWeight: 800
              }}>
                Optimisation fiscale
              </p>
              <p style={{ 
                fontSize: '13px', 
                margin: 0, 
                color: 'var(--zenith-on-surface)' 
              }}>
                Action requise avant le 15 du mois pour le PEA.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Priorities and Executables */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--zenith-primary)' }}>!</span>
            <h3 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)', margin: 0 }}>
              Priorités immédiates
            </h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--zenith-primary)', fontWeight: 700, cursor: 'pointer' }}>
            Voir tout
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Priority Card 1: Automatic Reallocation */}
          <div style={{
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
                backgroundColor: '#1A4F8B',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <TrendingUp size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 className="font-heading" style={{ fontSize: '14px', margin: '0 0 4px 0', color: 'var(--zenith-on-surface)' }}>
                  Réallocation Automatique
                </h4>
                <p style={{ fontSize: '13px', margin: 0, color: 'var(--zenith-on-surface-variant)', lineHeight: '1.4' }}>
                  Équilibrer le surplus du Livret A vers l'Assurance Vie.
                </p>
              </div>
            </div>

            <button
              onClick={() => alert("Réallocation automatique exécutée par l'algorithme Zenith !")}
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
              Exécuter
            </button>
          </div>

          {/* Priority Card 2: Travel project funding */}
          <div style={{
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
                backgroundColor: '#E8F5E9',
                color: 'var(--zenith-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 className="font-heading" style={{ fontSize: '14px', margin: '0 0 4px 0', color: 'var(--zenith-on-surface)' }}>
                  Financer Projet "Voyage"
                </h4>
                <p style={{ fontSize: '13px', margin: 0, color: 'var(--zenith-on-surface-variant)', lineHeight: '1.4' }}>
                  Dernier versement requis pour validation de la réservation.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <span className="font-data" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', fontWeight: 800, display: 'block' }}>
                  450
                </span>
                <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>
                  {currencyCode}
                </span>
              </div>
              <button style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#ECEFF1',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}>
                <ChevronRight size={16} color="var(--zenith-on-surface-variant)" />
              </button>
            </div>
          </div>

          {/* Priority Card 3: Scan electricity bill */}
          <div style={{
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
                backgroundColor: '#FFE7D3',
                color: '#E65100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Receipt size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 className="font-heading" style={{ fontSize: '14px', margin: '0 0 4px 0', color: 'var(--zenith-on-surface)' }}>
                  Scanner Facture Énergie
                </h4>
                <p style={{ fontSize: '13px', margin: 0, color: 'var(--zenith-on-surface-variant)', lineHeight: '1.4' }}>
                  Mise à jour du budget prévisionnel de charges fixes.
                </p>
              </div>
            </div>

            <button
              onClick={() => alert("Scanner photo de facture activé !")}
              style={{
                marginLeft: '12px',
                padding: '8px 16px',
                backgroundColor: 'white',
                color: 'var(--zenith-primary)',
                border: '1px solid var(--zenith-primary)',
                borderRadius: 'var(--radius-pill)',
                fontFamily: 'var(--font-headings)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Scanner
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

export default PremiumDashboard;
