import { z } from "zod";
import { TaskPriority } from "@/generated/prisma/client";

export const generateSuggestionsSchema = z.object({
  boardId: z.string().min(1),
});

export type GenerateSuggestionsInput = z.infer<typeof generateSuggestionsSchema>;

export const suggestionSchema = z.object({
  taskId: z.string().min(1),
  taskTitle: z.string(),
  reason: z.string(),
  suggestedColumnId: z.string().min(1).optional(),
  suggestedPriority: z.nativeEnum(TaskPriority).optional(),
});

export type Suggestion = z.infer<typeof suggestionSchema>;

export const suggestionsResponseSchema = z.array(suggestionSchema);
