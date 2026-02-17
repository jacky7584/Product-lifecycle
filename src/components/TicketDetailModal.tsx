'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TicketWithRelations } from '@/types'
import { Stage } from '@/types'
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

export default function TicketDetailModal({ open, onClose, ticket, onEdit, onDeleted }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (open) setConfirmDelete(false)
  }, [open])

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

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open || !ticket) return null

  const badge = STAGE_BADGE[ticket.stage]

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
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
              <span className="text-sm text-text-tertiary">
                {ticket.assignee ? ticket.assignee.name : '未指派'}
              </span>
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
