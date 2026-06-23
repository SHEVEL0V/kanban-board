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
    task: { findFirst: vi.fn(), delete: vi.fn(async (args: unknown) => args) },
    activity: { create: vi.fn(async (args: unknown) => args) },
    $transaction: vi.fn(),
  };
  m.$transaction.mockImplementation(async (cb: (tx: typeof m) => unknown) => cb(m));
  return m;
});
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { deleteTask } from "./delete-task";

const baseInput = { taskId: "task-1", boardId: "board-1" };

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof prismaMock) => unknown) =>
    cb(prismaMock),
  );
  prismaMock.task.delete.mockImplementation(async (args: unknown) => args);
  prismaMock.activity.create.mockImplementation(async (args: unknown) => args);
  prismaMock.task.findFirst.mockResolvedValue({ title: "Doomed task" });
});

describe("deleteTask", () => {
  it("returns NOT_FOUND when the task is not editable", async () => {
    prismaMock.task.findFirst.mockResolvedValue(null);

    const result = await deleteTask(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(prismaMock.task.delete).not.toHaveBeenCalled();
  });

  it("deletes the task and logs a DELETED activity with the snapshot title", async () => {
    const result = await deleteTask(baseInput);

    expect(result.ok).toBe(true);
    expect(prismaMock.task.delete).toHaveBeenCalledWith({ where: { id: "task-1" } });
    expect(prismaMock.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        boardId: "board-1",
        actorId: USER_ID,
        action: "DELETED",
        taskTitle: "Doomed task",
      }),
    });
  });
});
