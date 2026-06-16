"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";
import { deleteCommentSchema } from "@/features/comments/schema/comment-schema";

export const deleteComment = runAction({
  schema: deleteCommentSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ commentId, boardId }, session) => {
    const { count } = await prisma.comment.deleteMany({
      where: {
        id: commentId,
        authorId: session.userId,
        task: { column: { boardId, board: boardAccessFilter(session.userId) } },
      },
    });

    if (count === 0) {
      return err(ErrorCode.NOT_FOUND);
    }

    return ok(undefined);
  },
});
