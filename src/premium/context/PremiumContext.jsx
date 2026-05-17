import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { useFinance } from '../../context/FinanceContext';

const PremiumContext = createContext();

export const PremiumProvider = ({ children }) => {
  const { salary, savings, currency, setSalary, setSavings } = useFinance();
  const [profile, setProfile] = useState({ salary: 0, savings: 0, currency: { code: 'XOF' } });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableFunds, setAvailableFunds] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [priorities, setPriorities] = useState([]);

  // Keep profile and availableFunds state synchronized with the unified FinanceContext
  useEffect(() => {
    setProfile({
      salary: salary || 0,
      savings: savings || 0,
      currency: currency || { code: 'XOF' }
    });
    setAvailableFunds(savings || 0);
  }, [salary, savings, currency]);

  // Fetch all premium data from Supabase
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Projects with their Milestones
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          milestones(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      
      const loadedProjects = projectsData || [];
      setProjects(loadedProjects);

      // 2. Process Smart Alerts & Priorities
      generateAlertsAndPriorities(loadedProjects, { salary, savings, currency });

    } catch (error) {
      console.error('Error loading Premium Zenith data:', error);
    } finally {
      setLoading(false);
    }
  }, [salary, savings, currency]);

  // Calculate monthly need for a single project
  const calculateMonthlyNeed = useCallback((project) => {
    if (project.is_recurring) {
      return parseFloat(project.target_amount || 0);
    }

    if (!project.deadline || !project.target_amount) return 0;
    
    const target = parseFloat(project.target_amount);
    const current = parseFloat(project.current_amount || 0);
    const remaining = target - current;
    
    if (remaining <= 0) return 0;

    const today = new Date();
    const deadline = new Date(project.deadline);
    const monthsLeft = (deadline.getFullYear() - today.getFullYear()) * 12 + (deadline.getMonth() - today.getMonth());
    
    const effectiveMonths = Math.max(1, monthsLeft);
    return remaining / effectiveMonths;
  }, []);

  // Helper to compile alerts (including the "Ready to Realize" status)
  const generateAlertsAndPriorities = (loadedProjects, userProfile) => {
    const newAlerts = [];
    const newPriorities = [];

    // Check projects and milestones for funding states
    loadedProjects.forEach(project => {
      const target = parseFloat(project.target_amount || 0);
      const current = parseFloat(project.current_amount || 0);

      // Rule 1: Project is fully funded and ready to realize
      if (current >= target && target > 0) {
        newAlerts.push({
          id: `realize-project-${project.id}`,
          type: 'ready_to_realize',
          title: 'Projet prêt à réaliser !',
          description: `Félicitations ! Votre projet "${project.name}" est entièrement financé (${current.toLocaleString()} ${userProfile?.currency?.code || 'XOF'}).`,
          projectId: project.id,
          project: project
        });

        // Add to immediate priorities to let the user "Execute" realization
        newPriorities.push({
          id: `priority-realize-${project.id}`,
          type: 'realize',
          title: `Finaliser "${project.name}"`,
          description: 'Marquer ce projet comme accompli.',
          amount: current,
          actionLabel: 'Réaliser',
          projectId: project.id
        });
      }

      // Rule 2: Milestones fully funded but not marked completed (for Complex Projects)
      if (project.is_complex && project.milestones) {
        project.milestones.forEach(milestone => {
          const mAmount = parseFloat(milestone.amount || 0);
          const mAllocated = parseFloat(milestone.current_allocated || 0);
          
          if (mAllocated >= mAmount && !milestone.completed) {
            newAlerts.push({
              id: `realize-milestone-${milestone.id}`,
              type: 'ready_to_realize',
              title: 'Étape prête à réaliser !',
              description: `L'étape "${milestone.name}" du projet "${project.name}" est entièrement financée. Vous pouvez la lancer !`,
              projectId: project.id,
              milestoneId: milestone.id,
              milestone: milestone
            });

            newPriorities.push({
              id: `priority-milestone-${milestone.id}`,
              type: 'milestone_complete',
              title: `Valider "${milestone.name}"`,
              description: `Débloquer l'étape de "${project.name}"`,
              amount: mAmount,
              actionLabel: 'Débloquer',
              milestoneId: milestone.id,
              projectId: project.id
            });
          }
        });
      }

      // Rule 3: Funding delays (underfunded projects based on deadline)
      if (!project.is_recurring && current < target) {
        const monthlyNeed = calculateMonthlyNeed(project);
        // Simple mock warning for delayed funding
        if (monthlyNeed > (parseFloat(userProfile?.salary || 0) * 0.4)) {
          newAlerts.push({
            id: `delay-${project.id}`,
            type: 'funding_delay',
            title: 'Retard de financement',
            description: `Le projet "${project.name}" demande ${Math.round(monthlyNeed).toLocaleString()} ${userProfile?.currency?.code || 'XOF'} ce mois-ci, ce qui dépasse le seuil conseillé.`,
            projectId: project.id
          });
        }
      }
    });

    // Fallback general tips or priorities if none generated
    if (newPriorities.length === 0) {
      newPriorities.push({
        id: 'priority-reallocate',
        type: 'general',
        title: 'Optimisation de Surplus',
        description: 'Répartir automatiquement vos économies passées vers vos objectifs urgents.',
        actionLabel: 'Équilibrer',
      });
    }

    setAlerts(newAlerts);
    setPriorities(newPriorities);
  };

  // Perform priority action
  const executePriorityAction = async (priority) => {
    try {
      if (priority.type === 'milestone_complete') {
        // Complete milestone in database
        const { error } = await supabase
          .from('milestones')
          .update({ completed: true })
          .eq('id', priority.milestoneId);
        
        if (error) throw error;
      } else if (priority.type === 'realize') {
        // Mark project as complete (in projects we could delete it, or update status/archive)
        const { error } = await supabase
          .from('projects')
          .delete() // Simple action: archive or remove completed project
          .eq('id', priority.projectId);

        if (error) throw error;
      }
      
      // Refresh
      await fetchData();
    } catch (err) {
      console.error('Error executing Zenith Action:', err.message);
      alert('Erreur action: ' + err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <PremiumContext.Provider value={{
      profile,
      projects,
      loading,
      availableFunds,
      alerts,
      priorities,
      fetchData,
      calculateMonthlyNeed,
      executePriorityAction
    }}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};
