"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";
import { toggleChecklistItemSchema } from "@/features/tasks/schema/task-schema";

// Marks a checklist item as done or not done.
export const toggleChecklistItem = runAction({
  schema: toggleChecklistItemSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ id, taskId, boardId, done }, session) => {
    const item = await prisma.checklistItem.findFirst({
      where: { id, task: { id: taskId, column: { boardId, board: boardAccessFilter(session.userId) } } },
      select: { id: true },
    });
    if (!item) return err(ErrorCode.NOT_FOUND);

    await prisma.checklistItem.update({ where: { id }, data: { done } });
    return ok(undefined);
  },
});
