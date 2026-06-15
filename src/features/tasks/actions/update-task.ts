"use server";

import { prisma } from "@/shared/lib/prisma";
import { runAction } from "@/shared/lib/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/result";
import { CacheTags } from "@/shared/lib/cache-tags";
import { boardAccessFilter } from "@/shared/lib/board-access";
import { updateTaskSchema } from "@/features/tasks/schema/task-schema";

export const updateTask = runAction({
  schema: updateTaskSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ taskId, boardId, title, description, priority, dueDate }, session) => {
    const { count } = await prisma.task.updateMany({
      where: { id: taskId, column: { boardId, board: boardAccessFilter(session.userId) } },
      data: { title, description: description ?? null, priority, dueDate },
    });

    if (count === 0) {
      return err(ErrorCode.NOT_FOUND);
    }

    return ok(undefined);
  },
});
