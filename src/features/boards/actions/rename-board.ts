"use server";

import { prisma } from "@/shared/lib/prisma";
import { runAction } from "@/shared/lib/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/result";
import { CacheTags } from "@/shared/lib/cache-tags";
import { renameBoardSchema } from "@/features/boards/schema/board-schema";

export const renameBoard = runAction({
  schema: renameBoardSchema,
  revalidate: ({ boardId }) => [CacheTags.boards(), CacheTags.board(boardId)],
  handler: async ({ boardId, title }, session) => {
    const { count } = await prisma.board.updateMany({
      where: { id: boardId, ownerId: session.userId },
      data: { title },
    });

    if (count === 0) {
      return err(ErrorCode.NOT_FOUND);
    }

    return ok(undefined);
  },
});
