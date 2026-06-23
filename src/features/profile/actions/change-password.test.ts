import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: USER_ID })),
}));

const bcryptMock = vi.hoisted(() => ({
  compare: vi.fn(),
  hash: vi.fn(async () => "new-hash"),
}));
vi.mock("bcrypt", () => ({ default: bcryptMock }));

const prismaMock = vi.hoisted(() => ({
  user: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { changePassword } from "./change-password";

const baseInput = { currentPassword: "old-password", newPassword: "brand-new-password" };

beforeEach(() => {
  vi.clearAllMocks();
  bcryptMock.hash.mockResolvedValue("new-hash");
  prismaMock.user.findUniqueOrThrow.mockResolvedValue({ passwordHash: "old-hash" });
  prismaMock.user.update.mockResolvedValue({ id: USER_ID });
});

describe("changePassword", () => {
  it("rejects when the current password is wrong", async () => {
    bcryptMock.compare.mockResolvedValue(false);

    const result = await changePassword(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.INCORRECT_PASSWORD);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("stores a fresh hash when the current password matches", async () => {
    bcryptMock.compare.mockResolvedValue(true);

    const result = await changePassword(baseInput);

    expect(result.ok).toBe(true);
    expect(bcryptMock.compare).toHaveBeenCalledWith("old-password", "old-hash");
    expect(bcryptMock.hash).toHaveBeenCalledWith("brand-new-password", 10);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { passwordHash: "new-hash" },
    });
  });

  it("rejects a too-short new password via the schema", async () => {
    const result = await changePassword({ ...baseInput, newPassword: "short" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.VALIDATION);
    expect(prismaMock.user.findUniqueOrThrow).not.toHaveBeenCalled();
  });
});
