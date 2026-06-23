import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: USER_ID })),
}));

const prismaMock = vi.hoisted(() => ({
  board: { findFirst: vi.fn() },
  boardMember: { update: vi.fn() },
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { updateMemberRole } from "./update-member-role";

const baseInput = { boardId: "board-1", memberId: "member-1", role: "VIEWER" as const };

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.board.findFirst.mockResolvedValue({ id: "board-1" });
  prismaMock.boardMember.update.mockResolvedValue({ id: "member-1" });
});

describe("updateMemberRole", () => {
  it("forbids a caller who does not own the board", async () => {
    prismaMock.board.findFirst.mockResolvedValue(null);

    const result = await updateMemberRole(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.FORBIDDEN);
    expect(prismaMock.boardMember.update).not.toHaveBeenCalled();
  });

  it("updates the role scoped to the board on success", async () => {
    const result = await updateMemberRole(baseInput);

    expect(result.ok).toBe(true);
    expect(prismaMock.boardMember.update).toHaveBeenCalledWith({
      where: { id: "member-1", boardId: "board-1" },
      data: { role: "VIEWER" },
    });
  });

  it("rejects an invalid role before any DB access", async () => {
    const result = await updateMemberRole({ ...baseInput, role: "ADMIN" as never });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.VALIDATION);
    expect(prismaMock.board.findFirst).not.toHaveBeenCalled();
  });
});
