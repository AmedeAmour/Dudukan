
export const NotificationService = {
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('Ce navigateur ne supporte pas les notifications.');
      return false;
    }
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission === 'granted';
  },

  async sendNotification(title, body) {
    // Ensure permission is granted before sending
    if (Notification.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn('Notification not sent: permission not granted');
        return;
      }
    }
    if (Notification.permission === 'granted') {
      try {
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
      } catch (e) {
        console.error('Error using service worker for notification:', e);
        // Fallback to simple Notification API
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
  },

  async scheduleNotification(title, body, timeString) {
    if (Notification.permission !== 'granted') return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const now = new Date();
      const [hours, minutes] = timeString.split(':').map(Number);
      let scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

      // If the time has already passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      // Check if showTrigger is supported (Experimental API for scheduled notifications)
      if ('showTrigger' in Notification.prototype) {
        await registration.showNotification(title, {
          body,
          icon: '/sampa-electro.png',
          badge: '/favicon.svg',
          showTrigger: new window.TimestampTrigger(scheduledTime.getTime())
        });
        console.log('Notification scheduled natively for', scheduledTime);
      } else {
        console.log('Native scheduled notifications not supported by this browser.');
      }
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }
};
