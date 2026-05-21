import React from 'react';
import {
  Download,
  Bell,
  Trash2,
  Calendar,
  CheckCircle,
  Sparkles,
  Plus,
  Settings,
  Wallet,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { NotificationService } from '../../NotificationService';

export const PremiumActions = ({ onDownloadReport }) => {
  const { resetData, notificationSchedule, setNotificationSchedule } = useFinance();

  const handleTestNotification = async () => {
    const granted = await NotificationService.requestPermission();
    if (granted) {
      NotificationService.sendNotification('Test Notification', 'Ceci est une notification de test depuis Dudukan Premium.');
      alert('Notification de test envoyée !');
    } else {
      alert('Permission de notification refusée.');
    }
  };

  const handleReset = () => {
    if (window.confirm('Voulez‑vous vraiment réinitialiser toutes les données ?')) {
      resetData();
      alert('Toutes les données ont été réinitialisées.');
    }
  };

  const toggleDay = (idx) => {
    const newSched = [...notificationSchedule];
    newSched[idx].enabled = !newSched[idx].enabled;
    setNotificationSchedule(newSched);
  };

  return (
    <div className="premium-actions">
      {/* Download PDF */}
      <div className="action-card">
        <div className="icon-wrapper" style={{ background: 'rgba(16,185,129,0.1)' }}>
          <Download size={20} color="var(--zenith-accent-emerald)" />
        </div>
        <div className="content">
          <h4>📄 Télécharger le rapport (PDF)</h4>
          <p>Générez et téléchargez votre rapport financier.</p>
          <button onClick={onDownloadReport} className="action-btn">Générer le PDF</button>
        </div>
      </div>

      {/* Test Notification */}
      <div className="action-card">
        <div className="icon-wrapper" style={{ background: 'rgba(59,130,246,0.1)' }}>
          <Bell size={20} color="var(--zenith-accent-blue)" />
        </div>
        <div className="content">
          <h4>🔔 Tester les notifications</h4>
          <p>Envoyez une notification de test pour vérifier les réglages.</p>
          <button onClick={handleTestNotification} className="action-btn">Envoyer le test</button>
        </div>
      </div>

      {/* Reset Data */}
      <div className="action-card">
        <div className="icon-wrapper" style={{ background: 'rgba(236,72,153,0.1)' }}>
          <Trash2 size={20} color="var(--zenith-accent-pink)" />
        </div>
        <div className="content">
          <h4>🗑️ Réinitialiser toutes les données</h4>
          <p>Supprimez toutes les données locales et recommencez à zéro.</p>
          <button onClick={handleReset} className="action-btn danger">Tout réinitialiser</button>
        </div>
      </div>

      {/* Planning des rappels */}
      <div className="action-card">
        <div className="icon-wrapper" style={{ background: 'rgba(255,165,0,0.1)' }}>
          <Calendar size={20} color="var(--zenith-accent-orange)" />
        </div>
        <div className="content">
          <h4>🗓️ Planning des rappels</h4>
          <p>Activez ou désactivez les jours de rappel.</p>
          <div className="schedule-list">
            {notificationSchedule.map((s, i) => (
              <label key={s.day} className="schedule-item">
                <input type="checkbox" checked={s.enabled} onChange={() => toggleDay(i)} />
                <span>{s.label} – {s.time}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
