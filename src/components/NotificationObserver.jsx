import React, { useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { NotificationService } from '../NotificationService';

const NotificationObserver = () => {
  const { lastActivity } = useFinance();

  useEffect(() => {
    // Check on mount
    const checkActivity = () => {
      const last = new Date(lastActivity).getTime();
      const now = new Date().getTime();
      const diffInHours = (now - last) / (1000 * 60 * 60);

      // If more than 24 hours since last activity
      if (diffInHours > 24) {
        NotificationService.sendNotification(
          "Dudukan vous manque !",
          "N'oubliez pas d'enregistrer vos transactions du jour pour garder le contrôle sur votre budget."
        );
      }
    };

    // Delay a bit to not spam on load
    const timer = setTimeout(checkActivity, 5000);
    
    // Also try to schedule background sync
    NotificationService.scheduleReminderIfPossible();

    return () => clearTimeout(timer);
  }, [lastActivity]);

  return null;
};

export default NotificationObserver;
