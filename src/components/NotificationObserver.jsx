import React, { useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { NotificationService } from '../NotificationService';

const NotificationObserver = () => {
  const { notificationSchedule, lastNotifiedDate, setLastNotifiedDate } = useFinance();

  useEffect(() => {
    const checkTime = () => {
      if (!notificationSchedule || notificationSchedule.length === 0) return;

      const now = new Date();
      const currentDay = now.getDay(); // 0: Dim, 1: Lun, etc.
      const dayConfig = notificationSchedule.find(s => s.day === currentDay);

      if (!dayConfig || !dayConfig.enabled) return;

      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const [targetHour, targetMinute] = dayConfig.time.split(':').map(Number);
      
      const todayStr = now.toISOString().split('T')[0];

      if (lastNotifiedDate !== todayStr) {
        const nowMinutes = currentHour * 60 + currentMinute;
        const targetMinutes = targetHour * 60 + targetMinute;

        // On notifie si on est à l'heure ou dans la fenêtre de 30 minutes qui suit
        if (nowMinutes >= targetMinutes && nowMinutes <= targetMinutes + 30) {
          NotificationService.sendNotification(
            "C'est l'heure de faire les comptes !",
            "N'oubliez pas d'enregistrer vos transactions du jour sur Dudukan."
          );
          setLastNotifiedDate(todayStr);
        }
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    
    return () => clearInterval(interval);
  }, [notificationSchedule, lastNotifiedDate, setLastNotifiedDate]);

  return null;
};

export default NotificationObserver;
