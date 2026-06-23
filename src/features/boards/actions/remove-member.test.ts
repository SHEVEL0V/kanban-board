import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: USER_ID })),
}));

const prismaMock = vi.hoisted(() => ({
  boardMember: { findFirst: vi.fn(), delete: vi.fn() },
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { removeMember } from "./remove-member";

const baseInput = { boardId: "board-1", memberId: "member-1" };

// A membership row: by default it belongs to someone else on a board the
// caller does not own.
function member(overrides: { userId?: string; ownerId?: string } = {}) {
  return {
    userId: overrides.userId ?? "user-2",
    board: { ownerId: overrides.ownerId ?? "user-owner" },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.boardMember.findFirst.mockResolvedValue(member());
  prismaMock.boardMember.delete.mockResolvedValue({ id: "member-1" });
});

describe("removeMember", () => {
  it("returns NOT_FOUND when the membership does not exist", async () => {
    prismaMock.boardMember.findFirst.mockResolvedValue(null);

    const result = await removeMember(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(prismaMock.boardMember.delete).not.toHaveBeenCalled();
  });

  it("forbids a non-owner removing someone else", async () => {
    prismaMock.boardMember.findFirst.mockResolvedValue(member({ userId: "user-2", ownerId: "user-9" }));

    const result = await removeMember(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.FORBIDDEN);
    expect(prismaMock.boardMember.delete).not.toHaveBeenCalled();
  });

  it("lets the board owner remove a member", async () => {
    prismaMock.boardMember.findFirst.mockResolvedValue(member({ userId: "user-2", ownerId: USER_ID }));

    const result = await removeMember(baseInput);

    expect(result.ok).toBe(true);
    expect(prismaMock.boardMember.delete).toHaveBeenCalledWith({ where: { id: "member-1" } });
  });

  it("lets a member remove themselves (leave the board)", async () => {
    prismaMock.boardMember.findFirst.mockResolvedValue(member({ userId: USER_ID, ownerId: "user-9" }));

    const result = await removeMember(baseInput);

    expect(result.ok).toBe(true);
    expect(prismaMock.boardMember.delete).toHaveBeenCalledWith({ where: { id: "member-1" } });
  });
});
