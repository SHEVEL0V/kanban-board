"use server";

import { prisma } from "@/shared/lib/prisma";
import { runAction } from "@/shared/lib/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/result";
import { CacheTags } from "@/shared/lib/cache-tags";
import { removeMemberSchema } from "@/features/boards/schema/board-member-schema";

export const removeMember = runAction({
  schema: removeMemberSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ boardId, memberId }, session) => {
    const member = await prisma.boardMember.findFirst({
      where: { id: memberId, boardId },
      select: { userId: true, board: { select: { ownerId: true } } },
    });

    if (!member) {
      return err(ErrorCode.NOT_FOUND);
    }

    const isOwner = member.board.ownerId === session.userId;
    const isSelf = member.userId === session.userId;

    if (!isOwner && !isSelf) {
      return err(ErrorCode.FORBIDDEN);
    }

    await prisma.boardMember.delete({ where: { id: memberId } });

    return ok(undefined);
  },
});
