'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { initPush, setupPushListeners } from '@/lib/push'

export default function PushSetup() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) return

    let mounted = true

    async function setup() {
      const token = await initPush()
      if (token && mounted) {
        // Device token obtained — backend push API can be implemented later
        console.log('Device push token registered:', token)
      }

      await setupPushListeners(
        (notification) => {
          console.log('Push received in foreground:', notification)
        },
        (data) => {
          if (data.projectId) {
            router.push(`/projects/${data.projectId}`)
          } else {
            router.push('/dashboard')
          }
        },
      )
    }

    setup()
    return () => {
      mounted = false
    }
  }, [user, router])

  return null
}
