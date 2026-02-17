'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import KanbanColumn from './KanbanColumn'
import TicketDetailModal from './TicketDetailModal'
import TicketFormModal from './TicketFormModal'
import { apiFetch } from '@/lib/api'
import { hapticImpact, hapticNotification, hapticSelection } from '@/lib/haptics'
import type { TicketWithRelations } from '@/types'
import { Stage } from '@/types'

const STAGES: Stage[] = [Stage.START, Stage.DEV, Stage.QA, Stage.FINISH]

type Props = {
  tickets: TicketWithRelations[]
  projectId: string
  onRefresh: () => void
}

export default function KanbanBoard({ tickets, projectId, onRefresh }: Props) {
  const [localTickets, setLocalTickets] = useState<TicketWithRelations[]>(tickets)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [detailTicket, setDetailTicket] = useState<TicketWithRelations | null>(null)
  const [editTicket, setEditTicket] = useState<TicketWithRelations | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Sync from parent when tickets prop changes
  const ticketsKey = tickets.map((t) => `${t.id}:${t.stage}:${t.order}`).join(',')
  const [prevKey, setPrevKey] = useState(ticketsKey)
  if (ticketsKey !== prevKey) {
    setLocalTickets(tickets)
    setPrevKey(ticketsKey)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  )

  const ticketsByStage = useMemo(() => {
    const map: Record<Stage, TicketWithRelations[]> = {
      START: [],
      DEV: [],
      QA: [],
      FINISH: [],
    }
    for (const t of localTickets) {
      map[t.stage].push(t)
    }
    for (const stage of STAGES) {
      map[stage].sort((a, b) => a.order - b.order)
    }
    return map
  }, [localTickets])

  const activeTicket = useMemo(
    () => (activeId ? localTickets.find((t) => t.id === activeId) || null : null),
    [activeId, localTickets]
  )

  const findStageForTicket = useCallback(
    (ticketId: string): Stage | null => {
      const ticket = localTickets.find((t) => t.id === ticketId)
      if (ticket) return ticket.stage
      // Check if the id is a stage (droppable column id)
      if (STAGES.includes(ticketId as Stage)) return ticketId as Stage
      return null
    },
    [localTickets]
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    hapticImpact('medium')
  }, [])

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return

      const activeTicketId = active.id as string
      const overId = over.id as string

      const activeStage = findStageForTicket(activeTicketId)
      // over could be a ticket or a column (stage)
      let overStage = findStageForTicket(overId)
      if (!overStage && STAGES.includes(overId as Stage)) {
        overStage = overId as Stage
      }

      if (!activeStage || !overStage || activeStage === overStage) return

      hapticSelection()
      // Move ticket to new column
      setLocalTickets((prev) => {
        return prev.map((t) => {
          if (t.id === activeTicketId) {
            return { ...t, stage: overStage }
          }
          return t
        })
      })
    },
    [findStageForTicket]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)

      if (!over) return

      const activeTicketId = active.id as string
      const overId = over.id as string

      const activeTicket = localTickets.find((t) => t.id === activeTicketId)
      if (!activeTicket) return

      // Determine the target stage
      let targetStage = activeTicket.stage
      if (STAGES.includes(overId as Stage)) {
        targetStage = overId as Stage
      } else {
        const overTicket = localTickets.find((t) => t.id === overId)
        if (overTicket) {
          targetStage = overTicket.stage
        }
      }

      setLocalTickets((prev) => {
        const updated = prev.map((t) => {
          if (t.id === activeTicketId) {
            return { ...t, stage: targetStage }
          }
          return t
        })

        const columnTickets = updated
          .filter((t) => t.stage === targetStage)
          .sort((a, b) => a.order - b.order)

        const activeIndex = columnTickets.findIndex((t) => t.id === activeTicketId)
        const overIndex = STAGES.includes(overId as Stage)
          ? columnTickets.length - 1
          : columnTickets.findIndex((t) => t.id === overId)

        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          const reordered = arrayMove(columnTickets, activeIndex, overIndex)
          const reorderedIds = reordered.map((t) => t.id)
          return updated.map((t) => {
            if (t.stage === targetStage) {
              const newOrder = reorderedIds.indexOf(t.id)
              return { ...t, order: newOrder }
            }
            return t
          })
        }

        // Just reindex the column
        const sorted = columnTickets.map((t) => t.id)
        return updated.map((t) => {
          if (t.stage === targetStage) {
            return { ...t, order: sorted.indexOf(t.id) }
          }
          return t
        })
      })

      hapticNotification('success')
      // Persist to API
      persistReorder(targetStage)
    },
    [localTickets]
  )

  const persistReorder = useCallback(
    (changedStage: Stage) => {
      // Small delay to let state settle
      setTimeout(() => {
        setLocalTickets((current) => {
          const ticketsToUpdate = current
            .filter((t) => t.stage === changedStage)
            .sort((a, b) => a.order - b.order)
            .map((t, i) => ({ id: t.id, stage: t.stage, order: i }))

          if (ticketsToUpdate.length > 0) {
            apiFetch('/api/tickets/reorder', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tickets: ticketsToUpdate }),
            }).catch(() => {})
          }

          return current
        })
      }, 0)
    },
    []
  )

  const handleTicketClick = useCallback((ticket: TicketWithRelations) => {
    setDetailTicket(ticket)
    setShowDetail(true)
  }, [])

  const handleEditFromDetail = useCallback(() => {
    setShowDetail(false)
    setEditTicket(detailTicket)
    setShowForm(true)
  }, [detailTicket])

  const handleFormSaved = useCallback(() => {
    setShowForm(false)
    setEditTicket(null)
    onRefresh()
  }, [onRefresh])

  const handleDeleted = useCallback(() => {
    setShowDetail(false)
    setDetailTicket(null)
    onRefresh()
  }, [onRefresh])

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              tickets={ticketsByStage[stage]}
              onTicketClick={handleTicketClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTicket ? (
            <div aria-label="拖曳中的任務" className="bg-bg-default rounded-lg shadow-lg border border-border-brand-subtle p-3 w-[244px] rotate-2 opacity-90">
              <p className="text-sm font-medium text-text-primary mb-2 line-clamp-2">{activeTicket.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TicketDetailModal
        open={showDetail}
        onClose={() => setShowDetail(false)}
        ticket={detailTicket}
        onEdit={handleEditFromDetail}
        onDeleted={handleDeleted}
      />

      <TicketFormModal
        open={showForm}
        onClose={() => {
          setShowForm(false)
          setEditTicket(null)
        }}
        onSaved={handleFormSaved}
        projectId={projectId}
        ticket={editTicket}
      />
    </>
  )
}
