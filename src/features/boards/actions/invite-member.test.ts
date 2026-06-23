import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: OWNER_ID })),
}));

const prismaMock = vi.hoisted(() => ({
  board: { findFirst: vi.fn() },
  user: { findUnique: vi.fn() },
  boardMember: { findUnique: vi.fn(), create: vi.fn() },
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const OWNER_ID = "owner-1";

import { inviteMember } from "./invite-member";

const baseInput = { boardId: "board-1", email: "new@example.com", role: "EDITOR" as const };

beforeEach(() => {
  vi.clearAllMocks();
  // Happy-path defaults; individual tests override the relevant step.
  prismaMock.board.findFirst.mockResolvedValue({ id: "board-1" });
  prismaMock.user.findUnique.mockResolvedValue({ id: "user-2" });
  prismaMock.boardMember.findUnique.mockResolvedValue(null);
  prismaMock.boardMember.create.mockResolvedValue({ id: "member-1" });
});

describe("inviteMember", () => {
  it("returns NOT_FOUND when the caller does not own the board", async () => {
    prismaMock.board.findFirst.mockResolvedValue(null);

    const result = await inviteMember(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(prismaMock.boardMember.create).not.toHaveBeenCalled();
  });

  it("returns USER_NOT_FOUND when no account has that email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await inviteMember(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.USER_NOT_FOUND);
    expect(prismaMock.boardMember.create).not.toHaveBeenCalled();
  });

  it("rejects inviting yourself with VALIDATION", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: OWNER_ID });

    const result = await inviteMember(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.VALIDATION);
    expect(prismaMock.boardMember.create).not.toHaveBeenCalled();
  });

  it("returns ALREADY_MEMBER when a membership already exists", async () => {
    prismaMock.boardMember.findUnique.mockResolvedValue({ id: "member-existing" });

    const result = await inviteMember(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.ALREADY_MEMBER);
    expect(prismaMock.boardMember.create).not.toHaveBeenCalled();
  });

  it("creates the membership with the requested role on success", async () => {
    const result = await inviteMember({ ...baseInput, role: "VIEWER" });

    expect(result.ok).toBe(true);
    expect(prismaMock.boardMember.create).toHaveBeenCalledWith({
      data: { boardId: "board-1", userId: "user-2", role: "VIEWER" },
    });
  });

  it("rejects a malformed email before touching the database", async () => {
    const result = await inviteMember({ ...baseInput, email: "not-an-email" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.VALIDATION);
    expect(prismaMock.board.findFirst).not.toHaveBeenCalled();
  });
});
