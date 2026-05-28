import React, { useState } from 'react';
import { usePremium } from '../context/PremiumContext';
import { supabase } from '../../supabaseClient';
import { 
  Zap, 
  CheckCircle, 
  Brain, 
  AlertCircle,
  PiggyBank,
  TrendingUp,
  Activity,
  History,
  Info
} from 'lucide-react';

const PremiumFunding = () => {
  const { 
    projects, 
    calculateMonthlyNeed, 
    fetchData, 
    currency, 
    financeSavings,
    freeSalary,
    latestAllocationReport,
    setLatestAllocationReport,
    createTransaction,
    transactions
  } = usePremium();

  // Group allocations from transactions into operations
  const allocations = (transactions || []).filter(tx => tx.type === 'allocation');
  const operations = [];
  
  allocations.forEach(tx => {
    const txTime = new Date(tx.date).getTime();
    const existingOp = operations.find(op => Math.abs(new Date(op.timestamp).getTime() - txTime) <= 10000);
    
    if (existingOp) {
      existingOp.totalAmount += tx.amount;
      existingOp.projects.push(tx);
      if (tx.metadata?.source?.startsWith('projet_manuel') || tx.note?.toLowerCase().includes('manuel') || tx.title?.toLowerCase().includes('manuelle') || tx.description?.toLowerCase().includes('page du projet')) {
        existingOp.isManual = true;
      }
    } else {
      operations.push({
        id: tx.id,
        timestamp: tx.date,
        totalAmount: tx.amount,
        isManual: tx.metadata?.source?.startsWith('projet_manuel') || tx.note?.toLowerCase().includes('manuel') || tx.title?.toLowerCase().includes('manuelle') || tx.description?.toLowerCase().includes('page du projet'),
        projects: [tx]
      });
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const currencyCode = currency?.code || 'XOF';

  // Calculations for Savings Breakdown
  const totalSavings = parseFloat(financeSavings || 0);
  const totalAllocatedToProjects = projects.reduce((acc, p) => acc + parseFloat(p.current_amount || 0), 0);
  const unallocatedSavings = Math.max(0, totalSavings - totalAllocatedToProjects);

  const allocatedPercentage = totalSavings > 0 ? Math.round((totalAllocatedToProjects / totalSavings) * 100) : 0;
  const unallocatedPercentage = totalSavings > 0 ? Math.round((unallocatedSavings / totalSavings) * 100) : 0;

  // Compute allocations using unallocated savings
  const recurringProjects = projects.filter(p => p.is_recurring);
  const targetProjects = projects.filter(p => !p.is_recurring);

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

  const priorityWeights = { 1: 3, 3: 1.5, 5: 1 };
  
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
    
    if (remainingTarget <= 0) {
      return { ...project, allocation: 0, idealMonthlyNeed: calculateMonthlyNeed(project) };
    }

    const weight = priorityWeights[project.priority] || 1;
    const share = totalPriorityWeight > 0 ? weight / totalPriorityWeight : 0;
    
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

      for (const project of recurringAllocations) {
        if (project.allocation > 0) {
          const { error } = await supabase
            .from('projects')
            .update({ current_amount: parseFloat(project.current_amount || 0) + project.allocation })
            .eq('id', project.id);
          if (error) throw error;
        }
      }

      for (const project of targetAllocations) {
        if (project.allocation > 0) {
          const newAmount = parseFloat(project.current_amount || 0) + project.allocation;
          const { error } = await supabase
            .from('projects')
            .update({ current_amount: newAmount })
            .eq('id', project.id);
          if (error) throw error;

          if (project.is_complex && project.milestones) {
            let remainingAllocation = project.allocation;
            const sortedMilestones = [...project.milestones].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
            
            for (const milestone of sortedMilestones) {
              if (remainingAllocation <= 0) break;
              if (milestone.is_completed) continue;

              const milestoneTarget = parseFloat(milestone.target_amount || 0);
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

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ savings: totalSavings })
          .eq('id', user.id);
      }

      // Log allocations as premium transactions
      for (const p of [...recurringAllocations, ...targetAllocations]) {
        if (p.allocation > 0) {
          await createTransaction({
            type: 'allocation',
            title: `Allocation - ${p.name}`,
            description: `Répartition automatique d'épargne vers le projet : ${p.name}`,
            amount: p.allocation,
            project_id: p.id,
            project_name: p.name
          });
        }
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

  return (
    <div style={{ padding: '24px 20px', maxWidth: '500px', margin: '0 auto', paddingBottom: '100px' }}>
      
      {/* Header section */}
      <div style={{ marginBottom: '28px' }}>
        <h2 className="font-heading" style={{ fontSize: '28px', color: 'var(--zenith-on-surface)', margin: '0 0 4px 0' }}>
          Financement
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--zenith-on-surface-variant)', margin: 0 }}>
          Visualisez la répartition de votre épargne réelle sur vos projets de vie.
        </p>
      </div>

      {/* Graphical Savings Visualization */}
      <div className="premium-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h4 className="font-heading" style={{ fontSize: '14px', color: 'var(--zenith-on-surface)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--zenith-primary-container)" />
          Répartition Visuelle du Patrimoine
        </h4>
        
        {/* Dual Stacked Progress Bar */}
        <div style={{
          width: '100%',
          height: '16px',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
          display: 'flex',
          backgroundColor: 'var(--zenith-track)',
          marginBottom: '16px'
        }}>
          {totalAllocatedToProjects > 0 && (
            <div style={{
              width: `${allocatedPercentage}%`,
              height: '100%',
              backgroundColor: 'var(--zenith-secondary)',
              transition: 'width 0.4s ease'
            }} title="Engagée dans vos projets" />
          )}
          {unallocatedSavings > 0 && (
            <div style={{
              width: `${unallocatedPercentage}%`,
              height: '100%',
              backgroundColor: 'var(--zenith-accent-gold)',
              transition: 'width 0.4s ease'
            }} title="Disponible à l'allocation" />
          )}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--zenith-secondary)' }} />
              <span style={{ color: 'var(--zenith-on-surface-variant)' }}>Épargne engagée</span>
            </div>
            <span className="font-data" style={{ fontWeight: 700 }}>
              {totalAllocatedToProjects.toLocaleString()} {currencyCode} ({allocatedPercentage}%)
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--zenith-accent-gold)' }} />
              <span style={{ color: 'var(--zenith-on-surface-variant)' }}>Épargne disponible (libre)</span>
            </div>
            <span className="font-data" style={{ fontWeight: 700 }}>
              {unallocatedSavings.toLocaleString()} {currencyCode} ({unallocatedPercentage}%)
            </span>
          </div>
        </div>
      </div>

      {/* Savings Breakdown Card */}
      <div className="premium-card" style={{
        padding: '24px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Épargne Réelle Totale (Depuis Gratuit)
          </span>
          <span className="font-data" style={{ display: 'block', fontSize: '32px', color: 'var(--zenith-primary)', fontWeight: 800, marginTop: '8px' }}>
            {totalSavings.toLocaleString()} {currencyCode}
          </span>
          <p style={{ fontSize: '12px', color: 'var(--zenith-on-surface-variant)', marginTop: '8px' }}>
            Cette ressource provient exclusivement de l'épargne constituée dans le volet gratuit.
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

      {/* Strategic Advisor Panel */}
      <div className="premium-card" style={{
        backgroundColor: 'var(--zenith-surface-muted)',
        padding: '20px',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start',
        marginBottom: '24px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          color: 'var(--zenith-accent-gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Brain size={20} />
        </div>
        <div>
          <h4 className="font-heading" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', margin: '0 0 4px 0' }}>
            Conseil lié à l'équilibre
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--zenith-on-surface-variant)', margin: 0, lineHeight: '1.5' }}>
            {unallocatedSavings > 0 
              ? `Dudukan propose de répartir automatiquement ${previewTotalAllocated.toLocaleString()} ${currencyCode} vers vos priorités. Cette allocation optimisera le délai de réalisation de vos projets complexes.`
              : "Vos réserves sont engagées de manière optimale. En cas de surplus ultérieur, Dudukan calculera la répartition idéale de manière séquentielle."}
          </p>
        </div>
      </div>

      {/* Previsional Breakdown Panel */}
      <div className="premium-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 className="font-heading" style={{ fontSize: '16px', color: 'var(--zenith-on-surface)', margin: 0 }}>
            Répartition Proposée par Dudukan
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

        {/* List of allocations preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
          
          {/* Recurring section */}
          {recurringAllocations.map(project => {
            const currentPercent = project.target_amount > 0 ? (parseFloat(project.current_amount || 0) / parseFloat(project.target_amount)) * 100 : 0;
            const deltaPercent = project.target_amount > 0 ? (project.allocation / parseFloat(project.target_amount)) * 100 : 0;
            const barColor = 'var(--zenith-data-recurring)';

            return (
              <div key={project.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--zenith-on-surface)' }}>{project.name}</span>
                  <span className="font-data" style={{ fontWeight: 800 }}>
                    +{project.allocation.toLocaleString()} {currencyCode}
                  </span>
                </div>
                
                {/* Micro visual dual track bar */}
                <div style={{
                  height: '6px',
                  width: '100%',
                  backgroundColor: 'var(--zenith-track)',
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
                    +{Math.round(deltaPercent)}% via répartition automatique
                  </span>
                </div>
              </div>
            );
          })}

          {/* Targets section */}
          {targetAllocations.map(project => {
            const currentPercent = project.target_amount > 0 ? (parseFloat(project.current_amount || 0) / parseFloat(project.target_amount)) * 100 : 0;
            const deltaPercent = project.target_amount > 0 ? (project.allocation / parseFloat(project.target_amount)) * 100 : 0;
            const barColor = project.is_complex ? 'var(--zenith-data-complex)' : 'var(--zenith-primary-container)';

            return (
              <div key={project.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--zenith-on-surface)' }}>{project.name}</span>
                  <span className="font-data" style={{ fontWeight: 800 }}>
                    +{project.allocation.toLocaleString()} {currencyCode}
                  </span>
                </div>
                
                {/* Micro visual dual track bar */}
                <div style={{
                  height: '6px',
                  width: '100%',
                  backgroundColor: 'var(--zenith-track)',
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
                    +{Math.round(deltaPercent)}% via répartition automatique
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
            <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>
              Total à répartir
            </span>
            <span className="font-data" style={{ fontSize: '18px', color: 'var(--zenith-primary)', fontWeight: 800 }}>
              {previewTotalAllocated.toLocaleString()} {currencyCode}
            </span>
          </div>

          <button
            onClick={handleExecuteAllocations}
            disabled={previewTotalAllocated <= 0 || loading}
            style={{
              padding: '12px 24px',
              backgroundColor: confirming ? 'var(--zenith-secondary)' : 'var(--zenith-primary-container)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-headings)',
              fontSize: '13px',
              fontWeight: 800,
              cursor: previewTotalAllocated > 0 ? 'pointer' : 'not-allowed',
              opacity: previewTotalAllocated > 0 ? 1 : 0.5,
              transition: 'background-color 0.25s',
              boxShadow: '0 4px 12px rgba(30, 62, 98, 0.15)'
            }}
          >
            {loading ? 'Application...' : confirming ? 'Confirmer ?' : 'Exécuter'}
          </button>
        </div>
      </div>

      {/* Allocation History Log */}
      <div className="premium-card" style={{ padding: '20px' }}>
        <h4 className="font-heading" style={{ fontSize: '14px', color: 'var(--zenith-on-surface)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} color="var(--zenith-primary-container)" />
          Historique récent des allocations
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {operations.slice(0, 5).map(op => {
            let label = '';
            if (op.isManual) {
              label = `Allocation manuelle - ${op.projects[0].projectName || op.projects[0].note || 'Projet'}`;
            } else {
              if (op.projects.length === 1) {
                label = `Allocation automatique - ${op.projects[0].projectName || op.projects[0].note || 'Projet'}`;
              } else {
                label = `Répartition automatique (${op.projects.length} projets)`;
              }
            }
            return (
              <div key={op.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingBottom: '10px', borderBottom: '1px dashed var(--zenith-outline-variant)' }}>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--zenith-on-surface)', display: 'block' }}>{label}</span>
                  <span style={{ fontSize: '10px', color: 'var(--zenith-on-surface-variant)' }}>
                    {new Date(op.timestamp).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <span className="font-data" style={{ color: 'var(--zenith-secondary)', fontWeight: 700 }}>
                  +{op.totalAmount.toLocaleString()} {currencyCode}
                </span>
              </div>
            );
          })}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingBottom: '10px', borderBottom: '1px dashed var(--zenith-outline-variant)' }}>
            <div>
              <span style={{ fontWeight: 700, color: 'var(--zenith-on-surface)', display: 'block' }}>Initialisation du plan premium</span>
              <span style={{ fontSize: '10px', color: 'var(--zenith-on-surface-variant)' }}>15 Mai 2026</span>
            </div>
            <span style={{ color: 'var(--zenith-on-surface-variant)', fontWeight: 700 }}>Actif</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PremiumFunding;
