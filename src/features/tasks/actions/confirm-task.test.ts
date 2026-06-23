import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: USER_ID })),
}));

const prismaMock = vi.hoisted(() => ({
  task: { findFirst: vi.fn(), update: vi.fn((args: unknown) => args) },
  activity: { create: vi.fn((args: unknown) => args) },
  $transaction: vi.fn(async (ops: unknown[]) => ops),
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { confirmTask } from "./confirm-task";

type UpdateOp = { where: { id: string }; data: Record<string, unknown> };

const baseInput = { taskId: "task-1", boardId: "board-1" };

// Pending-review task owned by someone else, assigned by someone else.
function pendingTask(
  overrides: { assignedById?: string | null; assigneeId?: string | null; ownerId?: string } = {},
) {
  return {
    title: "Review me",
    // `in` checks keep an explicit `null` distinct from an omitted override.
    assignedById: "assignedById" in overrides ? overrides.assignedById : "user-boss",
    assigneeId: "assigneeId" in overrides ? overrides.assigneeId : "user-2",
    column: { board: { ownerId: overrides.ownerId ?? "user-owner" } },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.task.update.mockImplementation((args: unknown) => args);
  prismaMock.activity.create.mockImplementation((args: unknown) => args);
  prismaMock.$transaction.mockImplementation(async (ops: unknown[]) => ops);
});

describe("confirmTask guards", () => {
  it("returns NOT_FOUND when no accessible PENDING_REVIEW task matches", async () => {
    prismaMock.task.findFirst.mockResolvedValue(null);

    const result = await confirmTask(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("forbids a user who is neither assigner, owner, nor assignee", async () => {
    prismaMock.task.findFirst.mockResolvedValue(pendingTask());

    const result = await confirmTask(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.FORBIDDEN);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("forbids the assignee when someone else assigned the task", async () => {
    // assignee is the current user, but assignedById points to another person.
    prismaMock.task.findFirst.mockResolvedValue(
      pendingTask({ assigneeId: USER_ID, assignedById: "user-boss" }),
    );

    const result = await confirmTask(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.FORBIDDEN);
  });
});

describe("confirmTask permission grants", () => {
  it("allows the board owner", async () => {
    prismaMock.task.findFirst.mockResolvedValue(pendingTask({ ownerId: USER_ID }));

    const result = await confirmTask(baseInput);

    expect(result.ok).toBe(true);
  });

  it("allows the original assigner", async () => {
    prismaMock.task.findFirst.mockResolvedValue(pendingTask({ assignedById: USER_ID }));

    const result = await confirmTask(baseInput);

    expect(result.ok).toBe(true);
  });

  it("allows a self-assigned task with explicit assignedById", async () => {
    prismaMock.task.findFirst.mockResolvedValue(
      pendingTask({ assigneeId: USER_ID, assignedById: USER_ID }),
    );

    const result = await confirmTask(baseInput);

    expect(result.ok).toBe(true);
  });

  it("allows a self-assigned legacy task with null assignedById", async () => {
    prismaMock.task.findFirst.mockResolvedValue(
      pendingTask({ assigneeId: USER_ID, assignedById: null }),
    );

    const result = await confirmTask(baseInput);

    expect(result.ok).toBe(true);
  });
});

describe("confirmTask archival", () => {
  it("archives the task and writes an activity row when permitted", async () => {
    prismaMock.task.findFirst.mockResolvedValue(pendingTask({ ownerId: USER_ID }));

    await confirmTask(baseInput);

    const ops = prismaMock.$transaction.mock.calls[0]![0] as UpdateOp[];
    expect(ops[0]).toMatchObject({
      where: { id: "task-1" },
      data: { status: "ARCHIVED", archivedById: USER_ID },
    });
    expect(ops[0]!.data.archivedAt).toBeInstanceOf(Date);

    expect(prismaMock.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        boardId: "board-1",
        actorId: USER_ID,
        action: "UPDATED",
        taskTitle: "Review me",
      }),
    });
  });
});
