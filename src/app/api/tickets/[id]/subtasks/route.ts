import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const subtasks = await prisma.subtask.findMany({
      where: { ticketId: id },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(subtasks)
  } catch (error) {
    console.error('Failed to fetch subtasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subtasks' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    const lastSubtask = await prisma.subtask.findFirst({
      where: { ticketId: id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const order = lastSubtask ? lastSubtask.order + 1 : 0

    const subtask = await prisma.subtask.create({
      data: {
        title: title.trim(),
        order,
        ticketId: id,
      },
    })

    return NextResponse.json(subtask, { status: 201 })
  } catch (error) {
    console.error('Failed to create subtask:', error)
    return NextResponse.json(
      { error: 'Failed to create subtask' },
      { status: 500 }
    )
  }
}
