import type { Project, Ticket, Attachment, Subtask } from '@prisma/client'
import { Stage, Priority } from '@prisma/client'

export type { Project, Ticket, Attachment, Subtask }
export { Stage, Priority }

export type TicketWithRelations = Ticket & {
  attachments: Attachment[]
  subtasks: Subtask[]
}

export type ProjectWithTickets = Project & {
  tickets: TicketWithRelations[]
}

export type TicketReorderItem = {
  id: string
  stage: Stage
  order: number
}
