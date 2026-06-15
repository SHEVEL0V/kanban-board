"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";
import { orderAt } from "@/shared/lib/utils/ordering";
import { reorderColumnsSchema } from "@/features/columns/schema/column-schema";

export const reorderColumns = runAction({
  schema: reorderColumnsSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ boardId, orderedIds }, session) => {
    const board = await prisma.board.findFirst({
      where: { id: boardId, ...boardAccessFilter(session.userId) },
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
