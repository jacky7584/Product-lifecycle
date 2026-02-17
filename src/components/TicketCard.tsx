'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { TicketWithRelations } from '@/types'

type Props = {
  ticket: TicketWithRelations
  onClick: () => void
}

export default function TicketCard({ ticket, onClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-bg-default rounded-lg shadow-sm border border-border-primary p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
    >
      <p className="text-sm font-medium text-text-primary mb-2 line-clamp-2">{ticket.title}</p>
      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <span>{ticket.assignee ? ticket.assignee.name : '未指派'}</span>
        {ticket.attachments.length > 0 && (
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {ticket.attachments.length}
          </span>
        )}
      </div>
    </div>
  )
}
