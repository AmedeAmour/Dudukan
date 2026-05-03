import React from 'react';
import { Home, PieChart, PlusCircle, CreditCard, Settings as SettingsIcon } from 'lucide-react';

const BottomNav = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Accueil', icon: Home },
    { id: 'budget', label: 'Budget', icon: PieChart },
    { id: 'expenses', label: 'Dépenses', icon: PlusCircle },
    { id: 'debts', label: 'Dettes', icon: CreditCard },
    { id: 'settings', label: 'Plus', icon: SettingsIcon },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => setActiveTab(item.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <item.icon />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
