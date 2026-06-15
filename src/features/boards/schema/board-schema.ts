import { z } from "zod";

export const createBoardSchema = z.object({
  title: z.string().trim().min(1).max(100),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;

export const renameBoardSchema = z.object({
  boardId: z.string().min(1),
  title: z.string().trim().min(1).max(100),
});

export type RenameBoardInput = z.infer<typeof renameBoardSchema>;

export const deleteBoardSchema = z.object({
  boardId: z.string().min(1),
});

export type DeleteBoardInput = z.infer<typeof deleteBoardSchema>;
