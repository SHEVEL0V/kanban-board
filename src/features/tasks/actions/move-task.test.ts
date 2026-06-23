import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks for the server-only graph runAction/move-task pull in ──────────────
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: USER_ID })),
}));

// task.update / activity.create echo their args so we can read the operations
// array handed to $transaction.
const prismaMock = vi.hoisted(() => ({
  task: { findFirst: vi.fn(), update: vi.fn((args: unknown) => args) },
  column: { findFirst: vi.fn() },
  activity: { create: vi.fn((args: unknown) => args) },
  $transaction: vi.fn(async (ops: unknown[]) => ops),
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { moveTask } from "./move-task";

type UpdateOp = { where: { id: string }; data: Record<string, unknown> };

function input(overrides: Partial<Parameters<typeof moveTask>[0] & object> = {}) {
  return {
    taskId: "task-1",
    boardId: "board-1",
    columnId: "col-dest",
    orderedIds: ["task-1"],
    ...overrides,
  };
}

const activeTaskInTodo = {
  title: "Ship it",
  columnId: "col-todo",
  assigneeId: "user-9",
  status: "ACTIVE",
  column: { title: "To Do", isCompletion: false },
};

const plainColumn = {
  title: "In Progress",
  isCompletion: false,
  tasks: [{ id: "task-1" }],
};

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.task.update.mockImplementation((args: unknown) => args);
  prismaMock.activity.create.mockImplementation((args: unknown) => args);
  prismaMock.$transaction.mockImplementation(async (ops: unknown[]) => ops);
});

describe("moveTask validation", () => {
  it("rejects an empty orderedIds payload", async () => {
    const result = await moveTask(input({ orderedIds: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.VALIDATION);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

describe("moveTask guards", () => {
  it("returns NOT_FOUND when the task is not editable by the user", async () => {
    prismaMock.task.findFirst.mockResolvedValue(null);

    const result = await moveTask(input());

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(prismaMock.column.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when the destination column is not editable", async () => {
    prismaMock.task.findFirst.mockResolvedValue(activeTaskInTodo);
    prismaMock.column.findFirst.mockResolvedValue(null);

    const result = await moveTask(input());

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects orderedIds that reference tasks outside the destination", async () => {
    prismaMock.task.findFirst.mockResolvedValue(activeTaskInTodo);
    prismaMock.column.findFirst.mockResolvedValue(plainColumn);

    const result = await moveTask(input({ orderedIds: ["task-1", "task-foreign"] }));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

describe("moveTask ordering & status transitions", () => {
  it("renumbers every ordered task and moves the task to the new column", async () => {
    prismaMock.task.findFirst.mockResolvedValue(activeTaskInTodo);
    prismaMock.column.findFirst.mockResolvedValue({
      ...plainColumn,
      tasks: [{ id: "task-1" }, { id: "task-2" }],
    });

    const result = await moveTask(input({ orderedIds: ["task-2", "task-1"] }));

    expect(result.ok).toBe(true);
    const ops = prismaMock.$transaction.mock.calls[0]![0] as UpdateOp[];
    // First op moves the task into the destination column.
    expect(ops[0]).toMatchObject({ where: { id: "task-1" }, data: { columnId: "col-dest" } });
    // Subsequent ops renumber in payload order with the stepped scheme.
    expect(ops[1]).toMatchObject({ where: { id: "task-2" }, data: { order: 1000 } });
    expect(ops[2]).toMatchObject({ where: { id: "task-1" }, data: { order: 2000 } });
  });

  it("flags the task PENDING_REVIEW when moved into a completion column with an assignee", async () => {
    prismaMock.task.findFirst.mockResolvedValue(activeTaskInTodo);
    prismaMock.column.findFirst.mockResolvedValue({
      title: "Done",
      isCompletion: true,
      tasks: [{ id: "task-1" }],
    });

    await moveTask(input({ columnId: "col-done" }));

    const ops = prismaMock.$transaction.mock.calls[0]![0] as UpdateOp[];
    expect(ops[0]!.data.status).toBe("PENDING_REVIEW");
    expect(ops[0]!.data.completedAt).toBeInstanceOf(Date);
  });

  it("does not flag completion when the task has no assignee", async () => {
    prismaMock.task.findFirst.mockResolvedValue({ ...activeTaskInTodo, assigneeId: null });
    prismaMock.column.findFirst.mockResolvedValue({
      title: "Done",
      isCompletion: true,
      tasks: [{ id: "task-1" }],
    });

    await moveTask(input({ columnId: "col-done" }));

    const ops = prismaMock.$transaction.mock.calls[0]![0] as UpdateOp[];
    expect(ops[0]!.data).not.toHaveProperty("status");
  });

  it("reverts to ACTIVE when a PENDING_REVIEW task leaves the completion column", async () => {
    prismaMock.task.findFirst.mockResolvedValue({
      title: "Ship it",
      columnId: "col-done",
      assigneeId: "user-9",
      status: "PENDING_REVIEW",
      column: { title: "Done", isCompletion: true },
    });
    prismaMock.column.findFirst.mockResolvedValue(plainColumn);

    await moveTask(input());

    const ops = prismaMock.$transaction.mock.calls[0]![0] as UpdateOp[];
    expect(ops[0]!.data.status).toBe("ACTIVE");
    expect(ops[0]!.data.completedAt).toBeNull();
  });

  it("applies no status change when reordering within the same column", async () => {
    prismaMock.task.findFirst.mockResolvedValue({ ...activeTaskInTodo, columnId: "col-dest" });
    prismaMock.column.findFirst.mockResolvedValue(plainColumn);

    await moveTask(input());

    const ops = prismaMock.$transaction.mock.calls[0]![0] as UpdateOp[];
    expect(ops[0]!.data).not.toHaveProperty("status");
    // No activity row for an in-column reorder.
    expect(prismaMock.activity.create).not.toHaveBeenCalled();
  });

  it("logs a MOVED activity row when changing columns", async () => {
    prismaMock.task.findFirst.mockResolvedValue(activeTaskInTodo);
    prismaMock.column.findFirst.mockResolvedValue(plainColumn);

    await moveTask(input());

    expect(prismaMock.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        boardId: "board-1",
        actorId: USER_ID,
        action: "MOVED",
        taskTitle: "Ship it",
        fromColumn: "To Do",
        toColumn: "In Progress",
      }),
    });
  });
});
