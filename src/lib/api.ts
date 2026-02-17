'use client'

import { Capacitor } from '@capacitor/core'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

let tokenInMemory: string | null = null

async function getAuthToken(): Promise<string | null> {
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    const { Preferences } = await import('@capacitor/preferences')
    const { value } = await Preferences.get({ key: 'auth_token' })
    return value
  }
  return tokenInMemory
}

export async function setAuthToken(token: string): Promise<void> {
  tokenInMemory = token
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.set({ key: 'auth_token', value: token })
  }
}

export async function clearAuthToken(): Promise<void> {
  tokenInMemory = null
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.remove({ key: 'auth_token' })
  }
}

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const token = await getAuthToken()
  const headers = new Headers(options?.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(url, { ...options, headers, credentials: 'include' })
}
