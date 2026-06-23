import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: USER_ID })),
}));

const prismaMock = vi.hoisted(() => ({
  column: { findFirst: vi.fn(), update: vi.fn() },
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { updateColumn } from "./update-column";

const baseInput = { columnId: "col-1", title: "In Review", wipLimit: 5, isCompletion: false };

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.column.findFirst.mockResolvedValue({ boardId: "board-1" });
  prismaMock.column.update.mockResolvedValue({ id: "col-1" });
});

describe("updateColumn", () => {
  it("returns NOT_FOUND when the column is not editable", async () => {
    prismaMock.column.findFirst.mockResolvedValue(null);

    const result = await updateColumn(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(prismaMock.column.update).not.toHaveBeenCalled();
  });

  it("persists title, wipLimit and completion flag, returning the board id", async () => {
    const result = await updateColumn(baseInput);

    expect(result).toEqual({ ok: true, data: { boardId: "board-1" } });
    expect(prismaMock.column.update).toHaveBeenCalledWith({
      where: { id: "col-1" },
      data: { title: "In Review", wipLimit: 5, isCompletion: false },
    });
  });

  it("accepts a null wipLimit (no limit)", async () => {
    const result = await updateColumn({ ...baseInput, wipLimit: null });

    expect(result.ok).toBe(true);
    const data = prismaMock.column.update.mock.calls[0]![0]!.data;
    expect(data.wipLimit).toBeNull();
  });

  it("rejects a non-positive wipLimit via the schema", async () => {
    const result = await updateColumn({ ...baseInput, wipLimit: 0 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.VALIDATION);
    expect(prismaMock.column.findFirst).not.toHaveBeenCalled();
  });
});
