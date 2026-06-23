import { TaskPriority } from "@/generated/prisma/client";
import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: USER_ID })),
}));

const prismaMock = vi.hoisted(() => {
  const m = {
    task: { findFirst: vi.fn(), update: vi.fn(async (args: unknown) => args) },
    activity: { create: vi.fn(async (args: unknown) => args) },
    $transaction: vi.fn(),
  };
  m.$transaction.mockImplementation(async (cb: (tx: typeof m) => unknown) => cb(m));
  return m;
});
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { updateTask } from "./update-task";

function input(overrides: Record<string, unknown> = {}) {
  return {
    taskId: "task-1",
    boardId: "board-1",
    title: "Updated title",
    priority: TaskPriority.HIGH,
    dueDate: null,
    ...overrides,
  };
}

function updateData() {
  const arg = prismaMock.task.update.mock.calls[0]?.[0] as { data: Record<string, unknown> };
  return arg.data;
}

// Existing task state the access check returns before the update runs.
function existing(overrides: Record<string, unknown> = {}) {
  return { id: "task-1", assigneeId: "user-2", status: "ACTIVE", ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof prismaMock) => unknown) =>
    cb(prismaMock),
  );
  prismaMock.task.update.mockImplementation(async (args: unknown) => args);
  prismaMock.activity.create.mockImplementation(async (args: unknown) => args);
  prismaMock.task.findFirst.mockResolvedValue(existing());
});

describe("updateTask", () => {
  it("returns NOT_FOUND when the task is not editable", async () => {
    prismaMock.task.findFirst.mockResolvedValue(null);

    const result = await updateTask(input());

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(prismaMock.task.update).not.toHaveBeenCalled();
  });

  it("sets the assigner to the caller when the assignee changes to a person", async () => {
    prismaMock.task.findFirst.mockResolvedValue(existing({ assigneeId: null }));

    await updateTask(input({ assigneeId: "user-9" }));

    const data = updateData();
    expect(data.assigneeId).toBe("user-9");
    expect(data.assignedById).toBe(USER_ID);
  });

  it("does not touch the assigner when the assignee is unchanged", async () => {
    prismaMock.task.findFirst.mockResolvedValue(existing({ assigneeId: "user-2" }));

    await updateTask(input({ assigneeId: "user-2" }));

    expect(updateData()).not.toHaveProperty("assignedById");
  });

  it("clears the assigner when the assignee is removed", async () => {
    prismaMock.task.findFirst.mockResolvedValue(existing({ assigneeId: "user-2" }));

    await updateTask(input({ assigneeId: null }));

    const data = updateData();
    expect(data.assigneeId).toBeNull();
    expect(data.assignedById).toBeNull();
  });

  it("reverts a PENDING_REVIEW task to ACTIVE when its assignee is removed", async () => {
    prismaMock.task.findFirst.mockResolvedValue(
      existing({ assigneeId: "user-2", status: "PENDING_REVIEW" }),
    );

    await updateTask(input({ assigneeId: null }));

    const data = updateData();
    expect(data.status).toBe("ACTIVE");
    expect(data.completedAt).toBeNull();
  });

  it("does not change status when removing an assignee from a non-pending task", async () => {
    prismaMock.task.findFirst.mockResolvedValue(existing({ assigneeId: "user-2", status: "ACTIVE" }));

    await updateTask(input({ assigneeId: null }));

    expect(updateData()).not.toHaveProperty("status");
  });

  it("replaces the label set with the provided ids", async () => {
    await updateTask(input({ labelIds: ["l1", "l2"] }));
    expect(updateData().labels).toEqual({ set: [{ id: "l1" }, { id: "l2" }] });
  });

  it("clears all labels when none are provided", async () => {
    await updateTask(input());
    expect(updateData().labels).toEqual({ set: [] });
  });

  it("logs an UPDATED activity row on success", async () => {
    const result = await updateTask(input());

    expect(result.ok).toBe(true);
    expect(prismaMock.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "UPDATED", taskTitle: "Updated title", actorId: USER_ID }),
    });
  });
});
