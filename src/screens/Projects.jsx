import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Car, GraduationCap, Activity, Plane, Briefcase, Zap, CheckCircle2, ChevronRight, Plus, Clock } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import AddProjectModal from '../components/AddProjectModal';

const Projects = () => {
  const { projects = [], formatCurrency, balance } = useFinance();
  const [showAddModal, setShowAddModal] = useState(false);

  const getGlobalStats = () => {
    const totalNeeded = projects.reduce((acc, p) => acc + (p.target_amount || 0), 0);
    const totalSaved = projects.reduce((acc, p) => acc + (p.current_amount || 0), 0);
    const percent = totalNeeded > 0 ? Math.round((totalSaved / totalNeeded) * 100) : 0;
    return { totalNeeded, totalSaved, percent };
  };

  const { totalNeeded, totalSaved, percent } = getGlobalStats();

  const getProjectIcon = (type) => {
    switch(type) {
      case 'home': return <Home size={20} />;
      case 'car': return <Car size={20} />;
      case 'education': return <GraduationCap size={20} />;
      default: return <Activity size={20} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '24px 20px 100px' }}
    >
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--navy)' }}>Mes Projets</h1>
        <p style={{ color: 'var(--text-light)', fontSize: '15px' }}>Planifiez et réalisez vos rêves</p>
      </header>

      {/* Global Progress Card */}
      <div className="card-premium animate-slide-up" style={{ padding: '24px', marginBottom: '32px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(26, 43, 72, 0.15)', background: 'var(--navy)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '4px' }}>Progression globale</p>
            <h2 style={{ fontSize: '28px', fontWeight: '800' }}>{percent}%</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', opacity: 0.8 }}>Besoin total</p>
            <p style={{ fontSize: '18px', fontWeight: '800' }}>{formatCurrency(totalNeeded)}</p>
          </div>
        </div>
        
        <div style={{ height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ height: '100%', background: 'var(--emerald)', borderRadius: '10px' }}
          />
        </div>
        
        <p style={{ fontSize: '13px', opacity: 0.9 }}>
          <span style={{ fontWeight: '700' }}>{formatCurrency(totalSaved)}</span> déjà sécurisés sur {formatCurrency(totalNeeded)}
        </p>
      </div>

      {/* Monthly Allocation Tip */}
      {balance > 0 && (
        <div className="card" style={{ background: 'var(--emerald-light)', border: '1px solid var(--emerald)', marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ color: 'var(--emerald)' }}><Zap size={24} /></div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy)' }}>Optimisation disponible</p>
            <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
              Vous avez {formatCurrency(balance)} non alloués. La répartition suggérée peut les distribuer.
            </p>
          </div>
        </div>
      )}

      {/* Projects List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-light)', letterSpacing: '0.05em' }}>VOS OBJECTIFS</h3>
          <button 
            onClick={() => setShowAddModal(true)}
            style={{ background: 'var(--navy)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
          >
            + Nouveau
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px', border: '2px dashed #E5E7EB', background: 'none' }}>
            <div style={{ width: '64px', height: '64px', background: '#F3F4F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-light)' }}>
              <Plus size={32} />
            </div>
            <h4 style={{ color: 'var(--navy)', marginBottom: '8px' }}>Aucun projet actif</h4>
            <p style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '24px' }}>
              Commencez par ajouter votre premier objectif de vie pour le transformer en réalité.
            </p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary" 
              style={{ width: 'auto', padding: '12px 24px' }}
            >
              Ajouter un projet
            </button>
          </div>
        ) : (
          projects.map((project) => {
            const projPercent = Math.min(100, Math.round((project.current_amount / project.target_amount) * 100));
            const iconMap = {
              home: <Home size={20} />,
              car: <Car size={20} />,
              education: <GraduationCap size={20} />,
              travel: <Plane size={20} />,
              business: <Briefcase size={20} />,
              other: <Activity size={20} />
            };

            return (
              <div key={project.id} className="card" style={{ padding: '16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy)' }}>
                    {iconMap[project.type] || <Activity size={20} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>{project.name}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>{formatCurrency(project.current_amount)} sur {formatCurrency(project.target_amount)}</p>
                  </div>
                  <ChevronRight size={20} color="#D1D5DB" />
                </div>
                
                <div style={{ height: '6px', background: '#F3F4F6', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${projPercent}%`, height: '100%', background: 'var(--navy)' }} />
                </div>
                
                {/* Intelligent Alert if funded step exists */}
                {project.milestones?.find(m => !m.completed && project.current_amount >= m.amount) && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--bg-main)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ color: 'var(--emerald)' }}><CheckCircle2 size={14} /></div>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--emerald)' }}>
                      Étape "{project.milestones.find(m => !m.completed && project.current_amount >= m.amount).name}" finançable !
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <AddProjectModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />
    </motion.div>
  );
};

export default Projects;
