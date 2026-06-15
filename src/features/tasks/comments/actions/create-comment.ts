"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";
import { createCommentSchema } from "@/features/tasks/comments/schema/comment-schema";

export const createComment = runAction({
  schema: createCommentSchema,
  revalidate: ({ boardId }) => [CacheTags.board(boardId)],
  handler: async ({ taskId, boardId, content }, session) => {
    const task = await prisma.task.findFirst({
      where: { id: taskId, column: { boardId, board: boardAccessFilter(session.userId) } },
      select: { id: true },
    });

    if (!task) {
      return err(ErrorCode.NOT_FOUND);
    }

    const comment = await prisma.comment.create({
      data: { taskId, authorId: session.userId, content },
      select: { id: true },
    });

    return ok(comment);
  },
});
