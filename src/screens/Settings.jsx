import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Trash2, LogOut, ChevronRight, Calculator, Bell, Shield, Plus, Camera, User, Download } from 'lucide-react';
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
  const fileInputRef = useRef(null);

  const { 
    salary = 0, nextMonthSalary = 0, currency = { code: 'XOF', locale: 'fr-FR' },
    formatCurrency = (v) => v, totalIncome = 0, totalExpenses = 0, balance = 0, 
    allTransactions = [], startNewPeriod = () => {},
    setNextMonthSalary = () => {}, resetData = () => {}, setCurrency = () => {},
    notificationSchedule = [], setNotificationSchedule = () => {}
  } = finance || {};

  const { user = null, signOut = () => {}, updateProfile = () => {} } = auth || {};

  useEffect(() => {
    setTempSalary((nextMonthSalary || salary || 0).toString());
  }, [salary, nextMonthSalary]);

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setNewName(user.user_metadata.full_name);
    }
  }, [user]);

  if (!finance || !auth) return <div style={{ padding: '40px', textAlign: 'center' }}>Chargement...</div>;

  const handleUpdateSalary = () => {
    const val = parseFloat(tempSalary);
    if (!isNaN(val) && val >= 0) {
      setNextMonthSalary(val);
      alert('Salaire planifié pour le mois prochain.');
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
      
      // Fonction pour nettoyer les chaînes de caractères (évite les bugs d'encodage)
      const clean = (str) => {
        if (!str) return '';
        return String(str)
          .replace(/\u00A0/g, ' ') // Remplace espace insécable
          .replace(/\u202F/g, ' ') // Remplace espace insécable fin
          .replace(/[^\x00-\x7F]/g, (c) => {
            // Remplace les caractères accentués courants pour éviter les carrés
            const map = {'é':'e', 'è':'e', 'ê':'e', 'à':'a', 'â':'a', 'î':'i', 'ï':'i', 'ô':'o', 'û':'u', 'ù':'u', 'Ç':'C', 'ç':'c'};
            return map[c] || c;
          });
      };

      // Chargement du logo
      const loadLogo = () => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = '/sampa-electro (15).png';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      };
      
      const logoImg = await loadLogo();

      // En-tête
      doc.setFillColor(26, 43, 72); // Couleur Navy
      doc.rect(0, 0, 210, 45, 'F');
      
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', 20, 10, 20, 20);
      }
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Dudukan', 45, 22);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(clean('L\'assistant financier intelligent'), 45, 28);

      doc.setFontSize(18);
      doc.text('RAPPORT FINANCIER', 130, 25);
      
      doc.setFontSize(8);
      doc.text(clean(`Genere le : ${new Date().toLocaleDateString('fr-FR')}`), 130, 32);

      // Section Résumé
      doc.setTextColor(26, 43, 72);
      doc.setFontSize(14);
      doc.text('RESUME DU MOIS', 20, 55);
      doc.line(20, 57, 60, 57);

      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      
      const stats = [
        ['Salaire de base :', formatCurrency(salary)],
        ['Revenus complementaires :', formatCurrency(totalIncome - salary)],
        ['Total des depenses :', formatCurrency(totalExpenses)],
        ['Solde actuel :', formatCurrency(balance)]
      ];

      let y = 70;
      stats.forEach(([label, value]) => {
        doc.text(clean(label), 25, y);
        doc.text(clean(value), 120, y);
        y += 10;
      });

      // Section Transactions
      y += 10;
      doc.setTextColor(26, 43, 72);
      doc.setFontSize(14);
      doc.text('DERNIERES OPERATIONS', 20, y);
      doc.line(20, y + 2, 80, y + 2);
      
      y += 15;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Date', 25, y);
      doc.text('Description', 50, y);
      doc.text('Montant', 150, y);
      
      doc.line(20, y + 2, 190, y + 2);
      y += 10;

      doc.setTextColor(60, 60, 60);
      const recent = (allTransactions || []).slice(0, 15);
      
      recent.forEach((tx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        
        const date = new Date(tx.date).toLocaleDateString('fr-FR');
        const amount = `${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}`;
        const note = tx.note || (tx.type === 'income' ? 'Revenu' : 'Depense');
        
        doc.text(clean(date), 25, y);
        doc.text(clean(note), 50, y);
        doc.text(clean(amount), 150, y);
        
        y += 8;
      });

      // Bas de page
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Document genere par l\'application Dudukan - Votre assistant financier personnel.', 105, 285, { align: 'center' });

      doc.save(`Rapport_Dudukan_${new Date().getMonth() + 1}_${new Date().getFullYear()}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la génération du PDF.");
    }
  };

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

  const avatarUrl = user?.user_metadata?.avatar_url;
  const diff = targetSalary ? parseFloat(targetSalary) - salary : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '24px 20px' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px' }}>Profil & Réglages</h1>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Gérez vos préférences et exportez vos données</p>
      </header>

      {/* Profile Section */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', position: 'relative' }}>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--accent-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '4px solid white', boxShadow: 'var(--shadow-soft)' }}>
            {avatarUrl ? <img src={avatarUrl} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={40} color="var(--accent-blue)" />}
          </div>
          <button onClick={() => fileInputRef.current.click()} disabled={uploading} style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--navy)', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={16} />
          </button>
          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleAvatarUpload} />
        </div>

        {isEditingName ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ textAlign: 'center', width: '80%' }} autoFocus />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setIsEditingName(false)} style={{ padding: '8px 16px', background: 'white', border: '1px solid #DDD', borderRadius: '8px' }}>Annuler</button>
              <button onClick={handleUpdateName} className="btn-primary" style={{ padding: '8px 16px' }}>Valider</button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }} onClick={() => setIsEditingName(true)}>
            <h2 style={{ fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user?.user_metadata?.full_name || user?.email}
              <User size={14} color="#6B7280" />
            </h2>
            <p style={{ color: 'var(--text-light)', fontSize: '13px' }}>{user?.user_metadata?.full_name ? user.email : 'Cliquez pour modifier le nom'}</p>
          </div>
        )}
      </div>

      {/* Simulation Card */}
      <div className="card" style={{ background: 'var(--navy)', color: 'white', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }} onClick={() => setShowSim(true)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}><Calculator size={24} /></div>
          <div>
            <h3 style={{ color: 'white', fontSize: '16px' }}>Simulation de revenus</h3>
            <p style={{ opacity: 0.7, fontSize: '12px' }}>Visualisez votre futur budget</p>
          </div>
        </div>
        <ChevronRight size={20} />
      </div>

      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '12px' }}>PLANIFIER MON REVENU</h3>
        <div className="card">
          <p style={{ fontSize: '13px', marginBottom: '12px' }}>Actuel : <strong>{formatCurrency(salary)}</strong></p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input type="number" value={tempSalary} onChange={(e) => setTempSalary(e.target.value)} style={{ flex: 1 }} />
            <button onClick={handleUpdateSalary} style={{ background: 'var(--navy)', color: 'white', padding: '0 20px', borderRadius: '12px', border: 'none', fontWeight: '600' }}>Valider</button>
          </div>
          {nextMonthSalary > 0 && (
            <div style={{ background: 'var(--accent-blue-light)', padding: '10px', borderRadius: '8px', marginTop: '12px', border: '1px solid var(--accent-blue)' }}>
              <p style={{ fontSize: '12px', color: 'var(--navy)' }}>Planifié : <strong>{formatCurrency(nextMonthSalary)}</strong> (actif au prochain mois)</p>
            </div>
          )}
        </div>

        <h3 style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '12px', marginTop: '24px' }}>PLANNING DES RAPPELS</h3>
        <div className="card" style={{ padding: '8px 16px' }}>
          {notificationSchedule.map((s, idx) => (
            <div key={s.day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: idx === 6 ? 'none' : '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="checkbox" 
                  checked={s.enabled} 
                  onChange={(e) => {
                    const newSched = [...notificationSchedule];
                    newSched[idx].enabled = e.target.checked;
                    setNotificationSchedule(newSched);
                  }}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '600', width: '40px', fontSize: '14px' }}>{s.label}</span>
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
                style={{ 
                  border: '1px solid #E5E7EB', 
                  borderRadius: '8px', 
                  padding: '4px 8px', 
                  fontSize: '14px',
                  background: s.enabled ? 'white' : '#F9FAFB',
                  opacity: s.enabled ? 1 : 0.5,
                  cursor: s.enabled ? 'pointer' : 'default'
                }}
              />
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '12px', marginTop: '24px' }}>MONNAIE</h3>
        <div className="card">
          <select value={currency.code} onChange={(e) => setCurrency(currencies.find(c => c.code === e.target.value))} style={{ width: '100%', padding: '12px', borderRadius: '12px' }}>
            {currencies.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>

        <h3 style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '12px', marginTop: '24px' }}>ACTIONS</h3>
        <div className="card" style={{ padding: '0' }}>
          {[
            { icon: Plus, label: 'Démarrer mon nouveau mois', color: 'var(--accent-orange)', onClick: startNewPeriod },
            { icon: Download, label: 'Télécharger le rapport financier (PDF)', color: 'var(--emerald)', onClick: handleDownloadReport },
            { icon: Bell, label: 'Gérer les notifications', color: 'var(--accent-blue)', onClick: async () => {
              const granted = await NotificationService.requestPermission();
              if (granted) {
                NotificationService.sendNotification("Activées !", "Vos rappels Dudukan sont prêts.");
                alert('Notifications activées avec succès !');
              } else {
                alert('Les notifications sont bloquées par votre navigateur. Veuillez les autoriser dans les réglages de votre téléphone ou navigateur.');
              }
            } },
            { icon: Trash2, label: 'Réinitialiser toutes les données', color: 'var(--accent-pink)', onClick: () => { if(window.confirm('Voulez-vous vraiment TOUT supprimer ?')) resetData(); } },
            { icon: LogOut, label: 'Se déconnecter', color: 'var(--text-light)', onClick: signOut },
          ].map((item, index, arr) => (
            <div key={index} onClick={item.onClick} style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: index === arr.length - 1 ? 'none' : '1px solid #F3F4F6', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <item.icon size={20} color={item.color} />
                <span style={{ fontWeight: '500' }}>{item.label}</span>
              </div>
              <ChevronRight size={18} color="#D1D5DB" />
            </div>
          ))}
        </div>
      </div>

      {/* Simulation Modal */}
      <AnimatePresence>
        {showSim && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'flex-end' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ background: 'var(--bg-main)', width: '100%', maxWidth: '500px', margin: '0 auto', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '32px 24px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px' }}>Simulation</h2>
                <button onClick={() => setShowSim(false)} style={{ background: '#F3F4F6', border: 'none', padding: '8px', borderRadius: '50%' }}><Plus style={{ transform: 'rotate(45deg)' }} size={20} /></button>
              </div>
              
              <label className="label">Revenu mensuel espéré ({currency.code})</label>
              <input type="number" placeholder="Ex: 250 000" value={targetSalary} onChange={(e) => setTargetSalary(e.target.value)} />
              
              {targetSalary && (
                <div style={{ marginTop: '24px' }}>
                  {diff > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ color: 'var(--emerald)', fontWeight: '600' }}>Augmentation de +{formatCurrency(diff)}</p>
                      {[{ label: 'Dettes (40%)', amount: diff * 0.4 }, { label: 'Épargne (30%)', amount: diff * 0.3 }, { label: 'Confort (20%)', amount: diff * 0.2 }, { label: 'Imprévus (10%)', amount: diff * 0.1 }].map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EEE', padding: '8px 0' }}>
                          <span>{item.label}</span><span style={{ fontWeight: '700' }}>+{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p style={{ color: 'var(--text-light)' }}>Entrez un montant supérieur à votre salaire actuel pour voir les conseils.</p>}
                </div>
              )}
              
              <button className="btn-primary" style={{ marginTop: '32px' }} onClick={() => setShowSim(false)}>C'est compris</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Settings;
