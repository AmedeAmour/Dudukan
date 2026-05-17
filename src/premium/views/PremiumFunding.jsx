import React, { useState } from 'react';
import { usePremium } from '../context/PremiumContext';
import { supabase } from '../../supabaseClient';
import { 
  Zap, 
  CheckCircle, 
  PlusCircle, 
  Brain, 
  TrendingUp, 
  Briefcase, 
  Wallet,
  Calendar,
  Layers
} from 'lucide-react';

const PremiumFunding = () => {
  const { profile, projects, calculateMonthlyNeed, fetchData } = usePremium();
  
  // Strategy toggle
  const [strategy, setStrategy] = useState('auto'); // auto, manual

  // Form states
  const [salaryInput, setSalaryInput] = useState(profile?.salary?.toString() || '');
  const [extraInput, setExtraInput] = useState('');
  const [savingsInput, setSavingsInput] = useState(profile?.savings?.toString() || '');
  const [loading, setLoading] = useState(false);

  // 1. Compute financial needs
  const salary = parseFloat(salaryInput || profile?.salary || 0);
  const savings = parseFloat(savingsInput || profile?.savings || 0);
  const extra = parseFloat(extraInput || 0);
  
  // Total available money for the month = salary + extra + savings
  const totalAvailableThisMonth = salary + extra;

  // Recurring costs
  const recurringProjects = projects.filter(p => p.is_recurring);
  const totalRecurringNeed = recurringProjects.reduce((acc, p) => acc + calculateMonthlyNeed(p), 0);

  // Goal/Project needs
  const targetProjects = projects.filter(p => !p.is_recurring);
  const totalTargetNeed = targetProjects.reduce((acc, p) => acc + calculateMonthlyNeed(p), 0);

  const totalMonthlyNeed = totalRecurringNeed + totalTargetNeed;

  // 2. Allocation Algorithm (Zenith AI)
  // Auto-allocate available monthly budget (Salary - Recurring costs)
  const remainingMonthlyBudget = Math.max(0, totalAvailableThisMonth - totalRecurringNeed);

  // Distribute remaining monthly budget to target projects based on priority
  // Higher priority (1) gets more weight than default priority (3) or low priority (5)
  const priorityWeights = { 1: 3, 3: 1.5, 5: 1 };
  
  const totalPriorityWeight = targetProjects.reduce((acc, p) => {
    const w = priorityWeights[p.priority] || 1;
    return acc + w;
  }, 0);

  // Compute allocations
  const projectAllocations = targetProjects.map(project => {
    const weight = priorityWeights[project.priority] || 1;
    const share = totalPriorityWeight > 0 ? weight / totalPriorityWeight : 0;
    
    // Target monthly need for this project
    const idealMonthlyNeed = calculateMonthlyNeed(project);
    
    // Allocation from Zenith Algorithm
    let allocation = remainingMonthlyBudget * share;

    // Can't allocate more than remaining needed target
    const remainingTarget = parseFloat(project.target_amount || 0) - parseFloat(project.current_amount || 0);
    allocation = Math.min(allocation, Math.max(0, remainingTarget));

    return {
      ...project,
      allocation,
      idealMonthlyNeed
    };
  });

  const totalAllocated = projectAllocations.reduce((acc, p) => acc + p.allocation, 0) + totalRecurringNeed;
  const leftToAllocate = Math.max(0, totalAvailableThisMonth - totalAllocated);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté.");

      const updatedSalary = parseFloat(salaryInput);
      const updatedSavings = parseFloat(savingsInput);

      if (isNaN(updatedSalary) || isNaN(updatedSavings)) {
        throw new Error("Veuillez renseigner des montants valides.");
      }

      // Update in Supabase profiles
      const { error } = await supabase
        .from('profiles')
        .update({
          salary: updatedSalary,
          savings: updatedSavings + extra // Roll over any extra earnings directly to savings if desired
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setExtraInput('');
      await fetchData();
      alert('Flux de ressources synchronisés avec succès !');
    } catch (err) {
      alert("Erreur d'optimisation : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const currencyCode = profile?.currency?.code || 'XOF';

  return (
    <div style={{ padding: '24px 20px', maxWidth: '500px', margin: '0 auto' }}>
      
      {/* Header section with toggle */}
      <div style={{ marginBottom: '32px' }}>
        <h2 className="font-heading" style={{ fontSize: '28px', color: 'var(--zenith-on-surface)', margin: '0 0 6px 0' }}>
          Configuration des flux
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--zenith-on-surface-variant)', marginBottom: '20px' }}>
          Saisissez vos nouvelles ressources pour que l'algorithme optimise leur répartition.
        </p>

        {/* Strategy Toggle */}
        <div style={{
          display: 'flex',
          backgroundColor: 'rgba(26, 79, 139, 0.05)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--zenith-outline-variant)',
          width: 'fit-content'
        }}>
          <button 
            onClick={() => setStrategy('auto')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontFamily: 'var(--font-headings)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: strategy === 'auto' ? 'var(--zenith-primary-container)' : 'transparent',
              color: strategy === 'auto' ? 'white' : 'var(--zenith-on-surface-variant)',
              transition: 'all 0.2s'
            }}
          >
            <Zap size={12} /> Automatique
          </button>
          <button 
            onClick={() => setStrategy('manual')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontFamily: 'var(--font-headings)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: strategy === 'manual' ? 'var(--zenith-primary-container)' : 'transparent',
              color: strategy === 'manual' ? 'white' : 'var(--zenith-on-surface-variant)',
              transition: 'all 0.2s'
            }}
          >
            Manuel
          </button>
        </div>
      </div>

      {/* Form and analysis panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
        
        {/* Resource Input Card */}
        <div style={{
          backgroundColor: 'var(--zenith-white)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--zenith-outline-variant)',
          boxShadow: 'var(--zenith-shadow-soft)'
        }}>
          <h3 className="font-heading" style={{ 
            fontSize: '16px', 
            color: 'var(--zenith-primary)', 
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <PlusCircle size={18} /> Nouveaux Entrants
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Monthly salary */}
            <div style={{ position: 'relative' }}>
              <label style={{ 
                position: 'absolute', 
                top: '-8px', 
                left: '12px', 
                backgroundColor: 'white', 
                padding: '0 4px',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--zenith-primary)' 
              }}>
                Revenus Mensuels
              </label>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                border: '1px solid var(--zenith-outline-variant)', 
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px'
              }}>
                <span className="font-data" style={{ marginRight: '8px', color: 'var(--zenith-on-surface-variant)' }}>{currencyCode}</span>
                <input 
                  type="number" 
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  placeholder="0.00" 
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    fontFamily: 'var(--font-data)',
                    fontSize: '16px',
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
            </div>

            {/* Extra exceptional income */}
            <div style={{ position: 'relative' }}>
              <label style={{ 
                position: 'absolute', 
                top: '-8px', 
                left: '12px', 
                backgroundColor: 'white', 
                padding: '0 4px',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--zenith-primary)' 
              }}>
                Bénéfices Exceptionnels
              </label>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                border: '1px solid var(--zenith-outline-variant)', 
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px'
              }}>
                <span className="font-data" style={{ marginRight: '8px', color: 'var(--zenith-on-surface-variant)' }}>{currencyCode}</span>
                <input 
                  type="number" 
                  value={extraInput}
                  onChange={(e) => setExtraInput(e.target.value)}
                  placeholder="0.00" 
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    fontFamily: 'var(--font-data)',
                    fontSize: '16px',
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
            </div>

            {/* Savings available */}
            <div style={{ position: 'relative' }}>
              <label style={{ 
                position: 'absolute', 
                top: '-8px', 
                left: '12px', 
                backgroundColor: 'white', 
                padding: '0 4px',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--zenith-primary)' 
              }}>
                Économies Disponibles
              </label>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                border: '1px solid var(--zenith-outline-variant)', 
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px'
              }}>
                <span className="font-data" style={{ marginRight: '8px', color: 'var(--zenith-on-surface-variant)' }}>{currencyCode}</span>
                <input 
                  type="number" 
                  value={savingsInput}
                  onChange={(e) => setSavingsInput(e.target.value)}
                  placeholder="0.00" 
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    fontFamily: 'var(--font-data)',
                    fontSize: '16px',
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: 'var(--zenith-primary)',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-headings)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--zenith-shadow-soft)',
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? 'Optimisation en cours...' : "Mettre à jour l'algorithme"}
            </button>
          </form>
        </div>

        {/* Assistant Analysis Panel */}
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px dashed var(--zenith-outline-variant)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--zenith-secondary-container)',
            color: 'var(--zenith-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            shrink: 0
          }}>
            <Brain size={20} />
          </div>
          <div>
            <h4 className="font-heading" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', margin: '0 0 4px 0' }}>
              Analyse de l'Assistant
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--zenith-on-surface-variant)', margin: 0, lineHeight: '1.5' }}>
              {targetProjects.length > 0
                ? `L'algorithme distribue actuellement ${Math.round(totalAllocated - totalRecurringNeed).toLocaleString()} ${currencyCode} vers vos objectifs de vie en priorisant ceux à date limite proche.`
                : "Aucun projet actif. Configurez vos objectifs dans l'onglet Projets pour activer l'analyse."}
            </p>
          </div>
        </div>

      </div>

      {/* Previsional Breakdown Panel */}
      <div style={{
        backgroundColor: 'var(--zenith-white)',
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--zenith-outline-variant)',
        boxShadow: 'var(--zenith-shadow-soft)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 className="font-heading" style={{ fontSize: '16px', color: 'var(--zenith-on-surface)', margin: 0 }}>
            Répartition Prévisionnelle
          </h3>
          <span style={{
            backgroundColor: '#E8F5E9',
            color: 'var(--zenith-secondary)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <CheckCircle size={12} /> Plan viable
          </span>
        </div>

        {/* Projects previsional list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Recurring projects */}
          {recurringProjects.map(project => {
            const need = calculateMonthlyNeed(project);
            return (
              <div key={project.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--zenith-data-recurring)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Récurrent
                    </span>
                    <h4 className="font-heading" style={{ fontSize: '14px', margin: '2px 0 0 0', color: 'var(--zenith-on-surface)' }}>
                      {project.name}
                    </h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="font-data" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', fontWeight: 700 }}>
                      {need.toLocaleString()} {currencyCode}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>/ mois</span>
                  </div>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--zenith-bg)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: 'var(--zenith-data-recurring)', width: '100%' }}></div>
                </div>
              </div>
            );
          })}

          {/* Allocated target projects */}
          {projectAllocations.map(project => {
            const current = parseFloat(project.current_amount || 0);
            const target = parseFloat(project.target_amount || 0);
            const currentPercent = target > 0 ? (current / target) * 100 : 0;
            const forecastPercent = target > 0 ? ((current + project.allocation) / target) * 100 : 0;
            const deltaPercent = Math.max(0, forecastPercent - currentPercent);

            const barColor = project.is_complex ? 'var(--zenith-data-complex)' : 'var(--zenith-primary)';

            return (
              <div key={project.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: barColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {project.is_complex ? 'Complexe' : 'Simple'}
                    </span>
                    <h4 className="font-heading" style={{ fontSize: '14px', margin: '2px 0 0 0', color: 'var(--zenith-on-surface)' }}>
                      {project.name}
                    </h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="font-data" style={{ fontSize: '15px', color: 'var(--zenith-primary)', fontWeight: 700 }}>
                      {Math.round(project.allocation).toLocaleString()} {currencyCode}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>/ mois</span>
                  </div>
                </div>

                {/* Double Progress Bar (Current + Forecast delta) */}
                <div style={{ 
                  height: '10px', 
                  backgroundColor: 'var(--zenith-bg)', 
                  borderRadius: 'var(--radius-pill)', 
                  overflow: 'hidden',
                  display: 'flex'
                }}>
                  <div style={{ 
                    height: '100%', 
                    backgroundColor: barColor, 
                    width: `${currentPercent}%` 
                  }}></div>
                  <div style={{ 
                    height: '100%', 
                    backgroundColor: barColor, 
                    opacity: 0.4,
                    width: `${deltaPercent}%`,
                    // subtle pulse effect mock style
                    animation: 'pulse 1.5s infinite' 
                  }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px' }}>
                  <span style={{ color: 'var(--zenith-on-surface-variant)', fontWeight: 600 }}>
                    Financement : {Math.round(currentPercent)}%
                  </span>
                  <span style={{ color: 'var(--zenith-secondary)', fontWeight: 700 }}>
                    +{Math.round(deltaPercent)}% via algorithme
                  </span>
                </div>
              </div>
            );
          })}

        </div>

        {/* Footer remaining to allocate */}
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid var(--zenith-outline-variant)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
              Reste à Allouer
            </span>
            <span className="font-data" style={{ fontSize: '24px', color: 'var(--zenith-primary)', fontWeight: 700 }}>
              {Math.round(leftToAllocate).toLocaleString()} {currencyCode}
            </span>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(0, 110, 28, 0.05)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '10px', color: 'var(--zenith-on-surface-variant)', margin: '0 0 2px 0' }}>Score de Faisabilité</p>
              <p className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-secondary)', margin: 0 }}>92%</p>
            </div>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '3px solid var(--zenith-secondary)',
              borderTopColor: 'var(--zenith-outline-variant)',
              transform: 'rotate(45deg)'
            }}></div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default PremiumFunding;
