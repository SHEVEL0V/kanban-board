import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: USER_ID })),
}));

const prismaMock = vi.hoisted(() => ({
  column: { deleteMany: vi.fn() },
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { deleteColumn } from "./delete-column";

const baseInput = { columnId: "col-1", boardId: "board-1" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("deleteColumn", () => {
  it("returns NOT_FOUND when no editable column matches", async () => {
    prismaMock.column.deleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteColumn(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
  });

  it("succeeds when a column was deleted", async () => {
    prismaMock.column.deleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteColumn(baseInput);

    expect(result.ok).toBe(true);
    expect(prismaMock.column.deleteMany).toHaveBeenCalledTimes(1);
  });
});
