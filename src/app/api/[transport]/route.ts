import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Stage } from '@prisma/client'

const handler = createMcpHandler(
  (server) => {
    // ── Project tools ──────────────────────────────────────────

    server.tool('list_projects', '列出所有項目及工單統計', async () => {
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
      '取得項目詳情含所有工單',
      { projectId: z.string().describe('項目 ID') },
      async ({ projectId }) => {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: {
            tickets: {
              include: { assignee: true },
              orderBy: { order: 'asc' },
            },
          },
        })
        if (!project) {
          return { content: [{ type: 'text', text: `找不到項目 ${projectId}` }], isError: true }
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(project, null, 2) }],
        }
      },
    )

    server.tool(
      'create_project',
      '建立新項目',
      {
        name: z.string().describe('項目名稱'),
        description: z.string().optional().describe('項目描述'),
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
      '更新項目',
      {
        projectId: z.string().describe('項目 ID'),
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
      '刪除項目（cascade 刪除所有工單）',
      { projectId: z.string().describe('項目 ID') },
      async ({ projectId }) => {
        await prisma.project.delete({ where: { id: projectId } })
        return {
          content: [{ type: 'text', text: `已刪除項目 ${projectId}` }],
        }
      },
    )

    // ── Ticket tools ───────────────────────────────────────────

    server.tool(
      'list_tickets',
      '列出項目工單，可依階段篩選',
      {
        projectId: z.string().describe('項目 ID'),
        stage: z.enum(['START', 'DEV', 'QA', 'FINISH']).optional().describe('篩選階段'),
      },
      async ({ projectId, stage }) => {
        const where: { projectId: string; stage?: Stage } = { projectId }
        if (stage) where.stage = stage as Stage
        const tickets = await prisma.ticket.findMany({
          where,
          include: { assignee: true },
          orderBy: { order: 'asc' },
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(tickets, null, 2) }],
        }
      },
    )

    server.tool(
      'create_ticket',
      '在項目中建立工單',
      {
        projectId: z.string().describe('項目 ID'),
        title: z.string().describe('工單標題'),
        description: z.string().optional().describe('工單描述'),
        assigneeId: z.string().optional().describe('指派工程師 ID'),
        stage: z.enum(['START', 'DEV', 'QA', 'FINISH']).optional().describe('初始階段，預設 START'),
      },
      async ({ projectId, title, description, assigneeId, stage }) => {
        const ticketStage = (stage as Stage) ?? Stage.START

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
            order,
            projectId,
            assigneeId: assigneeId ?? null,
          },
          include: { assignee: true },
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }],
        }
      },
    )

    server.tool(
      'update_ticket',
      '更新工單欄位',
      {
        ticketId: z.string().describe('工單 ID'),
        title: z.string().optional().describe('新標題'),
        description: z.string().optional().describe('新描述'),
        stage: z.enum(['START', 'DEV', 'QA', 'FINISH']).optional().describe('新階段'),
        assigneeId: z.string().nullable().optional().describe('新指派工程師 ID，null 表示取消指派'),
      },
      async ({ ticketId, title, description, stage, assigneeId }) => {
        const data: Record<string, unknown> = {}
        if (title !== undefined) data.title = title.trim()
        if (description !== undefined) data.description = description?.trim() ?? null
        if (stage !== undefined) data.stage = stage as Stage
        if (assigneeId !== undefined) data.assigneeId = assigneeId
        const ticket = await prisma.ticket.update({
          where: { id: ticketId },
          data,
          include: { assignee: true },
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }],
        }
      },
    )

    server.tool(
      'delete_ticket',
      '刪除工單',
      { ticketId: z.string().describe('工單 ID') },
      async ({ ticketId }) => {
        await prisma.ticket.delete({ where: { id: ticketId } })
        return {
          content: [{ type: 'text', text: `已刪除工單 ${ticketId}` }],
        }
      },
    )

    server.tool(
      'move_ticket',
      '移動工單到不同階段',
      {
        ticketId: z.string().describe('工單 ID'),
        stage: z.enum(['START', 'DEV', 'QA', 'FINISH']).describe('目標階段'),
      },
      async ({ ticketId, stage }) => {
        const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
        if (!ticket) {
          return { content: [{ type: 'text', text: `找不到工單 ${ticketId}` }], isError: true }
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
          include: { assignee: true },
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }],
        }
      },
    )

    server.tool('get_dashboard', '取得全域統計概覽', async () => {
      const [projects, tickets, engineers] = await Promise.all([
        prisma.project.count(),
        prisma.ticket.groupBy({
          by: ['stage'],
          _count: { id: true },
        }),
        prisma.engineer.count(),
      ])

      const stageMap = Object.fromEntries(
        tickets.map((t) => [t.stage, t._count.id]),
      )

      const dashboard = {
        totalProjects: projects,
        totalEngineers: engineers,
        totalTickets: Object.values(stageMap).reduce((a, b) => a + b, 0),
        ticketsByStage: {
          START: stageMap.START ?? 0,
          DEV: stageMap.DEV ?? 0,
          QA: stageMap.QA ?? 0,
          FINISH: stageMap.FINISH ?? 0,
        },
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(dashboard, null, 2) }],
      }
    })

    // ── Engineer tools ─────────────────────────────────────────

    server.tool('list_engineers', '列出所有工程師及指派工單數', async () => {
      const engineers = await prisma.engineer.findMany({
        include: { _count: { select: { tickets: true } } },
        orderBy: { name: 'asc' },
      })
      return {
        content: [{ type: 'text', text: JSON.stringify(engineers, null, 2) }],
      }
    })

    server.tool(
      'create_engineer',
      '新增工程師',
      {
        name: z.string().describe('工程師姓名'),
        email: z.string().email().describe('電子郵件'),
        avatar: z.string().optional().describe('頭像 URL'),
      },
      async ({ name, email, avatar }) => {
        const engineer = await prisma.engineer.create({
          data: { name, email, avatar: avatar ?? null },
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(engineer, null, 2) }],
        }
      },
    )

    server.tool(
      'update_engineer',
      '更新工程師資料',
      {
        engineerId: z.string().describe('工程師 ID'),
        name: z.string().optional().describe('新姓名'),
        email: z.string().email().optional().describe('新電子郵件'),
        avatar: z.string().optional().describe('新頭像 URL'),
      },
      async ({ engineerId, name, email, avatar }) => {
        const data: Record<string, string> = {}
        if (name !== undefined) data.name = name
        if (email !== undefined) data.email = email
        if (avatar !== undefined) data.avatar = avatar
        const engineer = await prisma.engineer.update({
          where: { id: engineerId },
          data,
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(engineer, null, 2) }],
        }
      },
    )

    server.tool(
      'delete_engineer',
      '刪除工程師',
      { engineerId: z.string().describe('工程師 ID') },
      async ({ engineerId }) => {
        await prisma.engineer.delete({ where: { id: engineerId } })
        return {
          content: [{ type: 'text', text: `已刪除工程師 ${engineerId}` }],
        }
      },
    )
  },
  {
    capabilities: {},
    serverInfo: { name: 'product-lifecycle', version: '1.0.0' },
  },
  { basePath: '/api' },
)

export { handler as GET, handler as POST, handler as DELETE }
