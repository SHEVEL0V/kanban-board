"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardEditorFilter } from "@/shared/lib/auth/board-access";
import { updateColumnSchema } from "@/features/columns/schema/column-schema";

export const updateColumn = runAction({
  schema: updateColumnSchema,
  handler: async ({ columnId, title, wipLimit, isCompletion }, session) => {
    const column = await prisma.column.findFirst({
      where: { id: columnId, board: boardEditorFilter(session.userId) },
      select: { boardId: true },
    });

    if (!column) {
      return err(ErrorCode.NOT_FOUND);
    }

    await prisma.column.update({ where: { id: columnId }, data: { title, wipLimit, isCompletion } });

    return ok({ boardId: column.boardId });
  },
  revalidate: (_input, output) => [CacheTags.board(output.boardId)],
});
