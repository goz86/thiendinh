export const toggleReminderSetting = (enabled: boolean, timeString: string) => {
  localStorage.setItem('mindful-reminder-enabled', enabled ? 'true' : 'false');
  localStorage.setItem('mindful-reminder-time', timeString); // format "HH:mm"
};

export const getReminderSetting = () => {
  const enabled = localStorage.getItem('mindful-reminder-enabled') === 'true';
  const time = localStorage.getItem('mindful-reminder-time') || '06:00';
  return { enabled, time };
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Check if a reminder should be triggered now
export const checkAndTriggerReminder = async () => {
  const { enabled, time } = getReminderSetting();
  if (!enabled || !time) return;

  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create a Date object for today's reminder time
  const reminderTime = new Date();
  reminderTime.setHours(hours, minutes, 0, 0);

  const lastTriggered = localStorage.getItem('mindful-last-reminder-date');
  const todayStr = now.toDateString();

  // If already triggered today, skip
  if (lastTriggered === todayStr) return;

  // If current time is past the reminder time (within a 1 hour window)
  const diffMs = now.getTime() - reminderTime.getTime();
  if (diffMs >= 0 && diffMs < 3600000) {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('Đã đến giờ thiền 🌿', {
          body: 'Hãy dành vài phút để hít thở chánh niệm và tìm lại sự bình yên.',
          icon: '/icon512_maskable.png',
          badge: '/icon512_maskable.png',
          // @ts-ignore
          vibrate: [200, 100, 200],
          tag: 'mindful-daily-reminder', // prevents duplicate notifications
          data: { url: '/' }
        });
        localStorage.setItem('mindful-last-reminder-date', todayStr);
      }
    } catch (e) {
      console.error('Lỗi khi gửi thông báo:', e);
    }
  }
};

export const startReminderCheckLoop = () => {
  // Check immediately
  void checkAndTriggerReminder();
  
  // Then check every minute
  return window.setInterval(() => {
    void checkAndTriggerReminder();
  }, 60000);
};
