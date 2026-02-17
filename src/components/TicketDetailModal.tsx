'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TicketWithRelations, Subtask } from '@/types'
import { Stage, Priority } from '@/types'
import { apiFetch } from '@/lib/api'
import { hapticNotification } from '@/lib/haptics'

type Props = {
  open: boolean
  onClose: () => void
  ticket: TicketWithRelations | null
  onEdit: () => void
  onDeleted: () => void
}

const STAGE_BADGE: Record<Stage, { bg: string; text: string; label: string }> = {
  START: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Start' },
  DEV: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Dev' },
  QA: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'QA' },
  FINISH: { bg: 'bg-green-100', text: 'text-green-700', label: 'Finish' },
}

const PRIORITY_BADGE: Record<Priority, { bg: string; text: string; label: string }> = {
  HIGH: { bg: 'bg-red-100', text: 'text-red-700', label: '高' },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '中' },
  LOW: { bg: 'bg-green-100', text: 'text-green-700', label: '低' },
}

function formatDueDate(dateStr: string | null | undefined): { text: string; isOverdue: boolean } | null {
  if (!dateStr) return null
  const due = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isOverdue = due < today
  return {
    text: due.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', year: 'numeric' }),
    isOverdue,
  }
}

export default function TicketDetailModal({ open, onClose, ticket, onEdit, onDeleted }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSubtask, setNewSubtask] = useState('')

  useEffect(() => {
    if (open) {
      setConfirmDelete(false)
      setSubtasks(ticket?.subtasks || [])
      setNewSubtask('')
    }
  }, [open, ticket])

  const handleDelete = useCallback(async () => {
    if (!ticket) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      hapticNotification('warning')
      return
    }
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/tickets/${ticket.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDeleted()
        onClose()
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false)
    }
  }, [ticket, confirmDelete, onDeleted, onClose])

  const handleDeleteAttachment = useCallback(async (attachmentId: string) => {
    await apiFetch(`/api/attachments/${attachmentId}`, { method: 'DELETE' })
    onDeleted() // refresh data
  }, [onDeleted])

  const handleToggleSubtask = useCallback(async (subtask: Subtask) => {
    const newDone = !subtask.done
    setSubtasks((prev) => prev.map((s) => s.id === subtask.id ? { ...s, done: newDone } : s))
    await apiFetch(`/api/subtasks/${subtask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: newDone }),
    })
  }, [])

  const handleAddSubtask = useCallback(async () => {
    if (!ticket || !newSubtask.trim()) return
    const res = await apiFetch(`/api/tickets/${ticket.id}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newSubtask.trim() }),
    })
    if (res.ok) {
      const created = await res.json()
      setSubtasks((prev) => [...prev, created])
      setNewSubtask('')
    }
  }, [ticket, newSubtask])

  const handleDeleteSubtask = useCallback(async (subtaskId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId))
    await apiFetch(`/api/subtasks/${subtaskId}`, { method: 'DELETE' })
  }, [])

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open || !ticket) return null

  const stageBadge = STAGE_BADGE[ticket.stage]
  const priorityBadge = PRIORITY_BADGE[ticket.priority]
  const dueInfo = formatDueDate(ticket.dueDate as string | null)
  const doneCount = subtasks.filter((s) => s.done).length

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-bg-default rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg font-semibold text-text-primary">{ticket.title}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stageBadge.bg} ${stageBadge.text}`}>
                {stageBadge.label}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadge.bg} ${priorityBadge.text}`}>
                {priorityBadge.label}
              </span>
              {dueInfo && (
                <span className={`text-xs ${dueInfo.isOverdue ? 'text-red-500 font-medium' : 'text-text-tertiary'}`}>
                  {dueInfo.isOverdue ? '已逾期 ' : '截止 '}{dueInfo.text}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-secondary p-2 focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 transition-colors duration-200 cursor-pointer rounded-md"
            aria-label="關閉"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {ticket.description && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-text-secondary mb-1">描述</h3>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{ticket.description}</p>
          </div>
        )}

        {/* Subtasks */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-text-secondary">子任務</h3>
            {subtasks.length > 0 && (
              <span className="text-xs text-text-tertiary">{doneCount}/{subtasks.length}</span>
            )}
          </div>
          {subtasks.length > 0 && (
            <>
              <div className="w-full bg-bg-secondary rounded-full h-1.5 mb-2">
                <div
                  className="bg-bg-brand h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${subtasks.length > 0 ? (doneCount / subtasks.length) * 100 : 0}%` }}
                />
              </div>
              <div className="space-y-1 mb-2">
                {subtasks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2 group">
                    <input
                      type="checkbox"
                      checked={st.done}
                      onChange={() => handleToggleSubtask(st)}
                      className="w-4 h-4 rounded border-border-primary text-bg-brand focus:ring-border-focus cursor-pointer"
                    />
                    <span className={`flex-1 text-sm ${st.done ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
                      {st.title}
                    </span>
                    <button
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="text-text-tertiary hover:text-text-error opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
                      title="刪除子任務"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask() } }}
              placeholder="新增子任務..."
              className="flex-1 px-2 py-1.5 border border-border-primary rounded-md text-sm bg-bg-inputfield text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus"
            />
            <button
              onClick={handleAddSubtask}
              disabled={!newSubtask.trim()}
              className="px-3 py-1.5 text-sm font-medium text-text-onbrand bg-bg-brand rounded-md hover:bg-bg-brand-compliment disabled:opacity-50 cursor-pointer transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {ticket.attachments.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-text-secondary mb-2">附件</h3>
            <div className="grid grid-cols-3 gap-2">
              {ticket.attachments.map((att) => (
                <div key={att.id} className="relative group">
                  <a href={att.url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={att.url}
                      alt={att.filename}
                      className="w-full h-24 object-cover rounded-md border border-border-primary hover:opacity-90"
                    />
                  </a>
                  <button
                    onClick={() => handleDeleteAttachment(att.id)}
                    className="absolute top-1 right-1 w-5 h-5 bg-bg-accent-3 text-text-onbrand rounded-full text-xs items-center justify-center hover:bg-red-600 hidden group-hover:flex"
                    title="刪除附件"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t border-border-primary">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`px-3 py-1.5 text-sm font-medium rounded-md min-h-[44px] focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 transition-colors duration-200 cursor-pointer ${
              confirmDelete
                ? 'bg-bg-accent-3 text-text-onbrand hover:bg-red-700'
                : 'text-text-error border border-border-error hover:bg-red-50'
            } disabled:opacity-50`}
          >
            {deleting ? '刪除中...' : confirmDelete ? '確認刪除' : '刪除'}
          </button>
          <button
            onClick={onEdit}
            className="px-3 py-1.5 text-sm font-medium text-text-brand border border-border-brand-subtle rounded-md hover:bg-bg-brand-subtle min-h-[44px] focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 transition-colors duration-200 cursor-pointer"
          >
            編輯
          </button>
        </div>
      </div>
    </div>
  )
}
