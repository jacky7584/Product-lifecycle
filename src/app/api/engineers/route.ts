import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const engineers = await prisma.engineer.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(engineers)
  } catch (error) {
    console.error('Failed to fetch engineers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch engineers' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, avatar } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be 100 characters or less' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const existing = await prisma.engineer.findUnique({
      where: { email: email.trim() },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'An engineer with this email already exists' },
        { status: 409 }
      )
    }

    const engineer = await prisma.engineer.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        avatar: avatar?.trim() || null,
      },
    })

    return NextResponse.json(engineer, { status: 201 })
  } catch (error) {
    console.error('Failed to create engineer:', error)
    return NextResponse.json(
      { error: 'Failed to create engineer' },
      { status: 500 }
    )
  }
}
