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
  const [notificationTime, setNotificationTime] = useState('20:00');
  const [lastNotifiedDate, setLastNotifiedDate] = useState(null);
  
  const [isInitialized, setIsInitialized] = useState(false);

  const storageKey = user ? `dudukan_data_${user.id}` : 'dudukan_data_anon';

  const syncWithCloud = async (dataToSync) => {
    if (!user || !isInitialized) return;
    try {
      await supabase.from('user_data').upsert({ 
        id: user.id, 
        data: dataToSync,
        updated_at: new Date().toISOString() 
      });
    } catch (err) {}
  };

  const applyData = (data) => {
    if (!data) return;
    if (data.salary !== undefined) setSalary(data.salary);
    if (data.nextMonthSalary !== undefined) setNextMonthSalary(data.nextMonthSalary);
    if (data.extraIncome) setExtraIncome(data.extraIncome);
    if (data.expenses) setExpenses(data.expenses);
    if (data.debts) setDebts(data.debts);
    if (data.categories) setCategories(data.categories);
    if (data.currency) setCurrency(data.currency);
    if (data.savings !== undefined) setSavings(data.savings);
    if (data.onboarded !== undefined) setOnboarded(data.onboarded);
    if (data.periodStart) setPeriodStart(data.periodStart);
    if (data.lastActivity) setLastActivity(data.lastActivity);
    if (data.notificationTime) setNotificationTime(data.notificationTime);
    if (data.lastNotifiedDate) setLastNotifiedDate(data.lastNotifiedDate);
  };

  useEffect(() => {
    if (!user) { setIsInitialized(true); return; }
    const loadData = async () => {
      let bestLocalData = null;
      let newestTimestamp = 0;
      ['dudukan_data', `dudukan_data_${user.id}`].forEach(key => {
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const ts = new Date(parsed.lastActivity || 0).getTime();
            if (ts > newestTimestamp) { newestTimestamp = ts; bestLocalData = parsed; }
          } catch(e) {}
        }
      });
      try {
        const { data: cloudRow } = await supabase.from('user_data').select('data, updated_at').eq('id', user.id).single();
        if (cloudRow && cloudRow.data && Object.keys(cloudRow.data).length > 2) {
          const cloudTs = new Date(cloudRow.updated_at).getTime();
          if (cloudTs >= newestTimestamp || !bestLocalData) {
            applyData(cloudRow.data); setIsInitialized(true); return;
          }
        }
      } catch (err) {}
      if (bestLocalData) applyData(bestLocalData);
      setIsInitialized(true);
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (!user || !isInitialized) return;
    const dataToSave = { salary, nextMonthSalary, extraIncome, expenses, debts, categories, onboarded, periodStart, currency, savings, lastActivity, notificationTime, lastNotifiedDate };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    const timeoutId = setTimeout(() => syncWithCloud(dataToSave), 2000);
    return () => clearTimeout(timeoutId);
  }, [isInitialized, user, salary, nextMonthSalary, extraIncome, expenses, debts, categories, onboarded, periodStart, currency, savings, lastActivity, notificationTime, lastNotifiedDate]);

  // DERIVED DATA
  const currentMonthExpenses = expenses.filter(e => new Date(e.date) >= new Date(periodStart));
  const currentMonthIncome = extraIncome.filter(i => i.date ? new Date(i.date) >= new Date(periodStart) : true);
  const totalIncomeValue = salary + currentMonthIncome.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpensesValue = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const balanceValue = totalIncomeValue - totalExpensesValue;

  // HELPERS
  const getCategorySpent = (categoryId) => currentMonthExpenses.filter(e => e.categoryId === categoryId).reduce((acc, curr) => acc + curr.amount, 0);
  const getCategoryBudget = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? Math.round(totalIncomeValue * cat.limit) : 0;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency', currency: currency.code,
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount);
  };

  // ACTIONS
  const addExpense = (expense, skipDebtUpdate = false) => {
    const amount = parseFloat(expense.amount);
    if (isNaN(amount)) return;
    const now = new Date().toISOString();
    setExpenses(prev => [...prev, { ...expense, amount, id: Date.now(), date: now }]);
    setLastActivity(now);
    if (expense.categoryId === 'savings') setSavings(prev => prev + amount);
    if (expense.categoryId === 'debt' && !skipDebtUpdate) {
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
    if (window.confirm('Nouveau mois ?')) {
      const rolloverBalance = balanceValue;
      const now = new Date().toISOString();
      setPeriodStart(now);
      if (nextMonthSalary > 0) { setSalary(nextMonthSalary); setNextMonthSalary(0); }
      if (rolloverBalance > 0) addIncome({ amount: rolloverBalance, note: 'Report du mois précédent' });
      setLastActivity(now);
    }
  };

  return (
    <FinanceContext.Provider value={{
      isInitialized, salary, setSalary, nextMonthSalary, setNextMonthSalary,
      extraIncome: currentMonthIncome, allIncome: extraIncome, addIncome, 
      expenses: currentMonthExpenses, allExpenses: expenses, addExpense,
      allTransactions: [...expenses.map(e => ({ ...e, type: 'expense' })), ...extraIncome.map(i => ({ ...i, type: 'income' }))].sort((a, b) => new Date(b.date) - new Date(a.date)),
      debts, addDebt, updateDebt, categories, setCategories, onboarded, setOnboarded,
      totalIncome: totalIncomeValue, totalExpenses: totalExpensesValue, balance: balanceValue,
      getCategorySpent, getCategoryBudget,
      daysRemaining: Math.max(1, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate() + 1),
      resteAVivre: balanceValue > 0 ? Math.round(balanceValue / 30) : 0,
      startNewPeriod, currency, setCurrency, formatCurrency, savings, setSavings, addToSavings, withdrawFromSavings,
      resetData: () => { localStorage.clear(); window.location.reload(); },
      getFinancialHealth: () => {
        let score = 70;
        if (balanceValue < 0) score -= 20;
        if (savings > totalIncomeValue * 0.1) score += 10;
        return { score: Math.max(0, Math.min(100, score)), projectedBalance: balanceValue, insights: ["Tout est prêt !"] };
      }
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
