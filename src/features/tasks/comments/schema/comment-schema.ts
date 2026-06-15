import { z } from "zod";

export const createCommentSchema = z.object({
  taskId: z.string().min(1),
  boardId: z.string().min(1),
  content: z.string().trim().min(1).max(1000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const deleteCommentSchema = z.object({
  commentId: z.string().min(1),
  boardId: z.string().min(1),
});

export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
