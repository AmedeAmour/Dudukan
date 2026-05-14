import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { 
  Trash2, LogOut, ChevronRight, Calculator, Bell, 
  Shield, Plus, Camera, User, Download, Coins, 
  ChevronDown, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationService } from '../NotificationService';

const Settings = () => {
  const finance = useFinance();
  const auth = useAuth();
  
  const [tempSalary, setTempSalary] = useState('');
  const [showSim, setShowSim] = useState(false);
  const [targetSalary, setTargetSalary] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [expandedSection, setExpandedSection] = useState(null); // 'income', 'notifications', 'currency'
  const fileInputRef = useRef(null);

  const { 
    salary = 0, nextMonthSalary = 0, currency = { code: 'XOF', locale: 'fr-FR' },
    formatCurrency = (v) => v, totalIncome = 0, totalExpenses = 0, balance = 0, 
    allTransactions = [], startNewPeriod = () => {},
    setNextMonthSalary = () => {}, resetData = () => {}, setCurrency = () => {},
    notificationSchedule = [], setNotificationSchedule = () => {}
  } = finance || {};

  const { user = null, signOut = () => {}, updateProfile = () => {} } = auth || {};

  const currencies = [
    { code: 'XOF', locale: 'fr-FR', name: 'Franc CFA (BCEAO)' },
    { code: 'XAF', locale: 'fr-FR', name: 'Franc CFA (BEAC)' },
    { code: 'GNF', locale: 'fr-GN', name: 'Franc Guinéen (GNF)' },
    { code: 'CDF', locale: 'fr-CD', name: 'Franc Congolais (CDF)' },
    { code: 'NGN', locale: 'en-NG', name: 'Naira Nigérian (NGN)' },
    { code: 'GHS', locale: 'en-GH', name: 'Cedi Ghanéen (GHS)' },
    { code: 'KES', locale: 'en-KE', name: 'Shilling Kényan (KES)' },
    { code: 'ZAR', locale: 'en-ZA', name: 'Rand Sud-Africain (ZAR)' },
    { code: 'MAD', locale: 'ar-MA', name: 'Dirham Marocain (MAD)' },
    { code: 'DZD', locale: 'ar-DZ', name: 'Dinar Algérien (DZD)' },
    { code: 'TND', locale: 'ar-TN', name: 'Dinar Tunisien (TND)' },
    { code: 'EGP', locale: 'ar-EG', name: 'Livre Égyptienne (EGP)' },
    { code: 'ETB', locale: 'am-ET', name: 'Birr Éthiopien (ETB)' },
    { code: 'RWF', locale: 'rw-RW', name: 'Franc Rwandais (RWF)' },
    { code: 'MUR', locale: 'en-MU', name: 'Roupie Mauricienne (MUR)' },
    { code: 'EUR', locale: 'fr-FR', name: 'Euro (€)' },
    { code: 'USD', locale: 'en-US', name: 'Dollar ($)' },
  ];

  useEffect(() => {
    setTempSalary((nextMonthSalary || salary || 0).toString());
  }, [salary, nextMonthSalary]);

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setNewName(user.user_metadata.full_name);
    }
  }, [user]);

  if (!finance || !auth) return <div style={{ padding: '40px', textAlign: 'center' }}>Chargement...</div>;

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleUpdateSalary = () => {
    const val = parseFloat(tempSalary);
    if (!isNaN(val) && val >= 0) {
      setNextMonthSalary(val);
      alert('Salaire planifié pour le mois prochain.');
      setExpandedSection(null);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    const { error } = await updateProfile({ full_name: newName });
    if (!error) {
      setIsEditingName(false);
      alert('Nom mis à jour !');
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id || 'anon'}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await updateProfile({ avatar_url: data.publicUrl });
      alert('Photo mise à jour !');
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const clean = (str) => {
        if (!str) return '';
        return String(str).replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ').replace(/[^\x00-\x7F]/g, (c) => {
          const map = {'é':'e', 'è':'e', 'ê':'e', 'à':'a', 'â':'a', 'î':'i', 'ï':'i', 'ô':'o', 'û':'u', 'ù':'u', 'Ç':'C', 'ç':'c'};
          return map[c] || c;
        });
      };

      const loadLogo = () => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = '/sampa-electro (15).png';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      };
      
      const logo = await loadLogo();
      if (logo) { doc.addImage(logo, 'PNG', 15, 10, 20, 20); }
      
      doc.setFontSize(22);
      doc.setTextColor(26, 43, 85);
      doc.text("Dudukan", 40, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(clean("L'assistant financier intelligent"), 40, 26);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 35, 195, 35);
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(clean("Rapport d'Activité Financière"), 15, 50);
      
      doc.setFontSize(12);
      doc.text(`Client : ${clean(user?.user_metadata?.full_name || 'Utilisateur')}`, 15, 60);
      doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 15, 67);
      
      doc.setFillColor(240, 244, 255);
      doc.rect(15, 75, 180, 35, 'F');
      doc.setFontSize(11);
      doc.setTextColor(26, 43, 85);
      doc.text(clean("Résumé de la période"), 20, 82);
      doc.setTextColor(0, 0, 0);
      doc.text(`${clean("Total Revenus :")} ${formatCurrency(totalIncome)}`, 20, 92);
      doc.text(`${clean("Total Dépenses :")} ${formatCurrency(totalExpenses)}`, 20, 99);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${clean("Solde Final :")} ${formatCurrency(balance)}`, 20, 107);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.text(clean("Détail des transactions récentes"), 15, 125);
      
      let y = 135;
      doc.setFontSize(10);
      allTransactions.slice(0, 20).forEach((tx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const dateStr = new Date(tx.date).toLocaleDateString('fr-FR');
        const typeStr = tx.type === 'income' ? '(+)' : '(-)';
        const noteStr = clean(tx.note || (tx.type === 'income' ? 'Revenu' : 'Dépense'));
        doc.text(`${dateStr}  ${typeStr}  ${noteStr}`, 15, y);
        doc.text(formatCurrency(tx.amount), 170, y, { align: 'right' });
        y += 8;
      });
      
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Généré par Dudukan - Votre gestion financière simplifiée", 105, 285, { align: 'center' });
      
      doc.save(`Rapport_Dudukan_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération du PDF.');
    }
  };

  const SettingRow = ({ icon: Icon, label, color, onClick, isExpanded, children }) => (
    <div style={{ borderBottom: '1px solid #F3F4F6' }}>
      <div 
        onClick={onClick} 
        style={{ 
          padding: '16px 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer',
          background: isExpanded ? '#F9FAFB' : 'white'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '10px', 
            background: `${color}15`, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: color 
          }}>
            <Icon size={20} />
          </div>
          <span style={{ fontWeight: '500', fontSize: '15px' }}>{label}</span>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
          <ChevronRight size={20} color="#9CA3AF" />
        </motion.div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', background: '#F9FAFB' }}
          >
            <div style={{ padding: '0 20px 20px 72px' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '24px 20px 100px' }}
    >
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--navy)' }}>Réglages</h1>
        <p style={{ color: 'var(--text-light)', fontSize: '15px' }}>Gérez votre profil et vos préférences</p>
      </header>

      {/* Profil Section */}
      <div className="card" style={{ marginBottom: '32px', padding: '24px', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 16px', cursor: 'pointer' }} onClick={() => fileInputRef.current.click()}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#F3F4F6', border: '4px solid white', boxShadow: 'var(--shadow-soft)' }}>
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>
                <User size={40} />
              </div>
            )}
          </div>
          <div style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--navy)', color: 'white', padding: '6px', borderRadius: '50%', border: '3px solid white' }}>
            <Camera size={16} />
          </div>
          <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} style={{ display: 'none' }} accept="image/*" />
        </div>

        {isEditingName ? (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <input 
              type="text" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', width: '160px' }}
              autoFocus
            />
            <button onClick={handleUpdateName} style={{ background: 'var(--navy)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '600' }}>OK</button>
          </div>
        ) : (
          <div onClick={() => setIsEditingName(true)} style={{ cursor: 'pointer' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{user?.user_metadata?.full_name || 'Utilisateur'}</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '13px' }}>{user?.email} • Modifier le nom</p>
          </div>
        )}
      </div>

      {/* Main Settings List */}
      <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-light)', letterSpacing: '0.05em', marginBottom: '12px', marginLeft: '4px' }}>CONFIGURATION</h3>
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        
        {/* Planifier mon revenu */}
        <SettingRow 
          icon={Calculator} 
          label="Planifier mon revenu" 
          color="var(--accent-blue)" 
          isExpanded={expandedSection === 'income'}
          onClick={() => toggleSection('income')}
        >
          <div style={{ paddingTop: '8px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '12px' }}>Définissez votre salaire habituel pour le mois prochain.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="number" 
                value={tempSalary} 
                onChange={(e) => setTempSalary(e.target.value)}
                placeholder="Montant du salaire"
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #E5E7EB' }}
              />
              <button onClick={handleUpdateSalary} style={{ background: 'var(--navy)', color: 'white', padding: '0 16px', borderRadius: '10px', border: 'none', fontWeight: '600', fontSize: '14px' }}>Valider</button>
            </div>
          </div>
        </SettingRow>

        {/* Planning des rappels */}
        <SettingRow 
          icon={Bell} 
          label="Planning des rappels" 
          color="var(--accent-orange)" 
          isExpanded={expandedSection === 'notifications'}
          onClick={() => toggleSection('notifications')}
        >
          <div style={{ paddingTop: '8px' }}>
            {notificationSchedule.map((s, idx) => (
              <div key={s.day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: idx === 6 ? 'none' : '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    checked={s.enabled} 
                    onChange={(e) => {
                      const newSched = [...notificationSchedule];
                      newSched[idx].enabled = e.target.checked;
                      setNotificationSchedule(newSched);
                    }}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontWeight: '600', width: '35px', fontSize: '13px' }}>{s.label}</span>
                </div>
                <input 
                  type="time" 
                  value={s.time}
                  disabled={!s.enabled}
                  onChange={(e) => {
                    const newSched = [...notificationSchedule];
                    newSched[idx].time = e.target.value;
                    setNotificationSchedule(newSched);
                  }}
                  style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '2px 6px', fontSize: '13px', background: s.enabled ? 'white' : '#F9FAFB' }}
                />
              </div>
            ))}
          </div>
        </SettingRow>

        {/* Monnaie */}
        <SettingRow 
          icon={Coins} 
          label="Monnaie & Devise" 
          color="var(--emerald)" 
          isExpanded={expandedSection === 'currency'}
          onClick={() => toggleSection('currency')}
        >
          <div style={{ paddingTop: '8px' }}>
            <select 
              value={currency.code} 
              onChange={(e) => {
                setCurrency(currencies.find(c => c.code === e.target.value));
                setExpandedSection(null);
              }}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px' }}
            >
              {currencies.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
        </SettingRow>
      </div>

      {/* Actions Section */}
      <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-light)', letterSpacing: '0.05em', marginBottom: '12px', marginTop: '32px', marginLeft: '4px' }}>ACTIONS & SÉCURITÉ</h3>
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {[
          { icon: Plus, label: 'Démarrer mon nouveau mois', color: 'var(--accent-orange)', onClick: startNewPeriod },
          { icon: Download, label: 'Télécharger le rapport (PDF)', color: 'var(--emerald)', onClick: handleDownloadReport },
          { icon: Bell, label: 'Tester les notifications', color: 'var(--accent-blue)', onClick: async () => {
            const granted = await NotificationService.requestPermission();
            if (granted) {
              NotificationService.sendNotification("Activées !", "Vos rappels Dudukan sont prêts.");
              alert('Notifications activées !');
            } else {
              alert('Veuillez autoriser les notifications dans les réglages de votre site.');
            }
          } },
          { icon: Trash2, label: 'Réinitialiser toutes les données', color: 'var(--accent-pink)', onClick: () => { if(window.confirm('Voulez-vous vraiment TOUT supprimer ?')) resetData(); } },
          { icon: LogOut, label: 'Se déconnecter du compte', color: 'var(--text-light)', onClick: signOut },
        ].map((item, index, arr) => (
          <div key={index} onClick={item.onClick} style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: index === arr.length - 1 ? 'none' : '1px solid #F3F4F6', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '10px', 
                background: `${item.color}15`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: item.color 
              }}>
                <item.icon size={20} />
              </div>
              <span style={{ fontWeight: '500', fontSize: '15px' }}>{item.label}</span>
            </div>
            <ChevronRight size={20} color="#9CA3AF" />
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px', padding: '20px', opacity: 0.5 }}>
        <p style={{ fontSize: '12px' }}>Dudukan v1.2.5 • Fait avec ❤️</p>
      </div>
    </motion.div>
  );
};

export default Settings;
