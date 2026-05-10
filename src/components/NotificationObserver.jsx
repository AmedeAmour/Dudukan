import React, { useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { NotificationService } from '../NotificationService';

const NotificationObserver = () => {
  const { notificationTime, lastNotifiedDate, setLastNotifiedDate } = useFinance();

  useEffect(() => {
    // Check if we should notify
    const checkTime = () => {
      if (!notificationTime) return;

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      const [targetHour, targetMinute] = notificationTime.split(':').map(Number);
      
      // Get current date string (YYYY-MM-DD) to check if we already notified today
      const todayStr = now.toISOString().split('T')[0];

      if (lastNotifiedDate !== todayStr) {
        // If current time is past the target time (within a reasonable 1-hour window to catch them if they open app slightly late)
        // Or if we check every minute and it's exactly the time
        const nowMinutes = currentHour * 60 + currentMinute;
        const targetMinutes = targetHour * 60 + targetMinute;

        if (nowMinutes >= targetMinutes && nowMinutes <= targetMinutes + 60) {
          NotificationService.sendNotification(
            "C'est l'heure de faire les comptes !",
            "N'oubliez pas d'enregistrer vos transactions du jour sur Dudukan."
          );
          setLastNotifiedDate(todayStr);
        }
      }
    };

    // Check immediately on mount
    checkTime();

    // Then check every minute
    const interval = setInterval(checkTime, 60000);
    
    // Also try to schedule background sync (this handles when app is closed, if supported)
    NotificationService.scheduleReminderIfPossible();

    return () => clearInterval(interval);
  }, [notificationTime, lastNotifiedDate, setLastNotifiedDate]);

  return null;
};

export default NotificationObserver;
