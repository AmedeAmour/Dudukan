import React, { useState } from 'react';
import { usePremium } from '../context/PremiumContext';
import '../PremiumStyles.css';
import DistributionRecap from './DistributionRecap';

const PremiumDashboard = ({ onAddProject }) => {
  const { projects, profile, availableFunds, loading, calculateMonthlyNeeds } = usePremium();
  const [distributeAmount, setDistributeAmount] = useState('');
  const [showRecap, setShowRecap] = useState(false);

  if (loading) return <div className="premium-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Chargement de l'assistant...</div>;

  const totalTarget = projects.reduce((acc, p) => acc + (p.target_amount || 0), 0);
  const totalSaved = projects.reduce((acc, p) => acc + (p.current_amount || 0), 0);
  const globalProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="premium-container">
      {/* Header Zenith Style */}
      <header className="premium-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ opacity: 0.8, fontSize: '14px', fontFamily: 'var(--font-body)' }}>Ravi de vous revoir,</p>
            <h1 style={{ fontSize: '32px' }}>{profile?.full_name || 'Investisseur'}</h1>
          </div>
          <div className="status-badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            Zenith Premium
          </div>
        </div>
      </header>

      {/* Global Progress Card */}
      <div style={{ padding: '0 20px', marginTop: '-40px' }}>
        <div className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-headings)', fontSize: '18px' }}>Progression Globale</h3>
            <span style={{ color: 'var(--zenith-secondary)', fontFamily: 'var(--font-data)', fontWeight: '700', fontSize: '20px' }}>
              {Math.round(globalProgress)}%
            </span>
          </div>
          <div className="premium-progress">
            <div className="premium-progress-fill" style={{ width: `${globalProgress}%` }}></div>
          </div>
          <div className="dashboard-grid" style={{ marginTop: '24px' }}>
            <div className="dashboard-stat-card">
              <p className="dashboard-stat-label" style={{ fontSize: '12px', color: 'var(--zenith-neutral)' }}>Total Objectifs</p>
              <p className="dashboard-stat-value" style={{ fontSize: '22px' }}>{totalTarget.toLocaleString()} <span style={{ fontSize: '14px' }}>{profile?.currency?.code}</span></p>
            </div>
            <div className="dashboard-stat-card">
              <p className="dashboard-stat-label" style={{ fontSize: '12px', color: 'var(--zenith-neutral)' }}>Disponibilité</p>
              <p className="dashboard-stat-value" style={{ color: 'var(--zenith-secondary)', fontSize: '22px' }}>{availableFunds.toLocaleString()} <span style={{ fontSize: '14px' }}>{profile?.currency?.code}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence & Smart Distribution */}
      <div style={{ padding: '0 20px' }}>
        <div className="premium-card">
          <h3 style={{ fontFamily: 'var(--font-headings)', marginBottom: '12px', fontSize: '18px' }}>Assistant de Répartition</h3>
          <p style={{ fontSize: '14px', color: 'var(--zenith-neutral)', marginBottom: '20px', lineHeight: '1.5' }}>
            Combien avez-vous reçu aujourd'hui ? L'IA Zenith va optimiser le placement de vos fonds.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="number" 
              className="premium-input"
              placeholder={`Montant en ${profile?.currency?.code}`} 
              value={distributeAmount}
              onChange={(e) => setDistributeAmount(e.target.value)}
              style={{ flex: 1 }}
            />
            <button 
              className="premium-btn" 
              style={{ padding: '0 32px' }}
              onClick={() => setShowRecap(true)}
            >
              Répartir
            </button>
          </div>
        </div>
      </div>

      {showRecap && distributeAmount > 0 && (
        <div style={{ padding: '0 20px' }} className="fade-in">
          <DistributionRecap amount={parseFloat(distributeAmount)} />
        </div>
      )}

      {/* Action Alerts */}
      <div style={{ padding: '0 20px' }}>
        <h3 style={{ fontFamily: 'var(--font-headings)', marginBottom: '16px', fontSize: '18px' }}>Alertes & Analyse</h3>
        <div className="premium-card" style={{ borderLeft: '6px solid var(--zenith-secondary)', background: 'rgba(67, 160, 71, 0.05)' }}>
          <p style={{ fontWeight: '700', color: 'var(--zenith-primary)', fontSize: '15px', fontFamily: 'var(--font-headings)' }}>
            💡 Analyse de faisabilité
          </p>
          <p style={{ fontSize: '14px', color: '#4A5568', marginTop: '8px', lineHeight: '1.6' }}>
            Vos revenus actuels permettent de couvrir <strong>85%</strong> de vos objectifs mensuels. Une légère optimisation de vos charges fixes pourrait accélérer vos projets.
          </p>
        </div>
      </div>

      {/* Active Projects List */}
      <div style={{ padding: '0 20px', paddingBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-headings)', fontSize: '18px' }}>Projets Actifs</h3>
          <button style={{ background: 'none', border: 'none', color: 'var(--zenith-primary)', fontWeight: '700', fontSize: '14px', fontFamily: 'var(--font-headings)' }}>Voir tout</button>
        </div>
        
        {projects.length === 0 ? (
          <div className="premium-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ marginBottom: '20px', opacity: 0.3 }}>
              <FolderOpen size={48} strokeWidth={1.5} style={{ margin: '0 auto' }} />
            </div>
            <p style={{ color: 'var(--zenith-neutral)', marginBottom: '24px', fontSize: '15px' }}>Aucun projet de vie actif pour le moment.</p>
            <button className="premium-btn" onClick={onAddProject} style={{ margin: '0 auto' }}>
              <Plus size={20} /> Créer mon premier projet
            </button>
          </div>
        ) : (
          projects.map(project => {
            const monthlyNeed = calculateMonthlyNeeds(project);
            const progress = (project.current_amount / project.target_amount) * 100;
            
            return (
              <div key={project.id} className="premium-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-headings)', marginBottom: '6px' }}>{project.name}</h4>
                    <span className={`status-badge ${project.is_complex ? 'status-waiting' : 'status-ready'}`}>
                      {project.is_complex ? 'Complexe' : 'Simple'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '12px', color: 'var(--zenith-neutral)', fontWeight: '500' }}>Besoin mensuel</p>
                    <p style={{ fontWeight: '700', color: 'var(--zenith-primary)', fontFamily: 'var(--font-data)', fontSize: '16px' }}>{Math.round(monthlyNeed).toLocaleString()} <span style={{ fontSize: '10px' }}>{profile?.currency?.code}</span></p>
                  </div>
                </div>
                
                <div className="premium-progress" style={{ marginBottom: '12px' }}>
                  <div className="premium-progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--zenith-neutral)', fontWeight: '500' }}>
                    <span style={{ fontFamily: 'var(--font-data)', fontWeight: '700', color: 'var(--zenith-primary)' }}>{project.current_amount.toLocaleString()}</span> financé
                  </span>
                  <span style={{ fontWeight: '600', color: 'var(--zenith-neutral)' }}>Objectif: {project.target_amount.toLocaleString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button Zenith Style */}
      <button 
        className="premium-btn" 
        onClick={onAddProject}
        style={{ 
          position: 'fixed', 
          bottom: '110px', 
          right: '24px', 
          width: '64px', 
          height: '64px', 
          borderRadius: 'var(--radius-pill)',
          padding: '0',
          boxShadow: '0 8px 25px rgba(26, 79, 139, 0.4)',
          zIndex: 100
        }}
      >
        <Plus size={32} />
      </button>
    </div>
  );
};

export default PremiumDashboard;
