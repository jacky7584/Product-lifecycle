import { Capacitor } from '@capacitor/core'

type CacheEntry<T> = {
  data: T
  timestamp: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function getCachedData<T>(key: string): Promise<T | null> {
  if (!Capacitor.isNativePlatform()) return null
  const { Preferences } = await import('@capacitor/preferences')
  const { value } = await Preferences.get({ key: `cache_${key}` })
  if (!value) return null
  try {
    const entry: CacheEntry<T> = JSON.parse(value)
    if (Date.now() - entry.timestamp > CACHE_TTL) return null
    return entry.data
  } catch {
    return null
  }
}

async function setCachedData<T>(key: string, data: T): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const { Preferences } = await import('@capacitor/preferences')
  const entry: CacheEntry<T> = { data, timestamp: Date.now() }
  await Preferences.set({ key: `cache_${key}`, value: JSON.stringify(entry) })
}

export async function isOnline(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return navigator.onLine
  const { Network } = await import('@capacitor/network')
  const status = await Network.getStatus()
  return status.connected
}

export async function fetchWithCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
): Promise<{ data: T; isOffline: boolean }> {
  const online = await isOnline()
  if (online) {
    try {
      const data = await fetchFn()
      await setCachedData(cacheKey, data)
      return { data, isOffline: false }
    } catch {
      const cached = await getCachedData<T>(cacheKey)
      if (cached) return { data: cached, isOffline: true }
      throw new Error('No cached data available')
    }
  }
  const cached = await getCachedData<T>(cacheKey)
  if (cached) return { data: cached, isOffline: true }
  throw new Error('No cached data available and device is offline')
}
