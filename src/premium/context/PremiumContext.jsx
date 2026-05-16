import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

const PremiumContext = createContext();

export const PremiumProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableFunds, setAvailableFunds] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);
      setAvailableFunds(profileData?.savings || 0);

      // Fetch Projects with Milestones
      const { data: projectsData } = await supabase
        .from('projects')
        .select(`
          *,
          milestones (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching premium data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Logic to calculate monthly needs for each project
  const calculateMonthlyNeeds = (project) => {
    // For recurring projects, the monthly need is the target amount (e.g., monthly rent)
    if (project.is_recurring) return project.target_amount || 0;

    if (!project.deadline || !project.target_amount) return 0;
    
    const remaining = project.target_amount - (project.current_amount || 0);
    if (remaining <= 0) return 0;

    const today = new Date();
    const deadline = new Date(project.deadline);
    const monthsLeft = (deadline.getFullYear() - today.getFullYear()) * 12 + (deadline.getMonth() - today.getMonth());
    
    // Minimum 1 month to avoid division by zero or negative
    const effectiveMonths = Math.max(1, monthsLeft);
    return remaining / effectiveMonths;
  };

  // ADVANCED AUTO-DISTRIBUTION ALGORITHM
  const suggestDistribution = (amount) => {
    if (!projects.length || amount <= 0) return [];

    let remainingToDistribute = amount;
    const finalDistribution = [];

    // STEP 1: Handle Recurring Projects (Fixed Costs) First
    const recurringProjects = projects.filter(p => p.is_recurring);
    recurringProjects.forEach(p => {
      const need = p.target_amount || 0;
      const allocation = Math.min(remainingToDistribute, need);
      if (allocation > 0) {
        finalDistribution.push({
          projectId: p.id,
          projectName: p.name,
          amount: allocation,
          type: 'recurring'
        });
        remainingToDistribute -= allocation;
      }
    });

    if (remainingToDistribute <= 0) return finalDistribution;

    // STEP 2: Handle Complex Projects Milestones (Unlock steps)
    // We prioritize completing the NEXT milestone of complex projects
    const complexProjects = projects.filter(p => p.is_complex && !p.is_recurring);
    complexProjects.forEach(p => {
      const nextMilestone = p.milestones?.find(m => !m.completed);
      if (nextMilestone) {
        const milestoneRemaining = nextMilestone.amount - (nextMilestone.current_allocated || 0); // Assuming current_allocated exists or logic
        const allocation = Math.min(remainingToDistribute, milestoneRemaining);
        if (allocation > 0) {
          // Check if already in distribution (unlikely but safe)
          const existing = finalDistribution.find(d => d.projectId === p.id);
          if (existing) {
            existing.amount += allocation;
          } else {
            finalDistribution.push({
              projectId: p.id,
              projectName: p.name,
              amount: allocation,
              type: 'milestone_unlock'
            });
          }
          remainingToDistribute -= allocation;
        }
      }
    });

    if (remainingToDistribute <= 0) return finalDistribution;

    // STEP 3: Proportional Distribution based on Urgency & Priority Score
    const otherProjects = projects.filter(p => !p.is_recurring && (p.target_amount - (p.current_amount || 0)) > 0);
    
    // Calculate scores
    const projectsWithScores = otherProjects.map(p => {
      const monthsLeft = Math.max(1, (new Date(p.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30));
      const urgency = 1 / monthsLeft;
      const priority = p.priority || 3; // Default middle priority
      return { ...p, score: urgency * priority };
    });

    const totalScore = projectsWithScores.reduce((acc, p) => acc + p.score, 0);

    if (totalScore > 0) {
      projectsWithScores.forEach(p => {
        const share = (p.score / totalScore) * remainingToDistribute;
        const remainingToTarget = p.target_amount - (p.current_amount || 0);
        const allocation = Math.min(share, remainingToTarget);
        
        const existing = finalDistribution.find(d => d.projectId === p.id);
        if (existing) {
          existing.amount += allocation;
        } else {
          finalDistribution.push({
            projectId: p.id,
            projectName: p.name,
            amount: allocation,
            type: 'proportional'
          });
        }
      });
    }

    return finalDistribution;
  };

  return (
    <PremiumContext.Provider value={{ 
      projects, 
      profile, 
      loading, 
      availableFunds, 
      fetchData,
      suggestDistribution,
      calculateMonthlyNeeds
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
