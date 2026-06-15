# Kanban Board

A multi-board Kanban app built with Next.js (App Router), Prisma/PostgreSQL and MUI.

## Features

- Email/password auth with sessions (JWT in cookies)
- Multiple boards with member invites and access control
- Columns with WIP limits, drag-and-drop tasks (@dnd-kit)
- Tasks with priority, due dates, descriptions and comments
- Board, list and calendar views with search/priority/due-date filters
- Activity log per board
- In-app notifications for overdue/upcoming due dates
- AI Assist: Gemini-powered suggestions for rebalancing tasks
- Ukrainian/English UI (cookie-based locale) and light/dark theme

## Getting started

1. Copy `.env.example` to `.env` and fill in the values:
   - `DATABASE_URL` — PostgreSQL connection string
   - `SESSION_SECRET` — random secret for signing session cookies (`openssl rand -base64 32`)
   - `GEMINI_API_KEY` / `GEMINI_MODEL` — required for the AI Assist feature
2. Start a local PostgreSQL instance:
   ```bash
   docker compose up -d
   ```
3. Install dependencies and apply database migrations:
   ```bash
   npm install
   npx prisma migrate deploy
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — start the production server
- `npm run lint` — run ESLint

## Project structure

```
prisma/
  schema.prisma          # User, Board, BoardMember, Column, Task, Comment, Activity

src/
  app/
    (auth)/login, register   # auth pages
    boards/page.tsx           # board list (dashboard)
    boards/[boardId]/page.tsx # single board view
    boards/layout.tsx          # authenticated shell (user + notifications)
  proxy.ts                # Next.js proxy: auth redirects (replaces middleware.ts)

  shared/
    lib/
      actions/            # runAction factory, Result/ok/err, cache tags, action feedback hook
      auth/               # session (JWT), DAL (verifySession/getCurrentUser), boardAccessFilter
      db/                 # Prisma client singleton
      routing/            # typed route helpers
      utils/              # date + ordering helpers
    i18n/                 # locale context, dictionaries (en/uk)
    ui/
      components/         # AppShell, ConfirmDialog, ErrorSnackbar, FormErrorAlert, TitleDialog
      theme.ts, theme-registry.tsx

  features/
    auth/                 # login/register/logout
    profile/              # update profile, change password, user menu
    boards/               # CRUD, members/invites, board list & header
    columns/              # CRUD, reorder, filters, board/list/calendar views
    tasks/                # CRUD, move, priority/due-date badges, task dialog
      comments/           # create/delete comments
    activity/             # per-board activity log
    notifications/        # due-date notifications (bell + dialog)
    ai-assist/            # Gemini-powered task/priority suggestions

  generated/prisma/       # generated Prisma client (gitignored)
```

See `CLAUDE.md` for a detailed breakdown of each feature's files and conventions.
