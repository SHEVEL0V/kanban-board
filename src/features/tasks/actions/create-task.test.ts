import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: USER_ID })),
}));

// create-task uses the callback form: $transaction(async (tx) => …). The tx
// client is the same mock surface as prisma.
const prismaMock = vi.hoisted(() => {
  const m = {
    column: { findFirst: vi.fn() },
    task: { create: vi.fn(async () => ({ id: "task-new" })) },
    activity: { create: vi.fn(async (args: unknown) => args) },
    $transaction: vi.fn(),
  };
  m.$transaction.mockImplementation(async (cb: (tx: typeof m) => unknown) => cb(m));
  return m;
});
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { createTask } from "./create-task";

function input(overrides: Record<string, unknown> = {}) {
  return {
    columnId: "col-1",
    boardId: "board-1",
    title: "New task",
    dueDate: null,
    ...overrides,
  };
}

function createdData() {
  const call = prismaMock.task.create.mock.calls[0] as unknown as [{ data: Record<string, unknown> }];
  return call[0].data;
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof prismaMock) => unknown) =>
    cb(prismaMock),
  );
  prismaMock.task.create.mockResolvedValue({ id: "task-new" });
  prismaMock.activity.create.mockImplementation(async (args: unknown) => args);
  // Default: accessible column whose last task sits at order 5000.
  prismaMock.column.findFirst.mockResolvedValue({ tasks: [{ order: 5000 }] });
});

describe("createTask", () => {
  it("returns NOT_FOUND when the column is not editable", async () => {
    prismaMock.column.findFirst.mockResolvedValue(null);

    const result = await createTask(input());

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(prismaMock.task.create).not.toHaveBeenCalled();
  });

  it("appends one step past the current last order", async () => {
    await createTask(input());
    expect(createdData().order).toBe(6000);
  });

  it("uses the first slot for an empty column", async () => {
    prismaMock.column.findFirst.mockResolvedValue({ tasks: [] });
    await createTask(input());
    expect(createdData().order).toBe(1000);
  });

  it("records the assigner when an assignee is set", async () => {
    await createTask(input({ assigneeId: "user-9" }));
    const data = createdData();
    expect(data.assigneeId).toBe("user-9");
    expect(data.assignedById).toBe(USER_ID);
  });

  it("leaves assigner null when no assignee is provided", async () => {
    await createTask(input());
    const data = createdData();
    expect(data.assigneeId).toBeNull();
    expect(data.assignedById).toBeNull();
  });

  it("connects labels when labelIds are given", async () => {
    await createTask(input({ labelIds: ["l1", "l2"] }));
    expect(createdData().labels).toEqual({ connect: [{ id: "l1" }, { id: "l2" }] });
  });

  it("omits the labels relation when none are given", async () => {
    await createTask(input());
    expect(createdData().labels).toBeUndefined();
  });

  it("writes a CREATED activity row and returns the new id", async () => {
    const result = await createTask(input());

    expect(result).toEqual({ ok: true, data: { id: "task-new" } });
    expect(prismaMock.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "CREATED", taskTitle: "New task", actorId: USER_ID }),
    });
  });
});
