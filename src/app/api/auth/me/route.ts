import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: '未登入' },
      { status: 401 }
    )
  }
  return NextResponse.json({
    user: { id: user.userId, email: user.email, name: user.name },
  })
}
