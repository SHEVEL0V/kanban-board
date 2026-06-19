"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { taskEditableWhere } from "@/shared/lib/auth/board-access";
import { nextOrder } from "@/shared/lib/utils/ordering";
import { createChecklistItemSchema } from "@/features/tasks/schema/task-schema";

// Creates a new checklist item at the end of the task's checklist.
export const createChecklistItem = runAction({
  schema: createChecklistItemSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ taskId, boardId, content }, session) => {
    const task = await prisma.task.findFirst({
      where: taskEditableWhere(taskId, boardId, session.userId),
      select: {
        checklistItems: { orderBy: { order: "desc" }, take: 1, select: { order: true } },
      },
    });
    if (!task) return err(ErrorCode.NOT_FOUND);

    const item = await prisma.checklistItem.create({
      data: { taskId, content, order: nextOrder(task.checklistItems[0]?.order) },
      select: { id: true },
    });
    return ok(item);
  },
});
