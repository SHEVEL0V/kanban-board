"use server";

import { prisma } from "@/shared/lib/prisma";
import { runAction } from "@/shared/lib/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/result";
import { CacheTags } from "@/shared/lib/cache-tags";
import { deleteTaskSchema } from "@/features/tasks/schema/task-schema";

export const deleteTask = runAction({
  schema: deleteTaskSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ taskId, boardId }, session) => {
    const { count } = await prisma.task.deleteMany({
      where: { id: taskId, column: { boardId, board: { ownerId: session.userId } } },
    });

    if (count === 0) {
      return err(ErrorCode.NOT_FOUND);
    }

    return ok(undefined);
  },
});
