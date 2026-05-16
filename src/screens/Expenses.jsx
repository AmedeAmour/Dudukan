import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { PlusCircle, MinusCircle, Check, X, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Expenses = () => {
  const { categories, addExpense, addIncome, currency, appMode, projects, allocateToProjects } = useFinance();
  const [type, setType] = useState('expense'); // 'expense', 'income', or 'allocate'
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('food');
  const [note, setNote] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('auto'); // 'auto' or specific project ID

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount) return;

    if (type === 'expense') {
      addExpense({ amount: parseFloat(amount), categoryId, note });
    } else if (type === 'income') {
      addIncome({ amount: parseFloat(amount), note });
    } else if (type === 'allocate') {
      const val = parseFloat(amount);
      if (selectedProjectId === 'auto') {
        allocateToProjects(val);
      } else {
        // Implementation for specific project allocation in FinanceContext
        // For now, use the global allocator as a fallback or add specific logic
        allocateToProjects(val); 
      }
      addExpense({ amount: val, categoryId: 'savings', note: `Financement projet : ${note || 'Allocation'}` }, true);
    }

    setAmount('');
    setNote('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '24px 20px' }}
    >
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px' }}>{appMode === 'premium' ? 'Financer mes projets' : 'Ajouter une opération'}</h1>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>{appMode === 'premium' ? 'Allouez vos ressources intelligemment' : 'Enregistrez vos entrées et sorties'}</p>
      </header>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button 
          onClick={() => setType('expense')}
          style={{ 
            flex: 1, minWidth: '100px', padding: '12px', borderRadius: '16px', border: 'none',
            background: type === 'expense' ? 'var(--navy)' : 'var(--white)',
            color: type === 'expense' ? 'white' : 'var(--text-main)',
            boxShadow: 'var(--shadow-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: '600', fontSize: '13px'
          }}
        >
          <MinusCircle size={18} /> Dépense
        </button>
        <button 
          onClick={() => setType('income')}
          style={{ 
            flex: 1, minWidth: '100px', padding: '12px', borderRadius: '16px', border: 'none',
            background: type === 'income' ? 'var(--emerald)' : 'var(--white)',
            color: type === 'income' ? 'white' : 'var(--text-main)',
            boxShadow: 'var(--shadow-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: '600', fontSize: '13px'
          }}
        >
          <PlusCircle size={18} /> Revenu
        </button>
        {appMode === 'premium' && (
          <button 
            onClick={() => setType('allocate')}
            style={{ 
              flex: 1, minWidth: '100px', padding: '12px', borderRadius: '16px', border: 'none',
              background: type === 'allocate' ? 'var(--accent-blue)' : 'var(--white)',
              color: type === 'allocate' ? 'white' : 'var(--text-main)',
              boxShadow: 'var(--shadow-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: '600', fontSize: '13px'
            }}
          >
            <Target size={18} /> Financer
          </button>
        )}
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label className="label">Montant ({currency.code})</label>
            <input 
              type="number" 
              placeholder="0" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          {type === 'expense' && (
            <div style={{ marginBottom: '20px' }}>
              <label className="label">Catégorie</label>
              <select 
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #E5E7EB', fontSize: '16px', background: 'white' }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {type === 'allocate' && (
            <div style={{ marginBottom: '20px' }}>
              <label className="label">Destination</label>
              <select 
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #E5E7EB', fontSize: '16px', background: 'white' }}
              >
                <option value="auto">Répartition automatique (IA)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label className="label">Note (Optionnel)</label>
            <input 
              type="text" 
              placeholder={type === 'expense' && categoryId === 'debt' ? "Ex: Remboursement prêt, Boutique..." : "Ex: Marché, Taxi, Prime..."} 
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            style={{ 
              background: type === 'expense' ? 'var(--navy)' : type === 'income' ? 'var(--emerald)' : 'var(--accent-blue)' 
            }}
          >
            {type === 'expense' ? 'Enregistrer la dépense' : type === 'income' ? 'Enregistrer le revenu' : 'Allouer aux projets'}
          </button>
        </form>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{ 
              position: 'fixed', 
              bottom: '100px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              background: 'var(--emerald)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)',
              zIndex: 2000
            }}
          >
            <Check size={20} /> Opération enregistrée !
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Expenses;
