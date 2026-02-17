import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-me')

const protectedPages = ['/dashboard', '/projects', '/engineers']
const publicApiPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/mcp',
  '/api/sse',
  '/api/message',
]

async function verifyTokenFromRequest(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public API routes — allow through
  if (publicApiPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Protected API routes — return 401
  if (pathname.startsWith('/api/')) {
    const payload = await verifyTokenFromRequest(request)
    if (!payload) {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  // Protected pages — redirect to login
  const isProtectedPage = protectedPages.some((p) => pathname.startsWith(p))
  if (isProtectedPage) {
    const payload = await verifyTokenFromRequest(request)
    if (!payload) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // Auth pages — redirect to dashboard if already logged in
  if (pathname === '/login' || pathname === '/register') {
    const payload = await verifyTokenFromRequest(request)
    if (payload) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|uploads/|.*\\.svg$|.*\\.png$|.*\\.ico$).*)',
  ],
}
