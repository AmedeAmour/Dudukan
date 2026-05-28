import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';

const PremiumContext = createContext();

export const PremiumProvider = ({ children }) => {
  const { user } = useAuth();
  const { currency, savings: financeSavings, setSavings: setFinanceSavings, balance, salary: freeSalary } = useFinance();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableFunds, setAvailableFunds] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [coachInsights, setCoachInsights] = useState([]);
  const [latestAllocationReport, setLatestAllocationReportState] = useState(null);
  
  // State for premium transactions (used as 'transactions' in UI)
  const [transactions, setTransactions] = useState([]);
  // Helper to fetch premium transactions for the current user and map to UI format
  const fetchPremiumTransactions = async (userId) => {
    const { data, error } = await supabase
      .from('premium_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to fetch premium transactions', error);
      return;
    }
    const mapped = (data || []).map(tx => ({
      id: tx.id,
      type: tx.transaction_type,
      projectName: tx.project_name,
      amount: parseFloat(tx.amount || 0),
      date: tx.created_at,
      note: tx.description || tx.title,
      stepName: tx.step_name,
      projectId: tx.project_id,
      stepId: tx.step_id,
      relatedAllocationId: tx.related_allocation_id,
      metadata: tx.metadata
    }));
    setTransactions(mapped);
  };



// Helper to create a new premium transaction
  const createTransaction = async (tx) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('createTransaction: No authenticated user found');
      return;
    }
    const payload = {
      user_id: user.id,
      transaction_type: tx.type,
      title: tx.title,
      description: tx.description || null,
      amount: tx.amount || null,
      project_id: tx.project_id || null,
      project_name: tx.project_name || null,
      step_id: tx.step_id || null,
      step_name: tx.step_name || null,
      related_allocation_id: tx.related_allocation_id || null,
      metadata: tx.metadata || null
    };
    const { error } = await supabase.from('premium_transactions').insert([payload]).select();
    if (error) {
      console.error('Failed to create premium transaction:', error.message);
    } else {
      await fetchPremiumTransactions(user.id);
    }
  };

  const setLatestAllocationReport = useCallback(async (report) => {
    setLatestAllocationReportState(report);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (report) {
        localStorage.setItem(`dudukan_latest_allocation_report_${user.id}`, JSON.stringify(report));
      } else {
        localStorage.removeItem(`dudukan_latest_allocation_report_${user.id}`);
      }
    }
  }, []);

  // Fetch all premium data from Supabase
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Clean up old global key if it exists
      localStorage.removeItem('dudukan_latest_allocation_report');

      // Load user-specific allocation report
      try {
        const saved = localStorage.getItem(`dudukan_latest_allocation_report_${user.id}`);
        setLatestAllocationReportState(saved ? JSON.parse(saved) : null);
      } catch (e) {
        setLatestAllocationReportState(null);
      }

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

      // Load premium transactions for this user
      await fetchPremiumTransactions(user.id);

      // 3. Fetch Projects and their milestones
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
      console.error('Error loading Dudukan Plus data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate monthly need for a single project
  const calculateMonthlyNeed = useCallback((project) => {
    // 1. Projets récurrents : le besoin mensuel est le montant cible périodique (ex: loyer, abonnement).
    if (project.is_recurring) {
      return parseFloat(project.target_amount || 0);
    }

    if (!project.deadline || !project.target_amount) return 0;
    
    const target = parseFloat(project.target_amount);
    const current = parseFloat(project.current_amount || 0);
    const remaining = target - current;
    
    // Si le projet est déjà entièrement financé, plus aucun besoin mensuel.
    if (remaining <= 0) return 0;

    const today = new Date();
    const deadline = new Date(project.deadline);
    const monthsLeft = (deadline.getFullYear() - today.getFullYear()) * 12 + (deadline.getMonth() - today.getMonth());
    
    // Si la date limite est déjà dépassée (projet en retard) :
    // le besoin prévu pour le mois en cours est de 0 (exclu du budget mensuel).
    if (monthsLeft < 0) return 0;

    // 2. Projets complexes (avec étapes / jalons) :
    // "des étapes prévues ce mois-ci" -> le besoin mensuel correspond au montant
    // requis pour accomplir l'étape active en cours de réalisation (active milestone).
    if (project.is_complex && project.milestones && project.milestones.length > 0) {
      const sortedMilestones = [...project.milestones].sort(
        (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
      );
      
      let previousTargetsSum = 0;
      let activeMilestone = null;
      
      for (const m of sortedMilestones) {
        if (!m.is_completed) {
          activeMilestone = m;
          break;
        }
        previousTargetsSum += parseFloat(m.target_amount || 0);
      }
      
      if (activeMilestone) {
        const activeTarget = parseFloat(activeMilestone.target_amount || 0);
        // Calcule la part de l'épargne déjà allouée à cette étape active
        const activeAllocated = Math.max(0, Math.min(activeTarget, current - previousTargetsSum));
        const activeRemaining = activeTarget - activeAllocated;
        
        // Garantir que ce besoin d'étape n'équivaut pas accidentellement au reste à financer global du projet,
        // sauf si le projet n'a qu'une seule étape.
        if (activeRemaining > 0 && (activeRemaining < remaining || sortedMilestones.length === 1)) {
          return activeRemaining;
        }
      }
    }

    // 3. Projets simples (non récurrents, non complexes) :
    // Calcul de la contribution mensuelle recommandée.
    // Si l'échéance est lointaine (dans au moins 2 mois), la contribution mensuelle recommandée est :
    if (monthsLeft >= 2) {
      return remaining / monthsLeft;
    }

    // Si l'échéance est imminente (ce mois-ci ou le mois prochain, monthsLeft === 0 ou 1) :
    // Pour éviter d'afficher le reste à financer total ou l'objectif global comme besoin mensuel,
    // on calcule la contribution mensuelle initialement prévue sur la durée totale du projet.
    const start = project.created_at ? new Date(project.created_at) : today;
    const totalDurationMonths = (deadline.getFullYear() - start.getFullYear()) * 12 + (deadline.getMonth() - start.getMonth());
    
    if (totalDurationMonths >= 2) {
      // Retourne la contribution mensuelle planifiée d'origine (cible / durée totale)
      return target / totalDurationMonths;
    }

    // Si le projet a été planifié sur une durée très courte (< 2 mois) ou si la donnée n'est pas disponible,
    // on ne retourne pas le reste à financer total ou l'objectif global comme besoin du mois.
    // On retourne 0 par défaut pour signifier qu'il n'y a pas de contribution mensuelle planifiée stable.
    return 0;
  }, []);

  // Helper to compile alerts (including the "Ready to Realize" status)
  function generateAlertsAndPriorities(loadedProjects, userProfile) {
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

    // Generate Dynamic Coach Insights (strategic, natural, human tone)
    const insights = [];
    const totalSavings = parseFloat(financeSavings || 0);
    const totalAllocated = loadedProjects.reduce((acc, p) => acc + parseFloat(p.current_amount || 0), 0);
    const unallocated = Math.max(0, totalSavings - totalAllocated);

    const targetProjects = loadedProjects.filter(p => !p.is_recurring);

    // 1. Check if no projects
    if (loadedProjects.length === 0) {
      insights.push({
        type: 'info',
        text: "Votre espace Dudukan Plus est opérationnel. Définissons ensemble vos premiers projets de vie afin de donner un cap clair à vos efforts d'épargne."
      });
    } else {
      // 2. Safety Buffer / Unallocated Savings
      if (totalSavings > 0) {
        const unallocatedRatio = unallocated / totalSavings;
        if (unallocatedRatio >= 0.3) {
          insights.push({
            type: 'success',
            text: "Votre réserve d'épargne non allouée reste confortable. Cette marge de sécurité est idéale pour absorber les imprévus à court terme sans impacter la trajectoire de vos projets."
          });
        } else if (unallocatedRatio < 0.1 && unallocatedRatio > 0) {
          insights.push({
            type: 'warning',
            text: "La quasi-totalité de vos économies est affectée à vos projets. C'est une planification rigoureuse, mais veillez à garder un petit coussin de sécurité pour vos dépenses courantes imprévues."
          });
        } else if (unallocated === 0) {
          insights.push({
            type: 'warning',
            text: "Toute votre épargne est actuellement engagée. Conserver une part d'épargne non allouée permet de parer aux aléas du quotidien sans avoir à piocher dans vos objectifs déjà financés."
          });
        }
      }

      // 3. Project Concentration & Balance
      if (totalAllocated > 0 && targetProjects.length > 1) {
        let maxProject = null;
        let maxAllocated = 0;
        targetProjects.forEach(p => {
          const amt = parseFloat(p.current_amount || 0);
          if (amt > maxAllocated) {
            maxAllocated = amt;
            maxProject = p;
          }
        });

        if (maxProject) {
          const ratio = maxAllocated / totalAllocated;
          if (ratio >= 0.65) {
            insights.push({
              type: 'info',
              text: `Une part majeure de vos fonds (${Math.round(ratio * 100)}%) est concentrée sur votre projet "${maxProject.name}". Cette orientation favorise la progression rapide de cet objectif de long terme, bien que cela ralentisse temporairement vos autres projets.`
            });
          } else if (ratio <= 0.4) {
            insights.push({
              type: 'success',
              text: "Votre stratégie actuelle permet d'avancer progressivement sur plusieurs projets de front sans déséquilibrer totalement votre réserve restante."
            });
          }
        }
      }

      // 4. Delayed Projects / Deadline Risk
      const today = new Date();
      targetProjects.forEach(project => {
        const target = parseFloat(project.target_amount || 0);
        const current = parseFloat(project.current_amount || 0);
        if (project.deadline && target > 0 && current < target) {
          const deadline = new Date(project.deadline);
          const monthsLeft = (deadline.getFullYear() - today.getFullYear()) * 12 + (deadline.getMonth() - today.getMonth());
          const progressPercent = (current / target) * 100;
          
          if (monthsLeft > 0 && monthsLeft <= 6 && progressPercent < 45) {
            insights.push({
              type: 'danger',
              text: `L'échéance du projet "${project.name}" se rapproche (moins de 6 mois), mais le financement n'est sécurisé qu'à ${Math.round(progressPercent)}%. Envisager de repousser la date cible permettrait d'alléger la pression financière mensuelle.`
            });
          }
        }
      });

      // 5. Neglected Target Projects
      if (targetProjects.length > 1) {
        const neglected = targetProjects.filter(p => {
          const target = parseFloat(p.target_amount || 0);
          const current = parseFloat(p.current_amount || 0);
          return target > 0 && (current / target) < 0.05;
        });

        if (neglected.length > 0) {
          const names = neglected.map(p => `"${p.name}"`).join(', ');
          insights.push({
            type: 'info',
            text: `Le projet ${names} reçoit actuellement une allocation plus faible. À ce rythme, son délai de réalisation sera probablement plus long. Pensez à rééquilibrer vos priorités si cet objectif devient plus urgent.`
          });
        }
      }

      // 6. Milestone progress encouragement
      const complexProjects = targetProjects.filter(p => p.is_complex && p.milestones);
      let completedMilestones = 0;
      complexProjects.forEach(p => {
        p.milestones.forEach(m => {
          if (m.is_completed) completedMilestones++;
        });
      });

      if (completedMilestones > 0) {
        insights.push({
          type: 'success',
          text: `Vous avez validé ${completedMilestones} étape(s) clé(s) sur vos projets complexes. Chaque jalon franchi renforce votre plan et vous rapproche concrètement du résultat.`
        });
      }
    }

    setCoachInsights(insights);
  }

  // Perform priority action
  const executePriorityAction = async (priority) => {
    try {
      if (priority.type === 'milestone_complete') {
        const project = projects.find(p => p.id === priority.projectId);
        const milestone = project?.milestones?.find(m => m.id === priority.milestoneId);

        // Complete milestone in database
        const { error } = await supabase
          .from('milestones')
          .update({ is_completed: true })
          .eq('id', priority.milestoneId);
        
        if (error) throw error;

        // Log milestone complete as life_allocation
        await createTransaction({
          type: 'life_allocation',
          title: milestone ? `Jalon validé : ${milestone.name}` : priority.title,
          description: `Déblocage de l'étape clé du projet : ${project?.name || ''}`,
          amount: priority.amount || null,
          project_id: priority.projectId,
          project_name: project?.name,
          step_id: priority.milestoneId,
          step_name: milestone?.name
        });
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

        // Log project realization as completion
        await createTransaction({
          type: 'completion',
          title: `Projet réalisé : ${project?.name || ''}`,
          description: `Accomplissement final et concrétisation de l'objectif de vie`,
          amount: projectAmount,
          project_id: priority.projectId,
          project_name: project?.name
        });
      }

      // Refresh data after action
      await fetchData();
    } catch (err) {
      console.error('Error executing priority action:', err);
      throw err;
    }
  };

  const [reminders, setReminders] = useState([]);

  // Load reminders when user changes
  useEffect(() => {
    if (user) {
      try {
        const saved = localStorage.getItem(`dudukan_premium_reminders_${user.id}`);
        setReminders(saved ? JSON.parse(saved) : []);
      } catch (e) {
        setReminders([]);
      }
    } else {
      setReminders([]);
    }
  }, [user]);

  // Helper to save reminders
  const saveReminders = useCallback((newReminders) => {
    setReminders(newReminders);
    if (user) {
      localStorage.setItem(`dudukan_premium_reminders_${user.id}`, JSON.stringify(newReminders));
    }
  }, [user]);

  const addReminder = useCallback((reminder) => {
    const newReminder = {
      id: Date.now().toString(),
      enabled: true,
      createdAt: new Date().toISOString(),
      ...reminder
    };
    saveReminders([...reminders, newReminder]);
  }, [reminders, saveReminders]);

  const deleteReminder = useCallback((id) => {
    saveReminders(reminders.filter(r => r.id !== id));
  }, [reminders, saveReminders]);

  const toggleReminder = useCallback((id) => {
    saveReminders(reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }, [reminders, saveReminders]);

  const resetPremiumData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Delete premium transactions
      const { error: txError } = await supabase
        .from('premium_transactions')
        .delete()
        .eq('user_id', user.id);
      if (txError) console.error('Error resetting premium transactions:', txError);

      // 2. Delete milestones
      const { data: userProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id);
      
      if (userProjects && userProjects.length > 0) {
        const projectIds = userProjects.map(p => p.id);
        const { error: msError } = await supabase
          .from('milestones')
          .delete()
          .in('project_id', projectIds);
        if (msError) console.error('Error resetting milestones:', msError);
      }

      // 3. Delete projects
      const { error: prError } = await supabase
        .from('projects')
        .delete()
        .eq('user_id', user.id);
      if (prError) console.error('Error resetting projects:', prError);

      // 4. Reset profile savings & salary to 0
      const { error: profError } = await supabase
        .from('profiles')
        .update({ savings: 0, salary: 0 })
        .eq('id', user.id);
      if (profError) console.error('Error resetting profile:', profError);

      // 5. Clean local state
      setProjects([]);
      setTransactions([]);
      setAvailableFunds(0);
      setLatestAllocationReportState(null);
      setAlerts([]);
      setPriorities([]);
      setCoachInsights([]);
      setReminders([]);

      // 6. Clean localStorage
      localStorage.removeItem(`dudukan_latest_allocation_report_${user.id}`);
      localStorage.removeItem(`dudukan_premium_reminders_${user.id}`);
      localStorage.removeItem('dudukan_coaching_tone');
      localStorage.removeItem('dudukan_dominant_strategy');
      localStorage.removeItem('dudukan_alert_safety_mat');
      localStorage.removeItem('dudukan_auto_analysis');

      // Reload data to ensure everything is clean
      await fetchData();
    } catch (err) {
      console.error('Error resetting premium data:', err);
      throw err;
    } finally {
      setLoading(false);
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
      freeSalary,
      coachInsights,
      latestAllocationReport,
      setLatestAllocationReport,
      transactions,
      createTransaction,
      reminders,
      addReminder,
      deleteReminder,
      toggleReminder,
      resetPremiumData
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
