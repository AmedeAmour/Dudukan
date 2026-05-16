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
    <div className="premium-container fade-in" style={{ padding: '20px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--navy)', marginBottom: '24px', cursor: 'pointer', fontWeight: '600' }}>
        <ArrowLeft size={20} /> Retour
      </button>

      <h2 className="font-outfit" style={{ marginBottom: '8px' }}>Nouveau Projet de Vie</h2>
      <p style={{ color: 'var(--text-light)', marginBottom: '32px' }}>Transformez vos rêves en étapes concrètes.</p>

      {/* Type Selector */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '32px' }}>
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
              padding: '16px 10px',
              borderRadius: 'var(--radius-md)',
              border: type === t.id ? '2px solid var(--navy)' : '1px solid #E5E7EB',
              background: type === t.id ? 'rgba(26, 43, 72, 0.05)' : 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <t.icon size={20} color={type === t.id ? 'var(--navy)' : 'var(--text-light)'} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: type === t.id ? 'var(--navy)' : 'var(--text-light)' }}>{t.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label className="label">Nom du projet</label>
          <input 
            required 
            placeholder="Ex: Construction Villa, Voyage, Loyer..." 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {type !== 'complex' && (
          <div style={{ marginBottom: '20px' }}>
            <label className="label">Montant {type === 'recurring' ? 'périodique' : 'total'}</label>
            <input 
              required 
              type="number" 
              placeholder={`0 ${profile?.currency?.code}`}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>
        )}

        {type === 'recurring' ? (
          <div style={{ marginBottom: '20px' }}>
            <label className="label">Fréquence</label>
            <select 
              className="premium-input" 
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #E5E7EB' }}
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <option value="daily">Quotidien</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
              <option value="yearly">Annuel</option>
            </select>
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <label className="label">Date limite souhaitée</label>
            <input 
              required 
              type="date" 
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        )}

        {type === 'complex' && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label className="label" style={{ marginBottom: 0 }}>Étapes du projet</label>
              <button type="button" onClick={handleAddStep} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={16} /> Ajouter
              </button>
            </div>
            {steps.map((step, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input 
                  required 
                  placeholder={`Étape ${index + 1}`} 
                  value={step.name}
                  onChange={(e) => handleStepChange(index, 'name', e.target.value)}
                  style={{ flex: 2 }}
                />
                <input 
                  required 
                  type="number" 
                  placeholder="Montant"
                  value={step.amount}
                  onChange={(e) => handleStepChange(index, 'amount', e.target.value)}
                  style={{ flex: 1.5 }}
                />
                {steps.length > 1 && (
                  <button type="button" onClick={() => handleRemoveStep(index)} style={{ background: 'none', border: 'none', color: '#EF4444' }}>
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <button type="submit" className="premium-btn" style={{ width: '100%', marginTop: '20px' }} disabled={loading}>
          {loading ? 'Création...' : 'Créer le projet'}
        </button>
      </form>
    </div>
  );
};

export default AddProject;
