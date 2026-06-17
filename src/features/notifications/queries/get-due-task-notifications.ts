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

type CacheResult = { due: DueRow[]; assigned: AssignedRow[] };

async function queryDb(userId: string): Promise<CacheResult> {
  const now = Date.now();

  const [dueTasks, assignedTasks] = await Promise.all([
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

  return { due, assigned };
}

// In-memory path: Next.js per-instance cache, TTL = 60 s per user.
const fetchWithNextCache = unstable_cache(
  (userId: string) => queryDb(userId),
  ["due-task-notifications"],
  { revalidate: CACHE_TTL_S },
);

// Cached per user, refreshed every 60 s — avoids a DB query on every /boards/* navigation.
export async function getDueTaskNotifications() {
  const { userId } = await verifySession();
  const { due, assigned } = await fetchWithNextCache(userId);
  return {
    dueNotifications: due.map((n) => ({ ...n, dueDate: new Date(n.dueDate) })),
    assignedTasks: assigned,
  };
}

export type DueTaskNotification = Awaited<ReturnType<typeof getDueTaskNotifications>>["dueNotifications"][number];
export type AssignedTaskNotification = Awaited<ReturnType<typeof getDueTaskNotifications>>["assignedTasks"][number];
