"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { updateMemberRoleSchema } from "@/features/boards/schema/board-member-schema";

// Owner-only: change an existing member's role between EDITOR and VIEWER.
export const updateMemberRole = runAction({
  schema: updateMemberRoleSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ boardId, memberId, role }, session) => {
    const board = await prisma.board.findFirst({
      where: { id: boardId, ownerId: session.userId },
      select: { id: true },
    });
    if (!board) return err(ErrorCode.FORBIDDEN);

    await prisma.boardMember.update({
      where: { id: memberId, boardId },
      data: { role },
    });

    return ok(undefined);
  },
});
