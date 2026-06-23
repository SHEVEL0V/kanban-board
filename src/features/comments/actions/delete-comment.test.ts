import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: USER_ID })),
}));

const prismaMock = vi.hoisted(() => ({
  comment: { deleteMany: vi.fn() },
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { deleteComment } from "./delete-comment";

const baseInput = { commentId: "comment-1", boardId: "board-1" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("deleteComment", () => {
  it("returns NOT_FOUND when nothing matches (wrong author or no access)", async () => {
    prismaMock.comment.deleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteComment(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
  });

  it("deletes the comment scoped to author and board access", async () => {
    prismaMock.comment.deleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteComment(baseInput);

    expect(result.ok).toBe(true);
    const where = prismaMock.comment.deleteMany.mock.calls[0]![0]!.where;
    expect(where).toMatchObject({ id: "comment-1", authorId: USER_ID });
  });
});
