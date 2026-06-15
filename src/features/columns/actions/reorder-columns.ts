"use server";

import { prisma } from "@/shared/lib/prisma";
import { runAction } from "@/shared/lib/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/result";
import { CacheTags } from "@/shared/lib/cache-tags";
import { orderAt } from "@/shared/lib/ordering";
import { reorderColumnsSchema } from "@/features/columns/schema/column-schema";

export const reorderColumns = runAction({
  schema: reorderColumnsSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ boardId, orderedIds }, session) => {
    const board = await prisma.board.findFirst({
      where: { id: boardId, ownerId: session.userId },
      select: { columns: { select: { id: true } } },
    });

    if (!board) {
      return err(ErrorCode.NOT_FOUND);
    }

    const boardColumnIds = new Set(board.columns.map((column) => column.id));
    if (!orderedIds.every((id) => boardColumnIds.has(id))) {
      return err(ErrorCode.NOT_FOUND);
    }

    await prisma.$transaction(
      orderedIds.map((columnId, index) =>
        prisma.column.update({
          where: { id: columnId },
          data: { order: orderAt(index) },
        }),
      ),
    );

    return ok(undefined);
  },
});
