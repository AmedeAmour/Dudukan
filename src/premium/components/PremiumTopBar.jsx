import React from 'react';
import { Bell, User, Moon, Sun, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PremiumTopBar = ({ title = "Financial Assistant", onBellClick, theme, onToggleTheme, onDownloadReport }) => {
  const { user } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <header className="premium-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: 'var(--zenith-outline-variant)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="User Avatar" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <User size={20} color="var(--zenith-white)" />
          )}
        </div>
        <h1 className="font-heading" style={{
          fontSize: '18px',
          color: 'var(--zenith-on-surface)',
          margin: 0
        }}>
          {title}
        </h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          onClick={onToggleTheme}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px',
            borderRadius: '50%',
            cursor: 'pointer',
            color: 'var(--zenith-on-surface)',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(26, 79, 139, 0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button 
          onClick={onBellClick}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--zenith-on-surface)',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(26, 79, 139, 0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Bell size={20} />
        </button>
        <button
          onClick={onDownloadReport}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px',
            borderRadius: '50%',
            cursor: 'pointer',
            color: 'var(--zenith-on-surface)',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(26, 79, 139, 0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Download size={20} />
        </button>
      </div>
    </header>
  );
};

export default PremiumTopBar;
