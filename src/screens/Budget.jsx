import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { PieChart, Plus, Info, Utensils, Car, Home, CreditCard, PiggyBank, AlertCircle, User, ChevronRight, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Budget = () => {
  const { salary, categories, setCategories, getCategorySpent, getCategoryBudget, formatCurrency, balance } = useFinance();
  const [showModal, setShowModal] = useState(false);
  
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
      name: newName,
      icon: newIcon,
      color: newColor,
      limit: parseFloat(newLimit) / 100
    };

    setCategories([...categories, newCat]);
    setShowModal(false);
    setNewName('');
    setNewLimit('');
  };

  const iconOptions = [
    { name: 'Utensils', icon: Utensils },
    { name: 'Car', icon: Car },
    { name: 'Home', icon: Home },
    { name: 'CreditCard', icon: CreditCard },
    { name: 'PiggyBank', icon: PiggyBank },
    { name: 'AlertCircle', icon: AlertCircle },
    { name: 'User', icon: User }
  ];

  const colorOptions = [
    { name: 'Bleu', value: '--accent-blue' },
    { name: 'Vert', value: '--emerald' },
    { name: 'Orange', value: '--accent-orange' },
    { name: 'Rouge', value: '--accent-red' },
    { name: 'Navy', value: '--navy' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '24px 20px' }}
    >
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px' }}>Planification</h1>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Répartition suggérée de vos revenus</p>
      </header>

      <div className="card" style={{ background: 'var(--emerald)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ opacity: 0.9, fontSize: '14px' }}>Solde disponible</p>
            <h2 style={{ color: 'white', fontSize: '28px' }}>{formatCurrency(balance)}</h2>
          </div>
          <PieChart size={40} style={{ opacity: 0.3 }} />
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
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

          const today = new Date().getDate();
          const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
          const monthProgress = (today / daysInMonth) * 100;
          const isSpendingTooFast = percent > monthProgress + 10; // 10% tolerance

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

          const isInvestmentCat = cat.id === 'debt' || cat.id === 'savings';
          const remaining = budget - spent;
          const isOver = spent > budget;
          
          return (
            <div key={cat.id} className="card" style={{ marginBottom: '12px', border: isSpendingTooFast && !isOver ? '1px solid var(--accent-orange-light)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
                    <IconComponent size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p style={{ fontWeight: '600' }}>{cat.name}</p>
                      {isSpendingTooFast && !isOver && (
                        <span style={{ fontSize: '9px', background: 'var(--accent-orange-light)', color: 'var(--accent-orange)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                          RISQUE
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                      Budget: {formatCurrency(budget)}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${percent >= 100 ? (isInvestmentCat ? 'badge-emerald' : 'badge-red') : percent > 50 ? 'badge-orange' : 'badge-emerald'}`}>
                    {percent}%
                  </span>
                  <button 
                    onClick={() => handleDeleteCategory(cat.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: '4px', display: 'flex' }}
                    title="Supprimer la catégorie"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    width: `${percent}%`, 
                    background: percent >= 100 ? (isInvestmentCat ? 'var(--emerald)' : 'var(--accent-red)') : percent > 80 ? 'var(--accent-orange)' : color 
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>Utilisé: {formatCurrency(spent)}</p>
                <p style={{ 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: isOver ? (isInvestmentCat ? 'var(--emerald)' : 'var(--accent-red)') : percent > 80 ? 'var(--accent-orange)' : 'var(--text-main)' 
                }}>
                  {isOver && isInvestmentCat ? `+${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)} restants
                </p>
              </div>

              {isSpendingTooFast && !isOver && (
                <p style={{ fontSize: '11px', color: 'var(--accent-orange)', marginTop: '8px', fontStyle: 'italic' }}>
                  Vous dépensez plus vite que prévu pour ce mois. Ralentissez pour tenir jusqu'à la fin !
                </p>
              )}
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
