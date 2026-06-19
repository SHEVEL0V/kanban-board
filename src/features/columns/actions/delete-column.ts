"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardEditorFilter } from "@/shared/lib/auth/board-access";
import { deleteColumnSchema } from "@/features/columns/schema/column-schema";

export const deleteColumn = runAction({
  schema: deleteColumnSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  notify: ({ boardId }) => [boardId],
  handler: async ({ columnId, boardId }, session) => {
    const { count } = await prisma.column.deleteMany({
      where: { id: columnId, boardId, board: boardEditorFilter(session.userId) },
    });

    if (count === 0) {
      return err(ErrorCode.NOT_FOUND);
    }

    return ok(undefined);
  },
});
