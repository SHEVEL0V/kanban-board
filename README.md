# Kanban Board

A multi-board task management app.

[![Kanban Board](https://img.shields.io/badge/Live-Demo-blue)](https://kanban-808925023135.europe-west1.run.app)

### Demo User

For testing purposes, you can use the following credentials:

- **Name**: Demo User
- **Email**: `demo@example.com`
- **Password**: `password123`

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Language**: TypeScript
- **Styling**: MUI 9
- **Database**: PostgreSQL, Prisma 7
- **Features**: Drag-and-drop (@dnd-kit), AI Assist (Gemini API), Auth (JWT/bcrypt)

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── boards/
│       ├── layout.tsx            # authenticated shell (AppShell + notifications)
│       ├── page.tsx              # board list
│       └── [boardId]/page.tsx    # single board view
│
├── features/                     # domain features
│   ├── activity/                 # immutable board event log
│   ├── ai-assist/                # Gemini REST API suggestions
│   ├── auth/                     # login / register / logout
│   ├── boards/                   # CRUD + membership
│   ├── columns/                  # CRUD + reorder + views (kanban/list/calendar)
│   ├── comments/                 # create / delete / get (lazy-loaded per task)
│   ├── notifications/            # overdue / due-soon bell (cached 60 s)
│   ├── profile/                  # update profile + change password
│   └── tasks/                    # CRUD + move (drag-and-drop)
│
│   # Each feature follows:
│   # actions/   — server mutations (runAction: auth → zod → $transaction → revalidate)
│   # queries/   — server reads
│   # schema/    — zod validation schemas
│   # lib/       — pure helpers / hooks
│   └── ui/      — React components
│
├── shared/
│   ├── i18n/                     # cookie-based locale, en/uk dictionaries
│   ├── lib/
│   │   ├── actions/              # runAction factory, Result type, useActionFeedback
│   │   ├── auth/                 # session (JWT), dal (verifySession), rate-limit
│   │   ├── db/prisma.ts          # Prisma client singleton
│   │   ├── env.ts                # Zod-validated process.env (fails fast at startup)
│   │   ├── routing/routes.ts     # typed route helpers
│   │   └── utils/                # date, ordering
│   └── ui/
│       ├── components/           # AppShell, dialogs, ErrorSnackbar
│       └── theme.ts              # MUI theme + light/dark
│
└── proxy.ts                      # Next.js middleware: session check + redirects
```

## Development

### Setup

1. Copy `.env.example` to `.env` and fill in the required variables.
2. Ensure PostgreSQL is running.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run migrations and seed the database:
   ```bash
   npx prisma migrate dev
   ```
