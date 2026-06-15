import { z } from "zod";

export const createColumnSchema = z.object({
  boardId: z.string().min(1),
  title: z.string().trim().min(1).max(100),
});

export type CreateColumnInput = z.infer<typeof createColumnSchema>;

export const updateColumnSchema = z.object({
  columnId: z.string().min(1),
  title: z.string().trim().min(1).max(100),
  wipLimit: z.number().int().positive().nullable(),
});

export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;

export const deleteColumnSchema = z.object({
  columnId: z.string().min(1),
  boardId: z.string().min(1),
});

export type DeleteColumnInput = z.infer<typeof deleteColumnSchema>;

export const reorderColumnsSchema = z.object({
  boardId: z.string().min(1),
  orderedIds: z.array(z.string().min(1)).min(1),
});

export type ReorderColumnsInput = z.infer<typeof reorderColumnsSchema>;
