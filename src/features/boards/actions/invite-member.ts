"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { inviteMemberSchema } from "@/features/boards/schema/board-member-schema";

export const inviteMember = runAction({
  schema: inviteMemberSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ boardId, email, role }, session) => {
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

    await prisma.boardMember.create({ data: { boardId, userId: user.id, role } });

    return ok(undefined);
  },
});
