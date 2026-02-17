import { Capacitor } from '@capacitor/core'

export async function initPush(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null

  const { PushNotifications } = await import('@capacitor/push-notifications')

  const permResult = await PushNotifications.requestPermissions()
  if (permResult.receive !== 'granted') {
    console.warn('Push notification permission not granted')
    return null
  }

  await PushNotifications.register()

  return new Promise((resolve) => {
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration token:', token.value)
      resolve(token.value)
    })

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error)
      resolve(null)
    })
  })
}

export async function setupPushListeners(
  onReceived: (notification: { title?: string; body?: string; data?: Record<string, unknown> }) => void,
  onTapped: (data: Record<string, unknown>) => void,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  const { PushNotifications } = await import('@capacitor/push-notifications')

  await PushNotifications.addListener('pushNotificationReceived', (notification) => {
    onReceived({
      title: notification.title,
      body: notification.body,
      data: notification.data as Record<string, unknown>,
    })
  })

  await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    onTapped((action.notification.data as Record<string, unknown>) || {})
  })
}
