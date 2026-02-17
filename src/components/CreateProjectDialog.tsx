'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { hapticNotification } from '@/lib/haptics'

type Props = {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export default function CreateProjectDialog({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('請輸入項目名稱')
      return
    }

    setSubmitting(true)
    try {
      const res = await apiFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '建立項目失敗')
        return
      }

      hapticNotification('success')
      setName('')
      setDescription('')
      onCreated()
      onClose()
    } catch {
      setError('建立項目失敗')
    } finally {
      setSubmitting(false)
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-bg-default rounded-lg shadow-xl w-full max-w-md mx-4 p-6 animate-slide-up">
        <h2 className="text-lg font-semibold text-text-primary mb-4">建立項目</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="project-name" className="block text-sm font-medium text-text-secondary mb-1">
              項目名稱 <span className="text-text-error">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 border border-border-primary rounded-md text-sm bg-bg-inputfield text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus"
              placeholder="輸入項目名稱"
              autoFocus
            />
            <p className="text-xs text-text-tertiary mt-1 text-right">{name.length}/100</p>
          </div>
          <div className="mb-4">
            <label htmlFor="project-desc" className="block text-sm font-medium text-text-secondary mb-1">
              描述
            </label>
            <textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 border border-border-primary rounded-md text-sm bg-bg-inputfield text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus resize-none"
              placeholder="選填描述"
            />
            <p className="text-xs text-text-tertiary mt-1 text-right">{description.length}/500</p>
          </div>
          {error && <p className="text-sm text-text-error mb-3">{error}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-default border border-border-primary rounded-md hover:bg-bg-secondary min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 transition-colors duration-200"
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-text-onbrand bg-bg-brand rounded-md hover:bg-bg-brand-compliment disabled:opacity-50 min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 transition-colors duration-200"
              disabled={submitting}
            >
              {submitting ? '建立中...' : '建立'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
