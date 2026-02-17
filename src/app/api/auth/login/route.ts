import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, getTokenCookieOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: '請輸入信箱和密碼' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: '信箱或密碼錯誤' },
        { status: 401 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: '信箱或密碼錯誤' },
        { status: 401 }
      )
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    })

    const cookieOptions = getTokenCookieOptions()
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    })
    response.cookies.set(cookieOptions.name, token, cookieOptions)
    return response
  } catch (error) {
    console.error('Login failed:', error)
    return NextResponse.json(
      { error: '登入失敗，請稍後再試' },
      { status: 500 }
    )
  }
}
