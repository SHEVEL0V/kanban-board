import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: USER_ID })),
}));

const prismaMock = vi.hoisted(() => ({
  board: { deleteMany: vi.fn() },
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { deleteBoard } from "./delete-board";

const baseInput = { boardId: "board-1" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("deleteBoard", () => {
  it("returns NOT_FOUND when the caller does not own the board", async () => {
    prismaMock.board.deleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteBoard(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
  });

  it("deletes the board scoped to the owner", async () => {
    prismaMock.board.deleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteBoard(baseInput);

    expect(result.ok).toBe(true);
    expect(prismaMock.board.deleteMany).toHaveBeenCalledWith({
      where: { id: "board-1", ownerId: USER_ID },
    });
  });
});
