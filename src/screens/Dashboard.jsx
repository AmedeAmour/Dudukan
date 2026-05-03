import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { TrendingUp, TrendingDown, Calendar, AlertCircle, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { salary, balance, totalExpenses, resteAVivre, daysRemaining, expenses } = useFinance();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' F';
  };

  const recentTransactions = expenses.slice(-3).reverse();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '24px 20px' }}
    >
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px' }}>Bonjour !</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Voici l'état de vos finances</p>
        </div>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--white)', display: 'flex', alignItems: 'center', justifySelf: 'center', boxShadow: 'var(--shadow-soft)', color: 'var(--navy)' }}>
          <Calendar size={20} style={{ margin: '0 auto' }} />
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
      <div className="card" style={{ borderLeft: '4px solid var(--emerald)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'var(--text-light)', fontSize: '13px', marginBottom: '4px' }}>Moyenne conseillée par jour</p>
            <h3 style={{ fontSize: '20px' }}>{formatCurrency(resteAVivre)} / jour</h3>
            <p style={{ color: 'var(--text-light)', fontSize: '12px', marginTop: '4px' }}>
              Il vous reste <span style={{ color: 'var(--navy)', fontWeight: '600' }}>{daysRemaining} jours</span> avant la fin du mois.
            </p>
          </div>
          <div style={{ background: 'var(--emerald-light)', color: 'var(--emerald)', padding: '12px', borderRadius: '16px' }}>
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Alerts or Tips Section */}
      <div className="card" style={{ background: 'var(--accent-blue-light)', border: 'none' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <AlertCircle color="var(--accent-blue)" />
          <p style={{ fontSize: '14px', color: 'var(--navy)', lineHeight: '1.4' }}>
            <strong>Conseil :</strong> L'augmentation salariale n'est utile que si vos habitudes changent. Commencez par épargner 5% ce mois-ci.
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px' }}>Transactions récentes</h3>
          <button style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '14px', fontWeight: '500' }}>
            Voir tout
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          recentTransactions.map((tx) => (
            <div key={tx.id} className="card" style={{ marginBottom: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingDown size={18} color="var(--text-light)" />
                  </div>
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '15px' }}>{tx.note || 'Dépense'}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>{new Date(tx.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <p style={{ fontWeight: '700', color: 'var(--text-main)' }}>-{formatCurrency(tx.amount)}</p>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>
            Aucune transaction ce mois-ci.
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Dashboard;
