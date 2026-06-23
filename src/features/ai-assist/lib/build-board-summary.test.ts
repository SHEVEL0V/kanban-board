import { TaskPriority } from "@/generated/prisma/client";
import { describe, expect, it } from "vitest";
import { buildBoardSummary } from "./build-board-summary";

type Board = Parameters<typeof buildBoardSummary>[0];

const board: Board = {
  title: "Sprint 1",
  columns: [
    {
      id: "c1",
      title: "To Do",
      wipLimit: 3,
      tasks: [
        {
          id: "t1",
          title: "Design API",
          priority: TaskPriority.HIGH,
          dueDate: new Date("2026-07-01T15:30:00.000Z"),
        },
      ],
    },
    {
      id: "c2",
      title: "Doing",
      wipLimit: null,
      tasks: [{ id: "t2", title: "Write tests", priority: TaskPriority.LOW, dueDate: null }],
    },
  ],
};

describe("buildBoardSummary", () => {
  it("includes the board title", () => {
    expect(buildBoardSummary(board)).toContain('Board "Sprint 1"');
  });

  it("shows occupancy/limit for a column with a WIP limit", () => {
    expect(buildBoardSummary(board)).toContain('Column "To Do" (id: c1, WIP: 1/3)');
  });

  it("shows bare occupancy for a column without a WIP limit", () => {
    expect(buildBoardSummary(board)).toContain('Column "Doing" (id: c2, WIP: 1)');
  });

  it("truncates a task due date to YYYY-MM-DD", () => {
    expect(buildBoardSummary(board)).toContain("dueDate: 2026-07-01");
  });

  it('renders "none" for a task without a due date', () => {
    expect(buildBoardSummary(board)).toContain('Task "Write tests" (id: t2, priority: LOW, dueDate: none');
  });

  it("attributes each task to its column", () => {
    const summary = buildBoardSummary(board);
    expect(summary).toContain('column: "To Do", columnId: c1');
    expect(summary).toContain('column: "Doing", columnId: c2');
  });

  it("keeps the section scaffolding for an empty board", () => {
    const summary = buildBoardSummary({ title: "Empty", columns: [] });
    expect(summary).toContain('Board "Empty"');
    expect(summary).toContain("Columns:\n\n\nTasks:");
  });
});
