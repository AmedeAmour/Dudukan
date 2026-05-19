import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { useFinance } from '../../context/FinanceContext';

const PremiumContext = createContext();

export const PremiumProvider = ({ children }) => {
  const { currency, savings: financeSavings, setSavings: setFinanceSavings, balance, salary: freeSalary } = useFinance();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableFunds, setAvailableFunds] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [priorities, setPriorities] = useState([]);

  // Fetch all premium data from Supabase
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Profile (with automatic defensive creation if missing)
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code === 'PGRST116') {
        // Automatically insert a default profile row for this user
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id, salary: 0, savings: 0 })
          .select()
          .single();
        
        if (insertError) {
          console.error("Auto-profile insertion failed:", insertError);
          profileData = { id: user.id, salary: 0, savings: 0 };
        } else {
          profileData = insertData;
        }
      } else if (profileError) {
        throw profileError;
      }
      
      setProfile(profileData);
      setAvailableFunds(financeSavings || 0);

      // 2. Fetch Projects with their Milestones
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          milestones(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      
      let loadedProjects = projectsData || [];

      // 3. Detect and handle savings decrease (withdrawal)
      const lastSynchronizedSavings = parseFloat(profileData?.savings || 0);
      const currentRealSavings = parseFloat(financeSavings || 0);

      if (currentRealSavings < lastSynchronizedSavings) {
        const reductionAmount = lastSynchronizedSavings - currentRealSavings;
        
        // Apply automatic reduction inverse of allocation
        let remainingReduction = reductionAmount;
        let targetProjectsList = loadedProjects.filter(p => !p.is_recurring && parseFloat(p.current_amount || 0) > 0);
        const priorityWeights = { 1: 3, 3: 1.5, 5: 1 };

        while (remainingReduction > 0 && targetProjectsList.length > 0) {
          const totalWeight = targetProjectsList.reduce((acc, p) => acc + (priorityWeights[p.priority] || 1), 0);
          let reductionApplied = false;
          const updates = [];

          for (const project of targetProjectsList) {
            const weight = priorityWeights[project.priority] || 1;
            const share = weight / totalWeight;
            const projectReduction = Math.min(parseFloat(project.current_amount || 0), remainingReduction * share);
            
            if (projectReduction > 0) {
              const newAmount = parseFloat(project.current_amount || 0) - projectReduction;
              updates.push({ id: project.id, current_amount: newAmount });
              remainingReduction -= projectReduction;
              reductionApplied = true;
            }
          }

          if (!reductionApplied) break;

          // Perform DB updates for reduced projects
          for (const update of updates) {
            await supabase
              .from('projects')
              .update({ current_amount: update.current_amount })
              .eq('id', update.id);

            // Sync milestones for this project
            const { data: milestones, error: mErr } = await supabase
              .from('milestones')
              .select('*')
              .eq('project_id', update.id);
            
            if (!mErr && milestones) {
              let accumulated = 0;
              for (const milestone of milestones) {
                accumulated += parseFloat(milestone.target_amount || 0);
                const shouldBeCompleted = update.current_amount >= accumulated;
                if (milestone.is_completed !== shouldBeCompleted) {
                  await supabase
                    .from('milestones')
                    .update({ is_completed: shouldBeCompleted })
                    .eq('id', milestone.id);
                }
              }
            }
          }

          // Reload projects data to reflect updates
          const { data: refreshedData } = await supabase
            .from('projects')
            .select(`
              *,
              milestones(*)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (refreshedData) {
            loadedProjects = refreshedData;
          }
          targetProjectsList = loadedProjects.filter(p => !p.is_recurring && parseFloat(p.current_amount || 0) > 0);
        }

        // Update profile savings to match currentRealSavings
        await supabase
          .from('profiles')
          .update({ savings: currentRealSavings })
          .eq('id', user.id);
      } else if (currentRealSavings > lastSynchronizedSavings) {
        // Just update profile savings to match the increase without automatically allocating
        await supabase
          .from('profiles')
          .update({ savings: currentRealSavings })
          .eq('id', user.id);
      }

      setProjects(loadedProjects);

      // 4. Process Smart Alerts & Priorities
      generateAlertsAndPriorities(loadedProjects, profileData);

    } catch (error) {
      console.error('Error loading Premium Zenith data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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
          description: `Félicitations ! Votre projet "${project.name}" est entièrement financé (${current.toLocaleString()} ${currency?.code || 'XOF'}).`,
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
        const sortedMilestones = [...project.milestones].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        let previousTargetsSum = 0;

        sortedMilestones.forEach(milestone => {
          const mAmount = parseFloat(milestone.target_amount || 0);
          const mAllocated = Math.max(0, Math.min(mAmount, current - previousTargetsSum));
          previousTargetsSum += mAmount;

          const isFullyFunded = mAllocated >= mAmount;
          
          if (isFullyFunded && !milestone.is_completed) {
            newAlerts.push({
              id: `realize-milestone-${milestone.id}`,
              type: 'ready_to_realize',
              title: 'Étape prête à réaliser !',
              description: `L'étape "${milestone.name}" du projet "${project.name}" est prête à être validée. Vous pouvez la lancer !`,
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
            description: `Le projet "${project.name}" demande ${Math.round(monthlyNeed).toLocaleString()} ${currency?.code || 'XOF'} ce mois-ci, ce qui dépasse le seuil conseillé.`,
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
          .update({ is_completed: true })
          .eq('id', priority.milestoneId);
        
        if (error) throw error;
      } else if (priority.type === 'realize') {
        const project = projects.find(p => p.id === priority.projectId);
        const projectAmount = project ? parseFloat(project.current_amount || 0) : 0;

        // Deduct the realized project budget from free savings (money is spent)
        const newSavings = Math.max(0, parseFloat(financeSavings || 0) - projectAmount);
        setFinanceSavings(newSavings);

        // Update profile in DB to match new savings
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ savings: newSavings })
            .eq('id', user.id);
        }

        // Delete/archive project from DB
        const { error } = await supabase
          .from('projects')
          .delete()
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
      currency,
      financeSavings,
      setFinanceSavings,
      balance,
      fetchData,
      calculateMonthlyNeed,
      executePriorityAction,
      freeSalary
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
