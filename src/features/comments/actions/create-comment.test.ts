import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: USER_ID })),
}));

const prismaMock = vi.hoisted(() => ({
  task: { findFirst: vi.fn() },
  comment: { create: vi.fn() },
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { createComment } from "./create-comment";

const baseInput = { taskId: "task-1", boardId: "board-1", content: "Looks good" };

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.task.findFirst.mockResolvedValue({ id: "task-1" });
  prismaMock.comment.create.mockResolvedValue({ id: "comment-1" });
});

describe("createComment", () => {
  it("returns NOT_FOUND when the task is not accessible", async () => {
    prismaMock.task.findFirst.mockResolvedValue(null);

    const result = await createComment(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(prismaMock.comment.create).not.toHaveBeenCalled();
  });

  it("creates the comment authored by the current user", async () => {
    const result = await createComment(baseInput);

    expect(result).toEqual({ ok: true, data: { id: "comment-1" } });
    expect(prismaMock.comment.create).toHaveBeenCalledWith({
      data: { taskId: "task-1", authorId: USER_ID, content: "Looks good" },
      select: { id: true },
    });
  });

  it("rejects blank content before any DB access", async () => {
    const result = await createComment({ ...baseInput, content: "   " });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.VALIDATION);
    expect(prismaMock.task.findFirst).not.toHaveBeenCalled();
  });
});
