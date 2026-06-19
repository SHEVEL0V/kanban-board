"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardEditorFilter } from "@/shared/lib/auth/board-access";
import { updateLabelSchema } from "@/features/labels/schema/label-schema";

export const updateLabel = runAction({
  schema: updateLabelSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ labelId, boardId, title, color }, session) => {
    const label = await prisma.label.findFirst({
      where: { id: labelId, board: boardEditorFilter(session.userId) },
      select: { id: true },
    });
    if (!label) return err(ErrorCode.NOT_FOUND);

    await prisma.label.update({ where: { id: labelId }, data: { title, color } });
    return ok(undefined);
  },
});
