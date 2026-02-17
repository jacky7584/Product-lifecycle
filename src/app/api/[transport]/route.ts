import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Stage, Priority } from '@prisma/client'

const handler = createMcpHandler(
  (server) => {
    // ── Project tools ──────────────────────────────────────────

    server.tool('list_projects', '列出所有清單及任務統計', async () => {
      const projects = await prisma.project.findMany({
        include: { _count: { select: { tickets: true } } },
        orderBy: { createdAt: 'desc' },
      })
      return {
        content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }],
      }
    })

    server.tool(
      'get_project',
      '取得清單詳情含所有任務',
      { projectId: z.string().describe('清單 ID') },
      async ({ projectId }) => {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: {
            tickets: {
              include: {
                subtasks: { orderBy: { order: 'asc' } },
                attachments: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        })
        if (!project) {
          return { content: [{ type: 'text', text: `找不到清單 ${projectId}` }], isError: true }
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(project, null, 2) }],
        }
      },
    )

    server.tool(
      'create_project',
      '建立新清單',
      {
        name: z.string().describe('清單名稱'),
        description: z.string().optional().describe('清單描述'),
      },
      async ({ name, description }) => {
        const project = await prisma.project.create({
          data: { name, description: description ?? null },
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(project, null, 2) }],
        }
      },
    )

    server.tool(
      'update_project',
      '更新清單',
      {
        projectId: z.string().describe('清單 ID'),
        name: z.string().optional().describe('新名稱'),
        description: z.string().optional().describe('新描述'),
      },
      async ({ projectId, name, description }) => {
        const data: Record<string, string> = {}
        if (name !== undefined) data.name = name
        if (description !== undefined) data.description = description
        const project = await prisma.project.update({
          where: { id: projectId },
          data,
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(project, null, 2) }],
        }
      },
    )

    server.tool(
      'delete_project',
      '刪除清單（cascade 刪除所有任務）',
      { projectId: z.string().describe('清單 ID') },
      async ({ projectId }) => {
        await prisma.project.delete({ where: { id: projectId } })
        return {
          content: [{ type: 'text', text: `已刪除清單 ${projectId}` }],
        }
      },
    )

    // ── Ticket tools ───────────────────────────────────────────

    server.tool(
      'list_tickets',
      '列出清單任務，可依階段篩選',
      {
        projectId: z.string().describe('清單 ID'),
        stage: z.enum(['START', 'DEV', 'QA', 'FINISH']).optional().describe('篩選階段'),
      },
      async ({ projectId, stage }) => {
        const where: { projectId: string; stage?: Stage } = { projectId }
        if (stage) where.stage = stage as Stage
        const tickets = await prisma.ticket.findMany({
          where,
          include: { subtasks: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(tickets, null, 2) }],
        }
      },
    )

    server.tool(
      'create_ticket',
      '在清單中建立任務',
      {
        projectId: z.string().describe('清單 ID'),
        title: z.string().describe('任務標題'),
        description: z.string().optional().describe('任務描述'),
        stage: z.enum(['START', 'DEV', 'QA', 'FINISH']).optional().describe('初始階段，預設 START'),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().describe('優先級，預設 MEDIUM'),
        dueDate: z.string().optional().describe('截止日 (ISO 格式，如 2024-12-31)'),
      },
      async ({ projectId, title, description, stage, priority, dueDate }) => {
        const ticketStage = (stage as Stage) ?? Stage.START
        const ticketPriority = (priority as Priority) ?? Priority.MEDIUM

        const lastTicket = await prisma.ticket.findFirst({
          where: { projectId, stage: ticketStage },
          orderBy: { order: 'desc' },
          select: { order: true },
        })
        const order = lastTicket ? lastTicket.order + 1 : 0

        const ticket = await prisma.ticket.create({
          data: {
            title: title.trim(),
            description: description?.trim() ?? null,
            stage: ticketStage,
            priority: ticketPriority,
            dueDate: dueDate ? new Date(dueDate) : null,
            order,
            projectId,
          },
          include: { subtasks: { orderBy: { order: 'asc' } } },
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }],
        }
      },
    )

    server.tool(
      'update_ticket',
      '更新任務欄位',
      {
        ticketId: z.string().describe('任務 ID'),
        title: z.string().optional().describe('新標題'),
        description: z.string().optional().describe('新描述'),
        stage: z.enum(['START', 'DEV', 'QA', 'FINISH']).optional().describe('新階段'),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().describe('新優先級'),
        dueDate: z.string().nullable().optional().describe('新截止日，null 表示移除'),
      },
      async ({ ticketId, title, description, stage, priority, dueDate }) => {
        const data: Record<string, unknown> = {}
        if (title !== undefined) data.title = title.trim()
        if (description !== undefined) data.description = description?.trim() ?? null
        if (stage !== undefined) data.stage = stage as Stage
        if (priority !== undefined) data.priority = priority as Priority
        if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null
        const ticket = await prisma.ticket.update({
          where: { id: ticketId },
          data,
          include: { subtasks: { orderBy: { order: 'asc' } } },
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }],
        }
      },
    )

    server.tool(
      'delete_ticket',
      '刪除任務',
      { ticketId: z.string().describe('任務 ID') },
      async ({ ticketId }) => {
        await prisma.ticket.delete({ where: { id: ticketId } })
        return {
          content: [{ type: 'text', text: `已刪除任務 ${ticketId}` }],
        }
      },
    )

    server.tool(
      'move_ticket',
      '移動任務到不同階段',
      {
        ticketId: z.string().describe('任務 ID'),
        stage: z.enum(['START', 'DEV', 'QA', 'FINISH']).describe('目標階段'),
      },
      async ({ ticketId, stage }) => {
        const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
        if (!ticket) {
          return { content: [{ type: 'text', text: `找不到任務 ${ticketId}` }], isError: true }
        }

        const lastTicket = await prisma.ticket.findFirst({
          where: { projectId: ticket.projectId, stage: stage as Stage },
          orderBy: { order: 'desc' },
          select: { order: true },
        })
        const order = lastTicket ? lastTicket.order + 1 : 0

        const updated = await prisma.ticket.update({
          where: { id: ticketId },
          data: { stage: stage as Stage, order },
          include: { subtasks: { orderBy: { order: 'asc' } } },
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }],
        }
      },
    )

    // ── Subtask tools ────────────────────────────────────────────

    server.tool(
      'list_subtasks',
      '列出任務的所有子任務',
      { ticketId: z.string().describe('任務 ID') },
      async ({ ticketId }) => {
        const subtasks = await prisma.subtask.findMany({
          where: { ticketId },
          orderBy: { order: 'asc' },
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(subtasks, null, 2) }],
        }
      },
    )

    server.tool(
      'create_subtask',
      '建立子任務',
      {
        ticketId: z.string().describe('任務 ID'),
        title: z.string().describe('子任務標題'),
      },
      async ({ ticketId, title }) => {
        const lastSubtask = await prisma.subtask.findFirst({
          where: { ticketId },
          orderBy: { order: 'desc' },
          select: { order: true },
        })
        const order = lastSubtask ? lastSubtask.order + 1 : 0

        const subtask = await prisma.subtask.create({
          data: { title: title.trim(), order, ticketId },
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(subtask, null, 2) }],
        }
      },
    )

    server.tool(
      'update_subtask',
      '更新子任務',
      {
        subtaskId: z.string().describe('子任務 ID'),
        title: z.string().optional().describe('新標題'),
        done: z.boolean().optional().describe('是否完成'),
      },
      async ({ subtaskId, title, done }) => {
        const data: Record<string, unknown> = {}
        if (title !== undefined) data.title = title.trim()
        if (done !== undefined) data.done = done
        const subtask = await prisma.subtask.update({
          where: { id: subtaskId },
          data,
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(subtask, null, 2) }],
        }
      },
    )

    server.tool(
      'delete_subtask',
      '刪除子任務',
      { subtaskId: z.string().describe('子任務 ID') },
      async ({ subtaskId }) => {
        await prisma.subtask.delete({ where: { id: subtaskId } })
        return {
          content: [{ type: 'text', text: `已刪除子任務 ${subtaskId}` }],
        }
      },
    )

    // ── Dashboard tool ───────────────────────────────────────────

    server.tool('get_dashboard', '取得今日概覽統計', async () => {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayEnd = new Date(todayStart)
      todayEnd.setDate(todayEnd.getDate() + 1)
      const weekEnd = new Date(todayStart)
      weekEnd.setDate(weekEnd.getDate() + 8)

      const notFinished = { stage: { not: Stage.FINISH } as const }

      const [totalProjects, totalTickets, overdue, todayDue, upcoming] = await Promise.all([
        prisma.project.count(),
        prisma.ticket.count(),
        prisma.ticket.count({ where: { ...notFinished, dueDate: { lt: todayStart } } }),
        prisma.ticket.count({ where: { ...notFinished, dueDate: { gte: todayStart, lt: todayEnd } } }),
        prisma.ticket.count({ where: { ...notFinished, dueDate: { gte: todayEnd, lt: weekEnd } } }),
      ])

      const dashboard = {
        totalProjects,
        totalTickets,
        overdue,
        todayDue,
        upcoming,
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(dashboard, null, 2) }],
      }
    })
  },
  {
    capabilities: {},
    serverInfo: { name: 'product-lifecycle', version: '2.0.0' },
  },
  { basePath: '/api' },
)

export { handler as GET, handler as POST, handler as DELETE }
