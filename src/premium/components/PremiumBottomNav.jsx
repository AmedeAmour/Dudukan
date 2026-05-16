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
      background: 'var(--zenith-white)', 
      height: '90px',
      paddingBottom: '20px',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.03)',
      borderTop: 'none',
      borderTopLeftRadius: 'var(--radius-xl)',
      borderTopRightRadius: 'var(--radius-xl)'
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
              color: isActive ? 'var(--zenith-primary)' : 'var(--zenith-neutral)',
              transition: 'all 0.3s ease',
              flex: 1,
              padding: '8px 0'
            }}
          >
            <div style={{
              padding: '8px 24px',
              borderRadius: 'var(--radius-pill)',
              background: isActive ? 'rgba(26, 79, 139, 0.08)' : 'transparent',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              marginBottom: '4px'
            }}>
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span style={{ 
              fontSize: '12px', 
              fontFamily: 'var(--font-headings)',
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
