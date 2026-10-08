/** US-59: permissão só é pedida por ação explícita — nunca ao carregar a página (RN-01). */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  return isNotificationSupported() ? Notification.permission : 'unsupported'
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied'
  }
  return Notification.requestPermission()
}

/** Silenciosa se a permissão não foi concedida (CA-002) — nunca lança erro. */
export function showSessionNotification(title: string, body: string): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return
  }
  new Notification(title, { body })
}
