"use server";

import { z } from "zod";
import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardEditorFilter } from "@/shared/lib/auth/board-access";

// Moves an ARCHIVED task back to ACTIVE; clears completion/archive timestamps.
export const restoreTask = runAction({
  schema: z.object({ taskId: z.string().min(1), boardId: z.string().min(1) }),
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  notify: ({ boardId }) => [boardId],
  handler: async ({ taskId, boardId }, session) => {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        status: "ARCHIVED",
        column: { boardId, board: boardEditorFilter(session.userId) },
      },
      select: { id: true },
    });

    if (!task) return err(ErrorCode.NOT_FOUND);

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "ACTIVE",
        completedAt: null,
        archivedAt: null,
        archivedById: null,
      },
    });

    return ok(undefined);
  },
});
