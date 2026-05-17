import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, User } from 'lucide-react';

const PremiumTopBar = ({ title = "Financial Assistant" }) => {
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
          color: 'var(--zenith-primary)',
          margin: 0
        }}>
          {title}
        </h1>
      </div>
      <button style={{
        background: 'none',
        border: 'none',
        padding: '8px',
        borderRadius: '50%',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--zenith-primary)',
        transition: 'background-color 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(26, 79, 139, 0.05)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <Bell size={20} />
      </button>
    </header>
  );
};

export default PremiumTopBar;
