# Product Requirements Document: Product Feature Tracking System

## 1. Overview & Goals

### 1.1 Product Summary

The **Product Feature Tracking System** is a Kanban-style project management tool designed for engineering teams. It provides a visual board to track product features and work tickets through a defined lifecycle: **Start -> Dev -> QA -> Finish**. Users can create projects, add tickets with descriptions and image attachments, assign tickets to engineers, and drag tickets between lifecycle stages on a Kanban board.

### 1.2 Goals

- **Visibility**: Give teams a clear, real-time view of where every feature stands in the development lifecycle.
- **Simplicity**: Provide a lightweight, focused tool - four stages, drag-and-drop, no unnecessary complexity.
- **Speed**: Fast local-first experience with SQLite, zero external service dependencies.
- **Self-hosted**: A single deployable Next.js application with an embedded database - no separate backend service required.

### 1.3 Target Users

- Small to mid-size engineering teams (2-20 people) who need a simple feature tracking board.
- Product managers and tech leads who want lifecycle visibility without heavyweight project management tools.

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | **Next.js 14** (App Router) | Full-stack React framework with API routes, server components, and file-based routing |
| Language | **TypeScript** | Type safety across the entire codebase |
| Styling | **Tailwind CSS** | Utility-first CSS for rapid UI development |
| UI Components | **shadcn/ui** | High-quality, accessible component primitives |
| ORM | **Prisma** | Type-safe database access with auto-generated client |
| Database | **SQLite** | Zero-config embedded database, ideal for self-hosted deployments |
| Drag & Drop | **@dnd-kit** | Modern, accessible, performant drag-and-drop library for React |
| File Storage | **Local filesystem** (`public/uploads/`) | Simple file-based storage for image attachments |

---

## 3. Data Model

### 3.1 Entity Relationship Diagram

```
Project 1---* Ticket *---1 Engineer
                |
                1
                |
                *
            Attachment
```

### 3.2 Schema Definitions

#### Project

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique identifier |
| name | String | required, max 100 chars | Project name |
| description | String? | optional, max 500 chars | Brief project description |
| createdAt | DateTime | auto, default now | Creation timestamp |
| updatedAt | DateTime | auto, updated on change | Last update timestamp |

#### Ticket

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique identifier |
| title | String | required, max 200 chars | Ticket title |
| description | String? | optional, text | Detailed description (supports plain text) |
| stage | Enum | START, DEV, QA, FINISH | Current lifecycle stage |
| order | Int | required | Sort order within its stage column |
| projectId | String | FK -> Project.id, cascade delete | Parent project |
| assigneeId | String? | FK -> Engineer.id, set null on delete | Assigned engineer |
| createdAt | DateTime | auto, default now | Creation timestamp |
| updatedAt | DateTime | auto, updated on change | Last update timestamp |

#### Engineer

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique identifier |
| name | String | required, max 100 chars | Display name |
| email | String | required, unique | Email address |
| avatar | String? | optional | Avatar image URL |

#### Attachment

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique identifier |
| filename | String | required | Original filename |
| url | String | required | Stored file path (relative to public/) |
| ticketId | String | FK -> Ticket.id, cascade delete | Parent ticket |
| createdAt | DateTime | auto, default now | Upload timestamp |

### 3.3 Prisma Schema

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Stage {
  START
  DEV
  QA
  FINISH
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tickets     Ticket[]
}

model Ticket {
  id          String       @id @default(cuid())
  title       String
  description String?
  stage       Stage        @default(START)
  order       Int
  projectId   String
  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assigneeId  String?
  assignee    Engineer?    @relation(fields: [assigneeId], references: [id], onDelete: SetNull)
  attachments Attachment[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([projectId])
  @@index([assigneeId])
}

model Engineer {
  id      String   @id @default(cuid())
  name    String
  email   String   @unique
  avatar  String?
  tickets Ticket[]
}

model Attachment {
  id        String   @id @default(cuid())
  filename  String
  url       String
  ticketId  String
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

---

## 4. Pages & UI Design

### 4.1 Page Map

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home / Project List | Lists all projects as cards with a "Create Project" button |
| `/projects/[id]` | Kanban Board | 4-column board for a single project |

### 4.2 Home Page (`/`)

**Layout:**
- Top navigation bar with app title "Product Tracker"
- "New Project" button (top right)
- Grid of project cards (responsive: 1 col mobile, 2 col tablet, 3 col desktop)

**Project Card:**
- Project name (bold)
- Description (truncated to 2 lines)
- Ticket count summary (e.g., "3 Start / 5 Dev / 2 QA / 1 Finish")
- Created date
- Click card -> navigate to `/projects/[id]`

**Create Project Dialog (modal):**
- Fields: Name (required), Description (optional)
- Buttons: Cancel, Create

### 4.3 Kanban Board Page (`/projects/[id]`)

**Layout:**
- Header: Back arrow, Project name, "Edit Project" button, "Add Ticket" button
- Four columns side by side, each with a header label and ticket count:
  - **Start** (gray)
  - **Dev** (blue)
  - **QA** (yellow)
  - **Finish** (green)
- Each column is a vertical droppable zone containing ticket cards
- Columns scroll vertically if tickets overflow; the board scrolls horizontally on small screens

**Ticket Card (in column):**
- Title
- Assignee avatar + name (or "Unassigned")
- Attachment count icon (if > 0)
- Click card -> open Ticket Detail Modal

**Drag & Drop Behavior:**
- Tickets can be dragged between any of the 4 columns
- Tickets can be reordered within a column
- Visual drag overlay shows a semi-transparent copy of the ticket card
- Drop zones highlight on hover
- On drop: PATCH request updates the ticket's `stage` and `order`

### 4.4 Create / Edit Ticket Modal

**Fields:**
- Title (required, text input)
- Description (optional, textarea)
- Assignee (optional, dropdown of engineers)
- Stage (dropdown: Start / Dev / QA / Finish - defaults to Start for new tickets)
- Image Attachments (file upload area, accepts image files, multiple allowed)

**Buttons:**
- Cancel, Save (create) / Update (edit)

### 4.5 Ticket Detail Modal

**Content:**
- Title (editable inline or via edit button)
- Stage badge (colored)
- Assignee name + avatar
- Description (full text)
- Attachments section: thumbnail grid of images, click to view full size, delete button per attachment
- Metadata: Created date, Last updated
- Action buttons: Edit, Delete (with confirmation)

### 4.6 Engineer Management

For v0, engineers are managed via a simple settings page or seeded via a Prisma seed script. A minimal UI is provided:

| Route | Page | Description |
|-------|------|-------------|
| `/engineers` | Engineer List | Table of engineers with Add/Edit/Delete |

---

## 5. API Endpoints

All API routes live under `/api/` using Next.js Route Handlers.

### 5.1 Projects

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | `/api/projects` | List all projects | - | `Project[]` |
| POST | `/api/projects` | Create a project | `{ name, description? }` | `Project` |
| GET | `/api/projects/[id]` | Get project with tickets | - | `Project & { tickets: Ticket[] }` |
| PATCH | `/api/projects/[id]` | Update a project | `{ name?, description? }` | `Project` |
| DELETE | `/api/projects/[id]` | Delete project + its tickets | - | `{ success: true }` |

### 5.2 Tickets

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | `/api/projects/[id]/tickets` | List tickets for a project | - | `Ticket[]` |
| POST | `/api/projects/[id]/tickets` | Create a ticket | `{ title, description?, assigneeId?, stage? }` | `Ticket` |
| GET | `/api/tickets/[id]` | Get single ticket with attachments | - | `Ticket & { attachments: Attachment[] }` |
| PATCH | `/api/tickets/[id]` | Update ticket fields | `{ title?, description?, stage?, order?, assigneeId? }` | `Ticket` |
| DELETE | `/api/tickets/[id]` | Delete a ticket | - | `{ success: true }` |
| PATCH | `/api/tickets/reorder` | Batch update stage + order for drag-and-drop | `{ tickets: { id, stage, order }[] }` | `{ success: true }` |

### 5.3 Engineers

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | `/api/engineers` | List all engineers | - | `Engineer[]` |
| POST | `/api/engineers` | Create an engineer | `{ name, email, avatar? }` | `Engineer` |
| PATCH | `/api/engineers/[id]` | Update an engineer | `{ name?, email?, avatar? }` | `Engineer` |
| DELETE | `/api/engineers/[id]` | Delete an engineer | - | `{ success: true }` |

### 5.4 Attachments

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| POST | `/api/tickets/[id]/attachments` | Upload image attachment | `FormData { file }` | `Attachment` |
| DELETE | `/api/attachments/[id]` | Delete an attachment | - | `{ success: true }` |

---

## 6. User Flows

### 6.1 Create a Project and Add Tickets

1. User lands on Home page (`/`), sees project list (empty on first use).
2. User clicks "New Project", fills in name and description, clicks "Create".
3. Project card appears in the list. User clicks the card.
4. Kanban board opens with 4 empty columns.
5. User clicks "Add Ticket", fills in title, description, selects assignee, clicks "Save".
6. Ticket card appears in the "Start" column.

### 6.2 Move a Ticket Through the Lifecycle

1. User is on the Kanban board for a project.
2. User drags a ticket card from "Start" to "Dev".
3. The ticket snaps into the "Dev" column. A PATCH request updates `stage` to `DEV` and recalculates `order` values.
4. Later, user drags from "Dev" to "QA", then from "QA" to "Finish".

### 6.3 View and Edit a Ticket

1. User clicks a ticket card on the board.
2. Ticket Detail Modal opens showing all ticket information.
3. User clicks "Edit", modifies the description, changes the assignee, uploads an image.
4. User clicks "Update". Modal refreshes with new data.

### 6.4 Manage Engineers

1. User navigates to `/engineers`.
2. User adds engineers by entering name and email.
3. Engineers are now available in the assignee dropdown when creating/editing tickets.

---

## 7. V0 Scope

### 7.1 In Scope (V0)

- Project CRUD (create, read, update, delete)
- Ticket CRUD with all fields (title, description, stage, assignee, attachments)
- Kanban board with 4 fixed columns (Start, Dev, QA, Finish)
- Drag-and-drop between columns and within columns using @dnd-kit
- Image attachment upload and display
- Engineer CRUD (basic management)
- Ticket assignment to engineers
- Responsive layout (desktop-first, mobile-usable)
- SQLite database with Prisma ORM
- Seed script with sample data for development

### 7.2 Out of Scope (V0)

- User authentication and authorization
- Role-based access control
- Real-time collaboration (WebSocket / live updates)
- Comments or activity log on tickets
- Due dates, priorities, or labels on tickets
- Search and filtering
- Notifications (email or in-app)
- Custom lifecycle stages (stages are fixed at 4)
- Multiple boards per project
- Reporting or analytics dashboards
- CI/CD integration
- Audit trail / history of changes

---

## 8. Project Structure

```
product-lifecycle/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── dev.db                (generated)
├── public/
│   └── uploads/              (attachment storage)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                          (Home - Project List)
│   │   ├── projects/
│   │   │   └── [id]/
│   │   │       └── page.tsx                  (Kanban Board)
│   │   ├── engineers/
│   │   │   └── page.tsx                      (Engineer Management)
│   │   └── api/
│   │       ├── projects/
│   │       │   ├── route.ts                  (GET list, POST create)
│   │       │   └── [id]/
│   │       │       ├── route.ts              (GET, PATCH, DELETE)
│   │       │       └── tickets/
│   │       │           └── route.ts          (GET list, POST create)
│   │       ├── tickets/
│   │       │   ├── [id]/
│   │       │   │   ├── route.ts              (GET, PATCH, DELETE)
│   │       │   │   └── attachments/
│   │       │   │       └── route.ts          (POST upload)
│   │       │   └── reorder/
│   │       │       └── route.ts              (PATCH batch reorder)
│   │       ├── engineers/
│   │       │   ├── route.ts                  (GET list, POST create)
│   │       │   └── [id]/
│   │       │       └── route.ts              (PATCH, DELETE)
│   │       └── attachments/
│   │           └── [id]/
│   │               └── route.ts              (DELETE)
│   ├── components/
│   │   ├── ui/                               (shadcn/ui primitives)
│   │   ├── ProjectCard.tsx
│   │   ├── CreateProjectDialog.tsx
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx
│   │   ├── TicketCard.tsx
│   │   ├── TicketDetailModal.tsx
│   │   ├── TicketFormModal.tsx
│   │   ├── EngineerTable.tsx
│   │   └── AttachmentGrid.tsx
│   ├── lib/
│   │   ├── prisma.ts                         (Prisma client singleton)
│   │   └── utils.ts                          (shared utilities)
│   └── types/
│       └── index.ts                          (shared TypeScript types)
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── next.config.js
├── .env                                      (DATABASE_URL)
└── PRD.md
```

---

## 9. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Initial page load | < 1s (local SQLite, no network DB latency) |
| Drag-and-drop latency | Optimistic UI update; persist in background |
| Max attachment size | 5 MB per image |
| Supported image formats | JPEG, PNG, GIF, WebP |
| Browser support | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| Accessibility | Keyboard-navigable board, ARIA labels on interactive elements |
