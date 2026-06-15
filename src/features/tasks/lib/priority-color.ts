import { TaskPriority } from "@/generated/prisma/browser";

// Shared between the priority chip and the card's accent border so both stay in sync.
export const PRIORITY_COLOR: Record<TaskPriority, "default" | "warning" | "error"> = {
  [TaskPriority.LOW]: "default",
  [TaskPriority.MEDIUM]: "warning",
  [TaskPriority.HIGH]: "error",
};
