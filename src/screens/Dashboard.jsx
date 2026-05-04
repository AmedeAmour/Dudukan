import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, TrendingDown, Calendar, AlertCircle, ArrowUpRight, Plus, Minus, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = ({ setActiveTab }) => {
  const { salary, balance, totalExpenses, resteAVivre, daysRemaining, expenses, allTransactions, formatCurrency, savings } = useFinance();
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || '';
  const [showAll, setShowAll] = useState(false);

  const displayTransactions = showAll ? allTransactions : allTransactions.slice(0, 3);

  const lastExpense = expenses.length > 0 ? expenses[expenses.length - 1] : null;
  const daysSinceLastExpense = lastExpense ? Math.floor((new Date() - new Date(lastExpense.date)) / (1000 * 60 * 60 * 24)) : 0;
  const showReminder = expenses.length === 0 || daysSinceLastExpense >= 2;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '24px 20px' }}
    >
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px' }}>Bonjour {firstName ? firstName : '!'}</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Voici l'état de vos finances</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('settings')}
            style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--white)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifySelf: 'center', boxShadow: 'var(--shadow-soft)', color: 'var(--text-light)' }}
          >
            <SettingsIcon size={20} style={{ margin: '0 auto' }} />
          </button>
          <button 
            onClick={() => alert(`Aujourd'hui nous sommes le ${new Date().toLocaleDateString('fr-FR')}`)}
            style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--white)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifySelf: 'center', boxShadow: 'var(--shadow-soft)', color: 'var(--navy)' }}
          >
            <Calendar size={20} style={{ margin: '0 auto' }} />
          </button>
        </div>
      </header>

      {/* Main Balance Card */}
      <div className="card" style={{ background: 'var(--navy)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '8px' }}>Reste à vivre (Solde total)</p>
          <h2 style={{ color: 'white', fontSize: '32px', marginBottom: '24px' }}>{formatCurrency(balance)}</h2>
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8, fontSize: '12px', marginBottom: '4px' }}>
                <TrendingUp size={12} /> Revenus
              </div>
              <p style={{ fontWeight: '600' }}>{formatCurrency(salary)}</p>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8, fontSize: '12px', marginBottom: '4px' }}>
                <TrendingDown size={12} /> Dépenses
              </div>
              <p style={{ fontWeight: '600' }}>{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>
        <div style={{ 
          position: 'absolute', 
          right: '-20px', 
          bottom: '-20px', 
          width: '120px', 
          height: '120px', 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '50%' 
        }} />
      </div>

      {/* Reste à vivre daily card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="card" style={{ margin: 0 }}>
          <p style={{ color: 'var(--text-light)', fontSize: '12px', marginBottom: '4px' }}>Moyenne / jour</p>
          <h3 style={{ fontSize: '18px' }}>{formatCurrency(resteAVivre)}</h3>
          <p style={{ color: 'var(--text-light)', fontSize: '11px', marginTop: '4px' }}>{daysRemaining}j restants</p>
        </div>
        <div 
          className="card" 
          style={{ margin: 0, background: 'var(--emerald-light)', cursor: 'pointer' }}
          onClick={() => setActiveTab('savings')}
        >
          <p style={{ color: 'var(--emerald)', fontSize: '12px', marginBottom: '4px' }}>Épargne totale</p>
          <h3 style={{ fontSize: '18px', color: 'var(--navy)' }}>{formatCurrency(savings)}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <TrendingUp size={10} color="var(--emerald)" />
            <span style={{ fontSize: '11px', color: 'var(--emerald)', fontWeight: '600' }}>En hausse</span>
          </div>
        </div>
      </div>

      {/* Reminder Alert */}
      {showReminder && (
        <div className="card fade-in" style={{ background: 'var(--accent-orange-light)', border: 'none', cursor: 'pointer' }} onClick={() => setActiveTab('expenses')}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <AlertCircle color="var(--accent-orange)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '14px', color: 'var(--navy)', lineHeight: '1.4' }}>
              <strong>Rappel :</strong> {expenses.length === 0 ? "Vous n'avez pas encore noté de dépense ce mois-ci." : `Vous n'avez rien enregistré depuis ${daysSinceLastExpense} jours.`} N'oubliez pas de le faire pour suivre votre budget !
            </p>
          </div>
        </div>
      )}

      {/* Tips Section */}
      {!showReminder && (
        <div className="card" style={{ background: 'var(--accent-blue-light)', border: 'none' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <AlertCircle color="var(--accent-blue)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '14px', color: 'var(--navy)', lineHeight: '1.4' }}>
              <strong>Conseil :</strong> L'augmentation salariale n'est utile que si vos habitudes changent. Commencez par épargner 5% ce mois-ci.
            </p>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px' }}>{showAll ? 'Toutes les transactions (50j)' : 'Transactions récentes'}</h3>
          <button 
            onClick={() => setShowAll(!showAll)}
            style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
          >
            {showAll ? 'Réduire' : 'Voir tout'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <AnimatePresence>
            {displayTransactions.length > 0 ? (
              displayTransactions.map((tx) => (
                <motion.div 
                  key={tx.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="card" 
                  style={{ margin: 0, padding: '16px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '12px', 
                        background: tx.type === 'income' ? 'var(--emerald-light)' : '#F3F4F6', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        {tx.type === 'income' ? (
                          <TrendingUp size={18} color="var(--emerald)" />
                        ) : (
                          <TrendingDown size={18} color="var(--text-light)" />
                        )}
                      </div>
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '15px' }}>{tx.note || (tx.type === 'income' ? 'Revenu' : 'Dépense')}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>{new Date(tx.date).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <p style={{ fontWeight: '700', color: tx.type === 'income' ? 'var(--emerald)' : 'var(--text-main)' }}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>
                Aucune transaction récente.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
