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
  Play,
  TrendingDown,
  Info,
  Clock
} from 'lucide-react';

const PremiumProjects = ({ onAddProject, onSelectProject }) => {
  const { projects, profile, alerts, executePriorityAction, calculateMonthlyNeed, currency } = usePremium();
  const [activeFilter, setActiveFilter] = useState('all'); 

  // Calculations for global feasibility
  const totalTarget = projects.reduce((sum, p) => sum + parseFloat(p.target_amount || 0), 0);
  const totalCurrent = projects.reduce((sum, p) => sum + parseFloat(p.current_amount || 0), 0);
  const feasibilityIndex = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 100;
  const totalProjects = projects.length;
  const delayCount = alerts.filter(a => a.type === 'funding_delay').length;
  
  const getFeasibilityText = () => {
    if (totalProjects === 0) return "Aucun projet planifié. Commencez par créer votre premier projet de vie !";
    if (delayCount === 0) {
      return `Votre stratégie actuelle permet de financer tous vos projets dans les délais impartis. Tout est au vert !`;
    }
    return `Votre stratégie actuelle permet de financer ${totalProjects - delayCount} sur ${totalProjects} projets dans les délais. Dudukan suggère des réajustements de versements.`;
  };

  // Filter projects based on active tab
  const filteredProjects = projects.filter(project => {
    if (activeFilter === 'simple') return !project.is_complex && !project.is_recurring;
    if (activeFilter === 'complex') return project.is_complex;
    if (activeFilter === 'recurring') return project.is_recurring;
    return true;
  });

  const radius = 40;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, feasibilityIndex)) / 100) * circumference;

  return (
    <div style={{ padding: '24px 20px', maxWidth: '500px', margin: '0 auto', paddingBottom: '100px' }}>
      
      {/* Header and Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <h2 className="font-heading" style={{ fontSize: '28px', color: 'var(--zenith-on-surface)', margin: '0 0 4px 0' }}>
            Vos Projets
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--zenith-on-surface-variant)', margin: 0 }}>
            Gérez vos objectifs financiers et suivez leur progression.
          </p>
        </div>
        <button 
          onClick={onAddProject}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--zenith-primary-container)',
            color: 'white',
            border: 'none',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-headings)',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(30, 62, 98, 0.15)',
            transition: 'transform 0.1s'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Plus size={16} /> Nouveau
        </button>
      </div>

      {/* Global Feasibility Card */}
      <div className="premium-card" style={{
        backgroundColor: '#F8FAFC',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{ position: 'relative', width: '96px', height: '96px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            Faisabilité Globale
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--zenith-on-surface-variant)', margin: 0, lineHeight: '1.5' }}>
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
        paddingBottom: '8px'
      }}>
        {[
          { id: 'all', label: 'Tous' },
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
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeFilter === tab.id ? 'var(--zenith-primary-container)' : 'rgba(30, 62, 98, 0.05)',
              color: activeFilter === tab.id ? 'white' : 'var(--zenith-on-surface-variant)',
              whiteSpace: 'nowrap',
              transition: 'all 0.25s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="premium-card" style={{
          padding: '48px 24px',
          borderStyle: 'dashed',
          textAlign: 'center',
          color: 'var(--zenith-on-surface-variant)'
        }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '15px' }}>Aucun projet dans cette catégorie pour le moment.</p>
          <button 
            onClick={onAddProject}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--zenith-primary-container)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 800
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
            const remaining = Math.max(0, target - current);

            const typeColor = project.is_recurring 
              ? 'var(--zenith-data-recurring)' 
              : project.is_complex 
                ? 'var(--zenith-data-complex)' 
                : 'var(--zenith-primary-container)';

            // Project delay check
            const hasDelay = alerts.some(a => a.type === 'funding_delay' && a.title.includes(project.name));

            // Feasibility score dynamic calculation
            let projectFeasibility = "Élevée";
            let feasibilityScore = 95;
            let feasibilityBadgeColor = '#E8F5E9';
            let feasibilityTextColor = '#2E7D32';

            if (hasDelay) {
              projectFeasibility = "Vigilance";
              feasibilityScore = 35;
              feasibilityBadgeColor = '#FFEBEE';
              feasibilityTextColor = '#D32F2F';
            } else if (progress < 25 && !project.is_recurring) {
              projectFeasibility = "Moyenne";
              feasibilityScore = 70;
              feasibilityBadgeColor = '#FFF3E0';
              feasibilityTextColor = '#E65100';
            }

            // Next Step check
            let nextMilestoneName = '';
            if (project.is_complex && project.milestones && project.milestones.length > 0) {
              const sorted = [...project.milestones].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
              const firstUncompleted = sorted.find(m => !m.is_completed);
              if (firstUncompleted) {
                nextMilestoneName = firstUncompleted.name;
              }
            }

            // Tendance
            const trendText = hasDelay ? "En baisse" : progress > 60 ? "En hausse" : "Stable";

            // Advice logic
            let contextAdvice = "Poursuivez vos versements réguliers pour atteindre votre objectif.";
            if (hasDelay) {
              contextAdvice = "Dudukan conseille de concentrer temporairement vos allocations sur ce projet pour combler le retard.";
            } else if (isReady) {
              contextAdvice = "Objectif atteint ! Vous disposez de la totalité des fonds requis.";
            } else if (nextMilestoneName) {
              contextAdvice = `Focus sur l'étape active : "${nextMilestoneName}".`;
            }

            return (
              <div 
                key={project.id}
                onClick={() => onSelectProject && onSelectProject(project)}
                className="premium-card"
                style={{
                  padding: '24px',
                  position: 'relative',
                  cursor: 'pointer'
                }}
              >
                {/* Header of Project Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(30, 62, 98, 0.05)',
                    color: typeColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {project.is_recurring ? <Calendar size={22} /> : project.is_complex ? <Home size={22} /> : <Briefcase size={22} />}
                  </div>

                  {/* Status Badges Row */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{
                      backgroundColor: feasibilityBadgeColor,
                      color: feasibilityTextColor,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '10px',
                      fontWeight: 800,
                      textTransform: 'uppercase'
                    }}>
                      {projectFeasibility} ({feasibilityScore}%)
                    </span>
                    {isReady && (
                      <span style={{
                        backgroundColor: '#E8F5E9',
                        color: 'var(--zenith-secondary)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '10px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <CheckCircle size={10} /> Prêt
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Type */}
                <h4 className="font-heading" style={{ fontSize: '18px', color: 'var(--zenith-on-surface)', margin: '0 0 2px 0' }}>
                  {project.name}
                </h4>
                <p style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                  {project.is_recurring ? `Mensuel (${project.frequency || 'Mensuel'})` : `Objectif de vie`}
                </p>

                {/* Progress bar */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--zenith-on-surface-variant)', fontWeight: 700 }}>Financement global</span>
                    <span className="font-data" style={{ color: 'var(--zenith-on-surface)', fontWeight: 800 }}>{progress}%</span>
                  </div>
                  <div style={{
                    height: '8px',
                    width: '100%',
                    backgroundColor: '#F1F5F9',
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

                {/* Detailed project metrics grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '12px', 
                  backgroundColor: '#F8FAFC',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  border: '1px solid var(--zenith-outline-variant)'
                }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>Cible</span>
                    <span className="font-data" style={{ fontSize: '13px', color: 'var(--zenith-on-surface)', fontWeight: 700 }}>
                      {target.toLocaleString()} {currency?.code || 'XOF'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>Reste à financer</span>
                    <span className="font-data" style={{ fontSize: '13px', color: remaining > 0 ? 'var(--zenith-primary-container)' : 'var(--zenith-secondary)', fontWeight: 700 }}>
                      {remaining.toLocaleString()} {currency?.code || 'XOF'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>Délai</span>
                    <span style={{ fontSize: '12px', color: 'var(--zenith-on-surface)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} color="var(--zenith-on-surface-variant)" />
                      {project.is_recurring ? 'Mensuel' : project.deadline ? new Date(project.deadline).toLocaleDateString('fr-FR') : 'Non défini'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>Tendance</span>
                    <span style={{ fontSize: '12px', color: hasDelay ? 'var(--zenith-status-alert)' : 'var(--zenith-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {hasDelay ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                      {trendText}
                    </span>
                  </div>
                </div>

                {/* Step indicator for complex projects list */}
                {project.is_complex && nextMilestoneName && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(6, 182, 212, 0.04)',
                    border: '1px solid rgba(6, 182, 212, 0.15)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <span style={{ fontSize: '10px', color: 'var(--zenith-data-complex)', fontWeight: 800, display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>
                      Étape active en cours
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--zenith-on-surface)', fontWeight: 700 }}>
                      {nextMilestoneName}
                    </span>
                  </div>
                )}

                {/* Glassmorphic coach note */}
                <div style={{
                  paddingTop: '12px',
                  borderTop: '1px solid var(--zenith-outline-variant)',
                  fontSize: '11px',
                  color: 'var(--zenith-on-surface-variant)',
                  fontStyle: 'italic',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px'
                }}>
                  <Info size={14} color="var(--zenith-accent-gold)" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>{contextAdvice}</span>
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
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                      transition: 'transform 0.1s'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
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
