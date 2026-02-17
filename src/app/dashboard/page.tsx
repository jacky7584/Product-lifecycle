'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import ProjectCard, { type ProjectSummary } from '@/components/ProjectCard'
import CreateProjectDialog from '@/components/CreateProjectDialog'
import { apiFetch } from '@/lib/api'
import { Priority } from '@/types'

type DashboardTicket = {
  id: string
  title: string
  priority: Priority
  dueDate: string | null
  stage: string
  project: { id: string; name: string }
}

type DashboardData = {
  overdue: DashboardTicket[]
  todayDue: DashboardTicket[]
  upcoming: DashboardTicket[]
}

const PRIORITY_DOT: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-green-500',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function TaskRow({ ticket }: { ticket: DashboardTicket }) {
  return (
    <Link
      href={`/projects/${ticket.project.id}`}
      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-bg-secondary transition-colors group"
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[ticket.priority] || PRIORITY_DOT.MEDIUM}`} />
      <span className="flex-1 text-sm text-text-primary truncate">{ticket.title}</span>
      <span className="text-xs text-text-tertiary shrink-0">{ticket.project.name}</span>
      {ticket.dueDate && (
        <span className="text-xs text-text-tertiary shrink-0">{formatDate(ticket.dueDate)}</span>
      )}
    </Link>
  )
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [projRes, dashRes] = await Promise.all([
        apiFetch('/api/projects'),
        apiFetch('/api/dashboard'),
      ])
      if (projRes.ok) {
        const data = await projRes.json()
        setProjects(data)
      }
      if (dashRes.ok) {
        const data = await dashRes.json()
        setDashboard(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const hasOverview = dashboard && (dashboard.overdue.length > 0 || dashboard.todayDue.length > 0 || dashboard.upcoming.length > 0)

  return (
    <>
      {/* Today overview */}
      {!loading && hasOverview && (
        <div className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">今日概覽</h2>

          {dashboard.overdue.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-red-500 mb-1">
                逾期 ({dashboard.overdue.length})
              </h3>
              <div className="bg-bg-default rounded-lg border border-red-200 divide-y divide-border-subtle">
                {dashboard.overdue.map((t) => (
                  <TaskRow key={t.id} ticket={t} />
                ))}
              </div>
            </div>
          )}

          {dashboard.todayDue.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-orange-500 mb-1">
                今日到期 ({dashboard.todayDue.length})
              </h3>
              <div className="bg-bg-default rounded-lg border border-orange-200 divide-y divide-border-subtle">
                {dashboard.todayDue.map((t) => (
                  <TaskRow key={t.id} ticket={t} />
                ))}
              </div>
            </div>
          )}

          {dashboard.upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-1">
                即將到期 ({dashboard.upcoming.length})
              </h3>
              <div className="bg-bg-default rounded-lg border border-border-primary divide-y divide-border-subtle">
                {dashboard.upcoming.map((t) => (
                  <TaskRow key={t.id} ticket={t} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Projects list */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">清單列表</h1>
        <button
          onClick={() => setDialogOpen(true)}
          className="px-4 py-2 text-sm font-medium text-text-onbrand bg-bg-brand rounded-md hover:bg-bg-brand-compliment transition-colors min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
        >
          新建清單
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-border-brand-subtle border-t-bg-brand rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-bg-default rounded-lg border-2 border-dashed border-border-primary">
          <p className="text-text-tertiary mb-2">尚無清單</p>
          <button
            onClick={() => setDialogOpen(true)}
            className="text-sm text-text-brand hover:text-text-brand font-medium cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
          >
            建立第一個清單
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onDeleted={fetchData} />
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={fetchData}
      />
    </>
  )
}
