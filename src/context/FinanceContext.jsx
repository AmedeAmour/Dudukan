import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

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
  const [lastActivity, setLastActivity] = useState(new Date().toISOString());
  const [notificationTime, setNotificationTime] = useState('20:00');
  const [lastNotifiedDate, setLastNotifiedDate] = useState(null);

  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  });

  const storageKey = user ? `dudukan_data_${user.id}` : null;

  // Load from localStorage
  useEffect(() => {
    if (!user) return;

    const loadData = () => {
      let saved = localStorage.getItem(storageKey);
      
      // Migration: if first time for this user and legacy data exists, migrate it
      if (!saved && !localStorage.getItem(`migrated_${user.id}`)) {
        const legacyData = localStorage.getItem('dudukan_data');
        if (legacyData) {
          localStorage.setItem(storageKey, legacyData);
          localStorage.setItem(`migrated_${user.id}`, 'true');
          saved = legacyData;
        }
      }

      if (saved) {
        const data = JSON.parse(saved);
        const fiftyDaysAgo = new Date();
        fiftyDaysAgo.setDate(fiftyDaysAgo.getDate() - 50);

        setSalary(data.salary || 0);
        setNextMonthSalary(data.nextMonthSalary || 0);
        setExtraIncome((data.extraIncome || []).filter(i => new Date(i.date) >= fiftyDaysAgo));
        setExpenses((data.expenses || []).filter(e => new Date(e.date) >= fiftyDaysAgo));
        setDebts(data.debts || []);
        setCategories(data.categories || DEFAULT_CATEGORIES);
        setCurrency(data.currency || DEFAULT_CURRENCY);
        setSavings(data.savings || 0);
        setOnboarded(data.onboarded || false);
        setLastActivity(data.lastActivity || new Date().toISOString());
        setNotificationTime(data.notificationTime || '20:00');
        setLastNotifiedDate(data.lastNotifiedDate || null);
        setPeriodStart(data.periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
      } else {
        // Reset state for new user
        setSalary(0);
        setNextMonthSalary(0);
        setExtraIncome([]);
        setExpenses([]);
        setDebts([]);
        setCategories(DEFAULT_CATEGORIES);
        setCurrency(DEFAULT_CURRENCY);
        setSavings(0);
        setOnboarded(false);
        setLastActivity(new Date().toISOString());
        setNotificationTime('20:00');
        setLastNotifiedDate(null);
        setPeriodStart(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
      }
    };

    loadData();
  }, [user, storageKey]);

  // Save to localStorage
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify({
        salary, nextMonthSalary, extraIncome, expenses, debts, categories, onboarded, periodStart, currency, savings, lastActivity, notificationTime, lastNotifiedDate
      }));
    }
  }, [storageKey, salary, nextMonthSalary, extraIncome, expenses, debts, categories, onboarded, periodStart, currency, savings, lastActivity, notificationTime, lastNotifiedDate]);

  const addExpense = (expense, skipDebtUpdate = false) => {
    const amount = parseFloat(expense.amount);
    if (isNaN(amount)) return;

    // Standardize note for debt repayments and avoid double prefix
    let finalNote = expense.note;
    if (expense.categoryId === 'debt') {
      if (!expense.note) {
        finalNote = 'Remboursement';
      } else if (!expense.note.toLowerCase().startsWith('remboursement')) {
        finalNote = `Remboursement : ${expense.note}`;
      } else {
        // Already has prefix, but let's ensure it follows our "Remboursement : " format
        finalNote = expense.note.replace(/^remboursement\s*:?\s*/i, 'Remboursement : ');
      }
    }

    const now = new Date().toISOString();
    setExpenses(prev => [...prev, { ...expense, note: finalNote, amount, id: Date.now(), date: now }]);
    setLastActivity(now);
    
    if (expense.categoryId === 'savings') {
      setSavings(prev => prev + amount);
    }

    // Identifie si c'est une catégorie de dette (par ID ou par nom)
    const category = categories.find(c => c.id === expense.categoryId);
    const isDebt = expense.categoryId === 'debt' || category?.name === 'Dettes';

    if (isDebt && !skipDebtUpdate) {
      setDebts(prevDebts => {
        let remainingToPay = amount;
        return prevDebts.map(debt => {
          if (remainingToPay <= 0 || debt.remaining <= 0) return debt;
          const pay = Math.min(debt.remaining, remainingToPay);
          remainingToPay -= pay;
          return { ...debt, remaining: debt.remaining - pay };
        });
      });
    }
  };

  const addIncome = (income) => {
    const amount = parseFloat(income.amount);
    const now = new Date().toISOString();
    setExtraIncome(prev => [...prev, { ...income, amount, id: Date.now(), date: now }]);
    setLastActivity(now);
  };

  const addDebt = (debt) => {
    setDebts(prev => [...prev, { ...debt, id: Date.now(), remaining: parseFloat(debt.amount) }]);
  };

  const addToSavings = (amount, note = '') => {
    addExpense({
      amount,
      categoryId: 'savings',
      note: note || 'Épargne'
    });
  };

  const withdrawFromSavings = (amount, note = '') => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    if (val > savings) {
      alert("Solde d'épargne insuffisant.");
      return;
    }

    setSavings(prev => prev - val);
    
    // On l'ajoute comme un revenu pour qu'il soit disponible dans le budget du mois
    addIncome({
      amount: val,
      note: note || 'Retrait épargne'
    });
  };

  const updateDebt = (id, payment) => {
    const debt = debts.find(d => d.id === id);
    if (!debt || payment <= 0) return;

    setDebts(prevDebts => prevDebts.map(d => d.id === id ? { ...d, remaining: Math.max(0, d.remaining - payment) } : d));

    addExpense({
      amount: payment,
      categoryId: 'debt',
      note: `Remboursement : ${debt.lender}`
    }, true);
  };

  const startNewPeriod = () => {
    if (window.confirm('Voulez-vous vraiment commencer un nouveau mois maintenant ? Votre solde actuel sera reporté sur le nouveau mois.')) {
      const rolloverBalance = balance;
      const now = new Date().toISOString();
      
      setPeriodStart(now);
      
      // Applique le salaire prévu pour le mois suivant s'il existe
      if (nextMonthSalary > 0) {
        setSalary(nextMonthSalary);
        setNextMonthSalary(0);
      }

      if (rolloverBalance > 0) {
        // Ajoute le reste du mois précédent comme un revenu de report
        addIncome({
          amount: rolloverBalance,
          note: 'Report du mois précédent'
        });
      }
    }
  };

  const isCurrentMonth = (dateString) => {
    if (!dateString) return true;
    return new Date(dateString) >= new Date(periodStart);
  };

  const currentMonthExpenses = expenses.filter(e => isCurrentMonth(e.date));
  const currentMonthIncome = extraIncome.filter(i => isCurrentMonth(i.date));

  const totalIncome = salary + currentMonthIncome.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpenses;

  const getCategorySpent = (categoryId) => {
    return currentMonthExpenses
      .filter(e => e.categoryId === categoryId)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const getCategoryBudget = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    const base = salary > 0 ? salary : totalIncome;
    return cat ? Math.round(base * cat.limit) : 0;
  };

  const currentDate = new Date();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const currentDay = currentDate.getDate();
  const daysRemaining = daysInMonth - currentDay + 1;
  const resteAVivre = balance > 0 ? Math.round(balance / daysRemaining) : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const allTransactions = [
    ...expenses.map(e => ({ ...e, type: 'expense' })),
    ...extraIncome.map(i => ({ ...i, type: 'income' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <FinanceContext.Provider value={{
      salary, setSalary,
      nextMonthSalary, setNextMonthSalary,
      extraIncome: currentMonthIncome, addIncome,
      expenses: currentMonthExpenses, addExpense,
      allExpenses: expenses,
      allIncome: extraIncome,
      allTransactions,
      debts, addDebt, updateDebt,
      categories, setCategories,
      onboarded, setOnboarded,
      totalIncome, totalExpenses, balance,
      getCategorySpent, getCategoryBudget,
      daysRemaining, resteAVivre,
      startNewPeriod,
      currency, setCurrency, formatCurrency,
      savings, setSavings, addToSavings, withdrawFromSavings,
      lastActivity, setLastActivity,
      notificationTime, setNotificationTime,
      lastNotifiedDate, setLastNotifiedDate,
      resetData: () => {
        if (storageKey) {
          localStorage.removeItem(storageKey);
          window.location.reload();
        }
      },
      getFinancialHealth: () => {
        const today = new Date();
        const currentDay = today.getDate();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        
        // 1. Month-end Projection
        const dailyBurnRate = currentDay > 0 ? totalExpenses / currentDay : 0;
        const projectedExpenses = dailyBurnRate * daysInMonth;
        const projectedBalance = totalIncome - projectedExpenses;
        
        // 2. Score Calculation (0-100)
        let score = 70; // Starting point
        
        // Savings impact
        const savingsRate = totalIncome > 0 ? (savings / totalIncome) : 0;
        if (savingsRate > 0.2) score += 20;
        else if (savingsRate > 0.1) score += 10;
        
        // Debt impact
        const totalDebt = debts.reduce((acc, d) => acc + d.remaining, 0);
        const debtRatio = totalIncome > 0 ? (totalDebt / (totalIncome * 12)) : 0; // Debt vs Annual Income
        if (debtRatio > 0.5) score -= 20;
        else if (debtRatio > 0.3) score -= 10;
        
        // Budget compliance
        let overBudgetCount = 0;
        categories.forEach(cat => {
          if (getCategorySpent(cat.id) > getCategoryBudget(cat.id)) {
            overBudgetCount++;
          }
        });
        score -= (overBudgetCount * 5);
        
        // Stability
        if (balance < 0) score -= 20;
        else if (balance < totalIncome * 0.1) score -= 5;
        
        score = Math.max(0, Math.min(100, score));
        
        // 3. Insights (Logic-based recommendations)
        const insights = [];
        if (overBudgetCount > 0) {
          insights.push(`Attention : vous dépassez le budget sur ${overBudgetCount} catégorie(s).`);
        }
        if (projectedBalance < 0) {
          insights.push(`Alerte : à ce rythme, vous finirez le mois avec un déficit de ${formatCurrency(Math.abs(projectedBalance))}.`);
        } else if (projectedBalance > 0 && balance > 0) {
          insights.push(`Bravo : vous devriez finir le mois avec environ ${formatCurrency(projectedBalance)} de surplus.`);
        }
        
        if (debtRatio > 0.4) {
          insights.push("Conseil : votre niveau d'endettement est élevé. Priorisez le remboursement des petites dettes.");
        }
        
        if (savingsRate < 0.05 && balance > 0) {
          insights.push("Suggestion : essayez de mettre de côté au moins 5% de vos revenus dès le début du mois.");
        }

        return { score, projectedBalance, projectedExpenses, insights, overBudgetCount };
      }
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
