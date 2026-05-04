import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Wallet, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Onboarding = () => {
  const { setSalary, setOnboarded, currency, setCurrency } = useFinance();
  const [step, setStep] = useState(1);
  const [inputValue, setInputValue] = useState('');

  const currencies = [
    { code: 'XOF', locale: 'fr-FR', name: 'Franc CFA (BCEAO)' },
    { code: 'EUR', locale: 'fr-FR', name: 'Euro (€)' },
    { code: 'USD', locale: 'en-US', name: 'Dollar ($)' },
    { code: 'MAD', locale: 'ar-MA', name: 'Dirham (MAD)' },
    { code: 'GNF', locale: 'fr-GN', name: 'Franc Guinéen' },
  ];

  const handleStart = () => {
    if (inputValue && parseFloat(inputValue) > 0) {
      setSalary(parseFloat(inputValue));
      setOnboarded(true);
    }
  };

  return (
    <div className="app-container" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
      {step === 1 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fade-in"
        >
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              margin: '0 auto 24px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <img src="/logo.png" alt="Dudukan Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>Bienvenue sur Dudukan</h1>
            <p style={{ color: 'var(--text-light)', fontSize: '16px', lineHeight: '1.6' }}>
              L'assistant intelligent qui vous aide à mieux gérer votre salaire et à éviter les dettes.
            </p>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--emerald-light)', padding: '10px', borderRadius: '12px', color: 'var(--emerald)' }}>
                <Wallet size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>Planification Intelligente</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Donnez une mission à chaque franc CFA de votre salaire.</p>
              </div>
            </div>
          </div>

          <button className="btn-primary" onClick={() => setStep(2)} style={{ marginTop: '20px' }}>
            Commencer <ArrowRight size={20} />
          </button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fade-in"
        >
          <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>Quel est votre salaire mensuel ?</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '32px' }}>
            Renseignez votre revenu fixe net pour que nous puissions organiser votre budget.
          </p>

          <div style={{ marginBottom: '24px' }}>
            <label className="label">Votre monnaie</label>
            <select 
              value={currency.code}
              onChange={(e) => {
                const selected = currencies.find(c => c.code === e.target.value);
                setCurrency(selected);
              }}
              style={{ 
                width: '100%', 
                padding: '14px', 
                borderRadius: '12px', 
                border: '1.5px solid #E5E7EB',
                fontSize: '16px',
                background: 'white',
                marginBottom: '20px'
              }}
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <label className="label">Salaire mensuel ({currency.code})</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="number" 
                placeholder="Ex: 150 000" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{ fontSize: '24px', fontWeight: 'bold', padding: '20px', paddingRight: '80px' }}
              />
              <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--navy)' }}>
                {currency.code}
              </span>
            </div>
          </div>

          <button 
            className="btn-primary" 
            onClick={handleStart}
            disabled={!inputValue}
            style={{ opacity: inputValue ? 1 : 0.6 }}
          >
            Organiser mon mois
          </button>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-light)' }}>
            Vos données sont stockées localement et restent privées.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Onboarding;
