"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";
import { deleteTaskSchema } from "@/features/tasks/schema/task-schema";

export const deleteTask = runAction({
  schema: deleteTaskSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ taskId, boardId }, session) => {
    const task = await prisma.task.findFirst({
      where: { id: taskId, column: { boardId, board: boardAccessFilter(session.userId) } },
      select: { title: true },
    });

    if (!task) {
      return err(ErrorCode.NOT_FOUND);
    }

    await prisma.task.delete({ where: { id: taskId } });

    await prisma.activity.create({
      data: { boardId, actorId: session.userId, action: "DELETED", taskTitle: task.title },
    });

    return ok(undefined);
  },
});
