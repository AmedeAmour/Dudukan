import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { PieChart, Plus, Info, Utensils, Car, Home, CreditCard, PiggyBank, AlertCircle, User, ChevronRight, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Budget = () => {
  const { salary, categories, setCategories, getCategorySpent, getCategoryBudget, formatCurrency, balance, appMode, projects } = useFinance();
  const [showModal, setShowModal] = useState(false);
  
  // Premium specific logic: Strategic Plan
  const getStrategicPlan = () => {
    return projects.map(p => {
      const remaining = p.targetAmount - p.currentAmount;
      if (remaining <= 0) return { ...p, monthlyNeed: 0, status: 'completed' };
      
      const deadline = p.deadline ? new Date(p.deadline) : null;
      const today = new Date();
      if (!deadline || deadline <= today) return { ...p, monthlyNeed: remaining, status: 'urgent' };
      
      const monthsLeft = (deadline.getFullYear() - today.getFullYear()) * 12 + (deadline.getMonth() - today.getMonth());
      const monthlyNeed = monthsLeft > 0 ? remaining / monthsLeft : remaining;
      
      return { ...p, monthlyNeed, monthsLeft, status: monthlyNeed > salary * 0.5 ? 'hard' : 'feasible' };
    });
  };

  const plan = appMode === 'premium' ? getStrategicPlan() : [];
  const totalMonthlyNeed = plan.reduce((acc, p) => acc + p.monthlyNeed, 0);

  // Form state
  const [newName, setNewName] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [newIcon, setNewIcon] = useState('Utensils');
  const [newColor, setNewColor] = useState('--accent-blue');

  const handleDeleteCategory = (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette catégorie ?')) {
      setCategories(categories.filter(cat => cat.id !== id));
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newName || !newLimit) return;
    const newCat = {
      id: `${newName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: newName, icon: newIcon, color: newColor, limit: parseFloat(newLimit) / 100
    };
    setCategories([...categories, newCat]);
    setShowModal(false);
    setNewName(''); setNewLimit('');
  };

  const iconOptions = [
    { name: 'Utensils', icon: Utensils }, { name: 'Car', icon: Car }, { name: 'Home', icon: Home },
    { name: 'CreditCard', icon: CreditCard }, { name: 'PiggyBank', icon: PiggyBank },
    { name: 'AlertCircle', icon: AlertCircle }, { name: 'User', icon: User }
  ];

  const colorOptions = [
    { name: 'Bleu', value: '--accent-blue' }, { name: 'Vert', value: '--emerald' },
    { name: 'Orange', value: '--accent-orange' }, { name: 'Rouge', value: '--accent-red' },
    { name: 'Navy', value: '--navy' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '24px 20px' }}
    >
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px' }}>{appMode === 'premium' ? 'Plan Stratégique' : 'Planification'}</h1>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>
          {appMode === 'premium' ? 'Comment atteindre vos objectifs de vie' : 'Répartition suggérée de vos revenus'}
        </p>
      </header>

      <div className="card" style={{ background: appMode === 'premium' ? 'var(--navy)' : 'var(--emerald)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ opacity: 0.9, fontSize: '14px' }}>{appMode === 'premium' ? 'Besoin mensuel total' : 'Solde disponible'}</p>
            <h2 style={{ color: 'white', fontSize: '28px' }}>{formatCurrency(appMode === 'premium' ? totalMonthlyNeed : balance)}</h2>
          </div>
          <PieChart size={40} style={{ opacity: 0.3 }} />
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        {appMode === 'premium' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px' }}>Plan de financement</h3>
            </div>
            
            {plan.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ color: 'var(--text-light)' }}>Aucun projet actif à planifier.</p>
              </div>
            ) : (
              plan.map(p => (
                <div key={p.id} className="card" style={{ marginBottom: '12px', borderLeft: `4px solid ${p.status === 'urgent' ? 'var(--accent-red)' : p.status === 'hard' ? 'var(--accent-orange)' : 'var(--emerald)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontWeight: '700' }}>{p.name}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                        {p.monthsLeft > 0 ? `Échéance dans ${p.monthsLeft} mois` : 'Échéance dépassée'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: '700', color: 'var(--navy)' }}>{formatCurrency(p.monthlyNeed)} / mois</p>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: p.status === 'urgent' ? 'var(--accent-red)' : p.status === 'hard' ? 'var(--accent-orange)' : 'var(--emerald)' }}>
                        {p.status === 'urgent' ? 'URGENT' : p.status === 'hard' ? 'DIFFICILE' : 'RÉALISABLE'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Info size={14} color="var(--text-light)" />
                    <p style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                      {p.status === 'hard' 
                        ? "Ce projet nécessite plus de 50% de vos revenus. Envisagez d'allonger le délai." 
                        : "Continuez ainsi pour atteindre votre objectif à temps."}
                    </p>
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px' }}>Répartition par catégories</h3>
              <button 
                onClick={() => setShowModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--navy)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}
              >
                <Plus size={16} /> Ajouter
              </button>
            </div>

            {categories.map((cat) => {
              const budget = getCategoryBudget(cat.id);
              const spent = getCategorySpent(cat.id);
              const percent = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
              const color = `var(${cat.color})`;
              const IconComponent = { Utensils, Car, Home, CreditCard, PiggyBank, AlertCircle, User }[cat.icon] || Info;
              const isInvestmentCat = cat.id === 'debt' || cat.id === 'savings';
              const remaining = budget - spent;
              const isOver = spent > budget;
              
              return (
                <div key={cat.id} className="card" style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
                        <IconComponent size={20} />
                      </div>
                      <div>
                        <p style={{ fontWeight: '600' }}>{cat.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>Budget: {formatCurrency(budget)}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${percent >= 100 ? (isInvestmentCat ? 'badge-emerald' : 'badge-red') : 'badge-emerald'}`}>
                        {percent}%
                      </span>
                      <button onClick={() => handleDeleteCategory(cat.id)} style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${percent}%`, background: color }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>Utilisé: {formatCurrency(spent)}</p>
                    <p style={{ fontSize: '12px', fontWeight: '600' }}>{formatCurrency(remaining)} restants</p>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="card" style={{ marginTop: '24px', border: '1px dashed var(--text-light)', background: 'none' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Info size={20} color="var(--text-light)" />
          <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>
            Vous pouvez modifier ces limites dans les paramètres pour les adapter à vos besoins réels.
          </p>
        </div>
      </div>

      {/* Modal Ajouter Catégorie */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              background: 'rgba(0,0,0,0.5)', 
              zIndex: 3000,
              display: 'flex',
              alignItems: 'flex-end'
            }}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ 
                background: 'var(--bg-main)', 
                width: '100%', 
                maxWidth: '500px', 
                margin: '0 auto', 
                borderTopLeftRadius: '32px', 
                borderTopRightRadius: '32px',
                padding: '32px 24px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px' }}>Nouvelle catégorie</h2>
                <button onClick={() => setShowModal(false)} style={{ background: '#F3F4F6', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                  <Plus style={{ transform: 'rotate(45deg)' }} size={20} />
                </button>
              </div>

              <form onSubmit={handleAddCategory}>
                <div style={{ marginBottom: '20px' }}>
                  <label className="label">Nom de la catégorie</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Loisirs, Santé..." 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label className="label">Part du revenu (%)</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 10" 
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    required
                  />
                  <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>
                    Indiquez quel pourcentage de votre revenu total vous allouez à cette catégorie.
                  </p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label className="label">Icône</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {iconOptions.map((item) => (
                      <div 
                        key={item.name}
                        onClick={() => setNewIcon(item.name)}
                        style={{ 
                          width: '44px', 
                          height: '44px', 
                          borderRadius: '12px', 
                          background: newIcon === item.name ? 'var(--navy)' : 'white',
                          color: newIcon === item.name ? 'white' : 'var(--text-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-soft)',
                          border: newIcon === item.name ? 'none' : '1px solid #F3F4F6'
                        }}
                      >
                        <item.icon size={20} />
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <label className="label">Couleur</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {colorOptions.map((color) => (
                      <div 
                        key={color.value}
                        onClick={() => setNewColor(color.value)}
                        style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          background: `var(${color.value})`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid white',
                          boxShadow: newColor === color.value ? '0 0 0 2px var(--navy)' : 'none'
                        }}
                      >
                        {newColor === color.value && <Check size={16} color="white" />}
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-primary">
                  Créer la catégorie
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Budget;
