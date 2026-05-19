import React, { useState } from 'react';
import { usePremium } from '../context/PremiumContext';
import { 
  Plus, 
  TrendingUp, 
  CheckCircle, 
  Home, 
  Calendar, 
  Briefcase, 
  ChevronRight,
  Sliders,
  AlertTriangle,
  Play
} from 'lucide-react';

const PremiumProjects = ({ onAddProject, onSelectProject }) => {
  const { projects, profile, alerts, executePriorityAction, calculateMonthlyNeed, currency } = usePremium();
  const [activeFilter, setActiveFilter] = useState('all'); // all, simple, complex, recurring

  // 1. Calculate overall feasibility (percentage of total target amount already funded)
  const totalTarget = projects.reduce((sum, p) => sum + parseFloat(p.target_amount || 0), 0);
  const totalCurrent = projects.reduce((sum, p) => sum + parseFloat(p.current_amount || 0), 0);
  const feasibilityIndex = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 100;
  const totalProjects = projects.length;
  const delayCount = alerts.filter(a => a.type === 'funding_delay').length;
  
  // Dynamic feasibility details based on the index
  const getFeasibilityText = () => {
    if (totalProjects === 0) return "Aucun projet planifié. Commencez par créer votre premier projet de vie !";
    if (delayCount === 0) {
      return `Votre stratégie actuelle permet de financer tous vos projets dans les délais impartis. Tout est au vert !`;
    }
    return `Votre stratégie actuelle permet de financer ${totalProjects - delayCount} sur ${totalProjects} projets dans les délais. L'algorithme Zenith suggère des réajustements de versements.`;
  };

  // Filter projects based on active tab
  const filteredProjects = projects.filter(project => {
    if (activeFilter === 'simple') return !project.is_complex && !project.is_recurring;
    if (activeFilter === 'complex') return project.is_complex;
    if (activeFilter === 'recurring') return project.is_recurring;
    return true;
  });

  // Circle gauge settings for Feasibility Index (radius=40, circumference ~251.2)
  const radius = 40;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, feasibilityIndex)) / 100) * circumference;

  return (
    <div style={{ padding: '24px 20px', maxWidth: '500px', margin: '0 auto' }}>
      
      {/* Header and Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <h2 className="font-heading" style={{ fontSize: '28px', color: 'var(--zenith-on-surface)', margin: '0 0 4px 0' }}>
            Vos Projets
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--zenith-on-surface-variant)', margin: 0 }}>
            Gérez vos objectifs financiers et suivez leur progression.
          </p>
        </div>
        <button 
          onClick={onAddProject}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--zenith-primary)',
            color: 'var(--zenith-white)',
            border: 'none',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-headings)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--zenith-shadow-soft)',
            transition: 'transform 0.1s'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Plus size={16} /> Nouveau
        </button>
      </div>

      {/* Global Feasibility Card */}
      <div style={{
        backgroundColor: '#F8FAFC',
        border: '1px solid var(--zenith-outline-variant)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{ position: 'relative', width: '96px', height: '96px', shrink: 0, display: 'flex', alignItems: 'center', justifycontent: 'center' }}>
          <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="48" cy="48" r={radius} fill="transparent" stroke="var(--zenith-outline-variant)" strokeWidth={stroke} opacity="0.3" />
            <circle 
              cx="48" 
              cy="48" 
              r={radius} 
              fill="transparent" 
              stroke="var(--zenith-secondary)" 
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)' }}>{feasibilityIndex}%</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h3 className="font-heading" style={{ fontSize: '16px', margin: '0 0 4px 0', color: 'var(--zenith-on-surface)' }}>
            Indice de Faisabilité Global
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--zenith-on-surface-variant)', margin: 0, lineHeight: '1.5' }}>
            {getFeasibilityText()}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px', 
        overflowX: 'auto', 
        paddingBottom: '8px',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none'
      }}>
        {[
          { id: 'all', label: 'Tous les Projets' },
          { id: 'simple', label: 'Simples' },
          { id: 'complex', label: 'Complexes' },
          { id: 'recurring', label: 'Récurrents' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-pill)',
              fontFamily: 'var(--font-headings)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeFilter === tab.id ? 'var(--zenith-primary)' : 'rgba(26, 79, 139, 0.05)',
              color: activeFilter === tab.id ? 'var(--zenith-white)' : 'var(--zenith-on-surface-variant)',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--zenith-white)',
          padding: '48px 24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--zenith-outline-variant)',
          textAlign: 'center',
          color: 'var(--zenith-on-surface-variant)'
        }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '15px' }}>Aucun projet dans cette catégorie pour le moment.</p>
          <button 
            onClick={onAddProject}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--zenith-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700
            }}
          >
            Créer un projet
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredProjects.map(project => {
            const target = parseFloat(project.target_amount || 0);
            const current = parseFloat(project.current_amount || 0);
            const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
            const isReady = current >= target;

            // Simple styling markers based on project type
            const typeColor = project.is_recurring 
              ? 'var(--zenith-data-recurring)' 
              : project.is_complex 
                ? 'var(--zenith-data-complex)' 
                : 'var(--zenith-primary)';

            return (
              <div 
                key={project.id}
                onClick={() => onSelectProject && onSelectProject(project)}
                style={{
                  backgroundColor: 'var(--zenith-white)',
                  border: '1px solid var(--zenith-outline-variant)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  boxShadow: 'var(--zenith-shadow-soft)',
                  position: 'relative',
                  cursor: 'pointer'
                }}
              >
                {/* Header of Project Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(26, 79, 139, 0.05)',
                    color: typeColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {project.is_recurring ? <Calendar size={24} /> : project.is_complex ? <Home size={24} /> : <Briefcase size={24} />}
                  </div>

                  {/* Status Badge */}
                  {isReady ? (
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
                      <CheckCircle size={12} /> Prêt
                    </span>
                  ) : (
                    <span style={{
                      backgroundColor: 'rgba(26, 79, 139, 0.05)',
                      color: 'var(--zenith-on-surface-variant)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      {project.is_recurring ? 'Récurrent' : project.is_complex ? 'Complexe' : 'Simple'}
                    </span>
                  )}
                </div>

                {/* Title & Type */}
                <h4 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)', margin: '0 0 4px 0' }}>
                  {project.name}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--zenith-on-surface-variant)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {project.is_recurring ? `Mensuel (${project.frequency || 'Mensuel'})` : `Objectif de vie`}
                </p>

                {/* Progress bar */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--zenith-on-surface-variant)', fontWeight: 600 }}>Progression</span>
                    <span className="font-data" style={{ color: 'var(--zenith-on-surface)', fontWeight: 700 }}>{progress}%</span>
                  </div>
                  <div style={{
                    height: '8px',
                    width: '100%',
                    backgroundColor: 'var(--zenith-bg)',
                    borderRadius: 'var(--radius-pill)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      backgroundColor: typeColor,
                      width: `${progress}%`,
                      borderRadius: 'var(--radius-pill)',
                      transition: 'width 0.4s ease'
                    }}></div>
                  </div>
                </div>

                {/* Footer details of card */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--zenith-outline-variant)'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block', marginBottom: '2px' }}>
                      {project.is_recurring ? 'Montant' : 'Cible'}
                    </span>
                    <span className="font-data" style={{ fontSize: '16px', color: 'var(--zenith-primary)', fontWeight: 700 }}>
                      {target.toLocaleString()} {currency?.code || 'XOF'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block', marginBottom: '2px' }}>
                      {project.is_recurring ? 'Prochain' : 'Délai'}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--zenith-on-surface)', fontWeight: 700 }}>
                      {project.is_recurring ? 'Le 01 du mois' : project.deadline ? new Date(project.deadline).toLocaleDateString('fr-FR') : 'Non défini'}
                    </span>
                  </div>
                </div>

                {/* Direct Action when "Ready to Realize" */}
                {isReady && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      executePriorityAction({ type: 'realize', projectId: project.id });
                    }}
                    style={{
                      position: 'absolute',
                      bottom: '24px',
                      right: '24px',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--zenith-secondary)',
                      color: 'white',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(0, 110, 28, 0.3)'
                    }}
                    title="Valider le projet accompli !"
                  >
                    <Play size={18} fill="white" />
                  </button>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default PremiumProjects;
