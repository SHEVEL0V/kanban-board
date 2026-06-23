import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/shared/lib/db/prisma";
import { verifySession } from "@/shared/lib/auth/dal";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";
import { DUE_SOON_WINDOW_MS } from "@/features/columns/lib/task-filters";
import type { TaskPriority } from "@/generated/prisma/client";

const CACHE_TTL_S = 60;

type DueRow = {
  taskId: string;
  taskTitle: string;
  boardId: string;
  boardTitle: string;
  dueDate: string; // ISO string — survives JSON serialization
  status: "overdue" | "dueSoon";
};

type AssignedRow = {
  taskId: string;
  taskTitle: string;
  boardId: string;
  boardTitle: string;
  columnTitle: string;
  priority: TaskPriority;
};

type PendingRow = {
  taskId: string;
  taskTitle: string;
  boardId: string;
  boardTitle: string;
  assigneeName: string;
  completedAt: string; // ISO string
};

type CacheResult = { due: DueRow[]; assigned: AssignedRow[]; pending: PendingRow[] };

async function queryDb(userId: string): Promise<CacheResult> {
  const now = Date.now();

  const [dueTasks, assignedTasks, pendingTasks] = await Promise.all([
    prisma.task.findMany({
      where: {
        dueDate: { lte: new Date(now + DUE_SOON_WINDOW_MS) },
        column: { board: boardAccessFilter(userId) },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        column: { select: { boardId: true, board: { select: { title: true } } } },
      },
      orderBy: { dueDate: "asc" },
      take: 50,
    }),
    prisma.task.findMany({
      where: { assigneeId: userId },
      select: {
        id: true,
        title: true,
        priority: true,
        column: { select: { title: true, boardId: true, board: { select: { title: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.task.findMany({
      where: { status: "PENDING_REVIEW", assignedById: userId },
      select: {
        id: true,
        title: true,
        completedAt: true,
        assignee: { select: { name: true } },
        column: { select: { boardId: true, board: { select: { title: true } } } },
      },
      orderBy: { completedAt: "desc" },
      take: 20,
    }),
  ]);

  const due: DueRow[] = dueTasks.flatMap((task) => {
    if (task.dueDate === null) return [];
    return [
      {
        taskId: task.id,
        taskTitle: task.title,
        boardId: task.column.boardId,
        boardTitle: task.column.board.title,
        dueDate: task.dueDate.toISOString(),
        status: task.dueDate.getTime() < now ? ("overdue" as const) : ("dueSoon" as const),
      },
    ];
  });

  const assigned: AssignedRow[] = assignedTasks.map((task) => ({
    taskId: task.id,
    taskTitle: task.title,
    boardId: task.column.boardId,
    boardTitle: task.column.board.title,
    columnTitle: task.column.title,
    priority: task.priority,
  }));

  const pending: PendingRow[] = pendingTasks.flatMap((task) => {
    if (!task.assignee || !task.completedAt) return [];
    return [{
      taskId: task.id,
      taskTitle: task.title,
      boardId: task.column.boardId,
      boardTitle: task.column.board.title,
      assigneeName: task.assignee.name,
      completedAt: task.completedAt.toISOString(),
    }];
  });

  return { due, assigned, pending };
}

// Cached per user, TTL = 60 s. Single source for both SSR navigation and the
// client poll, so DB load scales with users (not open tabs).
export const fetchNotificationsCached = unstable_cache(
  (userId: string) => queryDb(userId),
  ["due-task-notifications"],
  { revalidate: CACHE_TTL_S },
);

// Re-hydrates ISO date strings (needed for JSON-safe caching) into Date objects.
export function mapNotifications({ due, assigned, pending = [] }: CacheResult) {
  return {
    dueNotifications: due.map((n) => ({ ...n, dueDate: new Date(n.dueDate) })),
    assignedTasks: assigned,
    pendingConfirmation: pending.map((p) => ({ ...p, completedAt: new Date(p.completedAt) })),
  };
}

export async function getDueTaskNotifications() {
  const { userId } = await verifySession();
  return mapNotifications(await fetchNotificationsCached(userId));
}

export type DueTaskNotification = Awaited<ReturnType<typeof getDueTaskNotifications>>["dueNotifications"][number];
export type AssignedTaskNotification = Awaited<ReturnType<typeof getDueTaskNotifications>>["assignedTasks"][number];
export type PendingConfirmation = Awaited<ReturnType<typeof getDueTaskNotifications>>["pendingConfirmation"][number];
