
export const NotificationService = {
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('Ce navigateur ne supporte pas les notifications.');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async sendNotification(title, body) {
    if (Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        registration.showNotification(title, {
          body,
          icon: '/sampa-electro.png',
          badge: '/favicon.svg',
          vibrate: [100, 50, 100],
          data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
          }
        });
      } else {
        new Notification(title, { body, icon: '/sampa-electro.png' });
      }
    }
  },

  async scheduleReminderIfPossible() {
    // This is where we could use Periodic Sync if supported
    try {
      const registration = await navigator.serviceWorker.ready;
      if ('periodicSync' in registration) {
        const status = await navigator.permissions.query({
          name: 'periodic-background-sync',
        });

        if (status.state === 'granted') {
          await registration.periodicSync.register('remind-transaction', {
            minInterval: 24 * 60 * 60 * 1000, // 24 hours
          });
          console.log('Periodic sync registered');
        }
      }
    } catch (error) {
      console.log('Periodic sync registration failed:', error);
    }
  }
};
