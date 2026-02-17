import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-me')

const protectedPages = ['/dashboard', '/projects']
const publicApiPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/mcp',
  '/api/sse',
  '/api/message',
]

const CAPACITOR_ORIGINS = ['capacitor://localhost', 'http://localhost']

function addCorsHeaders(response: NextResponse, origin: string) {
  if (CAPACITOR_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  return response
}

async function verifyTokenFromRequest(request: NextRequest) {
  // Try Authorization header first (for Capacitor / mobile clients)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      return payload
    } catch {
      // Fall through to cookie check
    }
  }

  // Fall back to cookie-based auth (for web clients)
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
  const origin = request.headers.get('origin') || ''

  // Handle CORS preflight requests from Capacitor
  if (request.method === 'OPTIONS' && CAPACITOR_ORIGINS.includes(origin)) {
    const response = new NextResponse(null, { status: 204 })
    addCorsHeaders(response, origin)
    return response
  }

  // Public API routes — allow through
  if (publicApiPaths.some((p) => pathname.startsWith(p))) {
    const response = NextResponse.next()
    return addCorsHeaders(response, origin)
  }

  // Protected API routes — return 401
  if (pathname.startsWith('/api/')) {
    const payload = await verifyTokenFromRequest(request)
    if (!payload) {
      const errResponse = NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      )
      return addCorsHeaders(errResponse, origin)
    }
    const response = NextResponse.next()
    return addCorsHeaders(response, origin)
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
