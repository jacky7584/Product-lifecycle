import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  await prisma.subtask.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()

  // Default user
  const hashedPassword = await bcrypt.hash('123456', 10)
  await prisma.user.create({
    data: { name: 'Admin', email: 'admin@example.com', password: hashedPassword },
  })

  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 5)

  const project1 = await prisma.project.create({
    data: { name: 'E-Commerce Platform', description: 'Build a modern e-commerce platform with product catalog, shopping cart, and checkout flow.' },
  })

  await prisma.ticket.createMany({
    data: [
      { title: 'Design product listing page', description: 'Create wireframes and mockups for the product listing page with filters and sorting.', stage: 'FINISH', priority: 'HIGH', order: 0, projectId: project1.id },
      { title: 'Implement shopping cart API', description: 'Build REST API endpoints for adding, removing, and updating items in the shopping cart.', stage: 'QA', priority: 'HIGH', dueDate: today, order: 0, projectId: project1.id },
      { title: 'Build checkout flow UI', description: 'Implement the multi-step checkout process: shipping info, payment method, order review.', stage: 'DEV', priority: 'MEDIUM', dueDate: tomorrow, order: 0, projectId: project1.id },
      { title: 'Setup payment gateway integration', description: 'Integrate with Stripe for payment processing. Support credit card and bank transfer.', stage: 'DEV', priority: 'HIGH', dueDate: nextWeek, order: 1, projectId: project1.id },
      { title: 'Add product search functionality', description: 'Implement full-text search for products with autocomplete suggestions.', stage: 'START', priority: 'MEDIUM', dueDate: yesterday, order: 0, projectId: project1.id },
      { title: 'Order confirmation email', description: 'Send confirmation email with order details after successful checkout.', stage: 'START', priority: 'LOW', order: 1, projectId: project1.id },
    ],
  })

  const project2 = await prisma.project.create({
    data: { name: 'Mobile App Redesign', description: 'Redesign the mobile app with new UI/UX patterns and improved performance.' },
  })

  await prisma.ticket.createMany({
    data: [
      { title: 'User research and interviews', description: 'Conduct user interviews to identify pain points in the current app experience.', stage: 'FINISH', priority: 'HIGH', order: 0, projectId: project2.id },
      { title: 'New navigation structure', description: 'Design and implement the new bottom navigation with 5 main tabs.', stage: 'QA', priority: 'MEDIUM', dueDate: today, order: 0, projectId: project2.id },
      { title: 'Dark mode support', description: 'Add dark mode theme that follows system preferences with manual toggle option.', stage: 'DEV', priority: 'LOW', dueDate: nextWeek, order: 0, projectId: project2.id },
      { title: 'Performance optimization', description: 'Reduce app startup time by 50% and improve scroll performance on list views.', stage: 'START', priority: 'HIGH', dueDate: yesterday, order: 0, projectId: project2.id },
    ],
  })

  await prisma.project.create({
    data: { name: 'Internal Dashboard', description: 'Build an internal analytics dashboard for monitoring key business metrics.' },
  })

  console.log('Seed data created successfully!')
  console.log('  - Default user: admin@example.com / 123456')
  console.log('  - 3 Projects: E-Commerce Platform, Mobile App Redesign, Internal Dashboard')
  console.log('  - 10 Tickets with priorities and due dates')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
