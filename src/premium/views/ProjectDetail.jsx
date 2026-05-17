import React, { useState } from 'react';
import { usePremium } from '../context/PremiumContext';
import { supabase } from '../../supabaseClient';
import { 
  ArrowLeft, 
  CheckCircle, 
  Lock, 
  Calendar, 
  Activity, 
  Folder, 
  Check, 
  Hammer,
  TrendingUp,
  Brain
} from 'lucide-react';

const ProjectDetail = ({ project, onBack }) => {
  const { profile, fetchData } = usePremium();
  const [allocationAmount, setAllocationAmount] = useState('');
  const [fundingLoading, setFundingLoading] = useState(false);

  const target = parseFloat(project.target_amount || 0);
  const current = parseFloat(project.current_amount || 0);
  const globalProgress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  // Sort milestones by step_order
  const milestones = project.milestones ? [...project.milestones].sort((a, b) => a.step_order - b.step_order) : [];

  // Determine active, completed, and locked states
  let foundActive = false;
  const processedMilestones = milestones.map(m => {
    let state = 'locked';
    if (m.completed) {
      state = 'completed';
    } else if (!foundActive) {
      state = 'active';
      foundActive = true;
    }
    return { ...m, state };
  });

  const activeMilestone = processedMilestones.find(m => m.state === 'active');

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!activeMilestone) return;

    const amountToAllocate = parseFloat(allocationAmount);
    if (isNaN(amountToAllocate) || amountToAllocate <= 0) {
      alert("Veuillez entrer un montant valide supérieur à 0.");
      return;
    }

    const availableSavings = parseFloat(profile?.savings || 0);
    if (amountToAllocate > availableSavings) {
      alert("Fonds insuffisants dans votre épargne disponible. Veuillez d'abord approvisionner vos ressources.");
      return;
    }

    setFundingLoading(true);

    try {
      // 1. Calculate new milestone allocated amount
      const currentAllocated = parseFloat(activeMilestone.current_allocated || 0);
      const newAllocated = currentAllocated + amountToAllocate;
      const targetMilestoneAmount = parseFloat(activeMilestone.amount || 0);
      const isMilestoneCompleted = newAllocated >= targetMilestoneAmount;

      // 2. Update Milestone in database
      const { error: mError } = await supabase
        .from('milestones')
        .update({
          current_allocated: newAllocated,
          completed: isMilestoneCompleted
        })
        .eq('id', activeMilestone.id);

      if (mError) throw mError;

      // 3. Update project current_amount
      const { error: pError } = await supabase
        .from('projects')
        .update({
          current_amount: current + amountToAllocate
        })
        .eq('id', project.id);

      if (pError) throw pError;

      // 4. Deduct allocated funds from profile savings
      const { error: uError } = await supabase
        .from('profiles')
        .update({
          savings: availableSavings - amountToAllocate
        })
        .eq('id', profile.id);

      if (uError) throw uError;

      setAllocationAmount('');
      await fetchData();
      alert("Fonds alloués avec succès vers l'étape active !");
      onBack();
    } catch (err) {
      alert("Erreur de virement : " + err.message);
    } finally {
      setFundingLoading(false);
    }
  };

  const currencyCode = profile?.currency?.code || 'XOF';

  return (
    <div style={{ padding: '24px 20px', maxWidth: '500px', margin: '0 auto' }}>
      
      {/* Back Button */}
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
        <ArrowLeft size={18} strokeWidth={2.5} /> Retour
      </button>

      {/* Hero Category Badge */}
      <span style={{ 
        fontFamily: 'var(--font-headings)', 
        fontSize: '11px', 
        fontWeight: 700, 
        color: 'var(--zenith-primary)',
        backgroundColor: 'rgba(26, 79, 139, 0.08)',
        padding: '6px 14px',
        borderRadius: 'var(--radius-pill)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {project.is_complex ? 'Projet Complexe' : 'Projet Simple'}
      </span>

      {/* Title */}
      <h2 className="font-heading" style={{ fontSize: '32px', color: 'var(--zenith-on-surface)', margin: '12px 0 24px 0' }}>
        {project.name}
      </h2>

      {/* Bento Grid: Hero Stat Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
        
        {/* Global progress */}
        <div style={{
          backgroundColor: 'var(--zenith-white)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--zenith-outline-variant)',
          boxShadow: 'var(--zenith-shadow-soft)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', fontWeight: 700 }}>
                Financement Global
              </span>
              <span className="font-data" style={{ display: 'block', fontSize: '24px', color: 'var(--zenith-primary)', marginTop: '4px' }}>
                {target.toLocaleString()} {currencyCode}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', fontWeight: 700 }}>
                Sécurisé
              </span>
              <span className="font-data" style={{ display: 'block', fontSize: '18px', color: 'var(--zenith-secondary)', marginTop: '4px' }}>
                {current.toLocaleString()} {currencyCode}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{
            height: '10px',
            width: '100%',
            backgroundColor: 'var(--zenith-bg)',
            borderRadius: 'var(--radius-pill)',
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <div style={{
              height: '100%',
              backgroundColor: 'var(--zenith-secondary)',
              width: `${globalProgress}%`,
              borderRadius: 'var(--radius-pill)',
              transition: 'width 0.4s ease'
            }}></div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}>
            <span style={{ color: 'var(--zenith-secondary)' }}>{globalProgress}% Sécurisé</span>
            <span style={{ color: 'var(--zenith-on-surface-variant)' }}>Objectif de vie</span>
          </div>
        </div>

        {/* Circular Feasibility */}
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid var(--zenith-outline-variant)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--zenith-secondary-container)',
            color: 'var(--zenith-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            shrink: 0
          }}>
            <CheckCircle size={28} />
          </div>
          <div>
            <h4 className="font-heading" style={{ fontSize: '16px', color: 'var(--zenith-on-surface)', margin: '0 0 2px 0' }}>
              Projet viable
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--zenith-on-surface-variant)', margin: 0, lineHeight: '1.4' }}>
              Zenith AI confirme que vos flux actuels couvrent les échéances prévues.
            </p>
          </div>
        </div>

      </div>

      {/* Project Milestones / Steps */}
      {project.is_complex && (
        <div style={{ marginBottom: '32px' }}>
          <h3 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)', marginBottom: '20px' }}>
            Étapes du Projet
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
            {processedMilestones.map((milestone, idx) => {
              const mAmount = parseFloat(milestone.amount || 0);
              const mAllocated = parseFloat(milestone.current_allocated || 0);
              const mProgress = mAmount > 0 ? Math.min(100, Math.round((mAllocated / mAmount) * 100)) : 0;

              return (
                <div 
                  key={milestone.id}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    opacity: milestone.state === 'locked' ? 0.5 : 1,
                    position: 'relative'
                  }}
                >
                  {/* Timeline icon line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: milestone.state === 'completed' 
                        ? 'var(--zenith-secondary)' 
                        : milestone.state === 'active' 
                          ? 'var(--zenith-primary-container)' 
                          : 'var(--zenith-outline-variant)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2
                    }}>
                      {milestone.state === 'completed' ? (
                        <Check size={16} strokeWidth={3} />
                      ) : milestone.state === 'active' ? (
                        <Hammer size={16} />
                      ) : (
                        <Lock size={16} />
                      )}
                    </div>
                    {idx < processedMilestones.length - 1 && (
                      <div style={{
                        width: '2px',
                        flex: 1,
                        backgroundColor: milestone.state === 'completed' ? 'var(--zenith-secondary)' : 'var(--zenith-outline-variant)',
                        opacity: 0.3,
                        margin: '4px 0',
                        position: 'absolute',
                        top: '32px',
                        left: '15px',
                        height: 'calc(100% - 12px)',
                        zIndex: 1
                      }}></div>
                    )}
                  </div>

                  {/* Card content */}
                  <div style={{
                    flex: 1,
                    backgroundColor: 'var(--zenith-white)',
                    border: milestone.state === 'active' ? '2px solid var(--zenith-primary-container)' : '1px solid var(--zenith-outline-variant)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px',
                    boxShadow: 'var(--zenith-shadow-soft)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 className="font-heading" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', margin: 0 }}>
                        {milestone.name}
                      </h4>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: milestone.state === 'completed' 
                          ? 'var(--zenith-secondary)' 
                          : milestone.state === 'active' 
                            ? 'var(--zenith-primary)' 
                            : 'var(--zenith-on-surface-variant)'
                      }}>
                        {milestone.state === 'completed' ? 'Terminé' : milestone.state === 'active' ? 'Actif' : 'Verrouillé'}
                      </span>
                    </div>

                    {/* Allocated vs target amount info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--zenith-on-surface-variant)', marginBottom: '12px' }}>
                      <span>Budget : {mAmount.toLocaleString()} {currencyCode}</span>
                      {milestone.state === 'completed' ? (
                        <span>Payé : {mAmount.toLocaleString()} {currencyCode}</span>
                      ) : (
                        <span>Sécurisé : {mAllocated.toLocaleString()} {currencyCode}</span>
                      )}
                    </div>

                    {/* Active Milestone deposit form */}
                    {milestone.state === 'active' && (
                      <div style={{ marginTop: '16px' }}>
                        <div style={{
                          backgroundColor: '#F8FAFC',
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--zenith-outline-variant)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '10px', color: 'var(--zenith-on-surface-variant)', fontWeight: 700 }}>Montant restant</span>
                            <span className="font-data" style={{ fontSize: '15px', color: 'var(--zenith-primary)', fontWeight: 700 }}>
                              {(mAmount - mAllocated).toLocaleString()} {currencyCode}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input 
                              type="number"
                              placeholder="Epargner"
                              value={allocationAmount}
                              onChange={(e) => setAllocationAmount(e.target.value)}
                              style={{
                                width: '80px',
                                padding: '6px 8px',
                                border: '1px solid var(--zenith-outline-variant)',
                                borderRadius: 'var(--radius-sm)',
                                fontFamily: 'var(--font-data)',
                                fontSize: '13px',
                                outline: 'none'
                              }}
                            />
                            <button
                              onClick={handleAllocate}
                              disabled={fundingLoading}
                              style={{
                                backgroundColor: 'var(--zenith-primary)',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-sm)',
                                fontFamily: 'var(--font-headings)',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Allouer
                            </button>
                          </div>
                        </div>

                        {/* active progress bar */}
                        <div style={{ height: '6px', backgroundColor: 'var(--zenith-bg)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', backgroundColor: 'var(--zenith-primary)', width: `${mProgress}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Technical variation and tips bento */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{
            flex: 1,
            backgroundColor: '#F8FAFC',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--zenith-outline-variant)'
          }}>
            <Calendar size={18} color="var(--zenith-primary)" style={{ marginBottom: '8px' }} />
            <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>Livraison estimée</span>
            <span className="font-heading" style={{ fontSize: '14px', color: 'var(--zenith-on-surface)' }}>
              {project.deadline ? new Date(project.deadline).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Indéfinie'}
            </span>
          </div>

          <div style={{
            flex: 1,
            backgroundColor: '#F8FAFC',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--zenith-outline-variant)'
          }}>
            <Activity size={18} color="var(--zenith-primary)" style={{ marginBottom: '8px' }} />
            <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>Variation Coût</span>
            <span className="font-heading" style={{ fontSize: '14px', color: 'var(--zenith-status-warning)' }}>
              Stable (+0.0%)
            </span>
          </div>
        </div>

        {/* Assistant Tip Banner */}
        <div style={{
          backgroundColor: 'var(--zenith-tertiary-container)',
          color: 'var(--zenith-white)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h4 className="font-heading" style={{ fontSize: '16px', margin: '0 0 8px 0' }}>Action de l'Assistant</h4>
            <p style={{ fontSize: '13px', margin: 0, opacity: 0.9, lineHeight: '1.5' }}>
              Zenith AI conseille d'approvisionner l'étape active dès que possible pour consolider la planification des suivantes.
            </p>
          </div>
          {/* Subtle background brain watermark */}
          <Brain 
            size={100} 
            color="white" 
            style={{ 
              position: 'absolute', 
              bottom: '-20px', 
              right: '-20px', 
              opacity: 0.05, 
              transform: 'rotate(12deg)' 
            }} 
          />
        </div>

      </div>

    </div>
  );
};

export default ProjectDetail;
