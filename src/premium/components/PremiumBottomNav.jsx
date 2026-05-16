import React from 'react';
import { Home, FolderOpen, History, Settings } from 'lucide-react';

const PremiumBottomNav = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'projects', label: 'Projets', icon: FolderOpen },
    { id: 'history', label: 'Historique', icon: History },
    { id: 'settings', label: 'Réglages', icon: Settings },
  ];

  return (
    <nav className="bottom-nav" style={{ 
      background: 'rgba(255, 255, 255, 0.95)', 
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid rgba(0,0,0,0.05)',
      height: '80px',
      paddingBottom: '20px'
    }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: isActive ? 'var(--navy)' : 'var(--text-light)',
              transition: 'all 0.3s ease',
              flex: 1,
              padding: '8px 0'
            }}
          >
            <div style={{
              padding: '6px 16px',
              borderRadius: '20px',
              background: isActive ? 'rgba(26, 43, 72, 0.08)' : 'transparent',
              transition: 'all 0.3s ease'
            }}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: isActive ? '700' : '500',
              opacity: isActive ? 1 : 0.7
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default PremiumBottomNav;
