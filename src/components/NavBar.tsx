'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function NavBar() {
  const { user, loading, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link
            href={user ? '/' : '/'}
            className="text-lg font-semibold tracking-tight min-h-[44px] flex items-center cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
          >
            Product Tracker
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-6">
            {loading ? null : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-300 hover:text-white transition-colors duration-200 min-h-[44px] flex items-center cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
                >
                  清單
                </Link>
                <span className="text-sm text-gray-400">{user.name}</span>

                <button
                  onClick={logout}
                  className="text-sm text-gray-300 hover:text-white transition-colors duration-200 min-h-[44px] flex items-center cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
                >
                  登出
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-gray-300 hover:text-white transition-colors duration-200 min-h-[44px] flex items-center cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
                >
                  登入
                </Link>

                <Link
                  href="/register"
                  className="text-sm text-gray-300 hover:text-white transition-colors duration-200 min-h-[44px] flex items-center cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
                >
                  註冊
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden text-gray-300 hover:text-white transition-colors duration-200 min-h-[44px] flex items-center cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden w-full border-t border-gray-800">
          <div className="px-4 py-3 space-y-1">
            {loading ? null : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block text-sm text-gray-300 hover:text-white transition-colors duration-200 min-h-[44px] flex items-center cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
                  onClick={() => setMenuOpen(false)}
                >
                  清單
                </Link>
                <span className="block text-sm text-gray-400 min-h-[44px] flex items-center">{user.name}</span>

                <button
                  onClick={() => { logout(); setMenuOpen(false) }}
                  className="block text-sm text-gray-300 hover:text-white transition-colors duration-200 min-h-[44px] flex items-center cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
                >
                  登出
                </button>
              </>
            ) : (
              <>

                <Link
                  href="/login"
                  className="block text-sm text-gray-300 hover:text-white transition-colors duration-200 min-h-[44px] flex items-center cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
                  onClick={() => setMenuOpen(false)}
                >
                  登入
                </Link>
                <Link
                  href="/register"
                  className="block text-sm text-gray-300 hover:text-white transition-colors duration-200 min-h-[44px] flex items-center cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
                  onClick={() => setMenuOpen(false)}
                >
                  註冊
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
