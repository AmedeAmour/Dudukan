import React from 'react';
import { Bell, User, Moon, Sun, Download, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PremiumTopBar = ({ title = "Financial Assistant", onBellClick, theme, onToggleTheme, onDownloadReport }) => {
  const { user } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <header className="premium-topbar">
      <div className="premium-topbar-identity">
        <div className="premium-avatar">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="User Avatar" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <User size={20} />
          )}
        </div>
        <div>
          <div className="premium-topbar-kicker">
            <ShieldCheck size={12} />
            Dudukan Plus
          </div>
          <h1 className="font-heading premium-topbar-title">
            {title}
          </h1>
        </div>
      </div>
      <div className="premium-topbar-actions">
        <button 
          onClick={onToggleTheme}
          className="premium-icon-button"
          aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button 
          onClick={onBellClick}
          className="premium-icon-button"
          aria-label="Tester les notifications"
        >
          <Bell size={20} />
        </button>
        <button
          onClick={onDownloadReport}
          className="premium-icon-button premium-icon-button-strong"
          aria-label="Télécharger le rapport Dudukan Plus"
        >
          <Download size={20} />
        </button>
      </div>
    </header>
  );
};

export default PremiumTopBar;
