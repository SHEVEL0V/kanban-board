import { z } from "zod";

const templateColumnSchema = z.object({
  title: z.string().min(1).max(100),
  order: z.number().int(),
  wipLimit: z.number().int().nullable().optional(),
  isCompletion: z.boolean().optional(),
});

export const createBoardSchema = z.object({
  title: z.string().trim().min(1).max(100),
  columns: z.array(templateColumnSchema).optional(),
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
