export function isNotificationSupported() {
  return 'Notification' in window;
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function notify(title, body) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  new Notification(title, { body });
}
