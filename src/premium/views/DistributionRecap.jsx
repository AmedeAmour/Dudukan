import React, { useState, useEffect } from 'react';
import { usePremium } from '../context/PremiumContext';
import { Check, Info } from 'lucide-react';

const DistributionRecap = ({ amount }) => {
  const { suggestDistribution, profile } = usePremium();
  const [distribution, setDistribution] = useState([]);

  useEffect(() => {
    if (amount > 0) {
      setDistribution(suggestDistribution(amount));
    }
  }, [amount, suggestDistribution]);

  const getTypeLabel = (type) => {
    switch (type) {
      case 'recurring': return 'Charge Fixe';
      case 'milestone_unlock': return 'Déblocage Étape';
      case 'proportional': return 'Répartition Équilibrée';
      default: return 'Autre';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'recurring': return '#D32F2F'; // Zenith Error/Critical
      case 'milestone_unlock': return 'var(--zenith-primary)';
      case 'proportional': return 'var(--zenith-secondary)';
      default: return 'var(--zenith-neutral)';
    }
  };

  return (
    <div className="premium-card fade-in" style={{ borderTop: `6px solid var(--zenith-primary)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(26, 79, 139, 0.1)', color: 'var(--zenith-primary)', padding: '10px', borderRadius: '50%' }}>
          <Check size={20} strokeWidth={3} />
        </div>
        <div>
          <h3 style={{ fontFamily: 'var(--font-headings)', fontSize: '18px' }}>Proposition Zenith AI</h3>
          <p style={{ fontSize: '13px', color: 'var(--zenith-neutral)', fontFamily: 'var(--font-body)' }}>Optimisation de votre flux de trésorerie</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {distribution.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '30px', color: 'var(--zenith-neutral)', fontSize: '14px' }}>
            En attente d'un montant pour l'analyse...
          </p>
        ) : (
          distribution.map((item, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '16px', 
              background: 'rgba(248, 249, 250, 0.8)', 
              borderRadius: 'var(--radius-md)',
              borderLeft: `5px solid ${getTypeColor(item.type)}`
            }}>
              <div>
                <p style={{ fontWeight: '700', fontSize: '15px', fontFamily: 'var(--font-headings)', color: 'var(--zenith-primary)' }}>{item.projectName}</p>
                <span style={{ fontSize: '10px', color: getTypeColor(item.type), fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {getTypeLabel(item.type)}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '700', color: 'var(--zenith-primary)', fontFamily: 'var(--font-data)', fontSize: '17px' }}>
                  +{item.amount.toLocaleString()} <span style={{ fontSize: '10px' }}>{profile?.currency?.code}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {distribution.length > 0 && (
        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          background: 'rgba(26, 79, 139, 0.04)', 
          borderRadius: 'var(--radius-md)', 
          display: 'flex', 
          gap: '12px' 
        }}>
          <Info size={18} color="var(--zenith-primary)" />
          <p style={{ fontSize: '13px', color: '#4A5568', lineHeight: '1.5' }}>
            Cette répartition est calculée pour maximiser votre <strong>sécurité financière</strong> et accélérer le déblocage de vos étapes critiques.
          </p>
        </div>
      )}

      <button className="premium-btn" style={{ width: '100%', marginTop: '24px' }} disabled={distribution.length === 0}>
        Appliquer Zenith Allocation
      </button>
    </div>
  );
};

export default DistributionRecap;
