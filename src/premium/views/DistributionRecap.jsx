import React, { useState, useEffect } from 'react';
import { usePremium } from '../context/PremiumContext';
import { Check, AlertCircle, Info } from 'lucide-react';

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
      case 'recurring': return '#EF4444'; // Red for mandatory
      case 'milestone_unlock': return '#D4AF37'; // Gold for progress
      case 'proportional': return '#10B981'; // Green for growth
      default: return '#6B7280';
    }
  };

  return (
    <div className="premium-card premium-card-glass fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ background: 'var(--premium-gradient)', color: 'white', padding: '8px', borderRadius: '50%' }}>
          <Check size={20} />
        </div>
        <div>
          <h3 className="font-outfit">Proposition de l'Assistant</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>Optimisée selon vos priorités et délais</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {distribution.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-light)' }}>
            Entrez un montant pour voir la répartition.
          </p>
        ) : (
          distribution.map((item, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px', 
              background: 'white', 
              borderRadius: 'var(--radius-sm)',
              borderLeft: `4px solid ${getTypeColor(item.type)}`
            }}>
              <div>
                <p style={{ fontWeight: '600', fontSize: '15px' }}>{item.projectName}</p>
                <span style={{ fontSize: '11px', color: getTypeColor(item.type), fontWeight: '700', textTransform: 'uppercase' }}>
                  {getTypeLabel(item.type)}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '700', color: 'var(--navy)' }}>
                  +{item.amount.toLocaleString()} {profile?.currency?.code}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {distribution.length > 0 && (
        <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: var(--radius-sm), display: 'flex', gap: '12px' }}>
          <Info size={18} color="var(--accent-blue)" />
          <p style={{ fontSize: '12px', color: 'var(--navy)', lineHeight: '1.4' }}>
            Cette répartition privilégie vos **charges fixes** et le **déblocage de vos étapes en cours** pour garantir la progression de vos projets complexes.
          </p>
        </div>
      )}

      <button className="premium-btn" style={{ width: '100%', marginTop: '20px' }} disabled={distribution.length === 0}>
        Appliquer cette répartition
      </button>
    </div>
  );
};

export default DistributionRecap;
