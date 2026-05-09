import React, { createContext, useContext, useState, useEffect } from 'react';

const FinanceContext = createContext();

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
  const [salary, setSalary] = useState(0);
  const [extraIncome, setExtraIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [categories, setCategories] = useState([
    { id: 'food', name: 'Alimentation', icon: 'Utensils', color: '--accent-orange', limit: 0.3 },
    { id: 'transport', name: 'Transport', icon: 'Car', color: '--accent-blue', limit: 0.15 },
    { id: 'housing', name: 'Logement', icon: 'Home', color: '--navy', limit: 0.2 },
    { id: 'debt', name: 'Dettes', icon: 'CreditCard', color: '--accent-red', limit: 0.15 },
    { id: 'savings', name: 'Épargne', icon: 'PiggyBank', color: '--emerald', limit: 0.05 },
    { id: 'emergency', name: 'Imprévus', icon: 'AlertCircle', color: '--accent-red', limit: 0.05 },
    { id: 'personal', name: 'Dépenses personnelles', icon: 'User', color: '--accent-blue', limit: 0.1 },
  ]);
  const [currency, setCurrency] = useState({ locale: 'fr-FR', code: 'XOF' });
  const [savings, setSavings] = useState(0);

  const [onboarded, setOnboarded] = useState(false);
  const [lastActivity, setLastActivity] = useState(new Date().toISOString());

  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dudukan_data');
    if (saved) {
      const data = JSON.parse(saved);
      const fiftyDaysAgo = new Date();
      fiftyDaysAgo.setDate(fiftyDaysAgo.getDate() - 50);

      // Cleanup old data
      const filteredExpenses = (data.expenses || []).filter(e => new Date(e.date) >= fiftyDaysAgo);
      const filteredIncome = (data.extraIncome || []).filter(i => new Date(i.date) >= fiftyDaysAgo);

      setSalary(data.salary || 0);
      setExtraIncome(filteredIncome);
      setExpenses(filteredExpenses);
      setDebts(data.debts || []);
      setCategories(data.categories || categories);
      setCurrency(data.currency || { locale: 'fr-FR', code: 'XOF' });
      setSavings(data.savings || 0);
      setOnboarded(data.onboarded || false);
      setLastActivity(data.lastActivity || new Date().toISOString());
      if (data.periodStart) {
        setPeriodStart(data.periodStart);
      }
    }
  }, []);

  // Save to localStorage
    localStorage.setItem('dudukan_data', JSON.stringify({
      salary, extraIncome, expenses, debts, categories, onboarded, periodStart, currency, savings, lastActivity
    }));
  }, [salary, extraIncome, expenses, debts, categories, onboarded, periodStart, currency, savings, lastActivity]);

  const addExpense = (expense, skipDebtUpdate = false) => {
    const amount = parseFloat(expense.amount);
    if (isNaN(amount)) return;

    const now = new Date().toISOString();
    setExpenses(prev => [...prev, { ...expense, amount, id: Date.now(), date: now }]);
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
      note: `Remboursement: ${debt.lender}`
    }, true);
  };

  const startNewPeriod = () => {
    if (window.confirm('Voulez-vous vraiment commencer un nouveau mois maintenant ? Vos compteurs de budget seront réinitialisés.')) {
      setPeriodStart(new Date().toISOString());
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
    return cat ? Math.round(salary * cat.limit) : 0;
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
      lastActivity, setLastActivity
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
