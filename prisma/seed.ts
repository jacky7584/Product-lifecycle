import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  await prisma.attachment.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.project.deleteMany()
  await prisma.engineer.deleteMany()
  await prisma.user.deleteMany()

  // Default user
  const hashedPassword = await bcrypt.hash('123456', 10)
  await prisma.user.create({
    data: { name: 'Admin', email: 'admin@example.com', password: hashedPassword },
  })

  const alice = await prisma.engineer.create({ data: { name: 'Alice Chen', email: 'alice@example.com' } })
  const bob = await prisma.engineer.create({ data: { name: 'Bob Wang', email: 'bob@example.com' } })
  const carol = await prisma.engineer.create({ data: { name: 'Carol Lin', email: 'carol@example.com' } })
  const dave = await prisma.engineer.create({ data: { name: 'Dave Liu', email: 'dave@example.com' } })

  const project1 = await prisma.project.create({
    data: { name: 'E-Commerce Platform', description: 'Build a modern e-commerce platform with product catalog, shopping cart, and checkout flow.' },
  })

  await prisma.ticket.createMany({
    data: [
      { title: 'Design product listing page', description: 'Create wireframes and mockups for the product listing page with filters and sorting.', stage: 'FINISH', order: 0, projectId: project1.id, assigneeId: alice.id },
      { title: 'Implement shopping cart API', description: 'Build REST API endpoints for adding, removing, and updating items in the shopping cart.', stage: 'QA', order: 0, projectId: project1.id, assigneeId: bob.id },
      { title: 'Build checkout flow UI', description: 'Implement the multi-step checkout process: shipping info, payment method, order review.', stage: 'DEV', order: 0, projectId: project1.id, assigneeId: carol.id },
      { title: 'Setup payment gateway integration', description: 'Integrate with Stripe for payment processing. Support credit card and bank transfer.', stage: 'DEV', order: 1, projectId: project1.id, assigneeId: dave.id },
      { title: 'Add product search functionality', description: 'Implement full-text search for products with autocomplete suggestions.', stage: 'START', order: 0, projectId: project1.id, assigneeId: alice.id },
      { title: 'Order confirmation email', description: 'Send confirmation email with order details after successful checkout.', stage: 'START', order: 1, projectId: project1.id, assigneeId: null },
    ],
  })

  const project2 = await prisma.project.create({
    data: { name: 'Mobile App Redesign', description: 'Redesign the mobile app with new UI/UX patterns and improved performance.' },
  })

  await prisma.ticket.createMany({
    data: [
      { title: 'User research and interviews', description: 'Conduct user interviews to identify pain points in the current app experience.', stage: 'FINISH', order: 0, projectId: project2.id, assigneeId: carol.id },
      { title: 'New navigation structure', description: 'Design and implement the new bottom navigation with 5 main tabs.', stage: 'QA', order: 0, projectId: project2.id, assigneeId: alice.id },
      { title: 'Dark mode support', description: 'Add dark mode theme that follows system preferences with manual toggle option.', stage: 'DEV', order: 0, projectId: project2.id, assigneeId: bob.id },
      { title: 'Performance optimization', description: 'Reduce app startup time by 50% and improve scroll performance on list views.', stage: 'START', order: 0, projectId: project2.id, assigneeId: dave.id },
    ],
  })

  await prisma.project.create({
    data: { name: 'Internal Dashboard', description: 'Build an internal analytics dashboard for monitoring key business metrics.' },
  })

  console.log('Seed data created successfully!')
  console.log('  - Default user: admin@example.com / 123456')
  console.log('  - 4 Engineers: Alice, Bob, Carol, Dave')
  console.log('  - 3 Projects: E-Commerce Platform, Mobile App Redesign, Internal Dashboard')
  console.log('  - 10 Tickets distributed across lifecycle stages')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
