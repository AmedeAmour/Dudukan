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
    { id: 'debt', name: 'Dettes', icon: 'CreditCard', color: '--accent-pink', limit: 0.15 },
    { id: 'savings', name: 'Épargne', icon: 'PiggyBank', color: '--emerald', limit: 0.05 },
    { id: 'emergency', name: 'Imprévus', icon: 'AlertCircle', color: '--accent-pink', limit: 0.05 },
    { id: 'personal', name: 'Dépenses personnelles', icon: 'User', color: '--accent-blue', limit: 0.1 },
  ]);

  const [onboarded, setOnboarded] = useState(false);

  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dudukan_data');
    if (saved) {
      const data = JSON.parse(saved);
      setSalary(data.salary || 0);
      setExtraIncome(data.extraIncome || []);
      setExpenses(data.expenses || []);
      setDebts(data.debts || []);
      setCategories(data.categories || categories);
      setOnboarded(data.onboarded || false);
      if (data.periodStart) {
        setPeriodStart(data.periodStart);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('dudukan_data', JSON.stringify({
      salary, extraIncome, expenses, debts, categories, onboarded, periodStart
    }));
  }, [salary, extraIncome, expenses, debts, categories, onboarded, periodStart]);

  const addExpense = (expense) => {
    setExpenses([...expenses, { ...expense, id: Date.now(), date: new Date().toISOString() }]);
  };

  const addIncome = (income) => {
    setExtraIncome([...extraIncome, { ...income, id: Date.now(), date: new Date().toISOString() }]);
  };

  const addDebt = (debt) => {
    setDebts([...debts, { ...debt, id: Date.now(), remaining: debt.amount }]);
  };

  const updateDebt = (id, payment) => {
    const debt = debts.find(d => d.id === id);
    if (!debt || payment <= 0) return;

    setDebts(debts.map(d => d.id === id ? { ...d, remaining: Math.max(0, d.remaining - payment) } : d));

    addExpense({
      amount: payment,
      categoryId: 'debt',
      note: `Remboursement: ${debt.lender}`
    });
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

  return (
    <FinanceContext.Provider value={{
      salary, setSalary,
      extraIncome: currentMonthIncome, addIncome,
      expenses: currentMonthExpenses, addExpense,
      allExpenses: expenses,
      allIncome: extraIncome,
      debts, addDebt, updateDebt,
      categories, setCategories,
      onboarded, setOnboarded,
      totalIncome, totalExpenses, balance,
      getCategorySpent, getCategoryBudget,
      daysRemaining, resteAVivre,
      startNewPeriod
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
