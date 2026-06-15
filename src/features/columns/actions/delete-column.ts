"use server";

import { prisma } from "@/shared/lib/prisma";
import { runAction } from "@/shared/lib/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/result";
import { CacheTags } from "@/shared/lib/cache-tags";
import { boardAccessFilter } from "@/shared/lib/board-access";
import { deleteColumnSchema } from "@/features/columns/schema/column-schema";

export const deleteColumn = runAction({
  schema: deleteColumnSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ columnId, boardId }, session) => {
    const { count } = await prisma.column.deleteMany({
      where: { id: columnId, boardId, board: boardAccessFilter(session.userId) },
    });

    if (count === 0) {
      return err(ErrorCode.NOT_FOUND);
    }

    return ok(undefined);
  },
});
