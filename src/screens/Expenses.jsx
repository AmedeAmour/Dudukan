import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { PlusCircle, MinusCircle, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Expenses = () => {
  const { categories, addExpense, addIncome, currency } = useFinance();
  const [type, setType] = useState('expense'); // 'expense' or 'income'
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('food');
  const [note, setNote] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount) return;

    if (type === 'expense') {
      addExpense({ amount: parseFloat(amount), categoryId, note });
    } else {
      addIncome({ amount: parseFloat(amount), note });
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
      className="free-screen free-expenses-screen"
      style={{ padding: '24px 20px' }}
    >
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px' }}>Ajouter une opération</h1>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Enregistrez vos entrées et sorties</p>
      </header>

      <div className="free-expense-type-toggle" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          onClick={() => setType('expense')}
          style={{ 
            flex: 1, 
            padding: '12px', 
            borderRadius: '16px', 
            border: 'none',
            background: type === 'expense' ? 'var(--navy)' : 'var(--white)',
            color: type === 'expense' ? 'white' : 'var(--text-main)',
            boxShadow: 'var(--shadow-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontWeight: '600'
          }}
        >
          <MinusCircle size={20} /> Dépense
        </button>
        <button 
          onClick={() => setType('income')}
          style={{ 
            flex: 1, 
            padding: '12px', 
            borderRadius: '16px', 
            border: 'none',
            background: type === 'income' ? 'var(--emerald)' : 'var(--white)',
            color: type === 'income' ? 'white' : 'var(--text-main)',
            boxShadow: 'var(--shadow-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontWeight: '600'
          }}
        >
          <PlusCircle size={20} /> Revenu
        </button>
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
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  borderRadius: '12px', 
                  border: '1.5px solid #E5E7EB',
                  fontSize: '16px',
                  background: 'white'
                }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
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
            style={{ background: type === 'expense' ? 'var(--navy)' : 'var(--emerald)' }}
          >
            {type === 'expense' ? 'Enregistrer la dépense' : 'Enregistrer le revenu'}
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
