import React, { useState } from 'react';
import { usePremium } from '../context/PremiumContext';
import { supabase } from '../../supabaseClient';
import { 
  Zap, 
  CheckCircle, 
  Brain, 
  AlertCircle,
  PiggyBank
} from 'lucide-react';

const PremiumFunding = () => {
  const { 
    projects, 
    calculateMonthlyNeed, 
    fetchData, 
    currency, 
    financeSavings,
    freeSalary,
    setLatestAllocationReport
  } = usePremium();
  
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const currencyCode = currency?.code || 'XOF';

  // 1. Calculations for Savings Breakdown
  const totalSavings = parseFloat(financeSavings || 0);
  const totalAllocatedToProjects = projects.reduce((acc, p) => acc + parseFloat(p.current_amount || 0), 0);
  const unallocatedSavings = Math.max(0, totalSavings - totalAllocatedToProjects);

  // 2. Compute allocations using unallocated savings
  const recurringProjects = projects.filter(p => p.is_recurring);
  const targetProjects = projects.filter(p => !p.is_recurring);

  // We distribute unallocated savings:
  // First, to recurring projects' monthly needs
  let remainingFunds = unallocatedSavings;

  const recurringAllocations = recurringProjects.map(project => {
    const need = calculateMonthlyNeed(project);
    const allocation = Math.min(remainingFunds, need);
    remainingFunds -= allocation;
    return {
      ...project,
      allocation
    };
  });

  // Then, distribute to target projects based on priority weights
  const priorityWeights = { 1: 3, 3: 1.5, 5: 1 };
  
  // Only target projects that are not yet fully funded
  const unfinishedTargets = targetProjects.filter(p => {
    const remaining = parseFloat(p.target_amount || 0) - parseFloat(p.current_amount || 0);
    return remaining > 0;
  });

  const totalPriorityWeight = unfinishedTargets.reduce((acc, p) => {
    const w = priorityWeights[p.priority] || 1;
    return acc + w;
  }, 0);

  const targetAllocations = targetProjects.map(project => {
    const remainingTarget = Math.max(0, parseFloat(project.target_amount || 0) - parseFloat(project.current_amount || 0));
    
    // If project is completed, allocation is 0
    if (remainingTarget <= 0) {
      return { ...project, allocation: 0, idealMonthlyNeed: calculateMonthlyNeed(project) };
    }

    const weight = priorityWeights[project.priority] || 1;
    const share = totalPriorityWeight > 0 ? weight / totalPriorityWeight : 0;
    
    // Distribute from the remaining funds after recurring allocations
    let allocation = remainingFunds * share;
    allocation = Math.min(allocation, remainingTarget);

    return {
      ...project,
      allocation,
      idealMonthlyNeed: calculateMonthlyNeed(project)
    };
  });

  // Calculate actual total allocated in preview
  const previewTotalAllocated = recurringAllocations.reduce((acc, p) => acc + p.allocation, 0) + 
                               targetAllocations.reduce((acc, p) => acc + p.allocation, 0);

  const handleExecuteAllocations = async () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setConfirming(false);
    setLoading(true);

    try {
      // Build allocation report before database mutations
      const report = {
        timestamp: new Date().toISOString(),
        totalSavingsAtExecution: totalSavings,
        totalAllocatedThisTime: previewTotalAllocated,
        projects: [
          ...recurringAllocations.map(p => ({
            id: p.id,
            name: p.name,
            is_recurring: true,
            is_complex: false,
            allocatedAmount: p.allocation,
            currentAmountBefore: parseFloat(p.current_amount || 0),
            currentAmountAfter: parseFloat(p.current_amount || 0) + p.allocation,
            targetAmount: parseFloat(p.target_amount || 0),
            steps: []
          })),
          ...targetAllocations.map(p => {
            const current = parseFloat(p.current_amount || 0);
            const target = parseFloat(p.target_amount || 0);
            const allocatedAmount = p.allocation;
            
            let steps = [];
            if (p.is_complex && p.milestones) {
              let remainingAllocation = allocatedAmount;
              const sortedMilestones = [...p.milestones].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
              
              steps = sortedMilestones.map((milestone, idx) => {
                const milestoneTarget = parseFloat(milestone.target_amount || 0);
                // Calculate dynamic allocated amount before this new allocation
                let previousTargetsSum = 0;
                for (let i = 0; i < idx; i++) {
                  previousTargetsSum += parseFloat(sortedMilestones[i].target_amount || 0);
                }
                const milestoneCurrentBefore = Math.max(0, Math.min(milestoneTarget, current - previousTargetsSum));
                const addedToStep = Math.max(0, Math.min(remainingAllocation, milestoneTarget - milestoneCurrentBefore));
                remainingAllocation -= addedToStep;
                const milestoneCurrentAfter = milestoneCurrentBefore + addedToStep;

                let status = 'non_commencee';
                if (milestone.is_completed || milestoneCurrentAfter >= milestoneTarget) {
                  status = 'realisee';
                } else if (milestoneCurrentAfter > 0) {
                  status = 'en_cours_de_financement';
                }

                return {
                  id: milestone.id,
                  name: milestone.name,
                  targetAmount: milestoneTarget,
                  currentBefore: milestoneCurrentBefore,
                  addedAmount: addedToStep,
                  currentAfter: milestoneCurrentAfter,
                  status: status
                };
              });
            }

            return {
              id: p.id,
              name: p.name,
              is_recurring: false,
              is_complex: p.is_complex,
              allocatedAmount: allocatedAmount,
              currentAmountBefore: current,
              currentAmountAfter: current + allocatedAmount,
              targetAmount: target,
              steps: steps
            };
          })
        ].filter(p => p.allocatedAmount > 0)
      };

      // 1. Process recurring projects updates
      for (const project of recurringAllocations) {
        if (project.allocation > 0) {
          const { error } = await supabase
            .from('projects')
            .update({ current_amount: parseFloat(project.current_amount || 0) + project.allocation })
            .eq('id', project.id);
          if (error) throw error;
        }
      }

      // 2. Process target projects updates
      for (const project of targetAllocations) {
        if (project.allocation > 0) {
          const newAmount = parseFloat(project.current_amount || 0) + project.allocation;
          
          // Update project current_amount
          const { error } = await supabase
            .from('projects')
            .update({ current_amount: newAmount })
            .eq('id', project.id);
          if (error) throw error;

          // If complex, distribute allocation among milestones sequentially
          if (project.is_complex && project.milestones) {
            let remainingAllocation = project.allocation;
            const sortedMilestones = [...project.milestones].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
            
            for (const milestone of sortedMilestones) {
              if (remainingAllocation <= 0) break;
              if (milestone.is_completed) continue;

              const milestoneTarget = parseFloat(milestone.target_amount || 0);
              // Calculate dynamic allocated amount for this milestone before this new allocation
              let previousTargetsSum = 0;
              const idx = sortedMilestones.findIndex(m => m.id === milestone.id);
              for (let i = 0; i < idx; i++) {
                previousTargetsSum += parseFloat(sortedMilestones[i].target_amount || 0);
              }
              const milestoneCurrent = Math.max(0, Math.min(milestoneTarget, parseFloat(project.current_amount || 0) - previousTargetsSum));
              const milestoneNeed = milestoneTarget - milestoneCurrent;
              
              if (milestoneNeed > 0) {
                const toAllocate = Math.min(remainingAllocation, milestoneNeed);
                const isCompleted = (milestoneCurrent + toAllocate) >= milestoneTarget;
                
                await supabase
                  .from('milestones')
                  .update({ is_completed: isCompleted })
                  .eq('id', milestone.id);
                
                remainingAllocation -= toAllocate;
              }
            }
          }
        }
      }

      // Update profile savings in Supabase to sync total savings state
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ savings: totalSavings })
          .eq('id', user.id);
      }

      await fetchData();
      setLatestAllocationReport(report);
      alert("Répartition automatique exécutée avec succès !");
    } catch (err) {
      alert("Erreur lors de l'allocation : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Viability Score
  let viability = 100;
  const monthlyNeed = projects.reduce((acc, p) => acc + calculateMonthlyNeed(p), 0);
  if (projects.length > 0) {
    const salary = parseFloat(freeSalary || 0);
    if (salary > 0 && monthlyNeed > 0) {
      const ratio = monthlyNeed / salary;
      if (ratio <= 0.4) {
        viability = 95;
      } else if (ratio <= 0.7) {
        viability = 80;
      } else {
        viability = Math.max(30, Math.round(100 - (ratio * 50)));
      }
    } else if (monthlyNeed > 0) {
      viability = 45;
    }
  }

  return (
    <div style={{ padding: '24px 20px', maxWidth: '500px', margin: '0 auto', paddingBottom: '100px' }}>
      
      {/* Header section */}
      <div style={{ marginBottom: '32px' }}>
        <h2 className="font-heading" style={{ fontSize: '28px', color: 'var(--zenith-on-surface)', margin: '0 0 6px 0' }}>
          Plan de Financement
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--zenith-on-surface-variant)', marginBottom: '20px' }}>
          Visualisez et répartissez votre épargne réelle disponible sur vos différents projets de vie.
        </p>
      </div>

      {/* Savings Breakdown Cards (Bento style) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
        
        {/* Total savings card */}
        <div style={{
          backgroundColor: 'var(--zenith-white)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--zenith-outline-variant)',
          boxShadow: 'var(--zenith-shadow-soft)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>
              Épargne Réelle Totale (Gratuit)
            </span>
            <span className="font-data" style={{ display: 'block', fontSize: '32px', color: 'var(--zenith-primary)', fontWeight: 800, marginTop: '8px' }}>
              {totalSavings.toLocaleString()} {currencyCode}
            </span>
            <p style={{ fontSize: '12px', color: 'var(--zenith-on-surface-variant)', marginTop: '8px' }}>
              Synchronisée automatiquement avec votre onglet Épargne.
            </p>
          </div>
          <PiggyBank 
            size={90} 
            color="var(--zenith-primary)" 
            style={{ 
              position: 'absolute', 
              right: '-10px', 
              bottom: '-10px', 
              opacity: 0.05,
              transform: 'rotate(-15deg)'
            }} 
          />
        </div>

        {/* Allocated vs Unallocated cards */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {/* Allocated */}
          <div style={{
            flex: 1,
            backgroundColor: 'var(--zenith-white)',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--zenith-outline-variant)',
            boxShadow: 'var(--zenith-shadow-soft)'
          }}>
            <span style={{ fontSize: '10px', color: 'var(--zenith-on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>
              Épargne Allouée
            </span>
            <span className="font-data" style={{ display: 'block', fontSize: '20px', color: 'var(--zenith-secondary)', fontWeight: 800, marginTop: '4px' }}>
              {totalAllocatedToProjects.toLocaleString()} {currencyCode}
            </span>
          </div>

          {/* Unallocated */}
          <div style={{
            flex: 1,
            backgroundColor: 'var(--zenith-white)',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--zenith-outline-variant)',
            boxShadow: 'var(--zenith-shadow-soft)'
          }}>
            <span style={{ fontSize: '10px', color: 'var(--zenith-on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>
              Épargne Non Allouée
            </span>
            <span className="font-data" style={{ display: 'block', fontSize: '20px', color: 'var(--zenith-primary)', fontWeight: 800, marginTop: '4px' }}>
              {unallocatedSavings.toLocaleString()} {currencyCode}
            </span>
          </div>
        </div>

        {/* Assistant Tip */}
        <div style={{
          backgroundColor: 'rgba(26, 79, 139, 0.05)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--zenith-outline-variant)',
          fontSize: '12px',
          color: 'var(--zenith-on-surface-variant)',
          lineHeight: '1.4'
        }}>
          💡 <strong>Astuce :</strong> Vous pouvez également répartir manuellement vos fonds en vous rendant sur la fiche de chaque projet dans l'onglet <strong>Projets</strong>.
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
              {unallocatedSavings > 0 
                ? `Vous disposez de ${unallocatedSavings.toLocaleString()} ${currencyCode} non alloués. L'algorithme propose de répartir ${previewTotalAllocated.toLocaleString()} ${currencyCode} vers vos objectifs prioritaires.`
                : "Toutes vos économies sont actuellement allouées. Ajoutez de l'argent dans votre épargne gratuite pour l'attribuer à de nouveaux objectifs."}
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
            Répartition Proposée par l'Algorithme
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
          {recurringAllocations.map(project => (
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
                    {project.allocation.toLocaleString()} {currencyCode}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>alloués ce mois</span>
                </div>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--zenith-bg)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                <div style={{ height: '100%', backgroundColor: 'var(--zenith-data-recurring)', width: project.allocation > 0 ? '100%' : '0%' }}></div>
              </div>
            </div>
          ))}

          {/* Allocated target projects */}
          {targetAllocations.map(project => {
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
                    <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>alloués</span>
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
              Reste après Répartition
            </span>
            <span className="font-data" style={{ fontSize: '24px', color: 'var(--zenith-primary)', fontWeight: 700 }}>
              {Math.round(unallocatedSavings - previewTotalAllocated).toLocaleString()} {currencyCode}
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
              <p className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-secondary)', margin: 0 }}>{viability}%</p>
            </div>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '3px solid var(--zenith-secondary)',
              borderTopColor: 'var(--zenith-outline-variant)',
              transform: `rotate(${Math.round(viability * 1.8)}deg)`
            }}></div>
          </div>
        </div>

        {/* Action Button to execute allocations */}
        {previewTotalAllocated === 0 && (
          <div style={{
            marginTop: '24px',
            padding: '12px',
            backgroundColor: 'var(--zenith-surface-variant)',
            color: 'var(--zenith-on-surface-variant)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            Aucun fonds disponible ou nécessaire à répartir ce mois-ci.
          </div>
        )}
        
        <button 
          onClick={handleExecuteAllocations}
          disabled={loading || previewTotalAllocated === 0}
          style={{
            marginTop: previewTotalAllocated === 0 ? '12px' : '24px',
            width: '100%',
            backgroundColor: confirming ? 'var(--zenith-status-alert, #F59E0B)' : 'var(--zenith-secondary)',
            color: 'white',
            border: 'none',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-headings)',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--zenith-shadow-soft)',
            transition: 'all 0.2s',
            opacity: (loading || previewTotalAllocated === 0) ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Zap size={20} />
          {loading ? 'Exécution en cours...' : confirming ? 'Cliquez pour Confirmer !' : 'Exécuter la répartition du mois'}
        </button>

      </div>

    </div>
  );
};

export default PremiumFunding;
