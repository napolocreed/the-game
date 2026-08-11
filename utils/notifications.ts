// Notification helpers.
//
// On installed PWAs (notably Android), calling `new Notification(...)` from page
// context throws — notifications must go through the service worker registration.
// This helper prefers the service worker path and falls back to the constructor.

const ICON_URL = `${import.meta.env.BASE_URL}logo.png`;

export const notificationsSupported = (): boolean => 'Notification' in window;

export async function showAppNotification(title: string, body: string): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;

  const options: NotificationOptions = { body, icon: ICON_URL, badge: ICON_URL };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return;
      }
    }
  } catch (err) {
    console.warn('Service worker notification failed, falling back:', err);
  }

  try {
    new Notification(title, options);
  } catch (err) {
    console.error('Unable to display notification:', err);
  }
}
