"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";
import { nextOrder } from "@/shared/lib/utils/ordering";
import { createTaskSchema } from "@/features/tasks/schema/task-schema";

export const createTask = runAction({
  schema: createTaskSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ columnId, boardId, title, description, priority, dueDate }, session) => {
    const column = await prisma.column.findFirst({
      where: { id: columnId, boardId, board: boardAccessFilter(session.userId) },
      select: {
        tasks: { orderBy: { order: "desc" }, take: 1, select: { order: true } },
      },
    });

    if (!column) {
      return err(ErrorCode.NOT_FOUND);
    }

    const task = await prisma.task.create({
      data: {
        columnId,
        title,
        description,
        priority,
        dueDate,
        order: nextOrder(column.tasks[0]?.order),
      },
      select: { id: true },
    });

    await prisma.activity.create({
      data: { boardId, actorId: session.userId, action: "CREATED", taskTitle: title },
    });

    return ok(task);
  },
});
