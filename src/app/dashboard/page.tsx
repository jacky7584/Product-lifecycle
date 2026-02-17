'use client'

import { useState, useEffect, useCallback } from 'react'
import ProjectCard, { type ProjectSummary } from '@/components/ProjectCard'
import CreateProjectDialog from '@/components/CreateProjectDialog'
import { apiFetch } from '@/lib/api'

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await apiFetch('/api/projects')
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">項目列表 Projects</h1>
        <button
          onClick={() => setDialogOpen(true)}
          className="px-4 py-2 text-sm font-medium text-text-onbrand bg-bg-brand rounded-md hover:bg-bg-brand-compliment transition-colors min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
        >
          新建項目
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-border-brand-subtle border-t-bg-brand rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-bg-default rounded-lg border-2 border-dashed border-border-primary">
          <p className="text-text-tertiary mb-2">尚無項目</p>
          <button
            onClick={() => setDialogOpen(true)}
            className="text-sm text-text-brand hover:text-text-brand font-medium cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
          >
            建立第一個項目
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onDeleted={fetchProjects} />
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={fetchProjects}
      />
    </>
  )
}
