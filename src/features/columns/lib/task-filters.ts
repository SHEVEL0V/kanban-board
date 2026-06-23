import { TaskPriority } from "@/generated/prisma/browser";

export type DueDateFilter = "all" | "overdue" | "dueSoon" | "noDueDate";

export type TaskFilters = {
  search: string;
  priority: TaskPriority | "all";
  dueDate: DueDateFilter;
  assigneeId: string | "all";
  labelId: string | "all";
};

export const EMPTY_TASK_FILTERS: TaskFilters = {
  search: "",
  priority: "all",
  dueDate: "all",
  assigneeId: "all",
  labelId: "all",
};

export const DUE_SOON_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function hasActiveFilters(filters: TaskFilters): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.priority !== "all" ||
    filters.dueDate !== "all" ||
    filters.assigneeId !== "all" ||
    filters.labelId !== "all"
  );
}

type FilterableTask = {
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: Date | null;
  assignee: { id: string } | null;
  labels: { id: string }[];
};

export function taskMatchesFilters(task: FilterableTask, filters: TaskFilters): boolean {
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

  if (filters.assigneeId !== "all") {
    if (task.assignee?.id !== filters.assigneeId) return false;
  }

  if (filters.labelId !== "all") {
    if (!task.labels.some((l) => l.id === filters.labelId)) return false;
  }

  return true;
}
