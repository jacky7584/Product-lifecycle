'use client'

import { useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { hapticNotification } from '@/lib/haptics'

type StageCounts = {
  START: number
  DEV: number
  QA: number
  FINISH: number
}

export type ProjectSummary = {
  id: string
  name: string
  description: string | null
  stageCounts: StageCounts
  ticketCount: number
  createdAt: string
}

const stageBadges: { key: keyof StageCounts; label: string; bg: string; text: string }[] = [
  { key: 'START', label: 'Start', bg: 'bg-gray-100', text: 'text-gray-700' },
  { key: 'DEV', label: 'Dev', bg: 'bg-blue-100', text: 'text-blue-700' },
  { key: 'QA', label: 'QA', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  { key: 'FINISH', label: 'Finish', bg: 'bg-green-100', text: 'text-green-700' },
]

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ProjectCard({
  project,
  onDeleted,
}: {
  project: ProjectSummary
  onDeleted?: () => void
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    hapticNotification('warning')
    setShowDeleteConfirm(true)
  }

  const performDelete = async () => {
    try {
      const res = await apiFetch(`/api/projects/${project.id}`, { method: 'DELETE' })
      if (res.ok) onDeleted?.()
    } catch {
      // silently fail
    } finally {
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
      <Link href={`/projects/${project.id}`} className="block focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 rounded-lg">
        <div className="bg-bg-default rounded-lg border border-border-primary p-5 hover:shadow-md hover:border-border-primary transition-all transition-shadow duration-200 cursor-pointer h-full flex flex-col">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-lg font-semibold text-text-primary">{project.name}</h3>
            <button
              onClick={handleDelete}
              className="p-2.5 text-text-tertiary hover:text-text-error transition-colors shrink-0"
              aria-label="刪除清單"
              title="刪除清單"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          {project.description && (
            <p className="text-sm text-text-tertiary mb-3 line-clamp-2">{project.description}</p>
          )}
          {!project.description && <div className="mb-3" />}
          <div className="flex flex-wrap gap-1.5 mt-auto mb-3">
            {stageBadges.map(({ key, label, bg, text }) => {
              const count = project.stageCounts[key]
              if (count === 0) return null
              return (
                <span
                  key={key}
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}
                >
                  {count} {label}
                </span>
              )
            })}
            {project.ticketCount === 0 && (
              <span className="text-xs text-text-tertiary">尚無任務</span>
            )}
          </div>
          <p className="text-xs text-text-tertiary">建立於 {formatDate(project.createdAt)}</p>
        </div>
      </Link>
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay backdrop-blur-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteConfirm(false); }}>
          <div className="bg-bg-default rounded-lg shadow-xl p-6 max-w-sm mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary mb-2">確認刪除</h3>
            <p className="text-sm text-text-secondary mb-4">確定要刪除「{project.name}」嗎？此操作會同時刪除所有任務。</p>
            <div className="flex justify-end gap-3">
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteConfirm(false); }} className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-default border border-border-primary rounded-md hover:bg-bg-secondary min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 transition-colors duration-200">取消</button>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); performDelete(); }} className="px-4 py-2 text-sm font-medium text-text-onbrand bg-bg-accent-3 rounded-md hover:bg-red-700 min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 transition-colors duration-200">刪除</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
