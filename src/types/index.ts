import type { Project, Ticket, Engineer, Attachment } from '@prisma/client'
import { Stage } from '@prisma/client'

export type { Project, Ticket, Engineer, Attachment }
export { Stage }

export type TicketWithRelations = Ticket & {
  assignee: Engineer | null
  attachments: Attachment[]
}

export type ProjectWithTickets = Project & {
  tickets: TicketWithRelations[]
}

export type TicketReorderItem = {
  id: string
  stage: Stage
  order: number
}
