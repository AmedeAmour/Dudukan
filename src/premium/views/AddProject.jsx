import React, { useState } from 'react';
import { usePremium } from '../context/PremiumContext';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Target, Layers, RefreshCw, Plus, Trash2 } from 'lucide-react';

const AddProject = ({ onBack }) => {
  const { fetchData, profile } = usePremium();
  const [type, setType] = useState('simple'); // simple, complex, recurring
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [steps, setSteps] = useState([{ name: '', amount: '' }]);
  const [loading, setLoading] = useState(false);

  const handleAddStep = () => setSteps([...steps, { name: '', amount: '' }]);
  const handleRemoveStep = (index) => setSteps(steps.filter((_, i) => i !== index));
  const handleStepChange = (index, field, value) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const projectData = {
        user_id: user.id,
        name,
        target_amount: type === 'complex' ? steps.reduce((acc, s) => acc + parseFloat(s.amount || 0), 0) : parseFloat(target),
        deadline: type === 'recurring' ? null : deadline,
        is_complex: type === 'complex',
        is_recurring: type === 'recurring',
        type: type, // simple, complex, recurring
        priority: 3,
        frequency: type === 'recurring' ? frequency : null
      };

      const { data: project, error: pError } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (pError) throw pError;

      if (type === 'complex' && steps.length > 0) {
        const milestonesData = steps.map((s, i) => ({
          project_id: project.id,
          name: s.name,
          amount: parseFloat(s.amount),
          step_order: i + 1
        }));

        const { error: mError } = await supabase
          .from('milestones')
          .insert(milestonesData);
        
        if (mError) throw mError;
      }

      await fetchData();
      onBack();
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-container fade-in" style={{ padding: '24px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--zenith-primary)', marginBottom: '32px', cursor: 'pointer', fontWeight: '700', fontFamily: 'var(--font-headings)' }}>
        <ArrowLeft size={20} strokeWidth={2.5} /> Retour
      </button>

      <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '28px', marginBottom: '8px' }}>Nouveau Projet</h2>
      <p style={{ color: 'var(--zenith-neutral)', marginBottom: '40px', fontSize: '15px' }}>Transformez vos ambitions en étapes mesurables.</p>

      {/* Type Selector Zenith Style */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
        {[
          { id: 'simple', label: 'Simple', icon: Target },
          { id: 'complex', label: 'Complexe', icon: Layers },
          { id: 'recurring', label: 'Récurrent', icon: RefreshCw },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            style={{
              flex: 1,
              padding: '20px 10px',
              borderRadius: 'var(--radius-lg)',
              border: type === t.id ? '2.5px solid var(--zenith-primary)' : '1.5px solid #E9ECEF',
              background: type === t.id ? 'rgba(26, 79, 139, 0.05)' : 'var(--zenith-white)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <t.icon size={22} strokeWidth={type === t.id ? 2.5 : 2} color={type === t.id ? 'var(--zenith-primary)' : 'var(--zenith-neutral)'} />
            <span style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-headings)', color: type === t.id ? 'var(--zenith-primary)' : 'var(--zenith-neutral)' }}>{t.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '24px' }}>
          <label className="label" style={{ fontFamily: 'var(--font-headings)', fontWeight: '700', color: 'var(--zenith-primary)', marginBottom: '8px', display: 'block' }}>Nom du projet</label>
          <input 
            required 
            className="premium-input"
            placeholder="Ex: Construction Villa, Voyage..." 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {type !== 'complex' && (
          <div style={{ marginBottom: '24px' }}>
            <label className="label" style={{ fontFamily: 'var(--font-headings)', fontWeight: '700', color: 'var(--zenith-primary)', marginBottom: '8px', display: 'block' }}>
              Montant {type === 'recurring' ? 'périodique' : 'total'}
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                required 
                type="number" 
                className="premium-input"
                placeholder="0.00"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                style={{ fontFamily: 'var(--font-data)', fontSize: '18px' }}
              />
              <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: 'var(--zenith-neutral)' }}>
                {profile?.currency?.code}
              </span>
            </div>
          </div>
        )}

        {type === 'recurring' ? (
          <div style={{ marginBottom: '24px' }}>
            <label className="label" style={{ fontFamily: 'var(--font-headings)', fontWeight: '700', color: 'var(--zenith-primary)', marginBottom: '8px', display: 'block' }}>Fréquence</label>
            <select 
              className="premium-input" 
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              style={{ appearance: 'none', background: 'var(--zenith-white)' }}
            >
              <option value="daily">Quotidien</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
              <option value="yearly">Annuel</option>
            </select>
          </div>
        ) : (
          <div style={{ marginBottom: '24px' }}>
            <label className="label" style={{ fontFamily: 'var(--font-headings)', fontWeight: '700', color: 'var(--zenith-primary)', marginBottom: '8px', display: 'block' }}>Date limite souhaitée</label>
            <input 
              required 
              type="date" 
              className="premium-input"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        )}

        {type === 'complex' && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label className="label" style={{ fontFamily: 'var(--font-headings)', fontWeight: '700', color: 'var(--zenith-primary)', marginBottom: 0 }}>Étapes Zenith</label>
              <button type="button" onClick={handleAddStep} style={{ background: 'none', border: 'none', color: 'var(--zenith-secondary)', fontWeight: '700', fontSize: '14px', fontFamily: 'var(--font-headings)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={18} strokeWidth={2.5} /> Ajouter
              </button>
            </div>
            {steps.map((step, index) => (
              <div key={index} className="premium-card" style={{ padding: '16px', marginBottom: '12px', background: 'rgba(248, 249, 250, 0.5)' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    required 
                    className="premium-input"
                    placeholder={`Libellé étape ${index + 1}`} 
                    value={step.name}
                    onChange={(e) => handleStepChange(index, 'name', e.target.value)}
                    style={{ flex: 2, padding: '12px 16px' }}
                  />
                  <input 
                    required 
                    type="number" 
                    className="premium-input"
                    placeholder="Montant"
                    value={step.amount}
                    onChange={(e) => handleStepChange(index, 'amount', e.target.value)}
                    style={{ flex: 1.5, padding: '12px 16px', fontFamily: 'var(--font-data)' }}
                  />
                  {steps.length > 1 && (
                    <button type="button" onClick={() => handleRemoveStep(index)} style={{ background: 'none', border: 'none', color: 'var(--zenith-error)', padding: '0 8px' }}>
                      <Trash2 size={22} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button type="submit" className="premium-btn" style={{ width: '100%', padding: '20px', fontSize: '18px', marginTop: '10px' }} disabled={loading}>
          {loading ? 'Finalisation...' : 'Valider le Projet Zenith'}
        </button>
      </form>
    </div>
  );
};

export default AddProject;
