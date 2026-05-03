import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TrendingUp, Trash2, LogOut, ChevronRight, Calculator, Bell, Shield, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Settings = () => {
  const { salary, setSalary, setOnboarded } = useFinance();
  const [showSim, setShowSim] = useState(false);
  const [targetSalary, setTargetSalary] = useState('');

  const handleReset = () => {
    if (window.confirm('Voulez-vous vraiment réinitialiser toutes vos données ?')) {
      localStorage.removeItem('dudukan_data');
      window.location.reload();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' F';
  };

  const diff = targetSalary ? parseFloat(targetSalary) - salary : 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '24px 20px' }}
    >
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px' }}>Plus</h1>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Simulation et paramètres</p>
      </header>

      {/* Simulation Card */}
      <div 
        className="card" 
        style={{ 
          background: 'var(--navy)', 
          color: 'white', 
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onClick={() => setShowSim(true)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}>
            <Calculator size={24} />
          </div>
          <div>
            <h3 style={{ color: 'white', fontSize: '16px' }}>Simulation d'augmentation</h3>
            <p style={{ opacity: 0.7, fontSize: '12px' }}>Préparez votre future situation</p>
          </div>
        </div>
        <ChevronRight size={20} style={{ opacity: 0.5 }} />
      </div>

      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--text-light)', marginBottom: '12px', marginLeft: '4px' }}>PARAMÈTRES</h3>
        
        <div className="card" style={{ padding: '0' }}>
          {[
            { icon: Bell, label: 'Notifications', color: 'var(--accent-blue)', onClick: () => alert('Les notifications sont activées !') },
            { icon: Shield, label: 'Confidentialité', color: 'var(--emerald)', onClick: () => alert('Vos données sont sécurisées localement.') },
            { icon: Trash2, label: 'Réinitialiser les données', color: 'var(--accent-pink)', onClick: handleReset },
          ].map((item, index, arr) => (
            <div 
              key={index}
              onClick={item.onClick}
              style={{ 
                padding: '16px 20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: index === arr.length - 1 ? 'none' : '1px solid #F3F4F6',
                cursor: item.onClick ? 'pointer' : 'default'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <item.icon size={20} color={item.color} />
                <span style={{ fontWeight: '500' }}>{item.label}</span>
              </div>
              <ChevronRight size={18} color="#D1D5DB" />
            </div>
          ))}
        </div>
      </div>

      {/* Simulation Modal */}
      <AnimatePresence>
        {showSim && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              background: 'rgba(0,0,0,0.5)', 
              zIndex: 3000,
              display: 'flex',
              alignItems: 'flex-end'
            }}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ 
                background: 'var(--bg-main)', 
                width: '100%', 
                maxWidth: '500px', 
                margin: '0 auto', 
                borderTopLeftRadius: '32px', 
                borderTopRightRadius: '32px',
                padding: '32px 24px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px' }}>Simuler une augmentation</h2>
                <button onClick={() => setShowSim(false)} style={{ background: '#F3F4F6', border: 'none', padding: '8px', borderRadius: '50%' }}>
                  <ChevronRight style={{ transform: 'rotate(90deg)' }} size={20} />
                </button>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="label">Nouveau salaire espéré (F CFA)</label>
                <input 
                  type="number" 
                  placeholder="Ex: 200 000" 
                  value={targetSalary}
                  onChange={(e) => setTargetSalary(e.target.value)}
                />
              </div>

              {diff > 0 && (
                <div className="fade-in">
                  <div className="card" style={{ background: 'var(--emerald-light)', border: 'none', marginBottom: '24px' }}>
                    <p style={{ color: 'var(--emerald)', fontWeight: '600', marginBottom: '4px' }}>Augmentation de {formatCurrency(diff)}</p>
                    <p style={{ fontSize: '13px', color: 'var(--navy)' }}>Voici comment nous vous conseillons de l'utiliser :</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { label: 'Remboursement dettes (40%)', amount: diff * 0.4, color: 'var(--accent-pink)' },
                      { label: 'Épargne / Projets (30%)', amount: diff * 0.3, color: 'var(--emerald)' },
                      { label: 'Amélioration confort (20%)', amount: diff * 0.2, color: 'var(--accent-blue)' },
                      { label: 'Imprévus (10%)', amount: diff * 0.1, color: 'var(--accent-orange)' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #E5E7EB' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</span>
                        <span style={{ fontWeight: '700', color: item.color }}>+{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '32px', textAlign: 'center' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-light)', fontStyle: 'italic' }}>
                      "Une augmentation doit vous aider à avancer, pas seulement à dépenser plus."
                    </p>
                  </div>
                </div>
              )}

              <button className="btn-primary" style={{ marginTop: '32px' }} onClick={() => setShowSim(false)}>
                J'ai compris
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Settings;
