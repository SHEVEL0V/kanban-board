"use server";

import { prisma } from "@/shared/lib/prisma";
import { runAction } from "@/shared/lib/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/result";
import { CacheTags } from "@/shared/lib/cache-tags";
import { updateColumnSchema } from "@/features/columns/schema/column-schema";

export const updateColumn = runAction({
  schema: updateColumnSchema,
  handler: async ({ columnId, title, wipLimit }, session) => {
    const column = await prisma.column.findFirst({
      where: { id: columnId, board: { ownerId: session.userId } },
      select: { boardId: true },
    });

    if (!column) {
      return err(ErrorCode.NOT_FOUND);
    }

    await prisma.column.update({ where: { id: columnId }, data: { title, wipLimit } });

    return ok({ boardId: column.boardId });
  },
  revalidate: (_input, output) => [CacheTags.board(output.boardId)],
});
