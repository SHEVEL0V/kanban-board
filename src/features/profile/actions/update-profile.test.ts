import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: USER_ID })),
}));

const prismaMock = vi.hoisted(() => ({
  user: { update: vi.fn() },
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { updateProfile } from "./update-profile";

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.user.update.mockResolvedValue({ id: USER_ID });
});

describe("updateProfile", () => {
  it("updates the current user's name", async () => {
    const result = await updateProfile({ name: "Ada Lovelace" });

    expect(result.ok).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { name: "Ada Lovelace" },
    });
  });

  it("rejects a too-short name without touching the database", async () => {
    const result = await updateProfile({ name: "A" });

    expect(result.ok).toBe(false);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
