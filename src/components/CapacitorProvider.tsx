'use client'

import { useEffect, type ReactNode } from 'react'
import { initializeCapacitor } from '@/lib/capacitor-init'

export default function CapacitorProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initializeCapacitor()
  }, [])

  return <>{children}</>
}
