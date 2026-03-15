'use client'

import { useState, Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import gsap from 'gsap'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!formRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      formRef.current.style.visibility = 'visible'
      return
    }

    const ctx = gsap.context(() => {
      gsap.set(formRef.current, { visibility: 'visible' })
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl
        .fromTo('.login-title', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5 })
        .fromTo('.login-form', { opacity: 0, y: 30, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.6 }, '-=0.2')
        .fromTo('.login-fields > div', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.1 }, '-=0.3')
        .fromTo('.login-submit', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.1')
        .fromTo('.login-footer', { opacity: 0 }, { opacity: 1, duration: 0.3 }, '-=0.1')
    }, formRef)

    return () => ctx.revert()
  }, [])

  // Shake animation on error
  useEffect(() => {
    if (!error || !formRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const form = formRef.current.querySelector('.login-form')
    if (form) {
      gsap.fromTo(form,
        { x: -8 },
        { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' }
      )
    }
  }, [error])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const err = await login(email, password)
    if (err) {
      setError(err)
      setSubmitting(false)
      return
    }

    const redirect = searchParams.get('redirect') || '/dashboard'
    router.push(redirect)
  }

  return (
    <div ref={formRef} className="min-h-[60vh] flex items-center justify-center" style={{ visibility: 'hidden' }}>
      <div className="w-full max-w-sm">
        <h1 className="login-title text-2xl font-bold text-text-primary text-center mb-6">登入 Login</h1>
        <form onSubmit={handleSubmit} className="login-form bg-bg-default rounded-lg border border-border-primary p-6 space-y-4">
          <div className="login-fields space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
                信箱
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="信箱"
                className="w-full px-3 py-2 border border-border-primary rounded-md text-sm text-text-primary bg-bg-inputfield focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus"
                placeholder="you@example.com"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
                密碼
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  aria-label="密碼"
                  className="w-full px-3 py-2 pr-10 border border-border-primary rounded-md text-sm text-text-primary bg-bg-inputfield focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus"
                  placeholder="至少6位"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-tertiary hover:text-text-secondary cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
                  aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-text-error">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="login-submit w-full px-4 py-2 text-sm font-medium text-text-onbrand bg-bg-brand rounded-md hover:bg-bg-brand-compliment disabled:opacity-50 transition-colors min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
          >
            {submitting ? '登入中...' : '登入'}
          </button>
        </form>
        <p className="login-footer text-sm text-text-tertiary text-center mt-4">
          還沒有帳號？{' '}
          <Link href="/register" className="text-text-brand hover:text-text-brand font-medium cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2">
            註冊
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
