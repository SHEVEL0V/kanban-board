import { z } from "zod";
import { TaskPriority } from "@/generated/prisma/client";

export const createTaskSchema = z.object({
  columnId: z.string().min(1),
  boardId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.date().nullable(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  taskId: z.string().min(1),
  boardId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  priority: z.nativeEnum(TaskPriority),
  dueDate: z.date().nullable(),
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
