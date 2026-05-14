import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CreditCard, Plus, User, Calendar, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Debts = () => {
  const { debts, addDebt, updateDebt, currency, formatCurrency } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [newDebt, setNewDebt] = useState({ lender: '', amount: '', dueDate: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    if (newDebt.lender && newDebt.amount) {
      addDebt({ ...newDebt, amount: parseFloat(newDebt.amount) });
      setNewDebt({ lender: '', amount: '', dueDate: '' });
      setShowAdd(false);
    }
  };

  const totalDebt = debts.reduce((acc, curr) => acc + curr.remaining, 0);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '24px 20px' }}
    >
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px' }}>Dettes</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Gérez vos remboursements</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--navy)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Plus size={20} />
        </button>
      </header>

      <div className="card" style={{ background: 'var(--accent-red)', color: 'white', border: 'none' }}>
        <p style={{ opacity: 0.9, fontSize: '14px' }}>Total des dettes</p>
        <h2 style={{ color: 'white', fontSize: '28px' }}>{formatCurrency(totalDebt)}</h2>
      </div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card">
          <h3 style={{ marginBottom: '16px' }}>Nouvelle dette</h3>
          <form onSubmit={handleAdd}>
            <div style={{ marginBottom: '12px' }}>
              <label className="label">Prêteur</label>
              <input 
                type="text" 
                placeholder="Ex: Banque, Ami, Boutique..." 
                value={newDebt.lender}
                onChange={(e) => setNewDebt({...newDebt, lender: e.target.value})}
                required
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label className="label">Montant ({currency.code})</label>
              <input 
                type="number" 
                placeholder="0" 
                value={newDebt.amount}
                onChange={(e) => setNewDebt({...newDebt, amount: e.target.value})}
                required
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label className="label">Date limite</label>
              <input 
                type="date" 
                value={newDebt.dueDate}
                onChange={(e) => setNewDebt({...newDebt, dueDate: e.target.value})}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Annuler</button>
              <button type="submit" className="btn-primary">Enregistrer</button>
            </div>
          </form>
        </motion.div>
      )}

      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Liste des dettes</h3>
        {debts.length > 0 ? (
          <>
            {debts.map((debt) => {
              const isPastDue = debt.dueDate && new Date(debt.dueDate) < new Date() && debt.remaining > 0;
              const progress = Math.round(((debt.amount - debt.remaining) / debt.amount) * 100);

              return (
                <div key={debt.id} className="card" style={{ opacity: debt.remaining === 0 ? 0.6 : 1, border: isPastDue ? '1px solid var(--accent-red-light)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-red-light)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={20} />
                      </div>
                      <div>
                        <p style={{ fontWeight: '600' }}>{debt.lender}</p>
                        <p style={{ fontSize: '12px', color: isPastDue ? 'var(--accent-red)' : 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} /> {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('fr-FR') : 'Non définie'}
                          {isPastDue && <span style={{ fontWeight: 'bold' }}>(Retard)</span>}
                        </p>
                      </div>
                    </div>
                    {debt.remaining === 0 ? (
                      <span className="badge badge-emerald">Payée</span>
                    ) : (
                      <p style={{
                            fontWeight: '700',
                            color: debt.remaining > 0 ? 'var(--accent-red)' : 'var(--navy)'
                          }}>{formatCurrency(debt.remaining)}</p>
                    )}
                  </div>

                  {debt.remaining > 0 && (
                    <>
                      <div className="progress-bar-container" style={{ marginBottom: '16px' }}>
                        <div className="progress-bar-fill" style={{ width: `${progress}%`, background: 'var(--accent-red)' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <input 
                              type="number" 
                              placeholder="Montant" 
                              id={`pay-${debt.id}`}
                              style={{ padding: '8px 12px', fontSize: '14px', height: '38px' }}
                            />
                          </div>
                          <button 
                            onClick={() => {
                              const val = document.getElementById(`pay-${debt.id}`).value;
                              if (val && parseFloat(val) > 0) {
                                updateDebt(debt.id, parseFloat(val));
                                document.getElementById(`pay-${debt.id}`).value = '';
                              }
                            }}
                            className="btn-secondary" 
                            style={{ padding: '0 16px', fontSize: '12px', width: 'auto', height: '38px' }}
                          >
                            Payer
                          </button>
                        </div>
                        <button 
                          onClick={() => updateDebt(debt.id, debt.remaining)}
                          className="btn-primary" 
                          style={{ padding: '8px', fontSize: '12px', height: '38px' }}
                        >
                          Tout régler
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {totalDebt > 0 && (
              <div className="card" style={{ background: 'var(--accent-blue-light)', border: 'none', marginTop: '24px' }}>
                <h4 style={{ fontSize: '15px', color: 'var(--navy)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} /> Stratégie de remboursement
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: '1.4' }}>
                  {debts.some(d => d.dueDate && new Date(d.dueDate) < new Date() && d.remaining > 0) 
                    ? "Priorité : Remboursez immédiatement vos dettes en retard pour éviter les pénalités ou tensions." 
                    : "Conseil : Utilisez la méthode 'Boule de Neige'. Remboursez d'abord la plus petite dette pour gagner en motivation."}
                </p>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>
            <CheckCircle2 size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>Félicitations, vous n'avez aucune dette enregistrée !</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Debts;
