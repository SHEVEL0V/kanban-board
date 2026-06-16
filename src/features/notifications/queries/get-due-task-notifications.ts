import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/shared/lib/db/prisma";
import { verifySession } from "@/shared/lib/auth/dal";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";
import { DUE_SOON_WINDOW_MS } from "@/features/columns/lib/task-filters";

// Date objects become strings after JSON serialization in the Next.js data cache,
// so we store ISO strings here and rehydrate in the public wrapper below.
const fetchNotificationsForUser = unstable_cache(
  async (userId: string) => {
    const now = Date.now();

    const tasks = await prisma.task.findMany({
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
    });

    return tasks.flatMap((task) => {
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
  },
  ["due-task-notifications"],
  { revalidate: 60 },
);

// Cached per user, refreshed every 60 s — avoids a DB query on every /boards/* navigation.
export async function getDueTaskNotifications() {
  const { userId } = await verifySession();
  const results = await fetchNotificationsForUser(userId);
  return results.map((n) => ({ ...n, dueDate: new Date(n.dueDate) }));
}

export type DueTaskNotification = Awaited<ReturnType<typeof getDueTaskNotifications>>[number];
