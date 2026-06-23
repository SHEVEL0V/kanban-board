"use server";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ok } from "@/shared/lib/actions/result";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";

const searchSelect = {
  id: true,
  title: true,
  priority: true,
  column: {
    select: {
      title: true,
      board: { select: { id: true, title: true } },
    },
  },
} satisfies Prisma.TaskSelect;

export type SearchResult = Prisma.TaskGetPayload<{ select: typeof searchSelect }>;

// Full-text search across all tasks the user can access, ordered by recency.
export const searchTasks = runAction({
  schema: z.object({ query: z.string().min(1).max(200) }),
  handler: async ({ query }, session) => {
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
        column: { board: boardAccessFilter(session.userId) },
      },
      select: searchSelect,
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    return ok(tasks);
  },
});
