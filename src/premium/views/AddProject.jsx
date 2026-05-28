import React, { useState } from 'react';
import { usePremium } from '../context/PremiumContext';
import { supabase } from '../../supabaseClient';
import { 
  ArrowLeft, 
  Target, 
  Layers, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Info 
} from 'lucide-react';

const AddProject = ({ onBack }) => {
  const { fetchData, profile, currency } = usePremium();
  const [type, setType] = useState('simple'); // simple, complex, recurring
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [priority, setPriority] = useState(3);
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
      if (!user) throw new Error("Utilisateur non connecté.");

      const isComplex = type === 'complex';
      const isRecurring = type === 'recurring';

      // 1. Calculate final target amount
      const targetAmount = isComplex 
        ? steps.reduce((acc, s) => acc + (parseFloat(s.amount.toString().replace(/[\s,]/g, '') || 0) || 0), 0) 
        : parseFloat(target.toString().replace(/[\s,]/g, '') || 0) || 0;

      if (isNaN(targetAmount) || targetAmount <= 0) {
        throw new Error("Veuillez renseigner un montant cible valide supérieur à 0.");
      }

      const projectData = {
        user_id: user.id,
        name,
        target_amount: targetAmount,
        current_amount: 0,
        deadline: isRecurring ? null : deadline,
        is_complex: isComplex,
        is_recurring: isRecurring,
        type: type, 
        frequency: isRecurring ? frequency : null,
        priority: parseInt(priority)
      };

      // 2. Insert project to Supabase
      const { data: project, error: pError } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (pError) throw pError;

      // 3. Insert Milestones for complex project
      if (isComplex && steps.length > 0) {
        const milestonesData = steps.map((s, i) => ({
          project_id: project.id,
          user_id: user.id,
          name: s.name || `Étape ${i + 1}`,
          target_amount: parseFloat(s.amount.toString().replace(/[\s,]/g, '') || 0) || 0,
          is_completed: false
        }));

        const { error: mError } = await supabase
          .from('milestones')
          .insert(milestonesData);
        
        if (mError) throw mError;
      }

      await fetchData();
      onBack();
    } catch (error) {
      alert('Erreur de création : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: '500px', margin: '0 auto' }}>
      
      {/* Return Button */}
      <button 
        onClick={onBack} 
        style={{ 
          background: 'none', 
          border: 'none', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: 'var(--zenith-primary)', 
          marginBottom: '28px', 
          cursor: 'pointer', 
          fontWeight: '700', 
          fontFamily: 'var(--font-headings)' 
        }}
      >
        <ArrowLeft size={18} strokeWidth={2.5} /> Retour aux projets
      </button>

      <h2 className="font-heading" style={{ fontSize: '28px', color: 'var(--zenith-on-surface)', margin: '0 0 6px 0' }}>
        Planifier un Projet
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--zenith-on-surface-variant)', marginBottom: '32px' }}>
        Donnez forme à vos projets, à votre rythme, avec un plan clair.
      </p>

      {/* Type Selector (Simple, Complex, Recurring) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '32px' }}>
        {[
          { id: 'simple', label: 'Simple', icon: Target },
          { id: 'complex', label: 'Complexe', icon: Layers },
          { id: 'recurring', label: 'Récurrent', icon: RefreshCw },
        ].map((t) => {
          const Icon = t.icon;
          const isSelected = type === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              style={{
                flex: 1,
                padding: '16px 8px',
                borderRadius: 'var(--radius-lg)',
                border: isSelected ? '2px solid var(--zenith-primary)' : '1px solid var(--zenith-outline-variant)',
                background: isSelected ? 'rgba(26, 79, 139, 0.05)' : 'var(--zenith-white)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={20} color={isSelected ? 'var(--zenith-primary)' : 'var(--zenith-on-surface-variant)'} />
              <span className="font-heading" style={{ 
                fontSize: '11px', 
                color: isSelected ? 'var(--zenith-primary)' : 'var(--zenith-on-surface-variant)' 
              }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Name input */}
        <div>
          <label className="font-heading" style={{ fontSize: '14px', color: 'var(--zenith-primary)', display: 'block', marginBottom: '8px' }}>
            Nom du projet
          </label>
          <input 
            required 
            type="text"
            placeholder="Ex: Voyage au Japon, Épargne Maison..." 
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid var(--zenith-outline-variant)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Dynamic target input (hidden for Complex since it computes from milestones) */}
        {type !== 'complex' && (
          <div>
            <label className="font-heading" style={{ fontSize: '14px', color: 'var(--zenith-primary)', display: 'block', marginBottom: '8px' }}>
              Montant {type === 'recurring' ? 'périodique' : 'total'} cible
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                required 
                type="number" 
                placeholder="0.00"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  paddingRight: '60px',
                  border: '1px solid var(--zenith-outline-variant)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-data)',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span className="font-heading" style={{ 
                position: 'absolute', 
                right: '16px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                fontSize: '12px',
                color: 'var(--zenith-on-surface-variant)' 
              }}>
                {currency?.code || 'XOF'}
              </span>
            </div>
          </div>
        )}

        {/* Priority dropdown */}
        <div>
          <label className="font-heading" style={{ fontSize: '14px', color: 'var(--zenith-primary)', display: 'block', marginBottom: '8px' }}>
            Niveau de priorité
          </label>
          <select 
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid var(--zenith-outline-variant)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'var(--zenith-surface)',
              boxSizing: 'border-box'
            }}
          >
            <option value={5}>Faible (5)</option>
            <option value={3}>Moyenne (3)</option>
            <option value={1}>Haute priorité (1)</option>
          </select>
        </div>

        {/* Conditional deadline / frequency */}
        {type === 'recurring' ? (
          <div>
            <label className="font-heading" style={{ fontSize: '14px', color: 'var(--zenith-primary)', display: 'block', marginBottom: '8px' }}>
              Fréquence de prélèvement
            </label>
            <select 
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid var(--zenith-outline-variant)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'var(--zenith-surface)',
                boxSizing: 'border-box'
              }}
            >
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
              <option value="yearly">Annuel</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="font-heading" style={{ fontSize: '14px', color: 'var(--zenith-primary)', display: 'block', marginBottom: '8px' }}>
              Date limite souhaitée
            </label>
            <input 
              required 
              type="date" 
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid var(--zenith-outline-variant)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        {/* Complex Project Steps / Milestones Builder */}
        {type === 'complex' && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="font-heading" style={{ fontSize: '14px', color: 'var(--zenith-primary)' }}>
                Étapes de réalisation
              </label>
              <button 
                type="button" 
                onClick={handleAddStep}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--zenith-secondary)',
                  fontFamily: 'var(--font-headings)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={16} /> Ajouter une étape
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {steps.map((step, idx) => (
                <div 
                  key={idx}
                  style={{
                    backgroundColor: 'var(--zenith-surface-muted)',
                    border: '1px solid var(--zenith-outline-variant)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', fontWeight: 700 }}>
                      Étape {idx + 1}
                    </span>
                    {steps.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveStep(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--zenith-status-alert)', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      required 
                      type="text" 
                      placeholder="Libellé (ex: Fondations...)"
                      value={step.name}
                      onChange={(e) => handleStepChange(idx, 'name', e.target.value)}
                      style={{
                        flex: 2,
                        padding: '10px 12px',
                        border: '1px solid var(--zenith-outline-variant)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '13px',
                        outline: 'none',
                        backgroundColor: 'var(--zenith-surface)'
                      }}
                    />
                    <input 
                      required 
                      type="number" 
                      placeholder="Montant"
                      value={step.amount}
                      onChange={(e) => handleStepChange(idx, 'amount', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid var(--zenith-outline-variant)',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-data)',
                        fontSize: '13px',
                        outline: 'none',
                        backgroundColor: 'var(--zenith-surface)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total Sum indicator for complex projects */}
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(26, 79, 139, 0.05)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px'
            }}>
              <span className="font-heading" style={{ color: 'var(--zenith-primary)' }}>Montant total estimé</span>
              <span className="font-data" style={{ fontWeight: 700, color: 'var(--zenith-primary)' }}>
                {steps.reduce((acc, s) => acc + parseFloat(s.amount || 0), 0).toLocaleString()} {currency?.code || 'XOF'}
              </span>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button 
          type="submit" 
          disabled={loading}
          style={{
            marginTop: '16px',
            backgroundColor: 'var(--zenith-primary)',
            color: 'white',
            border: 'none',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-headings)',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--zenith-shadow-soft)',
            transition: 'opacity 0.2s'
          }}
        >
          {loading ? 'Planification en cours...' : 'Créer mon projet'}
        </button>

      </form>
    </div>
  );
};

export default AddProject;
