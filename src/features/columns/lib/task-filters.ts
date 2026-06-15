import type { Task } from "@/generated/prisma/client";
import { TaskPriority } from "@/generated/prisma/browser";

export type DueDateFilter = "all" | "overdue" | "dueSoon" | "noDueDate";

export type TaskFilters = {
  search: string;
  priority: TaskPriority | "all";
  dueDate: DueDateFilter;
};

export const EMPTY_TASK_FILTERS: TaskFilters = { search: "", priority: "all", dueDate: "all" };

const DUE_SOON_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function hasActiveFilters(filters: TaskFilters): boolean {
  return filters.search.trim() !== "" || filters.priority !== "all" || filters.dueDate !== "all";
}

export function taskMatchesFilters(task: Task, filters: TaskFilters): boolean {
  const search = filters.search.trim().toLowerCase();
  if (search) {
    const haystack = `${task.title} ${task.description ?? ""}`.toLowerCase();
    if (!haystack.includes(search)) return false;
  }

  if (filters.priority !== "all" && task.priority !== filters.priority) return false;

  if (filters.dueDate !== "all") {
    if (filters.dueDate === "noDueDate") return task.dueDate === null;
    if (task.dueDate === null) return false;

    const now = Date.now();
    const dueTime = task.dueDate.getTime();
    if (filters.dueDate === "overdue") return dueTime < now;
    if (filters.dueDate === "dueSoon") return dueTime >= now && dueTime <= now + DUE_SOON_WINDOW_MS;
  }

  return true;
}
