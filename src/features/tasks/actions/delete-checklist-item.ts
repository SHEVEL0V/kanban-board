"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardEditorFilter } from "@/shared/lib/auth/board-access";
import { deleteChecklistItemSchema } from "@/features/tasks/schema/task-schema";

// Deletes a checklist item after verifying board access.
export const deleteChecklistItem = runAction({
  schema: deleteChecklistItemSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ id, taskId, boardId }, session) => {
    const item = await prisma.checklistItem.findFirst({
      where: { id, task: { id: taskId, column: { boardId, board: boardEditorFilter(session.userId) } } },
      select: { id: true },
    });
    if (!item) return err(ErrorCode.NOT_FOUND);

    await prisma.checklistItem.delete({ where: { id } });
    return ok(undefined);
  },
});
