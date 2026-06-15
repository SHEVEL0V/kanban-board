import type { TaskPriority } from "@/generated/prisma/client";

type BoardSummaryInput = {
  title: string;
  columns: {
    id: string;
    title: string;
    wipLimit: number | null;
    tasks: { id: string; title: string; priority: TaskPriority; dueDate: Date | null }[];
  }[];
};

// Compact text description of the board's state for the LLM prompt: column
// WIP limits/occupancy and per-task priority/due date/current column.
export function buildBoardSummary(board: BoardSummaryInput): string {
  const columnsSummary = board.columns
    .map((column) => {
      const wip = column.wipLimit !== null ? `${column.tasks.length}/${column.wipLimit}` : `${column.tasks.length}`;
      return `- Column "${column.title}" (id: ${column.id}, WIP: ${wip})`;
    })
    .join("\n");

  const tasksSummary = board.columns
    .flatMap((column) =>
      column.tasks.map((task) => {
        const dueDate = task.dueDate ? task.dueDate.toISOString().slice(0, 10) : "none";
        return `- Task "${task.title}" (id: ${task.id}, priority: ${task.priority}, dueDate: ${dueDate}, column: "${column.title}", columnId: ${column.id})`;
      }),
    )
    .join("\n");

  return `Board "${board.title}"\n\nColumns:\n${columnsSummary}\n\nTasks:\n${tasksSummary}`;
}
