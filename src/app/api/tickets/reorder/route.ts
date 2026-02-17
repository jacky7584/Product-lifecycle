import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Stage } from '@prisma/client'

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { tickets } = body

    if (!Array.isArray(tickets) || tickets.length === 0) {
      return NextResponse.json(
        { error: 'tickets array is required' },
        { status: 400 }
      )
    }

    for (const item of tickets) {
      if (!item.id || typeof item.id !== 'string') {
        return NextResponse.json(
          { error: 'Each ticket must have a valid id' },
          { status: 400 }
        )
      }
      if (!Object.values(Stage).includes(item.stage)) {
        return NextResponse.json(
          { error: `Invalid stage value: ${item.stage}` },
          { status: 400 }
        )
      }
      if (typeof item.order !== 'number') {
        return NextResponse.json(
          { error: 'Each ticket must have a numeric order' },
          { status: 400 }
        )
      }
    }

    await prisma.$transaction(
      tickets.map((item: { id: string; stage: Stage; order: number }) =>
        prisma.ticket.update({
          where: { id: item.id },
          data: {
            stage: item.stage,
            order: item.order,
          },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to reorder tickets:', error)
    return NextResponse.json(
      { error: 'Failed to reorder tickets' },
      { status: 500 }
    )
  }
}
