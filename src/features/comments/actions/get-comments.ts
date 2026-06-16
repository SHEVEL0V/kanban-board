"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ok } from "@/shared/lib/actions/result";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";
import { z } from "zod";

// Fetches comments for a single task; called lazily when a task dialog is opened.
async function queryComments(taskId: string, userId: string) {
  return prisma.comment.findMany({
    where: { taskId, task: { column: { board: boardAccessFilter(userId) } } },
    select: {
      id: true,
      content: true,
      authorId: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export const getComments = runAction({
  schema: z.object({ taskId: z.string().min(1) }),
  handler: async ({ taskId }, session) => ok(await queryComments(taskId, session.userId)),
});

export type CommentWithAuthor = Awaited<ReturnType<typeof queryComments>>[number];
