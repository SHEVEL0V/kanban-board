"use server";

import { prisma } from "@/shared/lib/prisma";
import { runAction } from "@/shared/lib/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/result";
import { CacheTags } from "@/shared/lib/cache-tags";
import { orderAt } from "@/shared/lib/ordering";
import { moveTaskSchema } from "@/features/tasks/schema/task-schema";

export const moveTask = runAction({
  schema: moveTaskSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ taskId, boardId, columnId, orderedIds }, session) => {
    const column = await prisma.column.findFirst({
      where: { id: columnId, boardId, board: { ownerId: session.userId } },
      select: { tasks: { select: { id: true } } },
    });

    if (!column) {
      return err(ErrorCode.NOT_FOUND);
    }

    const destinationTaskIds = new Set(column.tasks.map((task) => task.id));
    destinationTaskIds.add(taskId);
    if (!orderedIds.every((id) => destinationTaskIds.has(id))) {
      return err(ErrorCode.NOT_FOUND);
    }

    await prisma.$transaction([
      prisma.task.update({ where: { id: taskId }, data: { columnId } }),
      ...orderedIds.map((id, index) =>
        prisma.task.update({ where: { id }, data: { order: orderAt(index) } }),
      ),
    ]);

    return ok(undefined);
  },
});
