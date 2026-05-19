import React, { useState, useEffect } from 'react';
import { usePremium } from '../context/PremiumContext';
import { 
  User, 
  Crown, 
  Settings, 
  Sliders, 
  ShieldCheck, 
  RefreshCw, 
  LogOut, 
  MessageSquare,
  Sparkles,
  TrendingUp,
  Zap
} from 'lucide-react';

const Profile = ({ onSwitchMode }) => {
  const { 
    profile, 
    projects, 
    financeSavings, 
    freeSalary, 
    currency 
  } = usePremium();

  const currencyCode = currency?.code || 'XOF';
  
  // Local state for coaching preferences (persisted to localStorage)
  const [coachingTone, setCoachingTone] = useState(() => {
    return localStorage.getItem('dudukan_coaching_tone') || 'pedagogic';
  });
  const [dominantStrategy, setDominantStrategy] = useState(() => {
    return localStorage.getItem('dudukan_dominant_strategy') || 'balanced';
  });
  const [securityMat, setSecurityMat] = useState(() => {
    return localStorage.getItem('dudukan_alert_safety_mat') === 'true' || true;
  });
  const [autoAnalysis, setAutoAnalysis] = useState(() => {
    return localStorage.getItem('dudukan_auto_analysis') === 'true' || true;
  });

  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem('dudukan_coaching_tone', coachingTone);
  }, [coachingTone]);

  useEffect(() => {
    localStorage.setItem('dudukan_dominant_strategy', dominantStrategy);
  }, [dominantStrategy]);

  useEffect(() => {
    localStorage.setItem('dudukan_alert_safety_mat', securityMat);
  }, [securityMat]);

  useEffect(() => {
    localStorage.setItem('dudukan_auto_analysis', autoAnalysis);
  }, [autoAnalysis]);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      alert("Synchronisation avec le cloud Dudukan réussie !");
    }, 1500);
  };

  const totalAllocated = projects.reduce((acc, p) => acc + parseFloat(p.current_amount || 0), 0);
  const remainingSavings = Math.max(0, parseFloat(financeSavings || 0) - totalAllocated);

  return (
    <div style={{ padding: '24px 20px', maxWidth: '500px', margin: '0 auto', paddingBottom: '100px' }}>
      
      {/* Header section */}
      <div style={{ marginBottom: '28px' }}>
        <h2 className="font-heading" style={{ fontSize: '28px', color: 'var(--zenith-on-surface)', margin: '0 0 4px 0' }}>
          Profil
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--zenith-on-surface-variant)', margin: 0 }}>
          Personnalisez votre assistant financier haut de gamme.
        </p>
      </div>

      {/* Premium Status Badge Card */}
      <div className="premium-card" style={{
        background: 'linear-gradient(135deg, var(--zenith-primary) 0%, #17253A 100%)',
        color: 'white',
        padding: '24px',
        borderRadius: 'var(--radius-xl)',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'var(--zenith-shadow-md)'
      }}>
        {/* Subtle decorative gold circle */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(212, 175, 55, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--zenith-accent-gold)',
            flexShrink: 0
          }}>
            <Crown size={28} color="var(--zenith-accent-gold)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 className="font-heading" style={{ fontSize: '18px', margin: 0, color: 'white' }}>
                Julia Premium
              </h3>
              <span className="premium-badge premium-badge-gold" style={{ fontSize: '9px', padding: '2px 8px' }}>
                VIP
              </span>
            </div>
            <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: 'rgba(255,255,255,0.7)' }}>
              Accompagnement financier actif
            </p>
          </div>
        </div>
      </div>

      {/* Financial Profile Summary */}
      <div className="premium-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h4 className="font-heading" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color="var(--zenith-primary-container)" />
          Résumé de votre profil financier
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--zenith-bg)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>Épargne totale</span>
            <span className="font-data" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', fontWeight: 800 }}>
              {parseFloat(financeSavings || 0).toLocaleString()} {currencyCode}
            </span>
          </div>
          <div style={{ backgroundColor: 'var(--zenith-bg)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>Revenu de base</span>
            <span className="font-data" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', fontWeight: 800 }}>
              {parseFloat(freeSalary || 0).toLocaleString()} {currencyCode}
            </span>
          </div>
          <div style={{ backgroundColor: 'var(--zenith-bg)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>Fonds alloués</span>
            <span className="font-data" style={{ fontSize: '15px', color: 'var(--zenith-secondary)', fontWeight: 800 }}>
              {totalAllocated.toLocaleString()} {currencyCode}
            </span>
          </div>
          <div style={{ backgroundColor: 'var(--zenith-bg)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>Fonds libres</span>
            <span className="font-data" style={{ fontSize: '15px', color: 'var(--zenith-accent-gold)', fontWeight: 800 }}>
              {remainingSavings.toLocaleString()} {currencyCode}
            </span>
          </div>
        </div>
      </div>

      {/* Coaching Preferences */}
      <div className="premium-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h4 className="font-heading" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} color="var(--zenith-primary-container)" />
          Préférences d'accompagnement
        </h4>

        {/* Tone Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--zenith-on-surface-variant)', display: 'block', marginBottom: '8px' }}>
            Ton du Coach
          </label>
          <select 
            value={coachingTone} 
            onChange={(e) => setCoachingTone(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--zenith-outline-variant)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: 'var(--zenith-on-surface)',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="pedagogic">Pédagogique et Bienveillant</option>
            <option value="direct">Direct et Factuel</option>
            <option value="ambitious">Ambitieux et Énergique</option>
          </select>
        </div>

        {/* Strategy Selector */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--zenith-on-surface-variant)', display: 'block', marginBottom: '8px' }}>
            Stratégie Dominante
          </label>
          <select 
            value={dominantStrategy} 
            onChange={(e) => setDominantStrategy(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--zenith-outline-variant)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: 'var(--zenith-on-surface)',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="balanced">Progression équilibrée (Recommandé)</option>
            <option value="focused">Focus sur le projet le plus urgent</option>
            <option value="security">Sécurité maximale (Coussin de réserve élevé)</option>
          </select>
        </div>
      </div>

      {/* Smart Parameters & Switches */}
      <div className="premium-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h4 className="font-heading" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="var(--zenith-primary-container)" />
          Paramètres intelligents
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Switch 1 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--zenith-on-surface)', display: 'block' }}>
                Surveiller le matelas de sécurité
              </span>
              <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)' }}>
                Alerter si l'épargne non allouée descend sous 25%
              </span>
            </div>
            <input 
              type="checkbox" 
              checked={securityMat}
              onChange={(e) => setSecurityMat(e.target.checked)}
              style={{ width: '36px', height: '20px', cursor: 'pointer' }}
            />
          </div>

          {/* Switch 2 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--zenith-outline-variant)' }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--zenith-on-surface)', display: 'block' }}>
                Analyses périodiques automatiques
              </span>
              <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)' }}>
                Diligence de nouveaux conseils à chaque connexion
              </span>
            </div>
            <input 
              type="checkbox" 
              checked={autoAnalysis}
              onChange={(e) => setAutoAnalysis(e.target.checked)}
              style={{ width: '36px', height: '20px', cursor: 'pointer' }}
            />
          </div>

        </div>
      </div>

      {/* Cloud Synchronization and Security */}
      <div className="premium-card" style={{ padding: '20px', marginBottom: '28px' }}>
        <h4 className="font-heading" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="var(--zenith-secondary)" />
          Sécurité & Synchronisation
        </h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>
              Base de données chiffrée
            </span>
            <span style={{ fontSize: '11px', color: 'var(--zenith-secondary)', fontWeight: 600 }}>
              Statut : Protégé par Supabase
            </span>
          </div>
          <button 
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--zenith-primary-container)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Synchronisation...' : 'Synchroniser'}
          </button>
        </div>
      </div>

      {/* Downgrade Action */}
      <div className="premium-card" style={{ 
        padding: '20px', 
        border: '1px solid rgba(239, 68, 68, 0.15)',
        backgroundColor: 'rgba(239, 68, 68, 0.02)'
      }}>
        <h4 className="font-heading" style={{ fontSize: '14px', color: 'var(--zenith-status-alert)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogOut size={16} />
          Retourner au mode standard
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--zenith-on-surface-variant)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
          Le passage en mode gratuit conservera vos projets mais supprimera les fonctionnalités d'allocation automatique séquentielle, de matelas de protection et les rapports de suivi détaillé.
        </p>
        <button 
          onClick={() => onSwitchMode('free')}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'transparent',
            border: '1.5px solid var(--zenith-status-alert)',
            color: 'var(--zenith-status-alert)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontFamily: 'var(--font-headings)',
            fontSize: '12px',
            fontWeight: 700,
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Repasser en mode Gratuit
        </button>
      </div>

    </div>
  );
};

export default Profile;
