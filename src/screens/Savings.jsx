import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { PiggyBank, Plus, TrendingUp, History, ShieldCheck, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Savings = () => {
  const { savings, addToSavings, formatCurrency, allExpenses } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (amount && parseFloat(amount) > 0) {
      addToSavings(parseFloat(amount), note);
      setAmount('');
      setNote('');
      setShowAdd(false);
    }
  };

  const savingsHistory = allExpenses
    .filter(e => e.categoryId === 'savings')
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
        <button 
          onClick={() => setShowAdd(!showAdd)}
          style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--emerald)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Plus size={20} />
        </button>
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

      {showAdd && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }} 
          className="card" 
          style={{ marginTop: '20px' }}
        >
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Alimenter mon épargne</h3>
          <form onSubmit={handleAdd}>
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Montant à mettre de côté</label>
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
                placeholder="Ex: Économies mois d'Avril" 
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Annuler</button>
              <button type="submit" className="btn-primary" style={{ background: 'var(--emerald)' }}>Confirmer</button>
            </div>
          </form>
        </motion.div>
      )}

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
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--emerald-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp size={18} color="var(--emerald)" />
                    </div>
                    <div>
                      <p style={{ fontWeight: '600', fontSize: '15px' }}>{item.note || 'Épargne'}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>{new Date(item.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <p style={{ fontWeight: '700', color: 'var(--emerald)' }}>+{formatCurrency(item.amount)}</p>
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
