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
    if (!project.deadline || !project.target_amount) return 0;
    
    const remaining = project.target_amount - (project.current_amount || 0);
    if (remaining <= 0) return 0;

    const today = new Date();
    const deadline = new Date(project.deadline);
    const monthsLeft = (deadline.getFullYear() - today.getFullYear()) * 12 + (deadline.getMonth() - today.getMonth());
    
    return monthsLeft > 0 ? remaining / monthsLeft : remaining;
  };

  // Auto-distribution simulation (AI Recommendation)
  const suggestDistribution = (amount) => {
    if (!projects.length || amount <= 0) return [];

    // Filter active projects
    const activeProjects = projects.filter(p => (p.target_amount - (p.current_amount || 0)) > 0);
    
    // Sort by priority (hypothetically stored in 'type' or a new field, defaulting to date urgency for now)
    const sortedProjects = [...activeProjects].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    let remainingToDistribute = amount;
    const distribution = sortedProjects.map(p => {
      const need = calculateMonthlyNeeds(p);
      const allocation = Math.min(remainingToDistribute, need);
      remainingToDistribute -= allocation;
      return {
        projectId: p.id,
        projectName: p.name,
        amount: allocation
      };
    });

    return distribution;
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
