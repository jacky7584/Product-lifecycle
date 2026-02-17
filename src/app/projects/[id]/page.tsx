'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import KanbanBoard from '@/components/KanbanBoard'
import TicketFormModal from '@/components/TicketFormModal'
import type { ProjectWithTickets } from '@/types'

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<ProjectWithTickets | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewTicket, setShowNewTicket] = useState(false)

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) {
        setError('找不到此項目')
        return
      }
      const data = await res.json()
      setProject(data)
    } catch {
      setError('載入項目失敗')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  const handleRefresh = useCallback(() => {
    fetchProject()
  }, [fetchProject])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-border-brand-subtle border-t-bg-brand rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-text-tertiary mb-2">{error || '找不到此項目'}</p>
        <Link href="/dashboard" className="text-sm text-text-brand hover:text-text-brand font-medium focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 rounded-md">
          返回項目列表
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-text-tertiary hover:text-text-secondary transition-colors p-2 focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 rounded-md"
            aria-label="返回項目列表"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">{project.name}</h1>
        </div>
        <button
          onClick={() => setShowNewTicket(true)}
          className="px-4 py-2 text-sm font-medium text-text-onbrand bg-bg-brand rounded-md hover:bg-bg-brand-compliment transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 cursor-pointer"
        >
          新增工單
        </button>
      </div>

      {project.description && (
        <p className="text-text-tertiary mb-6">{project.description}</p>
      )}

      <KanbanBoard tickets={project.tickets} projectId={project.id} onRefresh={handleRefresh} />

      <TicketFormModal
        open={showNewTicket}
        onClose={() => setShowNewTicket(false)}
        onSaved={handleRefresh}
        projectId={project.id}
      />
    </>
  )
}
