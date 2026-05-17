import React from 'react';

const PremiumApp = ({ onSwitchMode }) => {
  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
      <h1>Mode Premium (En construction)</h1>
      <p>C'est ici que nous allons construire la nouvelle version Premium à partir de zéro.</p>
      <button 
        onClick={() => onSwitchMode('free')}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: 'var(--navy)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Retourner à la version Gratuite
      </button>
    </div>
  );
};

export default PremiumApp;
