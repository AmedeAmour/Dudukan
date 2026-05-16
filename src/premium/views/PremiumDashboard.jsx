import React from 'react';
import { usePremium } from '../context/PremiumContext';
import '../PremiumStyles.css';

const PremiumDashboard = () => {
  const { projects, profile, availableFunds, loading, calculateMonthlyNeeds } = usePremium();

  if (loading) return <div className="premium-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Chargement de l'assistant...</div>;

  const totalTarget = projects.reduce((acc, p) => acc + (p.target_amount || 0), 0);
  const totalSaved = projects.reduce((acc, p) => acc + (p.current_amount || 0), 0);
  const globalProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="premium-container">
      {/* Header Premium */}
      <header className="premium-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ opacity: 0.8, fontSize: '14px' }}>Ravi de vous revoir,</p>
            <h1>{profile?.full_name || 'Investisseur'}</h1>
          </div>
          <div className="status-badge status-ready" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            Mode Premium
          </div>
        </div>
      </header>

      {/* Global Progress Card */}
      <div style={{ padding: '0 20px', marginTop: '-40px' }}>
        <div className="premium-card premium-card-glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 className="font-outfit">Progression Globale</h3>
            <span className="text-gold" style={{ fontWeight: '700' }}>{Math.round(globalProgress)}%</span>
          </div>
          <div className="premium-progress">
            <div className="premium-progress-fill" style={{ width: `${globalProgress}%` }}></div>
          </div>
          <div className="dashboard-grid" style={{ marginTop: '20px' }}>
            <div className="dashboard-stat-card">
              <p className="dashboard-stat-label">Total Objectifs</p>
              <p className="dashboard-stat-value">{totalTarget.toLocaleString()} {profile?.currency?.code}</p>
            </div>
            <div className="dashboard-stat-card">
              <p className="dashboard-stat-label">Disponibilité</p>
              <p className="dashboard-stat-value" style={{ color: 'var(--premium-success)' }}>{availableFunds.toLocaleString()} {profile?.currency?.code}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Alerts */}
      <div style={{ padding: '0 20px' }}>
        <h3 className="font-outfit" style={{ marginBottom: '16px' }}>Alertes & Actions</h3>
        <div className="premium-card" style={{ borderLeft: '4px solid var(--premium-gold)', background: 'var(--premium-gold-light)' }}>
          <p style={{ fontWeight: '600', color: 'var(--navy)', fontSize: '14px' }}>
            💡 Analyse de faisabilité :
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '4px' }}>
            Vos revenus actuels permettent de couvrir 85% de vos objectifs mensuels. Une économie supplémentaire de 15,000 {profile?.currency?.code} est recommandée ce mois-ci.
          </p>
        </div>
      </div>

      {/* Active Projects List */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="font-outfit">Projets Actifs</h3>
          <button style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontWeight: '600', fontSize: '14px' }}>Voir tout</button>
        </div>
        
        {projects.length === 0 ? (
          <div className="premium-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: 'var(--text-light)', marginBottom: '20px' }}>Aucun projet actif pour le moment.</p>
            <button className="premium-btn">Créer mon premier projet</button>
          </div>
        ) : (
          projects.map(project => {
            const monthlyNeed = calculateMonthlyNeeds(project);
            const progress = (project.current_amount / project.target_amount) * 100;
            
            return (
              <div key={project.id} className="premium-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '18px', marginBottom: '4px' }}>{project.name}</h4>
                    <span className={`status-badge ${project.is_complex ? 'status-waiting' : 'status-ready'}`}>
                      {project.is_complex ? 'Projet Complexe' : 'Projet Simple'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>Besoin mensuel</p>
                    <p style={{ fontWeight: '700', color: 'var(--navy)' }}>{Math.round(monthlyNeed).toLocaleString()} {profile?.currency?.code}</p>
                  </div>
                </div>
                
                <div className="premium-progress">
                  <div className="premium-progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-light)' }}>{project.current_amount.toLocaleString()} financé</span>
                  <span style={{ fontWeight: '600' }}>Objectif: {project.target_amount.toLocaleString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (Premium Style) */}
      <button className="premium-btn" style={{ 
        position: 'fixed', 
        bottom: '30px', 
        right: '20px', 
        width: '60px', 
        height: '60px', 
        borderRadius: '50%',
        padding: '0',
        fontSize: '24px',
        zIndex: 100
      }}>
        +
      </button>
    </div>
  );
};

export default PremiumDashboard;
