"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";
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

    await prisma.activity.create({
      data: { boardId, actorId: session.userId, action: "UPDATED", taskTitle: title },
    });

    return ok(undefined);
  },
});
