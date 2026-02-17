import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, getTokenCookieOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '請填寫所有必填欄位' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密碼長度至少為6位' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })
    if (existing) {
      return NextResponse.json(
        { error: '該信箱已被註冊' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
      },
    })

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    })

    const cookieOptions = getTokenCookieOptions()
    const response = NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name }, token },
      { status: 201 }
    )
    response.cookies.set(cookieOptions.name, token, cookieOptions)
    return response
  } catch (error) {
    console.error('Registration failed:', error)
    return NextResponse.json(
      { error: '註冊失敗，請稍後再試' },
      { status: 500 }
    )
  }
}
