"use server";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";
import { orderAt } from "@/shared/lib/utils/ordering";
import { moveTaskSchema } from "@/features/tasks/schema/task-schema";

export const moveTask = runAction({
  schema: moveTaskSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ taskId, boardId, columnId, orderedIds }, session) => {
    const sourceTask = await prisma.task.findFirst({
      where: { id: taskId, column: { boardId, board: boardAccessFilter(session.userId) } },
      select: { title: true, columnId: true, column: { select: { title: true } } },
    });

    if (!sourceTask) {
      return err(ErrorCode.NOT_FOUND);
    }

    const column = await prisma.column.findFirst({
      where: { id: columnId, boardId, board: boardAccessFilter(session.userId) },
      select: { title: true, tasks: { select: { id: true } } },
    });

    if (!column) {
      return err(ErrorCode.NOT_FOUND);
    }

    const destinationTaskIds = new Set(column.tasks.map((task) => task.id));
    destinationTaskIds.add(taskId);
    if (!orderedIds.every((id) => destinationTaskIds.has(id))) {
      return err(ErrorCode.NOT_FOUND);
    }

    const operations: Prisma.PrismaPromise<unknown>[] = [
      prisma.task.update({ where: { id: taskId }, data: { columnId } }),
      ...orderedIds.map((id, index) =>
        prisma.task.update({ where: { id }, data: { order: orderAt(index) } }),
      ),
    ];

    if (sourceTask.columnId !== columnId) {
      operations.push(
        prisma.activity.create({
          data: {
            boardId,
            actorId: session.userId,
            action: "MOVED",
            taskTitle: sourceTask.title,
            fromColumn: sourceTask.column.title,
            toColumn: column.title,
          },
        }),
      );
    }

    await prisma.$transaction(operations);

    return ok(undefined);
  },
});
