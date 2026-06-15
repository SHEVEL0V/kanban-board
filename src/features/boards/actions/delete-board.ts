"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { deleteBoardSchema } from "@/features/boards/schema/board-schema";

export const deleteBoard = runAction({
  schema: deleteBoardSchema,
  revalidate: () => [CacheTags.boards()],
  handler: async ({ boardId }, session) => {
    const { count } = await prisma.board.deleteMany({
      where: { id: boardId, ownerId: session.userId },
    });

    if (count === 0) {
      return err(ErrorCode.NOT_FOUND);
    }

    return ok(undefined);
  },
});
