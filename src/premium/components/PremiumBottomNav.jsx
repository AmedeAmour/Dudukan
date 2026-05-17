import React from 'react';
import { LayoutDashboard, Briefcase, Wallet, User, Plus } from 'lucide-react';

const PremiumBottomNav = ({ activeTab, setActiveTab, onAddClick }) => {
  const leftItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projets', icon: Briefcase },
  ];

  const rightItems = [
    { id: 'funding', label: 'Financement', icon: Wallet },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        onClick={() => setActiveTab(item.id)}
        className={`premium-nav-item ${isActive ? 'active' : ''}`}
      >
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        <span className="label">{item.label}</span>
      </button>
    );
  };

  return (
    <nav className="premium-bottomnav-container">
      {/* Left side tabs */}
      <div className="premium-nav-group">
        {leftItems.map(item => (
          <NavItem key={item.id} item={item} />
        ))}
      </div>

      {/* Centered Floating Action Button */}
      <div className="premium-nav-fab-container">
        <button 
          className="premium-nav-fab"
          onClick={onAddClick}
          aria-label="Ajouter un projet"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      </div>

      {/* Right side tabs */}
      <div className="premium-nav-group">
        {rightItems.map(item => (
          <NavItem key={item.id} item={item} />
        ))}
      </div>
    </nav>
  );
};

export default PremiumBottomNav;
