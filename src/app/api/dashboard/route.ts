import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Stage } from '@prisma/client'

export async function GET() {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)
    const weekEnd = new Date(todayStart)
    weekEnd.setDate(weekEnd.getDate() + 8) // tomorrow through 7 days from now

    const notFinished = { stage: { not: Stage.FINISH } }

    const [overdue, todayDue, upcoming] = await Promise.all([
      prisma.ticket.findMany({
        where: {
          ...notFinished,
          dueDate: { lt: todayStart },
        },
        include: {
          project: { select: { id: true, name: true } },
          subtasks: { orderBy: { order: 'asc' } },
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.ticket.findMany({
        where: {
          ...notFinished,
          dueDate: { gte: todayStart, lt: todayEnd },
        },
        include: {
          project: { select: { id: true, name: true } },
          subtasks: { orderBy: { order: 'asc' } },
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.ticket.findMany({
        where: {
          ...notFinished,
          dueDate: { gte: todayEnd, lt: weekEnd },
        },
        include: {
          project: { select: { id: true, name: true } },
          subtasks: { orderBy: { order: 'asc' } },
        },
        orderBy: { dueDate: 'asc' },
      }),
    ])

    return NextResponse.json({ overdue, todayDue, upcoming })
  } catch (error) {
    console.error('Failed to fetch dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
