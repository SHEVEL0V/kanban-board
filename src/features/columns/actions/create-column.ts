"use server";

import { prisma } from "@/shared/lib/prisma";
import { runAction } from "@/shared/lib/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/result";
import { CacheTags } from "@/shared/lib/cache-tags";
import { boardAccessFilter } from "@/shared/lib/board-access";
import { nextOrder } from "@/shared/lib/ordering";
import { createColumnSchema } from "@/features/columns/schema/column-schema";

export const createColumn = runAction({
  schema: createColumnSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ boardId, title }, session) => {
    const board = await prisma.board.findFirst({
      where: { id: boardId, ...boardAccessFilter(session.userId) },
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
