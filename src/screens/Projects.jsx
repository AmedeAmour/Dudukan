import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Plus, ChevronRight, AlertCircle, 
  CheckCircle2, Clock, Zap, Home, Car, Smartphone, 
  GraduationCap, MoreHorizontal
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import AddProjectModal from '../components/AddProjectModal';

const Projects = () => {
  const { projects = [], formatCurrency, balance } = useFinance();
  const [showAddModal, setShowAddModal] = useState(false);

  const totalNeeded = projects.reduce((acc, p) => acc + p.targetAmount, 0);
  const totalSaved = projects.reduce((acc, p) => acc + p.currentAmount, 0);
  const globalProgress = totalNeeded > 0 ? (totalSaved / totalNeeded) * 100 : 0;

  const getProjectIcon = (type) => {
    switch(type) {
      case 'home': return <Home size={20} />;
      case 'car': return <Car size={20} />;
      case 'tech': return <Smartphone size={20} />;
      case 'education': return <GraduationCap size={20} />;
      default: return <Target size={20} />;
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
      <div className="card" style={{ background: 'var(--navy)', color: 'white', marginBottom: '32px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '4px' }}>Progression globale</p>
            <h2 style={{ fontSize: '28px', fontWeight: '800' }}>{Math.round(globalProgress)}%</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '4px' }}>Besoin total</p>
            <p style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(totalNeeded)}</p>
          </div>
        </div>
        
        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${globalProgress}%` }}
            style={{ height: '100%', background: 'var(--emerald)' }}
          />
        </div>
        
        <p style={{ fontSize: '12px', opacity: 0.7 }}>
          {formatCurrency(totalSaved)} déjà sécurisés sur {formatCurrency(totalNeeded)}
        </p>
      </div>

      {/* Monthly Allocation Tip */}
      {balance > 0 && (
        <div className="card" style={{ background: 'var(--emerald-light)', border: '1px solid var(--emerald)', marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ color: 'var(--emerald)' }}><Zap size={24} /></div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy)' }}>Optimisation disponible</p>
            <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>Vous avez {formatCurrency(balance)} non alloués. Voulez-vous les distribuer sur vos projets ?</p>
          </div>
        </div>
      )}

      {/* Projects List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-light)' }}>VOS OBJECTIFS</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>{projects.length} actifs</span>
        </div>

        {projects.length === 0 ? (
          <div className="card" style={{ padding: '40px 20px', textAlign: 'center', borderStyle: 'dashed' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-light)' }}>
              <Plus size={32} />
            </div>
            <h4 style={{ fontWeight: '700', color: 'var(--navy)', marginBottom: '8px' }}>Aucun projet actif</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '20px' }}>Commencez par ajouter votre premier rêve pour le transformer en réalité.</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary" 
              style={{ width: 'auto', padding: '12px 24px' }}
            >
              Ajouter un projet
            </button>
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} className="card" style={{ padding: '16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: 'var(--bg-main)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--navy)'
                }}>
                  {getProjectIcon(project.type)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <h4 style={{ fontWeight: '700', color: 'var(--navy)' }}>{project.name}</h4>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--emerald)' }}>
                      {Math.round((project.currentAmount / project.targetAmount) * 100)}%
                    </span>
                  </div>
                  
                  <div style={{ height: '6px', background: '#F3F4F6', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ width: `${(project.currentAmount / project.targetAmount) * 100}%`, height: '100%', background: 'var(--navy)' }} />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-light)' }}>
                    <span>{formatCurrency(project.currentAmount)} / {formatCurrency(project.targetAmount)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} /> {project.deadline ? new Date(project.deadline).toLocaleDateString('fr-FR') : 'Sans délai'}
                    </span>
                  </div>
                </div>
                
                <ChevronRight size={20} color="#D1D5DB" />
              </div>
              
              {/* Intelligent Alert if funded step exists */}
              {project.milestones?.find(m => !m.completed && project.currentAmount >= m.amount) && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ color: 'var(--emerald)' }}><CheckCircle2 size={14} /></div>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--emerald)' }}>
                    Étape "{project.milestones.find(m => !m.completed && project.currentAmount >= m.amount).name}" finançable !
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAddModal(true)}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--navy)',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 24px rgba(26, 43, 85, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10
        }}
      >
        <Plus size={24} />
      </motion.button>

      <AddProjectModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />
    </motion.div>
  );
};

export default Projects;
