import { useState, useEffect } from 'react';
import { usePremium } from '../context/PremiumContext';
import { NotificationService } from '../../NotificationService';
import {
  Sliders,
  ShieldCheck,
  RefreshCw,
  LogOut,
  MessageSquare,
  TrendingUp,
  Calendar,
  Bell,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';

const Profile = ({ onSwitchMode }) => {
  const {
    projects,
    financeSavings,
    freeSalary,
    currency,
    reminders,
    addReminder,
    deleteReminder,
    toggleReminder,
    resetPremiumData
  } = usePremium();

  const currencyCode = currency?.code || 'XOF';

  // Local state for coaching preferences (persisted to localStorage)
  const [coachingTone, setCoachingTone] = useState(() => {
    return localStorage.getItem('dudukan_coaching_tone') || 'pedagogic';
  });
  const [dominantStrategy, setDominantStrategy] = useState(() => {
    return localStorage.getItem('dudukan_dominant_strategy') || 'balanced';
  });
  const [securityMat, setSecurityMat] = useState(() => {
    return localStorage.getItem('dudukan_alert_safety_mat') === 'true' || true;
  });
  const [autoAnalysis, setAutoAnalysis] = useState(() => {
    return localStorage.getItem('dudukan_auto_analysis') === 'true' || true;
  });

  // Reminders states
  const [expandedReminders, setExpandedReminders] = useState(false);
  const [remForm, setRemForm] = useState({
    title: '',
    type: 'project',
    frequency: 'once',
    date: new Date().toISOString().split('T')[0],
    time: '20:00',
    day: 1,
    description: '',
    targetId: ''
  });

  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem('dudukan_coaching_tone', coachingTone);
  }, [coachingTone]);

  useEffect(() => {
    localStorage.setItem('dudukan_dominant_strategy', dominantStrategy);
  }, [dominantStrategy]);

  useEffect(() => {
    localStorage.setItem('dudukan_alert_safety_mat', securityMat);
  }, [securityMat]);

  useEffect(() => {
    localStorage.setItem('dudukan_auto_analysis', autoAnalysis);
  }, [autoAnalysis]);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      alert("Synchronisation avec le cloud Dudukan réussie !");
    }, 1500);
  };

  const handleTestNotification = async () => {
    const granted = await NotificationService.requestPermission();
    if (granted) {
      NotificationService.sendNotification('Test Notification', 'Ceci est une notification de test depuis Dudukan Plus.');
      alert('Notification de test envoyée !');
    } else {
      alert('Permission de notification refusée.');
    }
  };

  const handleCreateReminder = (e) => {
    e.preventDefault();
    addReminder(remForm);
    setRemForm({
      title: '',
      type: 'project',
      frequency: 'once',
      date: new Date().toISOString().split('T')[0],
      time: '20:00',
      day: 1,
      description: '',
      targetId: ''
    });
    alert('Rappel créé avec succès !');
  };

  const handleResetPremium = async () => {
    const ok = window.confirm(
      "Êtes-vous absolument sûr de vouloir réinitialiser vos données premium ?\n\n" +
      "Cette action supprimera tous vos projets, transactions, allocations et rappels premium.\n" +
      "Vos données de la version gratuite (budgets, dépenses de base) resteront intactes."
    );
    if (ok) {
      try {
        await resetPremiumData();
        alert("Données premium réinitialisées avec succès !");
      } catch (err) {
        alert("Erreur lors de la réinitialisation : " + err.message);
      }
    }
  };

  const totalAllocated = projects.reduce((acc, p) => acc + parseFloat(p.current_amount || 0), 0);
  const remainingSavings = Math.max(0, parseFloat(financeSavings || 0) - totalAllocated);

  return (
    <div className="premium-profile-screen" style={{ padding: '24px 20px', maxWidth: '500px', margin: '0 auto', paddingBottom: '100px' }}>

      {/* Header section */}
      <div className="premium-profile-header" style={{ marginBottom: '28px' }}>
        <h2 className="font-heading" style={{ fontSize: '28px', color: 'var(--zenith-on-surface)', margin: '0 0 4px 0' }}>
          Profil
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--zenith-on-surface-variant)', margin: 0 }}>
          Personnalisez votre assistant financier haut de gamme.
        </p>
      </div>


      {/* Downgrade Action */}
      <div className="premium-card premium-profile-mode-card" style={{
        padding: '20px',
        border: '1px solid rgba(239, 68, 68, 0.15)',
        backgroundColor: 'rgba(239, 68, 68, 0.02)',
        marginBottom: '28px'
      }}>
        <h4 className="font-heading" style={{ fontSize: '14px', color: 'var(--zenith-status-alert)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogOut size={16} />
          Retourner au mode standard
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--zenith-on-surface-variant)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
          Le passage en mode gratuit conservera vos projets mais supprimera les fonctionnalités d'allocation automatique séquentielle, de matelas de protection et les rapports de suivi détaillé.
        </p>
        <button
          onClick={() => onSwitchMode('free')}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'transparent',
            border: '1.5px solid var(--zenith-status-alert)',
            color: 'var(--zenith-status-alert)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontFamily: 'var(--font-headings)',
            fontSize: '12px',
            fontWeight: 700,
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Repasser en mode Gratuit
        </button>
      </div>

      {/* Financial Profile Summary */}
      <div className="premium-card premium-profile-summary-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h4 className="font-heading" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color="var(--zenith-primary-container)" />
          Résumé de votre profil financier
        </h4>
        <div className="premium-profile-summary-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="premium-profile-summary-item" style={{ backgroundColor: 'var(--zenith-bg)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>Épargne totale</span>
            <span className="font-data" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', fontWeight: 800 }}>
              {parseFloat(financeSavings || 0).toLocaleString()} {currencyCode}
            </span>
          </div>
          <div className="premium-profile-summary-item" style={{ backgroundColor: 'var(--zenith-bg)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>Revenu de base</span>
            <span className="font-data" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', fontWeight: 800 }}>
              {parseFloat(freeSalary || 0).toLocaleString()} {currencyCode}
            </span>
          </div>
          <div className="premium-profile-summary-item" style={{ backgroundColor: 'var(--zenith-bg)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>Fonds alloués</span>
            <span className="font-data" style={{ fontSize: '15px', color: 'var(--zenith-secondary)', fontWeight: 800 }}>
              {totalAllocated.toLocaleString()} {currencyCode}
            </span>
          </div>
          <div className="premium-profile-summary-item" style={{ backgroundColor: 'var(--zenith-bg)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>Fonds libres</span>
            <span className="font-data" style={{ fontSize: '15px', color: 'var(--zenith-accent-gold)', fontWeight: 800 }}>
              {remainingSavings.toLocaleString()} {currencyCode}
            </span>
          </div>
        </div>
      </div>

      {/* Coaching Preferences */}
      <div className="premium-card premium-profile-preferences-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h4 className="font-heading" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} color="var(--zenith-primary-container)" />
          Préférences d'accompagnement
        </h4>

        {/* Tone Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--zenith-on-surface-variant)', display: 'block', marginBottom: '8px' }}>
            Ton du Coach
          </label>
          <select
            value={coachingTone}
            onChange={(e) => setCoachingTone(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--zenith-outline-variant)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: 'var(--zenith-on-surface)',
              backgroundColor: 'var(--zenith-surface)',
              cursor: 'pointer'
            }}
          >
            <option value="pedagogic">Pédagogique et Bienveillant</option>
            <option value="direct">Direct et Factuel</option>
            <option value="ambitious">Ambitieux et Énergique</option>
          </select>
        </div>

        {/* Strategy Selector */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--zenith-on-surface-variant)', display: 'block', marginBottom: '8px' }}>
            Stratégie Dominante
          </label>
          <select
            value={dominantStrategy}
            onChange={(e) => setDominantStrategy(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--zenith-outline-variant)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: 'var(--zenith-on-surface)',
              backgroundColor: 'var(--zenith-surface)',
              cursor: 'pointer'
            }}
          >
            <option value="balanced">Progression équilibrée (Recommandé)</option>
            <option value="focused">Focus sur le projet le plus urgent</option>
            <option value="security">Sécurité maximale (Coussin de réserve élevé)</option>
          </select>
        </div>
      </div>

      {/* Smart Parameters & Switches */}
      <div className="premium-card premium-profile-settings-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h4 className="font-heading" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="var(--zenith-primary-container)" />
          Paramètres intelligents
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Switch 1 */}
          <div className="premium-profile-switch-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="premium-profile-switch-text">
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--zenith-on-surface)', display: 'block' }}>
                Surveiller le matelas de sécurité
              </span>
              <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)' }}>
                Alerter si l'épargne non allouée descend sous 25%
              </span>
            </div>
            <input
              type="checkbox"
              checked={securityMat}
              onChange={(e) => setSecurityMat(e.target.checked)}
              style={{ width: '36px', height: '20px', cursor: 'pointer' }}
            />
          </div>

          {/* Switch 2 */}
          <div className="premium-profile-switch-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--zenith-outline-variant)' }}>
            <div className="premium-profile-switch-text">
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--zenith-on-surface)', display: 'block' }}>
                Analyses périodiques automatiques
              </span>
              <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)' }}>
                Diligence de nouveaux conseils à chaque connexion
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoAnalysis}
              onChange={(e) => setAutoAnalysis(e.target.checked)}
              style={{ width: '36px', height: '20px', cursor: 'pointer' }}
            />
          </div>

        </div>
      </div>

      {/* Premium Reminders Section */}
      <div className="premium-card premium-profile-reminders-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div
          className="premium-profile-reminders-toggle"
          onClick={() => setExpandedReminders(!expandedReminders)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <h4 className="font-heading" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--zenith-primary-container)" />
            Rappels & Notifications
          </h4>
          {expandedReminders ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>

        {expandedReminders && (
          <div style={{ marginTop: '16px' }}>
            {/* Permission status and test button */}
            <div className="premium-profile-notification-row" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--zenith-bg)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px'
            }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--zenith-on-surface)', display: 'block' }}>
                  Notifications Système
                </span>
                <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)' }}>
                  Vérifier l'accès navigateur
                </span>
              </div>
              <button
                onClick={handleTestNotification}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--zenith-outline-variant)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Bell size={12} />
                Tester
              </button>
            </div>

            {/* Form to add a new reminder */}
            <form className="premium-profile-reminder-form" onSubmit={handleCreateReminder} style={{
              backgroundColor: 'var(--zenith-bg)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              border: '1px solid var(--zenith-outline-variant)'
            }}>
              <h5 style={{ fontSize: '12px', fontWeight: 800, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Créer un nouveau rappel
              </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--zenith-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
                    Titre du rappel
                  </label>
                  <input
                    type="text"
                    required
                    value={remForm.title}
                    onChange={(e) => setRemForm({ ...remForm, title: e.target.value })}
                    placeholder="Ex: Réviser le budget Maison"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--zenith-outline-variant)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      backgroundColor: 'var(--zenith-surface)'
                    }}
                  />
                </div>

                <div className="premium-profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--zenith-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
                      Concerne... (Type)
                    </label>
                    <select
                      value={remForm.type}
                      onChange={(e) => setRemForm({ ...remForm, type: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid var(--zenith-outline-variant)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        backgroundColor: 'var(--zenith-surface)'
                      }}
                    >
                      <option value="project">Un projet</option>
                      <option value="milestone">Une étape de projet</option>
                      <option value="deadline">Une échéance</option>
                      <option value="financial">Une action financière</option>
                      <option value="priority">Une priorité à revoir</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--zenith-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
                      Fréquence
                    </label>
                    <select
                      value={remForm.frequency}
                      onChange={(e) => setRemForm({ ...remForm, frequency: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid var(--zenith-outline-variant)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        backgroundColor: 'var(--zenith-surface)'
                      }}
                    >
                      <option value="once">Une seule fois</option>
                      <option value="daily">Quotidien</option>
                      <option value="weekly">Hebdomadaire</option>
                    </select>
                  </div>
                </div>

                {/* Target Project Selection */}
                {(remForm.type === 'project' || remForm.type === 'milestone') && projects.length > 0 && (
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--zenith-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
                      Projet associé
                    </label>
                    <select
                      value={remForm.targetId}
                      onChange={(e) => setRemForm({ ...remForm, targetId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid var(--zenith-outline-variant)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        backgroundColor: 'var(--zenith-surface)'
                      }}
                    >
                      <option value="">Sélectionner un projet...</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Conditional Fields based on frequency */}
                <div className="premium-profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {remForm.frequency === 'once' && (
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--zenith-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
                        Date
                      </label>
                      <input
                        type="date"
                        required
                        value={remForm.date}
                        onChange={(e) => setRemForm({ ...remForm, date: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          border: '1px solid var(--zenith-outline-variant)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '12px',
                          backgroundColor: 'var(--zenith-surface)'
                        }}
                      />
                    </div>
                  )}

                  {remForm.frequency === 'weekly' && (
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--zenith-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
                        Jour
                      </label>
                      <select
                        value={remForm.day}
                        onChange={(e) => setRemForm({ ...remForm, day: Number(e.target.value) })}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid var(--zenith-outline-variant)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '12px',
                          backgroundColor: 'var(--zenith-surface)'
                        }}
                      >
                        <option value={1}>Lundi</option>
                        <option value={2}>Mardi</option>
                        <option value={3}>Mercredi</option>
                        <option value={4}>Jeudi</option>
                        <option value={5}>Vendredi</option>
                        <option value={6}>Samedi</option>
                        <option value={0}>Dimanche</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--zenith-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
                      Heure
                    </label>
                    <input
                      type="time"
                      required
                      value={remForm.time}
                      onChange={(e) => setRemForm({ ...remForm, time: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        border: '1px solid var(--zenith-outline-variant)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        backgroundColor: 'var(--zenith-surface)'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--zenith-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
                    Note / Message
                  </label>
                  <textarea
                    value={remForm.description}
                    onChange={(e) => setRemForm({ ...remForm, description: e.target.value })}
                    placeholder="Message qui s'affichera lors du rappel"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--zenith-outline-variant)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      backgroundColor: 'var(--zenith-surface)',
                      resize: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '10px',
                    backgroundColor: 'var(--zenith-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '4px'
                  }}
                >
                  <Plus size={14} />
                  Enregistrer le rappel
                </button>
              </div>
            </form>

            {/* List of current reminders */}
            <div>
              <h5 style={{ fontSize: '12px', fontWeight: 800, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Mes rappels actifs ({reminders.length})
              </h5>

              {reminders.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--zenith-on-surface-variant)', fontStyle: 'italic', margin: '10px 0' }}>
                  Aucun rappel personnalisé configuré.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {reminders.map(rem => {
                    const daysMap = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                    const freqText = rem.frequency === 'once' ? `Le ${new Date(rem.date).toLocaleDateString()}` :
                      rem.frequency === 'weekly' ? `Chaque ${daysMap[rem.day]}` : 'Chaque jour';

                    const badgeColors = {
                      project: { bg: 'rgba(6,182,212,0.1)', text: 'var(--zenith-data-complex)' },
                      milestone: { bg: 'rgba(139,92,246,0.1)', text: 'var(--zenith-data-complex)' },
                      deadline: { bg: 'rgba(239,68,68,0.1)', text: 'var(--zenith-status-alert)' },
                      financial: { bg: 'rgba(16,185,129,0.1)', text: 'var(--zenith-secondary)' },
                      priority: { bg: 'rgba(245,158,11,0.1)', text: 'var(--zenith-accent-gold)' }
                    };

                    const badge = badgeColors[rem.type] || { bg: 'rgba(100,116,139,0.1)', text: 'gray' };

                    return (
                      <div key={rem.id} style={{
                        border: '1px solid var(--zenith-outline-variant)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px',
                        backgroundColor: rem.enabled ? 'var(--zenith-surface)' : 'var(--zenith-bg)',
                        opacity: rem.enabled ? 1 : 0.6,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ flex: 1, paddingRight: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--zenith-on-surface)' }}>
                              {rem.title}
                            </span>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              backgroundColor: badge.bg,
                              color: badge.text,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              textTransform: 'uppercase'
                            }}>
                              {rem.type === 'project' ? 'Projet' :
                                rem.type === 'milestone' ? 'Étape' :
                                  rem.type === 'deadline' ? 'Échéance' :
                                    rem.type === 'financial' ? 'Finances' : 'Priorité'}
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>
                            {freqText} à {rem.time}
                          </span>
                          {rem.description && (
                            <span style={{ fontSize: '11px', color: 'gray', display: 'block', fontStyle: 'italic', marginTop: '4px' }}>
                              Note : {rem.description}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="checkbox"
                            checked={rem.enabled}
                            onChange={() => toggleReminder(rem.id)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                          <button
                            onClick={() => deleteReminder(rem.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--zenith-status-alert)',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cloud Synchronization and Security */}
      <div className="premium-card premium-profile-sync-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h4 className="font-heading" style={{ fontSize: '15px', color: 'var(--zenith-on-surface)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="var(--zenith-secondary)" />
          Sécurité & Synchronisation
        </h4>
        <div className="premium-profile-sync-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="premium-profile-sync-text">
            <span style={{ fontSize: '12px', color: 'var(--zenith-on-surface-variant)', display: 'block' }}>
              Base de données chiffrée
            </span>
            <span style={{ fontSize: '11px', color: 'var(--zenith-secondary)', fontWeight: 600 }}>
              Statut : Protégé par Supabase
            </span>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--zenith-primary-container)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Synchronisation...' : 'Synchroniser'}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="premium-card premium-profile-danger-card" style={{
        padding: '20px',
        marginBottom: '28px',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        backgroundColor: 'rgba(239, 68, 68, 0.03)'
      }}>
        <h4 className="font-heading" style={{ fontSize: '15px', color: 'var(--zenith-status-alert)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} color="var(--zenith-status-alert)" />
          Zone de Danger (Premium)
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--zenith-on-surface-variant)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
          La réinitialisation premium effacera tous vos projets de vie, jalons, allocations d'épargne et transactions de la version premium. Vos données de la version gratuite resteront intactes.
        </p>
        <button
          onClick={handleResetPremium}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'var(--zenith-status-alert)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontFamily: 'var(--font-headings)',
            fontSize: '12px',
            fontWeight: 800,
            transition: 'opacity 0.2s',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          Réinitialiser les données Premium
        </button>
      </div>

    </div>
  );
};

export default Profile;
