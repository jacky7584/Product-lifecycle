'use client'

import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      const handleOffline = () => setOffline(true)
      const handleOnline = () => setOffline(false)
      window.addEventListener('offline', handleOffline)
      window.addEventListener('online', handleOnline)
      setOffline(!navigator.onLine)
      return () => {
        window.removeEventListener('offline', handleOffline)
        window.removeEventListener('online', handleOnline)
      }
    }

    let cleanup: (() => void) | undefined
    import('@capacitor/network').then(({ Network }) => {
      Network.getStatus().then((s) => setOffline(!s.connected))
      const handle = Network.addListener('networkStatusChange', (status) => {
        setOffline(!status.connected)
      })
      cleanup = () => {
        handle.then((h) => h.remove())
      }
    })
    return () => {
      cleanup?.()
    }
  }, [])

  if (!offline) return null

  return (
    <div className="bg-amber-100 text-amber-800 text-xs text-center py-1.5 px-4 font-medium dark:bg-amber-900 dark:text-amber-200">
      目前離線，顯示緩存資料
    </div>
  )
}
