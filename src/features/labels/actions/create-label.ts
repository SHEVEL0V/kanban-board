"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardEditableWhere } from "@/shared/lib/auth/board-access";
import { createLabelSchema } from "@/features/labels/schema/label-schema";

export const createLabel = runAction({
  schema: createLabelSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ boardId, title, color }, session) => {
    const board = await prisma.board.findFirst({
      where: boardEditableWhere(boardId, session.userId),
      select: { id: true },
    });
    if (!board) return err(ErrorCode.NOT_FOUND);

    // Return existing label if name already taken (idempotent).
    const existing = await prisma.label.findUnique({
      where: { boardId_title: { boardId, title } },
      select: { id: true, title: true, color: true },
    });
    if (existing) return ok(existing);

    const label = await prisma.label.create({
      data: { boardId, title, color },
      select: { id: true, title: true, color: true },
    });
    return ok(label);
  },
});
