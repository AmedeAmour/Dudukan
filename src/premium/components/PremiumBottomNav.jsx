import React from 'react';
import { Home, FolderOpen, History, Settings } from 'lucide-react';

const PremiumBottomNav = ({ activeTab, setActiveTab, onAddClick }) => {
  const leftItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'projects', label: 'Projets', icon: FolderOpen },
  ];
  
  const rightItems = [
    { id: 'history', label: 'Historique', icon: History },
    { id: 'settings', label: 'Réglages', icon: Settings },
  ];

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
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
          padding: '8px 20px',
          borderRadius: 'var(--radius-pill)',
          background: isActive ? 'rgba(26, 79, 139, 0.08)' : 'transparent',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          marginBottom: '2px'
        }}>
          <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span style={{ 
          fontSize: '10px', 
          fontFamily: 'var(--font-headings)',
          fontWeight: isActive ? '800' : '600',
          opacity: isActive ? 1 : 0.7
        }}>
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <nav className="bottom-nav" style={{ 
      background: 'var(--zenith-white)', 
      height: '85px',
      paddingBottom: '10px',
      boxShadow: '0 -10px 30px rgba(0,0,0,0.05)',
      borderTop: 'none',
      borderTopLeftRadius: 'var(--radius-xl)',
      borderTopRightRadius: 'var(--radius-xl)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', flex: 2, justifyContent: 'space-around' }}>
        {leftItems.map(item => <NavItem key={item.id} item={item} />)}
      </div>

      {/* Center Action Button */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', marginTop: '-35px' }}>
        <button 
          onClick={onAddClick}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--zenith-primary)',
            border: '5px solid var(--zenith-bg)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(26, 79, 139, 0.3)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      </div>

      <div style={{ display: 'flex', flex: 2, justifyContent: 'space-around' }}>
        {rightItems.map(item => <NavItem key={item.id} item={item} />)}
      </div>
    </nav>
  );
};

export default PremiumBottomNav;
