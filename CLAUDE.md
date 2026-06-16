@AGENTS.md

# Project overview

Kanban Board — a multi-board task management app.

- **Stack**: Next.js 16 (App Router), React 19, TypeScript, MUI 9, Prisma 7 + PostgreSQL, @dnd-kit for drag-and-drop.
- **Auth**: email/password with bcrypt, JWT session cookies (`src/shared/lib/auth/session.ts`, `dal.ts`), route protection via `src/proxy.ts` (not `middleware.ts`).
- **Structure**: feature-based folders under `src/features/<feature>/{schema,actions,queries,ui,lib}`.
- **Server actions**: built via the `runAction` factory (`src/shared/lib/actions/run-action.ts`) — auth check → zod validation → handler → `revalidatePath`. Results use the `ok`/`err`/`ErrorCode` pattern from `src/shared/lib/actions/result.ts`. Mutating actions that also write an `Activity` row wrap both operations in `prisma.$transaction`.
- **Access control**: `boardAccessFilter(userId)` (`src/shared/lib/auth/board-access.ts`) is the reusable Prisma where-fragment for owner-or-member board access.
- **Env validation**: `src/shared/lib/env.ts` — Zod-parsed `process.env` at module load; fails fast at startup if `SESSION_SECRET` (<32 chars) or `DATABASE_URL` is missing.
- **i18n**: cookie-based locale via `useDictionary()`, dictionaries in `src/shared/i18n/dictionaries/{en,uk}.json`.
- **AI Assist**: `src/features/ai-assist/` calls the Gemini REST API directly (no SDK); requires `GEMINI_API_KEY`/`GEMINI_MODEL` env vars.
- **Notifications**: `src/features/notifications/` computes overdue/due-soon tasks; result cached per user via `unstable_cache` (60 s TTL) to avoid a DB query on every `/boards/*` navigation.
- **Testing/CI**: none currently set up — verification is done via `tsc`/`eslint` and manual Playwright checks.

# Architecture

## Data model (`prisma/schema.prisma`)

- **User** — email/password (bcrypt), has `boards` (owned), `boardMemberships`, `activities`, `comments`.
- **Board** — `ownerId` + `members: BoardMember[]` (many-to-many with `User` via `BoardMember`, unique on `[boardId, userId]`), `columns: Column[]`, `activities: Activity[]`.
- **Column** — belongs to a `Board`, ordered via `order: Int`, optional `wipLimit`, has `tasks: Task[]`. Index: `[boardId, order]`.
- **Task** — belongs to a `Column`, ordered via `order: Int`, `priority` (`TaskPriority`: LOW/MEDIUM/HIGH), optional `dueDate`/`description`, has `comments: Comment[]`. No assignee field yet. Indexes: `[columnId, order]`, `[dueDate]`.
- **Comment** — belongs to `Task` + `author: User`. Index: `[taskId, createdAt]`.
- **Activity** — immutable per-board event log (`ActivityAction`: CREATED/UPDATED/MOVED/DELETED). Stores `taskTitle`/`fromColumn`/`toColumn` as snapshots (not FKs) so entries survive task/column deletion. Index: `[boardId, createdAt]`.

Prisma client is generated to `src/generated/prisma` (gitignored), accessed via `@/generated/prisma`. Client instance: `src/shared/lib/db/prisma.ts`.

## Routing (`src/app`)

- `app/page.tsx` — root, redirects based on session (handled by `src/proxy.ts`).
- `app/(auth)/login`, `app/(auth)/register` — auth pages, shared `(auth)/layout.tsx`.
- `app/boards/page.tsx` — board list (dashboard).
- `app/boards/[boardId]/page.tsx` — single board view.
- `app/boards/layout.tsx` — authenticated shell: loads `getCurrentUser()` + `getDueTaskNotifications()`, renders `AppShell`.
- `src/proxy.ts` — Next.js 16 proxy (replaces `middleware.ts`), guards `/boards/*`, redirects authenticated users away from `/login`/`/register`, and handles `/`.

## Shared layer (`src/shared`)

- `lib/actions/` — server action infrastructure:
  - `run-action.ts` — `runAction` factory: auth check → zod validation → handler → `revalidatePath`.
  - `result.ts` — `ok`/`err`/`ErrorCode` result type used by all actions/queries.
  - `cache-tags.ts` — cache tag helpers (paths) for `revalidatePath` calls.
  - `use-action-feedback.ts` — client hook to surface action errors via `ErrorSnackbar`.
- `lib/auth/` — `session.ts` (JWT cookie sign/verify via `jose`), `dal.ts` (`verifySession()`/`getCurrentUser()`, cached per request via `React.cache`), `board-access.ts` (`boardAccessFilter(userId)` — Prisma where-fragment for owner-or-member access), `rate-limit.ts` (in-memory fixed-window limiter; `getClientIp` prefers `x-real-ip` over `x-forwarded-for` last entry to prevent spoofing).
- `lib/env.ts` — Zod-validated env vars; imported by `session.ts`, `prisma.ts`, `gemini-client.ts`. Fails at module load if required vars are absent.
- `lib/db/prisma.ts` — Prisma client singleton (pg adapter).
- `lib/routing/routes.ts` — typed route helpers (e.g. `routes.board(boardId)`).
- `lib/utils/` — `date.ts`, `ordering.ts` (fractional/sequential ordering helpers for drag-and-drop).
- `i18n/` — `dictionary-context.tsx` (React context, cookie-based locale), `get-dictionary.ts`, `set-locale.ts`, `dictionaries/{en,uk}.json`.
- `ui/components/` — `app-shell.tsx` (top nav/layout shell), `confirm-dialog.tsx`, `error-snackbar.tsx`, `form-error-alert.tsx`, `title-dialog.tsx`.
- `ui/theme.ts`, `ui/theme-registry.tsx` — MUI theme + light/dark mode setup.

## Features (`src/features/<feature>/{schema,actions,queries,lib,ui}`)

- **auth** — `login`, `register`, `logout` actions (`actions/`), zod schemas (`schema/auth-schema.ts`), `login-form.tsx`/`register-form.tsx`.
- **profile** — `update-profile`, `change-password` actions; `profile-dialog.tsx`, `user-menu.tsx` (header dropdown with logout/theme/locale).
- **boards** — CRUD actions (`create-board`, `rename-board`, `delete-board`), membership (`invite-member`, `remove-member`), queries (`get-boards`, `get-board`); UI: `board-list.tsx`, `board-card.tsx`, `board-header.tsx`, `board-members-dialog.tsx`.
- **columns** — CRUD + `reorder-columns` actions; `lib/task-filters.ts` (search/priority/due-date filters, exports `DUE_SOON_WINDOW_MS`), `lib/board-view.ts`, `lib/calendar-grid.ts`; UI: `board-view.tsx` (toolbar + view switcher), `column-list.tsx`, `column.tsx`, `column-settings-dialog.tsx`, `add-column-button.tsx`, `board-filters.tsx`, `view-switcher.tsx`, plus per-view renderers `task-list-view.tsx`/`task-list-row.tsx` and `task-calendar-view.tsx`/`task-calendar-item.tsx`.
- **tasks** — `create-task`, `update-task`, `delete-task`, `move-task` actions (create/update/delete wrapped in `$transaction` together with the `Activity` write); `lib/priority-color.ts`, `lib/use-task-card-state.ts`; UI: `task-card.tsx`, `task-badges.tsx` (priority/due-date chips), `task-dialog.tsx`/`task-dialogs.tsx`, `add-task-button.tsx`. `getBoard` does **not** load comments — they are fetched lazily by `CommentsSection`.
- **comments** — top-level feature (`src/features/comments/`). `create-comment`, `delete-comment`, `get-comments` actions; `comments-section.tsx` is self-contained: fetches its own comments on mount (via `getComments`) and refetches after each mutation. Uses a generation counter in a `useRef` to discard out-of-order responses.
- **activity** — `get-activity-log` query, `lib/activity-label.ts` (i18n label formatting per `ActivityAction`), `activity-dialog.tsx`.
- **notifications** — `get-due-task-notifications` query (computes overdue/due-soon tasks across all of a user's boards; result cached 60 s via `unstable_cache` per user, no separate DB model), `notification-bell.tsx` (badge in `AppShell`), `notification-dialog.tsx`.
- **ai-assist** — `generate-suggestions` action (calls Gemini REST API via `lib/gemini-client.ts`, builds context with `lib/build-board-summary.ts`, validated with `schema/ai-assist-schema.ts`); UI: `ai-assist-button.tsx`/`ai-assist-dialog.tsx` (apply suggestions via existing `moveTask`/`updateTask` actions).

## Drag-and-drop & ordering

`@dnd-kit/core` + `@dnd-kit/sortable` drive column/task reordering in `board-view.tsx`/`column-list.tsx`/`column.tsx`; persisted order changes go through `reorder-columns`/`move-task` actions, using `lib/utils/ordering.ts` to compute new `order` values.
