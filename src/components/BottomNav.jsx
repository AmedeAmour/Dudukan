import React from 'react';
import { Home, PieChart, Plus, X, CreditCard, Settings as SettingsIcon, PiggyBank } from 'lucide-react';

const BottomNav = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Accueil', icon: Home },
    { id: 'budget', label: 'Budget', icon: PieChart },
    { id: 'expenses', label: 'Dépenses', icon: Plus },
    { id: 'savings', label: 'Épargne', icon: PiggyBank },
    { id: 'debts', label: 'Dettes', icon: CreditCard },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isExpenses = item.id === 'expenses';
        const Icon = isExpenses 
          ? (activeTab === 'expenses' ? X : Plus) 
          : item.icon;

        return (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''} ${isExpenses ? 'nav-item-fab' : ''}`}
            onClick={() => {
              if (isExpenses && activeTab === 'expenses') {
                setActiveTab('dashboard');
              } else {
                setActiveTab(item.id);
              }
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Icon />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
