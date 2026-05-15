import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPWA = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);

    // Detect OS and Mobile
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobileDevice = /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(userAgent);
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    if (isMobileDevice && !isStandaloneMode) {
      // Afficher systématiquement pour les mobiles non installés
      const timer = setTimeout(() => setShowPrompt(true), 1500);

      const handleBeforeInstallPrompt = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              background: 'var(--navy)', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(26, 43, 72, 0.2)'
            }}>
              <img src="/favicon.svg" alt="App Icon" style={{ width: '32px', height: '32px' }} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)', margin: 0 }}>Installez Dudukan</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>L'application doit être installée pour continuer</p>
            </div>
          </div>
        </div>

        {isIOS ? (
          <div style={{ 
            background: 'var(--accent-blue-light)', 
            padding: '12px', 
            borderRadius: '12px',
            fontSize: '13px',
            color: 'var(--navy)',
            lineHeight: '1.5'
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>Pour installer sur votre iPhone :</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: 'white', padding: '4px', borderRadius: '4px' }}><Share size={14} /></div>
                <span>Appuyez sur le bouton <strong>Partager</strong> en bas</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: 'white', padding: '4px', borderRadius: '4px' }}><PlusSquare size={14} /></div>
                <span>Puis sur <strong>Sur l'écran d'accueil</strong></span>
              </div>
            </div>
          </div>
        ) : deferredPrompt ? (
          <button 
            onClick={handleInstall}
            style={{ 
              background: 'var(--navy)', 
              color: 'white', 
              border: 'none', 
              padding: '12px', 
              borderRadius: '12px', 
              fontWeight: '600', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Download size={18} /> Installer l'application
          </button>
        ) : (
          <div style={{ 
            background: 'var(--accent-blue-light)', 
            padding: '12px', 
            borderRadius: '12px',
            fontSize: '13px',
            color: 'var(--navy)',
            lineHeight: '1.5'
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>Pour installer sur Android :</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: 'white', padding: '4px', borderRadius: '4px', fontWeight: 'bold' }}>&#8942;</div>
                <span>Appuyez sur les <strong>3 points</strong> en haut à droite</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: 'white', padding: '4px', borderRadius: '4px' }}><Download size={14} /></div>
                <span>Puis sur <strong>Installer l'application</strong></span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPWA;
