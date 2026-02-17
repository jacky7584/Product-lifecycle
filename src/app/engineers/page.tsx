'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

type Engineer = {
  id: string
  name: string
  email: string
}

export default function EngineersPage() {
  const [engineers, setEngineers] = useState<Engineer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const fetchEngineers = useCallback(async () => {
    try {
      const res = await apiFetch('/api/engineers')
      if (res.ok) {
        const data = await res.json()
        setEngineers(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEngineers()
  }, [fetchEngineers])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !email.trim()) {
      setError('姓名與信箱為必填')
      return
    }

    setSubmitting(true)
    try {
      const res = await apiFetch('/api/engineers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '新增工程師失敗')
        return
      }

      setName('')
      setEmail('')
      setShowForm(false)
      fetchEngineers()
    } catch {
      setError('新增工程師失敗')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      return
    }
    try {
      const res = await apiFetch(`/api/engineers/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchEngineers()
      }
    } catch {
      // silently fail
    } finally {
      setConfirmDeleteId(null)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">工程師 Engineers</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium text-text-onbrand bg-bg-brand rounded-md hover:bg-bg-brand-compliment transition-colors duration-200 min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
        >
          {showForm ? '取消' : '新增工程師'}
        </button>
      </div>

      {showForm && (
        <div className="bg-bg-default rounded-lg border border-border-primary p-4 mb-6">
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="姓名"
              maxLength={100}
              aria-label="工程師姓名"
              className="flex-1 px-3 py-2 border border-border-primary rounded-md text-sm bg-bg-inputfield text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus"
              autoFocus
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="信箱"
              aria-label="工程師信箱"
              className="flex-1 px-3 py-2 border border-border-primary rounded-md text-sm bg-bg-inputfield text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-text-onbrand bg-bg-brand rounded-md hover:bg-bg-brand-compliment disabled:opacity-50 min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 transition-colors duration-200"
            >
              {submitting ? '新增中...' : '新增'}
            </button>
          </form>
          {error && <p className="text-sm text-text-error mt-2">{error}</p>}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-border-brand-subtle border-t-bg-brand rounded-full animate-spin" />
        </div>
      ) : engineers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-bg-default rounded-lg border-2 border-dashed border-border-primary">
          <p className="text-text-tertiary mb-2">尚無工程師</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-text-brand hover:text-text-brand font-medium cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
          >
            新增第一位工程師
          </button>
        </div>
      ) : (
        <>
          <div className="hidden sm:block bg-bg-default rounded-lg border border-border-primary overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-primary bg-bg-secondary">
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-tertiary">姓名</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-tertiary">信箱</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-text-tertiary">操作</th>
                </tr>
              </thead>
              <tbody>
                {engineers.map((engineer) => (
                  <tr key={engineer.id} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-3 text-sm text-text-primary">{engineer.name}</td>
                    <td className="px-4 py-3 text-sm text-text-tertiary">{engineer.email}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(engineer.id)}
                        className={`text-sm font-medium min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 transition-colors duration-200 ${confirmDeleteId === engineer.id ? 'bg-bg-accent-3 text-text-onbrand px-3 py-1.5 rounded-md' : 'text-text-error hover:text-red-700'}`}
                      >
                        {confirmDeleteId === engineer.id ? '確認刪除？' : '刪除'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-3">
            {engineers.map((engineer) => (
              <div key={engineer.id} className="bg-bg-default rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-text-primary">{engineer.name}</p>
                    <p className="text-sm text-text-tertiary">{engineer.email}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(engineer.id)}
                    className={`text-sm font-medium min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 transition-colors duration-200 ${confirmDeleteId === engineer.id ? 'bg-bg-accent-3 text-text-onbrand px-3 py-1.5 rounded-md' : 'text-text-error hover:text-red-700'}`}
                  >
                    {confirmDeleteId === engineer.id ? '確認刪除？' : '刪除'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
