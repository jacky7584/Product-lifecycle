import { Capacitor } from '@capacitor/core'

export async function initializeCapacitor(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  const { StatusBar, Style } = await import('@capacitor/status-bar')
  await StatusBar.setStyle({ style: Style.Dark })

  const { SplashScreen } = await import('@capacitor/splash-screen')
  await SplashScreen.hide()
}
