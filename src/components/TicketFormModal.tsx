'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TicketWithRelations, Engineer } from '@/types'
import { Stage } from '@/types'
import { apiFetch } from '@/lib/api'
import { hapticNotification } from '@/lib/haptics'

type Props = {
  open: boolean
  onClose: () => void
  onSaved: () => void
  projectId: string
  ticket?: TicketWithRelations | null
}

const STAGE_OPTIONS: { value: Stage; label: string }[] = [
  { value: Stage.START, label: 'Start' },
  { value: Stage.DEV, label: 'Dev' },
  { value: Stage.QA, label: 'QA' },
  { value: Stage.FINISH, label: 'Finish' },
]

export default function TicketFormModal({ open, onClose, onSaved, projectId, ticket }: Props) {
  const isEditing = !!ticket
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [stage, setStage] = useState<Stage>(Stage.START)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [engineers, setEngineers] = useState<Engineer[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      apiFetch('/api/engineers')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setEngineers(data)
        })
        .catch(() => {})
    }
  }, [open])

  useEffect(() => {
    if (open) {
      if (ticket) {
        setTitle(ticket.title)
        setDescription(ticket.description || '')
        setAssigneeId(ticket.assigneeId || '')
        setStage(ticket.stage)
      } else {
        setTitle('')
        setDescription('')
        setAssigneeId('')
        setStage(Stage.START)
      }
      setFiles([])
      setPreviews([])
      setError(null)
    }
  }, [open, ticket])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selected])
    const newPreviews = selected.map((f) => URL.createObjectURL(f))
    setPreviews((prev) => [...prev, ...newPreviews])
  }, [])

  const removeFile = useCallback((index: number) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('請輸入標題')
      return
    }

    setSubmitting(true)
    try {
      let ticketId: string

      if (isEditing) {
        const res = await apiFetch(`/api/tickets/${ticket.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            assigneeId: assigneeId || null,
            stage,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || '更新工單失敗')
          return
        }
        ticketId = ticket.id
      } else {
        const res = await apiFetch(`/api/projects/${projectId}/tickets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            assigneeId: assigneeId || null,
            stage,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || '建立工單失敗')
          return
        }
        const created = await res.json()
        ticketId = created.id
      }

      // Upload attachments
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        await apiFetch(`/api/tickets/${ticketId}/attachments`, {
          method: 'POST',
          body: formData,
        })
      }

      hapticNotification('success')
      onSaved()
      onClose()
    } catch {
      setError('發生錯誤')
    } finally {
      setSubmitting(false)
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-bg-default rounded-lg shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          {isEditing ? '編輯工單' : '新增工單'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="ticket-title" className="block text-sm font-medium text-text-secondary mb-1">
              標題 <span className="text-text-error">*</span>
            </label>
            <input
              id="ticket-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2 border border-border-primary rounded-md text-sm bg-bg-inputfield text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus"
              placeholder="工單標題"
              autoFocus
            />
            <p className="text-xs text-text-tertiary mt-1 text-right">{title.length}/200</p>
          </div>

          <div className="mb-4">
            <label htmlFor="ticket-desc" className="block text-sm font-medium text-text-secondary mb-1">
              描述
            </label>
            <textarea
              id="ticket-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border-primary rounded-md text-sm bg-bg-inputfield text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus resize-none"
              placeholder="選填描述"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="ticket-assignee" className="block text-sm font-medium text-text-secondary mb-1">
              負責人
            </label>
            <select
              id="ticket-assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 border border-border-primary rounded-md text-sm bg-bg-inputfield text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus"
            >
              <option value="">未指派</option>
              {engineers.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="ticket-stage" className="block text-sm font-medium text-text-secondary mb-1">
              階段
            </label>
            <select
              id="ticket-stage"
              value={stage}
              onChange={(e) => setStage(e.target.value as Stage)}
              className="w-full px-3 py-2 border border-border-primary rounded-md text-sm bg-bg-inputfield text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus"
            >
              {STAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-1">
              附件
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-text-tertiary file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-bg-brand-subtle file:text-text-brand hover:file:bg-bg-brand-subtle"
            />
            {previews.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-16 h-16">
                    <img src={src} alt="" className="w-full h-full object-cover rounded-md border" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-bg-accent-3 text-text-onbrand rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-text-error mb-3">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-default border border-border-primary rounded-md hover:bg-bg-secondary min-h-[44px] focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 transition-colors duration-200 cursor-pointer"
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-text-onbrand bg-bg-brand rounded-md hover:bg-bg-brand-compliment disabled:opacity-50 min-h-[44px] focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 transition-colors duration-200 cursor-pointer"
              disabled={submitting}
            >
              {submitting ? '儲存中...' : isEditing ? '儲存' : '建立'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
