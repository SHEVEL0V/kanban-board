"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardEditorFilter } from "@/shared/lib/auth/board-access";
import { nextOrder } from "@/shared/lib/utils/ordering";
import { createColumnSchema } from "@/features/columns/schema/column-schema";

export const createColumn = runAction({
  schema: createColumnSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  notify: ({ boardId }) => [boardId],
  handler: async ({ boardId, title }, session) => {
    const board = await prisma.board.findFirst({
      where: { id: boardId, ...boardEditorFilter(session.userId) },
      select: {
        columns: { orderBy: { order: "desc" }, take: 1, select: { order: true } },
      },
    });

    if (!board) {
      return err(ErrorCode.NOT_FOUND);
    }

    const column = await prisma.column.create({
      data: { boardId, title, order: nextOrder(board.columns[0]?.order) },
      select: { id: true },
    });

    return ok(column);
  },
});
