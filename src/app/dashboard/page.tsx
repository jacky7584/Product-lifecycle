'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import ProjectCard, { type ProjectSummary } from '@/components/ProjectCard'
import CreateProjectDialog from '@/components/CreateProjectDialog'
import { apiFetch } from '@/lib/api'
import { Priority } from '@/types'
import gsap from 'gsap'
import { useGsapCounter } from '@/hooks/useGsap'
import StarBorder from '@/components/StarBorder'
import AnimatedList from '@/components/AnimatedList'

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

  const pageRef = useRef<HTMLDivElement>(null)
  const overviewRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

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

  // Single animation: reveal entire page after data loads
  useEffect(() => {
    if (loading || hasAnimated.current) return
    hasAnimated.current = true

    const el = pageRef.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.opacity = '1'
      return
    }

    const ctx = gsap.context(() => {
      // Reveal the page wrapper
      gsap.fromTo(el,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      )

      // Stagger overview sections
      if (overviewRef.current) {
        const sections = overviewRef.current.children
        gsap.fromTo(sections,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1, delay: 0.2 }
        )
      }

      // Stagger project cards
      if (gridRef.current) {
        const cards = gridRef.current.children
        gsap.fromTo(cards,
          { opacity: 0, y: 30, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power2.out', stagger: 0.08, delay: 0.3 }
        )
      }
    }, el)

    return () => ctx.revert()
  }, [loading])

  const hasOverview = dashboard && (dashboard.overdue.length > 0 || dashboard.todayDue.length > 0 || dashboard.upcoming.length > 0)

  // Counter refs for overview counts
  const overdueCountRef = useGsapCounter(dashboard?.overdue.length ?? 0, [loading])
  const todayCountRef = useGsapCounter(dashboard?.todayDue.length ?? 0, [loading])
  const upcomingCountRef = useGsapCounter(dashboard?.upcoming.length ?? 0, [loading])

  return (
    <div ref={pageRef} style={{ opacity: 0 }}>
      {/* Today overview */}
      {!loading && hasOverview && (
        <div ref={overviewRef} className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">今日概覽</h2>

          {dashboard.overdue.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-red-500 mb-1">
                逾期 (<span ref={overdueCountRef}>{dashboard.overdue.length}</span>)
              </h3>
              <AnimatedList
                items={dashboard.overdue.map((t) => `${t.title} — ${t.project.name}`)}
                onItemSelect={(_, i) => {
                  const t = dashboard.overdue[i]
                  if (t) window.location.href = `/projects/${t.project.id}`
                }}
                showGradients={false}
                enableArrowNavigation={false}
                className="!w-full"
                itemClassName="!bg-bg-default border border-red-200 !rounded-lg"
                displayScrollbar={false}
              />
            </div>
          )}

          {dashboard.todayDue.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-orange-500 mb-1">
                今日到期 (<span ref={todayCountRef}>{dashboard.todayDue.length}</span>)
              </h3>
              <AnimatedList
                items={dashboard.todayDue.map((t) => `${t.title} — ${t.project.name}`)}
                onItemSelect={(_, i) => {
                  const t = dashboard.todayDue[i]
                  if (t) window.location.href = `/projects/${t.project.id}`
                }}
                showGradients={false}
                enableArrowNavigation={false}
                className="!w-full"
                itemClassName="!bg-bg-default border border-orange-200 !rounded-lg"
                displayScrollbar={false}
              />
            </div>
          )}

          {dashboard.upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-1">
                即將到期 (<span ref={upcomingCountRef}>{dashboard.upcoming.length}</span>)
              </h3>
              <AnimatedList
                items={dashboard.upcoming.map((t) => `${t.title} — ${t.project.name}`)}
                onItemSelect={(_, i) => {
                  const t = dashboard.upcoming[i]
                  if (t) window.location.href = `/projects/${t.project.id}`
                }}
                showGradients={false}
                enableArrowNavigation={false}
                className="!w-full"
                itemClassName="!bg-bg-default border border-border-primary !rounded-lg"
                displayScrollbar={false}
              />
            </div>
          )}
        </div>
      )}

      {/* Projects list */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">清單列表</h1>
        <StarBorder
          as="button"
          color="#2E9DFF"
          speed="5s"
          className="cursor-pointer"
          onClick={() => setDialogOpen(true)}
        >
          新建清單
        </StarBorder>
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
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  )
}
