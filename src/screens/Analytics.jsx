import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShieldCheck, AlertTriangle, Lightbulb, ArrowRight, Activity } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const Analytics = () => {
  const { getFinancialHealth, formatCurrency, balance } = useFinance();
  const { score, insights, projectedBalance } = getFinancialHealth();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '24px 20px 100px' }}
    >
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--navy)' }}>Analyses</h1>
        <p style={{ color: 'var(--text-light)', fontSize: '15px' }}>Votre santé financière en un coup d'œil</p>
      </header>

      {/* Health Score Circle */}
      <div className="card" style={{ padding: '32px 24px', textAlign: 'center', background: 'white' }}>
        <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto 24px' }}>
          <svg style={{ transform: 'rotate(-90deg)', width: '160px', height: '160px' }}>
            <circle 
              cx="80" cy="80" r="70" 
              fill="none" stroke="#F3F4F6" strokeWidth="12" 
            />
            <motion.circle 
              cx="80" cy="80" r="70" 
              fill="none" 
              stroke={score > 70 ? 'var(--emerald)' : score > 40 ? 'var(--accent-orange)' : 'var(--accent-red)'} 
              strokeWidth="12" 
              strokeDasharray="440"
              initial={{ strokeDashoffset: 440 }}
              animate={{ strokeDashoffset: 440 - (440 * score) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '40px', fontWeight: '800', color: 'var(--navy)' }}>{score}</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>Score</span>
          </div>
        </div>
        
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--navy)', marginBottom: '8px' }}>
          {score > 80 ? 'Excellente santé !' : score > 60 ? 'Bonne situation' : score > 40 ? 'Attention requise' : 'Situation critique'}
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-light)', lineHeight: '1.5' }}>
          Basé sur vos revenus, dépenses et objectifs actuels.
        </p>
      </div>

      {/* Key Insights */}
      <div style={{ marginTop: '32px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '16px', letterSpacing: '0.05em' }}>CONSEILS INTELLIGENTS</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {insights.map((insight, idx) => (
            <motion.div 
              key={idx}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * idx }}
              className="card" 
              style={{ 
                padding: '16px', 
                display: 'flex', 
                gap: '16px', 
                alignItems: 'center',
                borderLeft: `4px solid ${insight.includes('Critique') || insight.includes('Alerte') ? 'var(--accent-red)' : insight.includes('Excellent') || insight.includes('Félicitations') ? 'var(--emerald)' : 'var(--accent-blue)'}`
              }}
            >
              <div style={{ 
                color: insight.includes('Critique') || insight.includes('Alerte') ? 'var(--accent-red)' : insight.includes('Excellent') || insight.includes('Félicitations') ? 'var(--emerald)' : 'var(--accent-blue)' 
              }}>
                {insight.includes('Critique') ? <AlertTriangle size={24} /> : <Lightbulb size={24} />}
              </div>
              <p style={{ fontSize: '14px', color: 'var(--navy)', fontWeight: '500', lineHeight: '1.4' }}>
                {insight}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Projection Card */}
      <div className="card" style={{ marginTop: '32px', background: 'var(--bg-main)', border: '1px dashed #D1D5DB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy)' }}>Projection Fin de Mois</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>Solde estimé restant</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '18px', fontWeight: '800', color: projectedBalance >= 0 ? 'var(--emerald)' : 'var(--accent-red)' }}>
              {formatCurrency(projectedBalance)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Analytics;
