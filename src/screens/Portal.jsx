import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Target, ArrowRight, Star } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const Portal = () => {
  const { setAppMode } = useFinance();

  const modes = [
    {
      id: 'free',
      title: 'Dudukan Budget',
      subtitle: 'Gestion quotidienne',
      description: 'Suivez vos revenus, dépenses et économies au jour le jour.',
      icon: LayoutGrid,
      color: 'var(--accent-blue)',
      premium: false
    },
    {
      id: 'premium',
      title: 'Projets de Vie',
      subtitle: 'Planification intelligente',
      description: 'Transformez vos rêves en étapes concrètes et suivez leur financement.',
      icon: Target,
      color: 'var(--emerald)',
      premium: true
    }
  ];

  return (
    <div className="app-container" style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '48px' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <img src="/logo.png" alt="Logo" style={{ width: '80px', height: '80px', marginBottom: '16px' }} />
        </motion.div>
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ fontSize: '32px', fontWeight: '800', color: 'var(--navy)', marginBottom: '8px' }}
        >
          Bienvenue
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ color: 'var(--text-light)', fontSize: '16px' }}
        >
          Choisissez votre mode de gestion
        </motion.p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {modes.map((mode, idx) => (
          <motion.div
            key={mode.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 + (idx * 0.1) }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAppMode(mode.id)}
            className="card"
            style={{ 
              padding: '24px', 
              cursor: 'pointer', 
              position: 'relative',
              overflow: 'hidden',
              border: mode.premium ? '2px solid var(--emerald)' : '1px solid var(--bg-main)',
              background: mode.premium ? 'linear-gradient(135deg, var(--white) 0%, var(--emerald-light) 100%)' : 'var(--white)'
            }}
          >
            {mode.premium && (
              <div style={{ 
                position: 'absolute', 
                top: '12px', 
                right: '12px', 
                background: 'var(--emerald)', 
                color: 'white', 
                fontSize: '10px', 
                fontWeight: '700', 
                padding: '4px 8px', 
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Star size={10} fill="white" />
                PREMIUM
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '16px', 
                background: `${mode.color}15`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: mode.color,
                flexShrink: 0
              }}>
                <mode.icon size={28} />
              </div>
              
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: mode.color, letterSpacing: '0.05em', marginBottom: '4px', textTransform: 'uppercase' }}>
                  {mode.subtitle}
                </p>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy)', marginBottom: '8px' }}>
                  {mode.title}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-light)', lineHeight: '1.5', marginBottom: '16px' }}>
                  {mode.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--navy)', fontWeight: '700', fontSize: '14px' }}>
                  Commencer <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <footer style={{ marginTop: 'auto', textAlign: 'center', paddingTop: '40px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-light)', opacity: 0.6 }}>
          Dudukan &bull; Votre futur commence ici
        </p>
      </footer>
    </div>
  );
};

export default Portal;
