import { z } from "zod";
import { TaskPriority } from "@/generated/prisma/client";

export const createTaskSchema = z.object({
  columnId: z.string().min(1),
  boardId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.date().nullable(),
  assigneeId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  taskId: z.string().min(1),
  boardId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  priority: z.nativeEnum(TaskPriority),
  dueDate: z.date().nullable(),
  assigneeId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const deleteTaskSchema = z.object({
  taskId: z.string().min(1),
  boardId: z.string().min(1),
});

export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;

export const moveTaskSchema = z.object({
  taskId: z.string().min(1),
  boardId: z.string().min(1),
  columnId: z.string().min(1),
  orderedIds: z.array(z.string().min(1)).min(1),
});

export type MoveTaskInput = z.infer<typeof moveTaskSchema>;

export const createChecklistItemSchema = z.object({
  taskId: z.string().min(1),
  boardId: z.string().min(1),
  content: z.string().trim().min(1).max(500),
});

export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;

export const toggleChecklistItemSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  boardId: z.string().min(1),
  done: z.boolean(),
});

export type ToggleChecklistItemInput = z.infer<typeof toggleChecklistItemSchema>;

export const deleteChecklistItemSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  boardId: z.string().min(1),
});

export type DeleteChecklistItemInput = z.infer<typeof deleteChecklistItemSchema>;
