import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, avatar } = body

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      )
    }

    if (name && name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be 100 characters or less' },
        { status: 400 }
      )
    }

    if (email !== undefined && (typeof email !== 'string' || email.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Email cannot be empty' },
        { status: 400 }
      )
    }

    if (email) {
      const existing = await prisma.engineer.findFirst({
        where: { email: email.trim(), NOT: { id } },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'An engineer with this email already exists' },
          { status: 409 }
        )
      }
    }

    const data: Record<string, string | null> = {}
    if (name !== undefined) data.name = name.trim()
    if (email !== undefined) data.email = email.trim()
    if (avatar !== undefined) data.avatar = avatar?.trim() || null

    const engineer = await prisma.engineer.update({
      where: { id },
      data,
    })

    return NextResponse.json(engineer)
  } catch (error) {
    console.error('Failed to update engineer:', error)
    return NextResponse.json(
      { error: 'Failed to update engineer' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.engineer.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete engineer:', error)
    return NextResponse.json(
      { error: 'Failed to delete engineer' },
      { status: 500 }
    )
  }
}
