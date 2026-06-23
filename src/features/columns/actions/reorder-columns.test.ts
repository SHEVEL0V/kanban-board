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
  column: { update: vi.fn((args: unknown) => args) },
  $transaction: vi.fn(async (ops: unknown[]) => ops),
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { reorderColumns } from "./reorder-columns";

type UpdateOp = { where: { id: string }; data: { order: number } };

function input(overrides: { boardId?: string; orderedIds?: string[] } = {}) {
  return { boardId: "board-1", orderedIds: ["c1", "c2", "c3"], ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.column.update.mockImplementation((args: unknown) => args);
  prismaMock.$transaction.mockImplementation(async (ops: unknown[]) => ops);
  prismaMock.board.findFirst.mockResolvedValue({
    columns: [{ id: "c1" }, { id: "c2" }, { id: "c3" }],
  });
});

describe("reorderColumns", () => {
  it("rejects an empty payload with VALIDATION", async () => {
    const result = await reorderColumns(input({ orderedIds: [] }));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.VALIDATION);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when the board is not editable", async () => {
    prismaMock.board.findFirst.mockResolvedValue(null);

    const result = await reorderColumns(input());

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects ids that don't all belong to the board", async () => {
    const result = await reorderColumns(input({ orderedIds: ["c1", "c-foreign"] }));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("renumbers columns to stepped order values in payload sequence", async () => {
    const result = await reorderColumns(input({ orderedIds: ["c3", "c1", "c2"] }));

    expect(result.ok).toBe(true);
    const ops = prismaMock.$transaction.mock.calls[0]![0] as UpdateOp[];
    expect(ops).toEqual([
      { where: { id: "c3" }, data: { order: 1000 } },
      { where: { id: "c1" }, data: { order: 2000 } },
      { where: { id: "c2" }, data: { order: 3000 } },
    ]);
  });
});
