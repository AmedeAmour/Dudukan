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
  Brain,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react';

const ProjectDetail = ({ project, onBack }) => {
  const { profile, fetchData, currency, financeSavings, setFinanceSavings, projects } = usePremium();
  const [allocationAmount, setAllocationAmount] = useState('');
  const [fundingLoading, setFundingLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editTarget, setEditTarget] = useState(project.target_amount || 0);
  const [editPriority, setEditPriority] = useState(project.priority || 3);
  const [editDeadline, setEditDeadline] = useState(project.deadline ? project.deadline.substring(0, 10) : '');
  const [editFrequency, setEditFrequency] = useState(project.frequency || 'monthly');
  const [editSteps, setEditSteps] = useState(project.milestones ? [...project.milestones].map(m => ({ id: m.id, name: m.name, target_amount: m.target_amount, is_completed: m.is_completed || false })) : []);

  const handleAddEditStep = () => setEditSteps([...editSteps, { name: '', target_amount: '', is_completed: false }]);
  const handleRemoveEditStep = (index) => setEditSteps(editSteps.filter((_, i) => i !== index));
  const handleEditStepChange = (index, field, value) => {
    const newSteps = [...editSteps];
    newSteps[index][field] = value;
    setEditSteps(newSteps);
  };

  const handleDeleteProject = async () => {
    const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ainsi que toutes ses étapes ? Cette action est irréversible.");
    if (!confirmDelete) return;

    setFundingLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      alert("Projet supprimé avec succès !");
      await fetchData();
      onBack();
    } catch (err) {
      alert("Erreur lors de la suppression : " + err.message);
    } finally {
      setFundingLoading(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setFundingLoading(true);

    try {
      const targetAmount = project.is_complex
        ? editSteps.reduce((acc, s) => acc + (parseFloat(s.target_amount.toString().replace(/[\s,]/g, '') || 0) || 0), 0)
        : parseFloat(editTarget.toString().replace(/[\s,]/g, '') || 0) || 0;

      if (isNaN(targetAmount) || targetAmount <= 0) {
        throw new Error("Veuillez renseigner un montant valide supérieur à 0.");
      }

      // Update the project details
      const { error: pError } = await supabase
        .from('projects')
        .update({
          name: editName,
          target_amount: targetAmount,
          priority: parseInt(editPriority),
          deadline: project.is_recurring ? null : editDeadline,
          frequency: project.is_recurring ? editFrequency : null
        })
        .eq('id', project.id);

      if (pError) throw pError;

      // Update/Insert/Delete milestones if complex
      if (project.is_complex) {
        const originalMilestones = project.milestones || [];
        const originalIds = originalMilestones.map(m => m.id);
        const keptIds = editSteps.filter(s => s.id).map(s => s.id);
        const idsToDelete = originalIds.filter(id => !keptIds.includes(id));

        // Delete removed milestones
        if (idsToDelete.length > 0) {
          const { error: dError } = await supabase
            .from('milestones')
            .delete()
            .in('id', idsToDelete);
          if (dError) throw dError;
        }

        // Upsert milestones
        for (let i = 0; i < editSteps.length; i++) {
          const s = editSteps[i];
          const mData = {
            project_id: project.id,
            user_id: project.user_id, // include user_id in case it's required by schema
            name: s.name || `Étape ${i + 1}`,
            target_amount: parseFloat(s.target_amount.toString().replace(/[\s,]/g, '') || 0) || 0,
            is_completed: s.is_completed || false
          };

          if (s.id) {
            const { error: uError } = await supabase
              .from('milestones')
              .update(mData)
              .eq('id', s.id);
            if (uError) throw uError;
          } else {
            const { error: iError } = await supabase
              .from('milestones')
              .insert(mData);
            if (iError) throw iError;
          }
        }
      }

      alert("Projet mis à jour avec succès !");
      setIsEditing(false);
      await fetchData();
      onBack();
    } catch (err) {
      alert("Erreur lors de la mise à jour : " + err.message);
    } finally {
      setFundingLoading(false);
    }
  };

  const target = parseFloat(project.target_amount || 0);
  const current = parseFloat(project.current_amount || 0);
  const globalProgress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  // Sort milestones by created_at
  const milestones = project.milestones ? [...project.milestones].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)) : [];

  // Determine active, completed, and locked states
  let foundActive = false;
  const processedMilestones = milestones.map(m => {
    let state = 'locked';
    if (m.is_completed) {
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

    const amountToAllocate = parseFloat(allocationAmount.toString().replace(/[\s,]/g, '') || 0) || 0;
    if (isNaN(amountToAllocate) || amountToAllocate <= 0) {
      alert("Veuillez entrer un montant valide supérieur à 0.");
      return;
    }

    const totalAllocatedToProjects = projects.reduce((acc, p) => acc + parseFloat(p.current_amount || 0), 0);
    const unallocatedSavings = Math.max(0, parseFloat(financeSavings || 0) - totalAllocatedToProjects);

    if (amountToAllocate > unallocatedSavings) {
      alert("Fonds insuffisants dans votre épargne non allouée. Veuillez d'abord épargner dans l'onglet Épargne gratuit.");
      return;
    }

    setFundingLoading(true);

    try {
      // Calculate dynamic allocated amount for this milestone
      let previousTargetsSum = 0;
      const idx = processedMilestones.findIndex(m => m.id === activeMilestone.id);
      for (let i = 0; i < idx; i++) {
        previousTargetsSum += parseFloat(processedMilestones[i].target_amount || 0);
      }
      const activeMilestoneAllocated = Math.max(0, Math.min(parseFloat(activeMilestone.target_amount || 0), current - previousTargetsSum));
      
      const newAllocated = activeMilestoneAllocated + amountToAllocate;
      const targetMilestoneAmount = parseFloat(activeMilestone.target_amount || 0);
      const isMilestoneCompleted = newAllocated >= targetMilestoneAmount;

      // 2. Update Milestone in database
      const { error: mError } = await supabase
        .from('milestones')
        .update({
          is_completed: isMilestoneCompleted
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

  const handleAllocateSimple = async (e) => {
    e.preventDefault();

    const amountToAllocate = parseFloat(allocationAmount.toString().replace(/[\s,]/g, '') || 0) || 0;
    if (isNaN(amountToAllocate) || amountToAllocate <= 0) {
      alert("Veuillez entrer un montant valide supérieur à 0.");
      return;
    }

    const totalAllocatedToProjects = projects.reduce((acc, p) => acc + parseFloat(p.current_amount || 0), 0);
    const unallocatedSavings = Math.max(0, parseFloat(financeSavings || 0) - totalAllocatedToProjects);

    if (amountToAllocate > unallocatedSavings) {
      alert("Fonds insuffisants dans votre épargne non allouée. Veuillez d'abord épargner dans l'onglet Épargne gratuit.");
      return;
    }

    setFundingLoading(true);

    try {
      const { error: pError } = await supabase
        .from('projects')
        .update({
          current_amount: current + amountToAllocate
        })
        .eq('id', project.id);

      if (pError) throw pError;

      setAllocationAmount('');
      await fetchData();
      alert("Fonds alloués avec succès !");
      onBack();
    } catch (err) {
      alert("Erreur de virement : " + err.message);
    } finally {
      setFundingLoading(false);
    }
  };

  const currencyCode = currency?.code || 'XOF';

  if (isEditing) {
    return (
      <div style={{ padding: '24px 20px', maxWidth: '500px', margin: '0 auto' }}>
        
        {/* Cancel Button */}
        <button 
          onClick={() => setIsEditing(false)} 
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
          <ArrowLeft size={18} strokeWidth={2.5} /> Annuler la modification
        </button>

        <h2 className="font-heading" style={{ fontSize: '28px', color: 'var(--zenith-on-surface)', margin: '0 0 6px 0' }}>
          Modifier le Projet
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--zenith-on-surface-variant)', marginBottom: '32px' }}>
          Mettez à jour les paramètres de votre projet et de ses étapes.
        </p>

        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Name input */}
          <div>
            <label className="font-heading" style={{ fontSize: '14px', color: 'var(--zenith-primary)', display: 'block', marginBottom: '8px' }}>
              Nom du projet
            </label>
            <input 
              required
              type="text" 
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Ex: Achat Moto"
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

          {/* Target Amount (only if simple) */}
          {!project.is_complex && (
            <div>
              <label className="font-heading" style={{ fontSize: '14px', color: 'var(--zenith-primary)', display: 'block', marginBottom: '8px' }}>
                Montant total cible ({currencyCode})
              </label>
              <input 
                required
                type="number" 
                value={editTarget}
                onChange={(e) => setEditTarget(e.target.value)}
                placeholder="Ex: 500000"
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

          {/* Priority */}
          <div>
            <label className="font-heading" style={{ fontSize: '14px', color: 'var(--zenith-primary)', display: 'block', marginBottom: '8px' }}>
              Niveau de priorité
            </label>
            <select 
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid var(--zenith-outline-variant)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white',
                boxSizing: 'border-box'
              }}
            >
              <option value={5}>Faible (5)</option>
              <option value={3}>Moyenne (3)</option>
              <option value={1}>Haute priorité (1)</option>
            </select>
          </div>

          {/* Conditional deadline / frequency */}
          {project.is_recurring ? (
            <div>
              <label className="font-heading" style={{ fontSize: '14px', color: 'var(--zenith-primary)', display: 'block', marginBottom: '8px' }}>
                Fréquence de prélèvement
              </label>
              <select 
                value={editFrequency}
                onChange={(e) => setEditFrequency(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid var(--zenith-outline-variant)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: 'white',
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
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
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
          {project.is_complex && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="font-heading" style={{ fontSize: '14px', color: 'var(--zenith-primary)' }}>
                  Étapes de réalisation
                </label>
                <button 
                  type="button" 
                  onClick={handleAddEditStep}
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
                {editSteps.map((step, idx) => (
                  <div 
                    key={idx}
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid var(--zenith-outline-variant)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="font-heading" style={{ fontSize: '12px', color: 'var(--zenith-secondary)' }}>
                        Étape #{idx + 1}
                      </span>
                      {editSteps.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveEditStep(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--zenith-status-error, #EF4444)',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        required
                        type="text" 
                        placeholder="Nom de l'étape" 
                        value={step.name}
                        onChange={(e) => handleEditStepChange(idx, 'name', e.target.value)}
                        style={{
                          flex: 2,
                          padding: '10px 12px',
                          border: '1px solid var(--zenith-outline-variant)',
                          borderRadius: 'var(--radius-sm)',
                          fontFamily: 'var(--font-body)',
                          fontSize: '13px',
                          outline: 'none',
                          backgroundColor: 'white'
                        }}
                      />
                      <input 
                        required
                        type="number" 
                        placeholder="Montant" 
                        value={step.target_amount}
                        onChange={(e) => handleEditStepChange(idx, 'target_amount', e.target.value)}
                        style={{
                          flex: 1.2,
                          padding: '10px 12px',
                          border: '1px solid var(--zenith-outline-variant)',
                          borderRadius: 'var(--radius-sm)',
                          fontFamily: 'var(--font-body)',
                          fontSize: '13px',
                          outline: 'none',
                          backgroundColor: 'white'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={fundingLoading}
            style={{
              marginTop: '12px',
              backgroundColor: 'var(--zenith-primary)',
              color: 'var(--zenith-white)',
              border: 'none',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-headings)',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              opacity: fundingLoading ? 0.7 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {fundingLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>
    );
  }

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

      {/* Action Buttons Row */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button
          onClick={() => setIsEditing(true)}
          style={{
            background: 'none',
            border: '1px solid var(--zenith-outline-variant)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 16px',
            color: 'var(--zenith-primary)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Edit2 size={14} /> Modifier
        </button>
        <button
          onClick={handleDeleteProject}
          style={{
            background: 'none',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 16px',
            color: '#EF4444',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Trash2 size={14} /> Supprimer
        </button>
      </div>

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

        {/* Manual Allocation Form for Simple Projects */}
        {!project.is_complex && current < target && (
          <div style={{
            backgroundColor: '#F8FAFC',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--zenith-outline-variant)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--zenith-on-surface-variant)', fontWeight: 700 }}>Montant restant</span>
              <span className="font-data" style={{ fontSize: '15px', color: 'var(--zenith-primary)', fontWeight: 700 }}>
                {(target - current).toLocaleString()} {currencyCode}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <input 
                type="number"
                placeholder="Montant"
                value={allocationAmount}
                onChange={(e) => setAllocationAmount(e.target.value)}
                style={{
                  width: '100px',
                  padding: '6px 8px',
                  border: '1px solid var(--zenith-outline-variant)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-data)',
                  fontSize: '13px',
                  outline: 'none',
                  backgroundColor: 'white'
                }}
              />
              <button
                onClick={handleAllocateSimple}
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
        )}

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
              const mAmount = parseFloat(milestone.target_amount || 0);
              
              // Calculate dynamic allocated amount for this milestone
              let previousTargetsSum = 0;
              for (let i = 0; i < idx; i++) {
                previousTargetsSum += parseFloat(processedMilestones[i].target_amount || 0);
              }
              const mAllocated = Math.max(0, Math.min(mAmount, current - previousTargetsSum));
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
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: 'var(--zenith-white)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)'
        }}>
          {/* Translucent bubble patterns to form a beautiful design motif */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-40px',
            right: '20px',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.06)',
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <h4 className="font-heading" style={{ fontSize: '16px', margin: '0 0 8px 0', color: 'var(--zenith-white)' }}>Action de l'Assistant</h4>
            <p style={{ fontSize: '13px', margin: 0, opacity: 0.95, lineHeight: '1.5' }}>
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
              opacity: 0.1, 
              transform: 'rotate(12deg)',
              zIndex: 1
            }} 
          />
        </div>

      </div>

    </div>
  );
};

export default ProjectDetail;
