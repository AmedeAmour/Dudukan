import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { TrendingUp, Trash2, LogOut, ChevronRight, Calculator, Bell, Shield, Plus, Camera, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationService } from '../NotificationService';

const Settings = () => {
  const { salary, setSalary, setOnboarded, startNewPeriod, currency, setCurrency, formatCurrency, notificationTime, setNotificationTime } = useFinance();
  const { user, signOut, updateProfile } = useAuth();
  const [showSim, setShowSim] = useState(false);
  const [targetSalary, setTargetSalary] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.user_metadata?.full_name || '');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setNewName(user.user_metadata.full_name);
    }
  }, [user]);

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    const { error } = await updateProfile({ full_name: newName });
    if (!error) {
      setIsEditingName(false);
      alert('Nom mis à jour !');
    } else {
      alert('Erreur: ' + error.message);
    }
  };

  const currencies = [
    { code: 'XOF', locale: 'fr-FR', name: 'Franc CFA (BCEAO)' },
    { code: 'EUR', locale: 'fr-FR', name: 'Euro (€)' },
    { code: 'USD', locale: 'en-US', name: 'Dollar ($)' },
    { code: 'MAD', locale: 'ar-MA', name: 'Dirham (MAD)' },
    { code: 'GNF', locale: 'fr-GN', name: 'Franc Guinéen' },
  ];

  const handleReset = () => {
    if (window.confirm('Voulez-vous vraiment réinitialiser toutes vos données locales ?')) {
      localStorage.removeItem('dudukan_data');
      window.location.reload();
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await updateProfile({ avatar_url: data.publicUrl });
      alert('Photo de profil mise à jour !');
    } catch (error) {
      alert('Erreur: Assurez-vous d\'avoir créé un bucket "avatars" public sur Supabase. ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const diff = targetSalary ? parseFloat(targetSalary) - salary : 0;
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '24px 20px' }}
    >
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px' }}>Profil</h1>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Gérez votre compte et vos paramètres</p>
      </header>

      {/* Profile Section */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', position: 'relative' }}>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            background: 'var(--accent-blue-light)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            overflow: 'hidden',
            border: '4px solid white',
            boxShadow: 'var(--shadow-soft)'
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={40} color="var(--accent-blue)" />
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            style={{ 
              position: 'absolute', 
              bottom: 0, 
              right: 0, 
              background: 'var(--navy)', 
              color: 'white', 
              border: 'none', 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: uploading ? 0.5 : 1
            }}
          >
            <Camera size={16} />
          </button>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleAvatarUpload} 
          />
        </div>

        {isEditingName ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <input 
              type="text" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              style={{ textAlign: 'center', fontSize: '18px', padding: '8px', borderRadius: '8px', border: '1px solid #E5E7EB', width: '80%' }}
              placeholder="Votre nom complet"
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => { setIsEditingName(false); setNewName(user?.user_metadata?.full_name || ''); }}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white', fontSize: '14px' }}
              >
                Annuler
              </button>
              <button 
                onClick={handleUpdateName}
                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: 'var(--navy)', color: 'white', fontSize: '14px' }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setIsEditingName(true)}>
            <h2 style={{ fontSize: '20px', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {user?.user_metadata?.full_name || user?.email}
              <User size={14} color="var(--text-light)" />
            </h2>
            <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>{user?.user_metadata?.full_name ? user.email : 'Cliquez pour modifier le nom'}</p>
          </div>
        )}
      </div>

      {/* Simulation Card */}
      <div 
        className="card" 
        style={{ 
          background: 'var(--navy)', 
          color: 'white', 
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onClick={() => setShowSim(true)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}>
            <Calculator size={24} />
          </div>
          <div>
            <h3 style={{ color: 'white', fontSize: '16px' }}>Simulation de revenus</h3>
            <p style={{ opacity: 0.7, fontSize: '12px' }}>Préparez votre future situation financière</p>
          </div>
        </div>
        <ChevronRight size={20} style={{ opacity: 0.5 }} />
      </div>

      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--text-light)', marginBottom: '12px', marginLeft: '4px' }}>MONNAIE</h3>
        <div className="card" style={{ padding: '20px' }}>
          <select 
            value={currency.code}
            onChange={(e) => {
              const selected = currencies.find(c => c.code === e.target.value);
              setCurrency(selected);
            }}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '12px', 
              border: '1.5px solid #F3F4F6',
              fontSize: '15px',
              background: 'var(--bg-main)',
              color: 'var(--text-main)',
              fontWeight: '500'
            }}
          >
            {currencies.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        <h3 style={{ fontSize: '16px', color: 'var(--text-light)', marginBottom: '12px', marginTop: '24px', marginLeft: '4px' }}>PARAMÈTRES</h3>
        
        <div className="card" style={{ padding: '0' }}>
          {[
            { icon: Plus, label: 'Démarer mon nouveau mois', color: 'var(--accent-orange)', onClick: startNewPeriod },
            { icon: Bell, label: 'Activer les notifications', color: 'var(--accent-blue)', onClick: async () => {
                const granted = await NotificationService.requestPermission();
                if (granted) {
                  NotificationService.sendNotification("Notifications activées !", "Vous recevrez des rappels pour vos transactions.");
                } else {
                  alert("Les notifications sont bloquées par votre navigateur.");
                }
              } 
            },
            { icon: Shield, label: 'Confidentialité', color: 'var(--emerald)', onClick: () => alert('Vos données sont sécurisées localement.') },
            { icon: Trash2, label: 'Réinitialiser les données locales', color: 'var(--accent-pink)', onClick: handleReset },
            { icon: LogOut, label: 'Se déconnecter', color: 'var(--text-light)', onClick: signOut },
          ].map((item, index, arr) => (
            <div 
              key={index}
              onClick={item.onClick}
              style={{ 
                padding: '16px 20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: index === arr.length - 1 ? 'none' : '1px solid #F3F4F6',
                cursor: item.onClick ? 'pointer' : 'default'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <item.icon size={20} color={item.color} />
                <span style={{ fontWeight: '500', color: item.label === 'Se déconnecter' ? 'var(--text-light)' : 'inherit' }}>{item.label}</span>
              </div>
              <ChevronRight size={18} color="#D1D5DB" />
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: '16px', color: 'var(--text-light)', marginBottom: '12px', marginTop: '24px', marginLeft: '4px' }}>HEURE DE RAPPEL</h3>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: '500', color: 'var(--navy)', marginBottom: '4px' }}>Heure de notification</p>
            <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>Quand voulez-vous être rappelé ?</p>
          </div>
          <input 
            type="time" 
            value={notificationTime}
            onChange={async (e) => {
              const newTime = e.target.value;
              setNotificationTime(newTime);
              
              // Request permission if not already granted
              const granted = await NotificationService.requestPermission();
              if (granted) {
                // Attempt to schedule it natively in the background
                NotificationService.scheduleNotification(
                  "C'est l'heure !", 
                  "N'oubliez pas d'enregistrer vos transactions du jour sur Dudukan.", 
                  newTime
                );
              }
            }}
            style={{ 
              padding: '8px 12px', 
              borderRadius: '8px', 
              border: '1.5px solid #F3F4F6',
              fontSize: '15px',
              background: 'var(--bg-main)',
              color: 'var(--navy)',
              fontWeight: '600',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Simulation Modal */}
      <AnimatePresence>
        {showSim && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              background: 'rgba(0,0,0,0.5)', 
              zIndex: 3000,
              display: 'flex',
              alignItems: 'flex-end'
            }}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ 
                background: 'var(--bg-main)', 
                width: '100%', 
                maxWidth: '500px', 
                margin: '0 auto', 
                borderTopLeftRadius: '32px', 
                borderTopRightRadius: '32px',
                padding: '32px 24px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px' }}>Simuler vos revenus</h2>
                <button onClick={() => { setShowSim(false); setTargetSalary(''); }} style={{ background: '#F3F4F6', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                  <Plus style={{ transform: 'rotate(45deg)' }} size={20} />
                </button>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="label">Revenu mensuel espéré ({currency.code})</label>
                <input 
                  type="number" 
                  placeholder="Ex: 200 000" 
                  value={targetSalary}
                  onChange={(e) => setTargetSalary(e.target.value)}
                />
              </div>

              {targetSalary && (
                <div className="fade-in">
                  {diff > 0 ? (
                    <>
                      <div className="card" style={{ background: 'var(--emerald-light)', border: 'none', marginBottom: '24px' }}>
                        <p style={{ color: 'var(--emerald)', fontWeight: '600', marginBottom: '4px' }}>Augmentation de {formatCurrency(diff)}</p>
                        <p style={{ fontSize: '13px', color: 'var(--navy)' }}>Voici comment nous vous conseillons de l'utiliser :</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                          { label: 'Remboursement dettes (40%)', amount: diff * 0.4, color: 'var(--accent-pink)' },
                          { label: 'Épargne / Projets (30%)', amount: diff * 0.3, color: 'var(--emerald)' },
                          { label: 'Amélioration confort (20%)', amount: diff * 0.2, color: 'var(--accent-blue)' },
                          { label: 'Imprévus (10%)', amount: diff * 0.1, color: 'var(--accent-orange)' },
                        ].map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #E5E7EB' }}>
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</span>
                            <span style={{ fontWeight: '700', color: item.color }}>+{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : diff < 0 ? (
                    <div className="card" style={{ background: 'var(--accent-pink-light)', border: 'none', marginBottom: '24px' }}>
                      <p style={{ color: 'var(--accent-pink)', fontWeight: '600', marginBottom: '4px' }}>Attention : Baisse de {formatCurrency(Math.abs(diff))}</p>
                      <p style={{ fontSize: '13px', color: 'var(--navy)' }}>Veuillez revoir vos priorités pour maintenir votre équilibre financier.</p>
                    </div>
                  ) : (
                    <div className="card" style={{ background: '#F3F4F6', border: 'none', marginBottom: '24px' }}>
                      <p style={{ color: 'var(--text-light)', fontWeight: '600' }}>Aucun changement par rapport à votre salaire actuel.</p>
                    </div>
                  )}

                  <div style={{ marginTop: '32px', textAlign: 'center' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-light)', fontStyle: 'italic' }}>
                      "Une hausse de revenus doit vous aider à avancer, pas seulement à dépenser plus."
                    </p>
                  </div>
                </div>
              )}

              <button className="btn-primary" style={{ marginTop: '32px' }} onClick={() => { setShowSim(false); setTargetSalary(''); }}>
                J'ai compris
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Settings;
