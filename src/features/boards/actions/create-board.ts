"use server";

import { prisma } from "@/shared/lib/prisma";
import { runAction } from "@/shared/lib/run-action";
import { ok } from "@/shared/lib/result";
import { CacheTags } from "@/shared/lib/cache-tags";
import { createBoardSchema } from "@/features/boards/schema/board-schema";

export const createBoard = runAction({
  schema: createBoardSchema,
  revalidate: () => [CacheTags.boards()],
  handler: async ({ title }, session) => {
    const board = await prisma.board.create({
      data: { title, ownerId: session.userId },
      select: { id: true },
    });

    return ok(board);
  },
});
