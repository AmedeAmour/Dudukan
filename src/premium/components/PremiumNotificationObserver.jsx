import React, { useEffect, useState } from 'react';
import { usePremium } from '../context/PremiumContext';
import { NotificationService } from '../../NotificationService';

const PremiumNotificationObserver = () => {
  const { reminders } = usePremium();
  const [lastNotifiedTimes, setLastNotifiedTimes] = useState({});

  useEffect(() => {
    const checkPremiumReminders = () => {
      if (!reminders || reminders.length === 0) return;

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDay = now.getDay(); // 0: Dim, 1: Lun, etc.

      reminders.forEach(reminder => {
        if (!reminder.enabled) return;

        // Check if we already notified this reminder today/this hour
        const notifiedKey = `${reminder.id}_${todayStr}`;
        if (lastNotifiedTimes[notifiedKey]) return;

        const [rHour, rMinute] = reminder.time.split(':').map(Number);
        const nowMinutes = currentHour * 60 + currentMinute;
        const targetMinutes = rHour * 60 + rMinute;

        // Verify if we are within the notification window (up to 30 mins after scheduled time)
        const isTimeMatch = nowMinutes >= targetMinutes && nowMinutes <= targetMinutes + 30;
        if (!isTimeMatch) return;

        let shouldNotify = false;

        if (reminder.frequency === 'once' && reminder.date === todayStr) {
          shouldNotify = true;
        } else if (reminder.frequency === 'daily') {
          shouldNotify = true;
        } else if (reminder.frequency === 'weekly' && Number(reminder.day) === currentDay) {
          shouldNotify = true;
        }

        if (shouldNotify) {
          NotificationService.sendNotification(
            reminder.title,
            reminder.description || "Rappel Dudukan Premium"
          );
          setLastNotifiedTimes(prev => ({ ...prev, [notifiedKey]: true }));
        }
      });
    };

    checkPremiumReminders();
    const interval = setInterval(checkPremiumReminders, 60000);
    return () => clearInterval(interval);
  }, [reminders, lastNotifiedTimes]);

  return null;
};

export default PremiumNotificationObserver;
