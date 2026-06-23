"use server";

import type { Prisma, TaskStatus } from "@/generated/prisma/client";
import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { logActivity } from "@/shared/lib/actions/log-activity";
import { columnEditableWhere, taskEditableWhere } from "@/shared/lib/auth/board-access";
import { isSubset, orderAt } from "@/shared/lib/utils/ordering";
import { moveTaskSchema } from "@/features/tasks/schema/task-schema";

export const moveTask = runAction({
  schema: moveTaskSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  // Delta event: other clients patch their board state directly instead of
  // refetching the whole board on every move.
  notify: ({ boardId, taskId, columnId, orderedIds }) => [
    { boardId, type: "task-moved", taskId, columnId, orderedIds },
  ],
  handler: async ({ taskId, boardId, columnId, orderedIds }, session) => {
    const sourceTask = await prisma.task.findFirst({
      where: taskEditableWhere(taskId, boardId, session.userId),
      select: {
        title: true,
        columnId: true,
        assigneeId: true,
        status: true,
        column: { select: { title: true, isCompletion: true } },
      },
    });

    if (!sourceTask) {
      return err(ErrorCode.NOT_FOUND);
    }

    const column = await prisma.column.findFirst({
      where: columnEditableWhere(columnId, boardId, session.userId),
      select: { title: true, isCompletion: true, tasks: { select: { id: true } } },
    });

    if (!column) {
      return err(ErrorCode.NOT_FOUND);
    }

    const destinationTaskIds = new Set(column.tasks.map((task) => task.id));
    destinationTaskIds.add(taskId);
    if (!isSubset(orderedIds, destinationTaskIds)) {
      return err(ErrorCode.NOT_FOUND);
    }

    // Determine status transition when moving between columns.
    const isChangingColumn = sourceTask.columnId !== columnId;
    let statusUpdate: { status?: TaskStatus; completedAt?: Date | null } = {};
    if (isChangingColumn) {
      if (column.isCompletion && sourceTask.assigneeId) {
        statusUpdate = { status: "PENDING_REVIEW", completedAt: new Date() };
      } else if (sourceTask.column.isCompletion && sourceTask.status === "PENDING_REVIEW") {
        statusUpdate = { status: "ACTIVE", completedAt: null };
      }
    }

    const operations: Prisma.PrismaPromise<unknown>[] = [
      prisma.task.update({ where: { id: taskId }, data: { columnId, ...statusUpdate } }),
      ...orderedIds.map((id, index) =>
        prisma.task.update({ where: { id }, data: { order: orderAt(index) } }),
      ),
    ];

    if (isChangingColumn) {
      operations.push(
        logActivity(prisma, {
          boardId,
          actorId: session.userId,
          action: "MOVED",
          taskTitle: sourceTask.title,
          fromColumn: sourceTask.column.title,
          toColumn: column.title,
        }),
      );
    }

    await prisma.$transaction(operations);

    return ok(undefined);
  },
});
