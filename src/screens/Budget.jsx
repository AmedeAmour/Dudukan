import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { PieChart, Plus, Info, Utensils, Car, Home, CreditCard, PiggyBank, AlertCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';

const Budget = () => {
  const { salary, categories, getCategorySpent, getCategoryBudget } = useFinance();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' F';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '24px 20px' }}
    >
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px' }}>Planification</h1>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Répartition suggérée de votre salaire</p>
      </header>

      <div className="card" style={{ background: 'var(--emerald)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ opacity: 0.9, fontSize: '14px' }}>Budget Total</p>
            <h2 style={{ color: 'white', fontSize: '28px' }}>{formatCurrency(salary)}</h2>
          </div>
          <PieChart size={40} style={{ opacity: 0.3 }} />
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px' }}>Répartition par catégories</h3>
          <button style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--navy)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '10px', fontSize: '13px' }}>
            <Plus size={16} /> Ajouter
          </button>
        </div>

        {categories.map((cat) => {
          const budget = getCategoryBudget(cat.id);
          const spent = getCategorySpent(cat.id);
          const percent = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
          const color = `var(${cat.color})`;

          const iconMap = {
            Utensils: Utensils,
            Car: Car,
            Home: Home,
            CreditCard: CreditCard,
            PiggyBank: PiggyBank,
            AlertCircle: AlertCircle,
            User: User
          };
          const IconComponent = iconMap[cat.icon] || Info;

          return (
            <div key={cat.id} className="card" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
                    <IconComponent size={20} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '600' }}>{cat.name}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                      Budget: {formatCurrency(budget)}
                    </p>
                  </div>
                </div>
                <span className={`badge ${percent > 90 ? 'badge-pink' : percent > 50 ? 'badge-orange' : 'badge-emerald'}`}>
                  {percent}%
                </span>
              </div>
              
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${percent}%`, background: percent > 90 ? 'var(--accent-pink)' : color }}
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>Utilisé: {formatCurrency(spent)}</p>
                <p style={{ fontSize: '12px', fontWeight: '600', color: percent > 90 ? 'var(--accent-pink)' : 'var(--text-main)' }}>
                  {formatCurrency(Math.max(0, budget - spent))} restants
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: '24px', border: '1px dashed var(--text-light)', background: 'none' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Info size={20} color="var(--text-light)" />
          <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>
            Vous pouvez modifier ces limites dans les paramètres pour les adapter à vos besoins réels.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Budget;
