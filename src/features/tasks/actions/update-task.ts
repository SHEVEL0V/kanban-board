"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardEditorFilter } from "@/shared/lib/auth/board-access";
import { updateTaskSchema } from "@/features/tasks/schema/task-schema";

export const updateTask = runAction({
  schema: updateTaskSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  notify: ({ boardId }) => [boardId],
  handler: async (
    { taskId, boardId, title, description, priority, dueDate, assigneeId, labelIds },
    session,
  ) => {
    const updated = await prisma.$transaction(async (tx) => {
      // Verify access before updating (updateMany can't handle label set relation).
      const task = await tx.task.findFirst({
        where: { id: taskId, column: { boardId, board: boardEditorFilter(session.userId) } },
        select: { id: true, assigneeId: true, status: true },
      });
      if (!task) return false;

      const assigneeChanged = assigneeId !== task.assigneeId;
      const removingAssignee = assigneeChanged && !assigneeId;

      await tx.task.update({
        where: { id: taskId },
        data: {
          title,
          description: description ?? null,
          priority,
          dueDate,
          assigneeId: assigneeId ?? null,
          ...(assigneeChanged && {
            assignedById: assigneeId ? session.userId : null,
          }),
          // Reset pending status when assignee is removed.
          ...(removingAssignee && task.status === "PENDING_REVIEW" && {
            status: "ACTIVE",
            completedAt: null,
          }),
          labels: { set: (labelIds ?? []).map((id) => ({ id })) },
        },
      });

      await tx.activity.create({
        data: { boardId, actorId: session.userId, action: "UPDATED", taskTitle: title },
      });

      return true;
    });

    if (!updated) return err(ErrorCode.NOT_FOUND);
    return ok(undefined);
  },
});
