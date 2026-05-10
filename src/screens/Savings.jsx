import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { PiggyBank, Plus, Minus, TrendingUp, TrendingDown, History, ShieldCheck, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Savings = () => {
  const { savings, addToSavings, withdrawFromSavings, formatCurrency, allExpenses, allIncome } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState('deposit'); // 'deposit' or 'withdraw'
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (val && val > 0) {
      if (mode === 'deposit') {
        addToSavings(val, note);
      } else {
        withdrawFromSavings(val, note);
      }
      setAmount('');
      setNote('');
      setShowForm(false);
    }
  };

  const depositHistory = allExpenses
    .filter(e => e.categoryId === 'savings')
    .map(e => ({ ...e, type: 'deposit' }));

  const withdrawalHistory = allIncome
    .filter(i => i.note?.includes('Retrait épargne') || i.note?.toLowerCase().includes('retrait'))
    .map(i => ({ ...i, type: 'withdraw' }));

  const savingsHistory = [...depositHistory, ...withdrawalHistory]
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '24px 20px' }}
    >
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px' }}>Mon Épargne</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Suivez vos économies en temps réel</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => { setMode('withdraw'); setShowForm(true); }}
            style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-pink)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Minus size={20} />
          </button>
          <button 
            onClick={() => { setMode('deposit'); setShowForm(true); }}
            style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--emerald)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      {/* Savings Total Card */}
      <div className="card" style={{ background: 'var(--emerald)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ opacity: 0.9, fontSize: '14px', marginBottom: '8px' }}>Total épargné</p>
          <h2 style={{ color: 'white', fontSize: '36px', fontWeight: '800' }}>{formatCurrency(savings)}</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', background: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '12px', width: 'fit-content' }}>
            <ShieldCheck size={16} />
            <span style={{ fontSize: '12px', fontWeight: '500' }}>Fonds sécurisé localement</span>
          </div>
        </div>
        <PiggyBank 
          size={120} 
          style={{ 
            position: 'absolute', 
            right: '-20px', 
            bottom: '-20px', 
            opacity: 0.1,
            transform: 'rotate(-15deg)'
          }} 
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="card" 
            style={{ marginTop: '20px', border: `1px solid ${mode === 'deposit' ? 'var(--emerald)' : 'var(--accent-pink)'}` }}
          >
            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>
              {mode === 'deposit' ? 'Alimenter mon épargne' : 'Retirer de mon épargne'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label className="label">Montant</label>
                <input 
                  type="number" 
                  placeholder="Ex: 5000" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label className="label">Motif (Optionnel)</label>
                <input 
                  type="text" 
                  placeholder={mode === 'deposit' ? "Ex: Économies mois d'Avril" : "Ex: Urgence médicale"} 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ background: mode === 'deposit' ? 'var(--emerald)' : 'var(--accent-pink)' }}
                >
                  {mode === 'deposit' ? 'Confirmer le dépôt' : 'Confirmer le retrait'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Savings Tips */}
      <div className="card" style={{ marginTop: '24px', background: 'var(--accent-blue-light)', border: 'none' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Target color="var(--accent-blue)" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '14px', color: 'var(--navy)', fontWeight: '600', marginBottom: '4px' }}>Objectif Conseillé</p>
            <p style={{ fontSize: '13px', color: 'var(--navy)', opacity: 0.8, lineHeight: '1.4' }}>
              Essayez de mettre de côté au moins 10% de votre salaire chaque mois avant de commencer vos dépenses.
            </p>
          </div>
        </div>
      </div>

      {/* History */}
      <div style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <History size={20} color="var(--text-light)" />
          <h3 style={{ fontSize: '18px' }}>Historique de l'épargne</h3>
        </div>

        {savingsHistory.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {savingsHistory.map((item) => (
              <div key={item.id} className="card" style={{ margin: 0, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '14px', 
                      background: item.type === 'deposit' ? 'var(--emerald-light)' : 'var(--accent-pink-light)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: item.type === 'deposit' ? 'var(--emerald)' : 'var(--accent-pink)'
                    }}>
                      {item.type === 'deposit' ? (
                        <PiggyBank size={20} />
                      ) : (
                        <TrendingUp size={20} />
                      )}
                    </div>
                    <div>
                      <p style={{ fontWeight: '600', fontSize: '15px' }}>{item.note || (item.type === 'deposit' ? 'Épargne' : 'Retrait')}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: '500', 
                          color: item.type === 'deposit' ? 'var(--emerald)' : 'var(--accent-pink)', 
                          background: item.type === 'deposit' ? 'var(--emerald-light)' : 'var(--accent-pink-light)', 
                          padding: '2px 6px', 
                          borderRadius: '4px' 
                        }}>
                          {item.type === 'deposit' ? 'Dépôt' : 'Retrait'}
                        </span>
                        <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                          {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p style={{ 
                    fontWeight: '700', 
                    fontSize: '16px',
                    color: item.type === 'deposit' ? 'var(--emerald)' : 'var(--accent-pink)' 
                  }}>
                    {item.type === 'deposit' ? '+' : '-'}{formatCurrency(item.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>
            Vous n'avez pas encore d'historique d'épargne.
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Savings;
