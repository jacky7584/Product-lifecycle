'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

export default function NavBar() {
  const { user, loading, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const themeToggleButton = (
    <button
      onClick={toggleTheme}
      className="text-sm text-gray-300 hover:text-white transition-colors duration-200 min-h-[44px] flex items-center cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
      aria-label={theme === 'dark' ? '切換淺色模式' : '切換深色模式'}
    >
      {theme === 'dark' ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  )

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
                {themeToggleButton}
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
                {themeToggleButton}
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
                {themeToggleButton}
                <button
                  onClick={() => { logout(); setMenuOpen(false) }}
                  className="block text-sm text-gray-300 hover:text-white transition-colors duration-200 min-h-[44px] flex items-center cursor-pointer focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
                >
                  登出
                </button>
              </>
            ) : (
              <>
                {themeToggleButton}
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
