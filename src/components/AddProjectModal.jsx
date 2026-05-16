import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Target, Home, Car, Smartphone, GraduationCap, Briefcase } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const AddProjectModal = ({ isOpen, onClose }) => {
  const { addProject } = useFinance();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [type, setType] = useState('other');
  const [isComplex, setIsComplex] = useState(false);
  const [milestones, setMilestones] = useState([{ name: '', amount: '' }]);

  const types = [
    { id: 'home', icon: Home, label: 'Logement' },
    { id: 'car', icon: Car, label: 'Véhicule' },
    { id: 'tech', icon: Smartphone, label: 'Équipement' },
    { id: 'education', icon: GraduationCap, label: 'Formation' },
    { id: 'business', icon: Briefcase, label: 'Business' },
    { id: 'other', icon: Target, label: 'Autre' },
  ];

  const handleAddMilestone = () => setMilestones([...milestones, { name: '', amount: '' }]);
  const handleRemoveMilestone = (idx) => setMilestones(milestones.filter((_, i) => i !== idx));
  const updateMilestone = (idx, field, value) => {
    const newM = [...milestones];
    newM[idx][field] = value;
    setMilestones(newM);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !targetAmount) return;

    addProject({
      name,
      targetAmount: parseFloat(targetAmount),
      deadline,
      type,
      isComplex,
      milestones: isComplex ? milestones.map(m => ({ ...m, amount: parseFloat(m.amount) })) : []
    });
    
    // Reset and close
    setName(''); setTargetAmount(''); setDeadline(''); setType('other'); setIsComplex(false); setMilestones([{ name: '', amount: '' }]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{ width: '100%', background: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy)' }}>Nouveau Projet</h2>
            <button onClick={onClose} style={{ padding: '8px', borderRadius: '50%', background: '#F3F4F6', border: 'none' }}><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '8px' }}>TYPE DE PROJET</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {types.map(t => (
                  <div 
                    key={t.id}
                    onClick={() => setType(t.id)}
                    style={{ 
                      padding: '12px 8px', 
                      borderRadius: '12px', 
                      border: type === t.id ? '2px solid var(--navy)' : '1.5px solid #F3F4F6',
                      background: type === t.id ? '#F0F7FF' : 'white',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: '0.2s'
                    }}
                  >
                    <div style={{ color: type === t.id ? 'var(--navy)' : '#9CA3AF', marginBottom: '4px' }}>
                      <t.icon size={20} style={{ margin: '0 auto' }} />
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: type === t.id ? 'var(--navy)' : '#6B7280' }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '8px' }}>NOM DU PROJET</label>
              <input 
                required
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Construction Villa, Voyage..."
                className="input-field"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '8px' }}>MONTANT CIBLE</label>
                <input 
                  required
                  type="number" 
                  value={targetAmount} 
                  onChange={e => setTargetAmount(e.target.value)}
                  placeholder="0"
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '8px' }}>DATE LIMITE</label>
                <input 
                  type="date" 
                  value={deadline} 
                  onChange={e => setDeadline(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px', padding: '16px', background: '#F9FAFB', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy)' }}>Projet complexe ?</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>Divisez votre projet en étapes clés.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={isComplex} 
                  onChange={e => setIsComplex(e.target.checked)}
                  style={{ width: '20px', height: '20px' }}
                />
              </div>

              {isComplex && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {milestones.map((m, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={m.name} 
                        onChange={e => updateMilestone(idx, 'name', e.target.value)}
                        placeholder="Étape (ex: Fondations)"
                        style={{ flex: 2, padding: '8px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                      />
                      <input 
                        type="number" 
                        value={m.amount} 
                        onChange={e => updateMilestone(idx, 'amount', e.target.value)}
                        placeholder="Montant"
                        style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                      />
                      {milestones.length > 1 && (
                        <button onClick={() => handleRemoveMilestone(idx)} type="button" style={{ color: 'var(--accent-red)', background: 'none', border: 'none' }}>
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={handleAddMilestone}
                    style={{ background: 'none', border: '1px dashed #D1D5DB', borderRadius: '8px', padding: '8px', color: 'var(--text-light)', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Plus size={14} /> Ajouter une étape
                  </button>
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary" style={{ height: '56px', fontSize: '16px' }}>
              Créer le projet
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddProjectModal;
