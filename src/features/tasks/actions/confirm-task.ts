"use server";

import { z } from "zod";
import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";

// Archives a PENDING_REVIEW task; only the original assigner or board owner may confirm.
export const confirmTask = runAction({
  schema: z.object({ taskId: z.string().min(1), boardId: z.string().min(1) }),
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  notify: ({ boardId }) => [boardId],
  handler: async ({ taskId, boardId }, session) => {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        status: "PENDING_REVIEW",
        column: { boardId, board: boardAccessFilter(session.userId) },
      },
      select: {
        title: true,
        assignedById: true,
        assigneeId: true,
        column: { select: { board: { select: { ownerId: true } } } },
      },
    });

    if (!task) return err(ErrorCode.NOT_FOUND);

    // Self-assigned: assignedById may be null for tasks created before tracking was added.
    const isSelfAssigned = task.assigneeId === session.userId &&
      (task.assignedById === null || task.assignedById === session.userId);

    const canConfirm =
      isSelfAssigned ||
      task.assignedById === session.userId ||
      task.column.board.ownerId === session.userId;

    if (!canConfirm) return err(ErrorCode.FORBIDDEN);

    await prisma.$transaction([
      prisma.task.update({
        where: { id: taskId },
        data: { status: "ARCHIVED", archivedAt: new Date(), archivedById: session.userId },
      }),
      prisma.activity.create({
        data: { boardId, actorId: session.userId, action: "UPDATED", taskTitle: task.title },
      }),
    ]);

    return ok(undefined);
  },
});
