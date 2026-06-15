"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
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
