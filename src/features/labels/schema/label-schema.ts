import { z } from "zod";

export const createLabelSchema = z.object({
  boardId: z.string().min(1),
  title: z.string().trim().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#6366f1"),
});

export const updateLabelSchema = z.object({
  labelId: z.string().min(1),
  boardId: z.string().min(1),
  title: z.string().trim().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export const deleteLabelSchema = z.object({
  labelId: z.string().min(1),
  boardId: z.string().min(1),
});
