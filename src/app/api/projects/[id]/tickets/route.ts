import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Stage } from '@prisma/client'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const tickets = await prisma.ticket.findMany({
      where: { projectId: id },
      include: {
        assignee: true,
        _count: { select: { attachments: true } },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Failed to fetch tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
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
    const { title, description, assigneeId, stage } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be 200 characters or less' },
        { status: 400 }
      )
    }

    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const ticketStage: Stage = stage && Object.values(Stage).includes(stage) ? stage : Stage.START

    // Calculate order: append to end of the target stage column
    const lastTicket = await prisma.ticket.findFirst({
      where: { projectId: id, stage: ticketStage },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const order = lastTicket ? lastTicket.order + 1 : 0

    const ticket = await prisma.ticket.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        stage: ticketStage,
        order,
        projectId: id,
        assigneeId: assigneeId || null,
      },
      include: {
        assignee: true,
        attachments: true,
      },
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Failed to create ticket:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}
