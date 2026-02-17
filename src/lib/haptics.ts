import { Capacitor } from '@capacitor/core'

type HapticStyle = 'light' | 'medium' | 'heavy'

export async function hapticImpact(style: HapticStyle = 'medium'): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
  const styleMap = {
    light: ImpactStyle.Light,
    medium: ImpactStyle.Medium,
    heavy: ImpactStyle.Heavy,
  } as const
  await Haptics.impact({ style: styleMap[style] })
}

export async function hapticNotification(type: 'success' | 'warning' | 'error' = 'success'): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const { Haptics, NotificationType } = await import('@capacitor/haptics')
  const typeMap = {
    success: NotificationType.Success,
    warning: NotificationType.Warning,
    error: NotificationType.Error,
  } as const
  await Haptics.notification({ type: typeMap[type] })
}

export async function hapticSelection(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const { Haptics } = await import('@capacitor/haptics')
  await Haptics.selectionStart()
  await Haptics.selectionChanged()
  await Haptics.selectionEnd()
}
