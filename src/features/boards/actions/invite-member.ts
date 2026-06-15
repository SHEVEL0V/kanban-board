"use server";

import { prisma } from "@/shared/lib/prisma";
import { runAction } from "@/shared/lib/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/result";
import { CacheTags } from "@/shared/lib/cache-tags";
import { inviteMemberSchema } from "@/features/boards/schema/board-member-schema";

export const inviteMember = runAction({
  schema: inviteMemberSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ boardId, email }, session) => {
    const board = await prisma.board.findFirst({
      where: { id: boardId, ownerId: session.userId },
      select: { id: true },
    });

    if (!board) {
      return err(ErrorCode.NOT_FOUND);
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

    if (!user) {
      return err(ErrorCode.USER_NOT_FOUND);
    }

    if (user.id === session.userId) {
      return err(ErrorCode.VALIDATION);
    }

    const existing = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: user.id } },
      select: { id: true },
    });

    if (existing) {
      return err(ErrorCode.ALREADY_MEMBER);
    }

    await prisma.boardMember.create({ data: { boardId, userId: user.id } });

    return ok(undefined);
  },
});
