'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TicketCard from './TicketCard'
import type { TicketWithRelations } from '@/types'
import type { Stage } from '@/types'

const COLUMN_CONFIG: Record<Stage, { label: string; headerBg: string; headerText: string }> = {
  START: { label: 'Start', headerBg: 'bg-gray-200', headerText: 'text-gray-700' },
  DEV: { label: 'Dev', headerBg: 'bg-blue-200', headerText: 'text-blue-700' },
  QA: { label: 'QA', headerBg: 'bg-amber-200', headerText: 'text-amber-700' },
  FINISH: { label: 'Finish', headerBg: 'bg-green-200', headerText: 'text-green-700' },
}

type Props = {
  stage: Stage
  tickets: TicketWithRelations[]
  onTicketClick: (ticket: TicketWithRelations) => void
}

export default function KanbanColumn({ stage, tickets, onTicketClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const config = COLUMN_CONFIG[stage]

  return (
    <div className="flex flex-col min-w-[260px] w-[260px] shrink-0" aria-label={`${config.label} 階段`}>
      <div className={`${config.headerBg} rounded-t-lg px-3 py-2 flex items-center justify-between`}>
        <span className={`text-sm font-semibold ${config.headerText}`}>{config.label}</span>
        <span className={`text-xs font-medium ${config.headerText} bg-white/50 rounded-full px-2 py-0.5`}>
          {tickets.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] bg-bg-secondary rounded-b-lg p-2 flex flex-col gap-2 transition-colors ${
          isOver ? 'ring-2 ring-border-focus bg-bg-brand-subtle/50' : ''
        }`}
      >
        <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => onTicketClick(ticket)}
            />
          ))}
        </SortableContext>
        {tickets.length === 0 && (
          <p className="text-xs text-text-tertiary text-center py-8">尚無任務</p>
        )}
      </div>
    </div>
  )
}
