import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../supabaseClient';

const FinanceContext = createContext();

export const useFinance = () => useContext(FinanceContext);

const DEFAULT_CATEGORIES = [
  { id: 'food', name: 'Alimentation', icon: 'Utensils', color: '--accent-orange', limit: 0.3 },
  { id: 'transport', name: 'Transport', icon: 'Car', color: '--accent-blue', limit: 0.15 },
  { id: 'housing', name: 'Logement', icon: 'Home', color: '--navy', limit: 0.2 },
  { id: 'debt', name: 'Dettes', icon: 'CreditCard', color: '--accent-red', limit: 0.15 },
  { id: 'savings', name: 'Épargne', icon: 'PiggyBank', color: '--emerald', limit: 0.05 },
  { id: 'emergency', name: 'Imprévus', icon: 'AlertCircle', color: '--accent-red', limit: 0.05 },
  { id: 'personal', name: 'Dépenses personnelles', icon: 'User', color: '--accent-blue', limit: 0.1 },
];

const DEFAULT_CURRENCY = { locale: 'fr-FR', code: 'XOF' };

const DEFAULT_SCHEDULE = [
  { day: 0, label: 'Dim', enabled: true, time: '20:00' },
  { day: 1, label: 'Lun', enabled: true, time: '20:00' },
  { day: 2, label: 'Mar', enabled: true, time: '20:00' },
  { day: 3, label: 'Mer', enabled: true, time: '20:00' },
  { day: 4, label: 'Jeu', enabled: true, time: '20:00' },
  { day: 5, label: 'Ven', enabled: true, time: '20:00' },
  { day: 6, label: 'Sam', enabled: true, time: '20:00' },
];

export const FinanceProvider = ({ children }) => {
  const { user } = useAuth();
  const [salary, setSalary] = useState(0);
  const [nextMonthSalary, setNextMonthSalary] = useState(0);
  const [extraIncome, setExtraIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [savings, setSavings] = useState(0);
  const [onboarded, setOnboarded] = useState(false);
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  });
  const [lastActivity, setLastActivity] = useState(new Date().toISOString());
  const [notificationSchedule, setNotificationSchedule] = useState(DEFAULT_SCHEDULE);
  const [lastNotifiedDate, setLastNotifiedDate] = useState(null);
  const [appMode, setAppMode] = useState(null); // 'free' or 'premium'
  const [allocationMode, setAllocationMode] = useState('manual'); // 'manual' or 'automatic'
  const [projects, setProjects] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!user) { 
      setIsInitialized(true); 
      return; 
    }

    const loadProData = async () => {
      try {
        // 1. Try to load from the NEW 'profiles' table
        const { data: profile, error: profError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        
        if (profile && profile.onboarded) {
          // Normal flow for migrated/new pro users
          setSalary(profile.salary || 0);
          setNextMonthSalary(profile.next_month_salary || 0);
          setCurrency(profile.currency || DEFAULT_CURRENCY);
          setSavings(profile.savings || 0);
          setOnboarded(profile.onboarded);
          setAppMode(profile.app_mode);
          setAllocationMode(profile.allocation_mode || 'manual');

          const { data: projectsData } = await supabase.from('projects').select('*, milestones(*)').eq('user_id', user.id);
          if (projectsData) setProjects(projectsData);

          const { data: transData } = await supabase.from('transactions').select('*').eq('user_id', user.id);
          if (transData) {
            setExtraIncome(transData.filter(t => t.type === 'income'));
            setExpenses(transData.filter(t => t.type === 'expense'));
          }
        } else {
          // 2. LEGACY FALLBACK & AUTO-MIGRATION
          const { data: legacyRow } = await supabase.from('user_data').select('data').eq('id', user.id).single();
          
          if (legacyRow && legacyRow.data) {
            const d = legacyRow.data;
            // Apply legacy data to state
            setSalary(d.salary || 0);
            setNextMonthSalary(d.nextMonthSalary || 0);
            setCurrency(d.currency || DEFAULT_CURRENCY);
            setSavings(d.savings || 0);
            setOnboarded(d.onboarded || false);
            setAppMode(d.appMode || 'free');
            setExtraIncome(d.extraIncome || []);
            setExpenses(d.expenses || []);
            setProjects(d.projects || []);
            setDebts(d.debts || []);

            // 3. SILENT MIGRATION to new tables
            await supabase.from('profiles').upsert({
              id: user.id, salary: d.salary, next_month_salary: d.nextMonthSalary,
              currency: d.currency, savings: d.savings, onboarded: d.onboarded, app_mode: d.appMode
            });

            if (d.projects && d.projects.length > 0) {
              for (const p of d.projects) {
                const { data: newP } = await supabase.from('projects').insert({
                  user_id: user.id, name: p.name, target_amount: p.targetAmount, 
                  current_amount: p.currentAmount, type: p.type, is_complex: !!p.milestones
                }).select().single();
                
                if (newP && p.milestones) {
                  await supabase.from('milestones').insert(
                    p.milestones.map((m, i) => ({ project_id: newP.id, name: m.name, amount: m.amount, completed: m.completed, step_order: i }))
                  );
                }
              }
            }

            if (d.expenses) {
              await supabase.from('transactions').insert(d.expenses.map(e => ({
                user_id: user.id, amount: e.amount, type: 'expense', category_id: e.categoryId, note: e.note, date: e.date
              })));
            }
          } else if (!profile) {
            // New user, just create profile
            await supabase.from('profiles').insert({ id: user.id });
          }
        }

        setIsInitialized(true);
      } catch (err) {
        console.error("Migration/Load error:", err);
        setIsInitialized(true);
      }
    };
    loadProData();
  }, [user]);

  // Sync Profile changes
  useEffect(() => {
    if (!user || !isInitialized) return;
    const updateProfile = async () => {
      await supabase.from('profiles').upsert({ 
        id: user.id, salary, next_month_salary: nextMonthSalary, 
        currency, savings, onboarded, app_mode: appMode, 
        allocation_mode: allocationMode,
        updated_at: new Date().toISOString() 
      });
    };
    const tid = setTimeout(updateProfile, 2000);
    return () => clearTimeout(tid);
  }, [salary, nextMonthSalary, currency, savings, onboarded, appMode, user, isInitialized]);

  const currentMonthExpenses = (expenses || []).filter(e => e && e.date && new Date(e.date) >= new Date(periodStart));
  const currentMonthIncome = (extraIncome || []).filter(i => i && (i.date ? new Date(i.date) >= new Date(periodStart) : true));
  const totalIncomeValue = (parseFloat(salary) || 0) + currentMonthIncome.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalExpensesValue = currentMonthExpenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const balanceValue = totalIncomeValue - totalExpensesValue;

  const getCategorySpent = (categoryId) => currentMonthExpenses.filter(e => e.categoryId === categoryId).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const getCategoryBudget = (categoryId) => {
    const cat = (categories || []).find(c => c.id === categoryId);
    return cat ? Math.round(totalIncomeValue * (parseFloat(cat.limit) || 0)) : 0;
  };

  const formatCurrency = (amount) => {
    const val = parseFloat(amount) || 0;
    try {
      return new Intl.NumberFormat(currency?.locale || 'fr-FR', {
        style: 'currency', currency: currency?.code || 'XOF',
        minimumFractionDigits: 0, maximumFractionDigits: 0
      }).format(val);
    } catch (e) {
      return val + ' ' + (currency?.code || 'XOF');
    }
  };

  const addExpense = async (expense, skipDebtUpdate = false) => {
    const amount = parseFloat(expense.amount);
    if (isNaN(amount)) return;
    const now = new Date().toISOString();
    
    // Optimistic update
    const newExpense = { ...expense, amount, id: Date.now(), date: now };
    setExpenses(prev => [...prev, newExpense]);
    
    if (user) {
      await supabase.from('transactions').insert({
        user_id: user.id, amount, type: 'expense', 
        category_id: expense.categoryId, note: expense.note,
        date: now, project_id: expense.projectId || null
      });
    }

    setLastActivity(now);
    if (expense.categoryId === 'savings') setSavings(prev => prev + amount);
    // ... Debt logic remains the same for local state ...
  };

  const addIncome = async (income) => {
    const amount = parseFloat(income.amount);
    const now = new Date().toISOString();
    
    setExtraIncome(prev => [...prev, { ...income, amount, id: Date.now(), date: now }]);
    
    if (user) {
      await supabase.from('transactions').insert({
        user_id: user.id, amount, type: 'income',
        note: income.note, date: now
      });
      if (allocationMode === 'automatic') {
        allocateToProjects(amount);
      }
    }
    setLastActivity(now);
  };

  const addDebt = (debt) => setDebts(prev => [...prev, { ...debt, id: Date.now(), remaining: parseFloat(debt.amount) }]);
  const updateDebt = (id, payment) => {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;
    setDebts(prev => prev.map(d => d.id === id ? { ...d, remaining: Math.max(0, d.remaining - payment) } : d));
    addExpense({ amount: payment, categoryId: 'debt', note: `Remboursement : ${debt.lender}` }, true);
  };

  const addToSavings = (amount, note = '') => addExpense({ amount, categoryId: 'savings', note: note || 'Épargne' });
  const withdrawFromSavings = (amount, note = '') => {
    const val = parseFloat(amount);
    if (val > savings) return alert("Épargne insuffisante");
    setSavings(prev => prev - val);
    addIncome({ amount: val, note: note || 'Retrait épargne' });
  };

  const startNewPeriod = () => {
    if (window.confirm('Voulez-vous vraiment commencer un nouveau mois maintenant ? Vos compteurs de budget seront réinitialisés.')) {
      const rolloverBalance = balanceValue;
      const now = new Date().toISOString();
      setPeriodStart(now);
      if (nextMonthSalary > 0) { setSalary(nextMonthSalary); setNextMonthSalary(0); }
      if (rolloverBalance > 0) addIncome({ amount: rolloverBalance, note: 'Report du mois précédent' });
      setLastActivity(now);
    }
  };

  const addProject = async (project) => {
    if (!user) return;
    const { data: newProj, error } = await supabase.from('projects').insert({
      user_id: user.id, name: project.name, target_amount: project.targetAmount,
      type: project.type, is_complex: project.isComplex, deadline: project.deadline || null
    }).select().single();

    if (newProj) {
      if (project.milestones && project.milestones.length > 0) {
        await supabase.from('milestones').insert(
          project.milestones.map((m, i) => ({ project_id: newProj.id, name: m.name, amount: m.amount, step_order: i }))
        );
      }
      // Reload projects to get the new one with milestones
      const { data: updatedProjects } = await supabase.from('projects').select('*, milestones(*)').eq('user_id', user.id);
      if (updatedProjects) setProjects(updatedProjects);
    }
  };

  const deleteProject = async (id) => {
    if (!user) return;
    await supabase.from('projects').delete().eq('id', id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const allocateToProjects = async (amount) => {
    const activeProjects = projects.filter(p => p.current_amount < p.target_amount);
    if (activeProjects.length === 0) return;

    const totalRemainingNeeded = activeProjects.reduce((acc, p) => acc + (p.target_amount - p.current_amount), 0);
    
    for (const p of activeProjects) {
      const remaining = p.target_amount - p.current_amount;
      const share = (remaining / totalRemainingNeeded) * amount;
      await supabase.from('projects').update({ current_amount: p.current_amount + share }).eq('id', p.id);
    }
    
    // Refresh projects from DB
    const { data: updatedProjects } = await supabase.from('projects').select('*, milestones(*)').eq('user_id', user.id);
    if (updatedProjects) setProjects(updatedProjects);
  };

  const getFinancialHealth = () => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();
    const monthProgress = dayOfMonth / daysInMonth;
    
    let score = 50; // Start at 50 (neutral)
    const insights = [];

    // 0. Initial State Check
    if (totalIncomeValue === 0 && totalExpensesValue === 0) {
      return { score: 50, projectedBalance: 0, insights: ["Bienvenue ! Enregistrez vos premiers revenus pour obtenir des conseils personnalisés."] };
    }

    // 1. Balance check
    if (balanceValue < 0) {
      score -= 40;
      insights.push("Critique : Votre budget est en déficit. Vous vivez au-dessus de vos moyens.");
    } else if (balanceValue === 0 && totalIncomeValue > 0) {
      score -= 10;
      insights.push("Attention : Votre solde est à zéro. Vous n'avez aucune marge de sécurité.");
    } else if (balanceValue > totalIncomeValue * 0.2) {
      score += 20;
      insights.push("Excellent : Vous maintenez un surplus confortable de plus de 20%.");
    } else {
      score += 10;
      insights.push("Correct : Votre solde est positif, mais surveillez vos prochaines dépenses.");
    }

    // 2. Spending Pacing
    const spendingRate = totalExpensesValue / (totalIncomeValue || 1);
    if (totalIncomeValue > 0) {
      if (spendingRate > monthProgress + 0.2) {
        score -= 20;
        insights.push(`Alerte Rythme : Vous dépensez trop vite (${Math.round(spendingRate * 100)}% du budget consommé à mi-chemin).`);
      }
    }

    // 3. Category alerts
    categories.forEach(cat => {
      const spent = getCategorySpent(cat.id);
      const budget = getCategoryBudget(cat.id);
      if (budget > 0 && spent > budget) {
        score -= 5;
        insights.push(`Dépassement ${cat.name} : Vous avez excédé le budget prévu.`);
      }
    });

    // 4. Savings check
    if (savings === 0) {
      score -= 15;
      insights.push("Épargne Inexistante : Votre fond de sécurité est vide. C'est risqué en cas d'imprévu.");
    } else if (savings < totalIncomeValue * 0.1) {
      score -= 5;
      insights.push("Épargne Faible : Essayez d'atteindre au moins 10% de vos revenus en réserve.");
    } else {
      score += 15;
      insights.push("Félicitations : Votre épargne constitue un bon filet de sécurité.");
    }

    // 5. Debt check
    const totalDebt = debts.reduce((acc, d) => acc + d.remaining, 0);
    if (totalDebt > 0) {
      if (totalDebt > totalIncomeValue * 2) {
        score -= 20;
        insights.push("Endettement Élevé : Vos dettes pèsent lourd. Priorisez leur remboursement.");
      } else {
        insights.push("Rappel Dettes : Continuez vos remboursements pour libérer du budget.");
      }
    }

    return { 
      score: Math.max(0, Math.min(100, score)), 
      projectedBalance: balanceValue, 
      insights: insights.length > 0 ? insights : ["Analyse en cours... Continuez à noter vos transactions."] 
    };
  };

  return (
    <FinanceContext.Provider value={{
      isInitialized, salary, setSalary, nextMonthSalary, setNextMonthSalary,
      extraIncome: currentMonthIncome, allIncome: extraIncome, addIncome, 
      expenses: currentMonthExpenses, allExpenses: expenses, addExpense,
      allTransactions: [...(expenses || []).map(e => ({ ...e, type: 'expense' })), ...(extraIncome || []).map(i => ({ ...i, type: 'income' }))]
        .filter(t => t && t.date)
        .sort((a, b) => {
          const da = new Date(a.date).getTime();
          const db = new Date(b.date).getTime();
          return (db || 0) - (da || 0);
        }),
      debts, addDebt, updateDebt, categories, setCategories, onboarded, setOnboarded,
      totalIncome: totalIncomeValue, totalExpenses: totalExpensesValue, balance: balanceValue,
      getCategorySpent, getCategoryBudget,
      daysRemaining: Math.max(1, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate() + 1),
      resteAVivre: balanceValue > 0 ? Math.round(balanceValue / 30) : 0,
      startNewPeriod, currency, setCurrency, formatCurrency, savings, setSavings, addToSavings, withdrawFromSavings,
      notificationSchedule, setNotificationSchedule, lastNotifiedDate, setLastNotifiedDate,
      appMode, setAppMode, allocationMode, setAllocationMode, projects, setProjects, addProject, deleteProject, allocateToProjects,
      resetData: async () => { if (user) { try { await supabase.from('user_data').delete().eq('id', user.id); } catch (e) {} } localStorage.clear(); window.location.reload(); },
      getFinancialHealth
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
