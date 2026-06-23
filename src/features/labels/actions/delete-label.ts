"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardEditableWhere } from "@/shared/lib/auth/board-access";
import { deleteLabelSchema } from "@/features/labels/schema/label-schema";

export const deleteLabel = runAction({
  schema: deleteLabelSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ labelId, boardId }, session) => {
    const label = await prisma.label.findFirst({
      where: { id: labelId, board: boardEditableWhere(boardId, session.userId) },
      select: { id: true },
    });
    if (!label) return err(ErrorCode.NOT_FOUND);

    await prisma.label.delete({ where: { id: labelId } });
    return ok(undefined);
  },
});
