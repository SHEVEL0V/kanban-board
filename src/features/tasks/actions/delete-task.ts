"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardEditorFilter } from "@/shared/lib/auth/board-access";
import { deleteTaskSchema } from "@/features/tasks/schema/task-schema";

export const deleteTask = runAction({
  schema: deleteTaskSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  notify: ({ boardId }) => [boardId],
  handler: async ({ taskId, boardId }, session) => {
    const deleted = await prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, column: { boardId, board: boardEditorFilter(session.userId) } },
        select: { title: true },
      });

      if (!task) return null;

      await tx.task.delete({ where: { id: taskId } });

      await tx.activity.create({
        data: { boardId, actorId: session.userId, action: "DELETED", taskTitle: task.title },
      });

      return true;
    });

    if (!deleted) return err(ErrorCode.NOT_FOUND);
    return ok(undefined);
  },
});
