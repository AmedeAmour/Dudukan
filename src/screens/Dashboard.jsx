import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, TrendingDown, Calendar, AlertCircle, ArrowUpRight, Plus, Minus, 
  Settings as SettingsIcon, Bell, BellOff, Utensils, Car, Home, CreditCard, 
  PiggyBank, User, Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationService } from '../NotificationService';

const Dashboard = ({ setActiveTab }) => {
  const { salary, totalIncome, balance, totalExpenses, resteAVivre, daysRemaining, expenses, allTransactions, formatCurrency, savings, categories, getFinancialHealth } = useFinance();
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || '';
  const [showAll, setShowAll] = useState(false);
  const [notifPermission, setNotifPermission] = useState(() => {
    try {
      return typeof Notification !== 'undefined' ? Notification.permission : 'denied';
    } catch (e) {
      return 'denied';
    }
  });

  const { score, projectedBalance, insights } = getFinancialHealth();

  const handleRequestNotif = async () => {
    try {
      const granted = await NotificationService.requestPermission();
      setNotifPermission(granted ? 'granted' : 'denied');
      if (granted) {
        NotificationService.sendNotification("C'est parti !", "Vous recevrez désormais des rappels intelligents.");
      } else {
        alert("Les notifications semblent bloquées. Pour les activer, cliquez sur l'icône de cadenas à gauche de l'adresse du site (URL) et autorisez les notifications.");
      }
    } catch (e) {
      alert("Votre appareil ne semble pas supporter les notifications.");
    }
  };

  const displayTransactions = showAll ? allTransactions : allTransactions.slice(0, 3);

  const lastExpense = expenses.length > 0 ? expenses[expenses.length - 1] : null;
  const daysSinceLastExpense = lastExpense ? Math.floor((new Date() - new Date(lastExpense.date)) / (1000 * 60 * 60 * 24)) : 0;
  const showReminder = expenses.length === 0 || daysSinceLastExpense >= 2;

  const getScoreColor = (s) => {
    if (s >= 80) return 'var(--emerald)';
    if (s >= 50) return 'var(--accent-orange)';
    return 'var(--accent-red)';
  };

  const iconMap = {
    Utensils: Utensils,
    Car: Car,
    Home: Home,
    CreditCard: CreditCard,
    PiggyBank: PiggyBank,
    AlertCircle: AlertCircle,
    User: User
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="free-screen free-dashboard-screen"
      style={{ padding: '24px 20px' }}
    >
      <header className="free-dashboard-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="free-dashboard-identity" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            onClick={() => setActiveTab('settings')}
            style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '50%', 
              background: 'var(--accent-blue-light)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              overflow: 'hidden',
              border: '2px solid white',
              boxShadow: 'var(--shadow-soft)',
              cursor: 'pointer'
            }}
          >
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={28} color="var(--accent-blue)" />
            )}
          </div>
          <div className="free-dashboard-greeting">
            <h1 style={{ fontSize: '24px', lineHeight: '1.2' }}>Bonjour {firstName ? firstName : '!'}</h1>
            <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Voici l'état de vos finances</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            aria-label="Ouvrir les réglages"
            onClick={() => setActiveTab('settings')}
            style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--white)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifySelf: 'center', boxShadow: 'var(--shadow-soft)', color: 'var(--text-light)' }}
          >
            <SettingsIcon size={20} style={{ margin: '0 auto' }} />
          </button>
        </div>
      </header>

      {/* Main Balance Card */}
      <div className="card free-hero-card free-balance-card" style={{ background: 'var(--navy)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="free-balance-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="free-balance-main">
              <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '8px' }}>Reste à vivre (Solde total)</p>
              <h2 className="free-money free-money-hero" style={{ color: 'white', fontSize: '32px', marginBottom: '24px' }}>{formatCurrency(balance)}</h2>
            </div>
            <div className="free-health-score" style={{ textAlign: 'right' }}>
              <div className="free-health-score-circle" style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '50%', 
                border: `3px solid ${getScoreColor(score)}`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.05)'
              }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: getScoreColor(score) }}>{score}</span>
              </div>
              <p style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>Score Santé</p>
            </div>
          </div>
          
          <div className="free-balance-breakdown" style={{ display: 'flex', gap: '20px' }}>
            <div className="free-balance-breakdown-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8, fontSize: '12px', marginBottom: '4px' }}>
                <TrendingUp size={12} /> {salary > 0 ? 'Revenus total' : 'Total Revenus'}
              </div>
              <p className="free-money" style={{ fontWeight: '600' }}>{formatCurrency(totalIncome)}</p>
            </div>
            <div className="free-balance-breakdown-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8, fontSize: '12px', marginBottom: '4px' }}>
                <TrendingDown size={12} /> Dépenses
              </div>
              <p className="free-money" style={{ fontWeight: '600' }}>{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>
        <div className="free-balance-decoration" style={{ 
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
      <div className="free-metric-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div className="card free-metric-card" style={{ margin: 0 }}>
          <p style={{ color: 'var(--text-light)', fontSize: '12px', marginBottom: '4px' }}>Moyenne / jour</p>
          <h3 className="free-money" style={{ fontSize: '18px' }}>{formatCurrency(resteAVivre)}</h3>
          <p style={{ color: 'var(--text-light)', fontSize: '11px', marginTop: '4px' }}>{daysRemaining}j restants</p>
        </div>
        <div 
          className="card free-metric-card"
          style={{ margin: 0, background: projectedBalance >= 0 ? 'var(--emerald-light)' : 'var(--accent-red-light)', cursor: 'pointer' }}
          onClick={() => setActiveTab('budget')}
        >
          <p style={{ color: projectedBalance >= 0 ? 'var(--emerald)' : 'var(--accent-red)', fontSize: '12px', marginBottom: '4px' }}>Prévision fin de mois</p>
          <h3 className="free-money" style={{ fontSize: '18px', color: 'var(--navy)' }}>{formatCurrency(projectedBalance)}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <Info size={10} color={projectedBalance >= 0 ? 'var(--emerald)' : 'var(--accent-red)'} />
            <span style={{ fontSize: '11px', color: projectedBalance >= 0 ? 'var(--emerald)' : 'var(--accent-red)', fontWeight: '600' }}>
              {projectedBalance >= 0 ? 'Surplus estimé' : 'Déficit estimé'}
            </span>
          </div>
        </div>
      </div>

      {/* Intelligent Insights */}
      {insights.length > 0 && (
        <div className="card" style={{ background: 'var(--bg-main)', border: '1.5px solid #F3F4F6', marginBottom: '12px' }}>
          <h4 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={16} color="var(--accent-blue)" /> Conseils intelligents
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {insights.map((insight, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-blue)', marginTop: '6px', flexShrink: 0 }} />
                <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.4' }}>{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Notification Permission Banner */}
      {notifPermission !== 'granted' && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card" 
          style={{ 
            background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--navy) 100%)', 
            color: 'white', 
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginTop: '12px'
          }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
              <Bell size={24} color="white" />
            </div>
            <div>
              <h4 style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>Activez les rappels</h4>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>Ne perdez plus le fil de vos dépenses quotidiennes.</p>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleRequestNotif();
            }}
            style={{ 
              background: 'white', 
              color: 'var(--navy)', 
              border: 'none', 
              padding: '14px', 
              borderRadius: '12px', 
              fontWeight: '700', 
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              position: 'relative',
              zIndex: 10
            }}
          >
            {notifPermission === 'denied' ? 'Réessayer l\'activation' : 'Activer maintenant'}
          </button>
        </motion.div>
      )}

      {/* Tips Section */}
      {!showReminder && (
        <div className="card" style={{ background: 'var(--accent-blue-light)', border: 'none' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <AlertCircle color="var(--accent-blue)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '14px', color: 'var(--navy)', lineHeight: '1.4' }}>
              <strong>Conseil :</strong> Gérez vos entrées d'argent intelligemment. {salary > 0 ? "Une augmentation n'est utile que si vos habitudes changent." : "Même avec des revenus irréguliers, l'épargne est la clé de votre liberté."}
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
              displayTransactions.map((tx) => {
                const category = tx.type === 'expense' ? categories.find(c => c.id === tx.categoryId) : null;
                const IconComponent = category ? (iconMap[category.icon] || Info) : (tx.type === 'income' ? TrendingUp : TrendingDown);
                const iconColor = category ? `var(${category.color})` : (tx.type === 'income' ? 'var(--emerald)' : 'var(--text-light)');
                const bgColor = category ? `var(${category.color}-light)` : (tx.type === 'income' ? 'var(--emerald-light)' : '#F3F4F6');

                return (
                  <motion.div 
                    key={tx.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="card free-transaction-card" 
                    style={{ margin: 0, padding: '16px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '44px', 
                          height: '44px', 
                          borderRadius: '14px', 
                          background: bgColor, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: iconColor
                        }}>
                          <IconComponent size={20} />
                        </div>
                        <div>
                          <p style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-main)' }}>
                            {tx.note || (tx.type === 'income' ? 'Revenu' : (tx.categoryId === 'debt' ? 'Remboursement' : category?.name || 'Dépense'))}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {category && (
                              <span style={{ fontSize: '11px', fontWeight: '500', color: iconColor, background: bgColor, padding: '2px 6px', borderRadius: '4px' }}>
                                {category.name}
                              </span>
                            )}
                            <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                              {new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="free-money free-transaction-amount" style={{ fontWeight: '700', fontSize: '16px', color: tx.type === 'income' ? 'var(--emerald)' : 'var(--text-main)' }}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  </motion.div>
                );
              })
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
