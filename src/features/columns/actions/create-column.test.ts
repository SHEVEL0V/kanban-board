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
  column: { create: vi.fn() },
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { createColumn } from "./create-column";

const baseInput = { boardId: "board-1", title: "Backlog" };

function createdData() {
  const call = prismaMock.column.create.mock.calls[0] as unknown as [
    { data: Record<string, unknown> },
  ];
  return call[0].data;
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.board.findFirst.mockResolvedValue({ columns: [{ order: 2000 }] });
  prismaMock.column.create.mockResolvedValue({ id: "col-new" });
});

describe("createColumn", () => {
  it("returns NOT_FOUND when the board is not editable", async () => {
    prismaMock.board.findFirst.mockResolvedValue(null);

    const result = await createColumn(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(prismaMock.column.create).not.toHaveBeenCalled();
  });

  it("appends the column past the current last order", async () => {
    const result = await createColumn(baseInput);

    expect(result).toEqual({ ok: true, data: { id: "col-new" } });
    expect(createdData()).toMatchObject({ boardId: "board-1", title: "Backlog", order: 3000 });
  });

  it("uses the first slot for the board's first column", async () => {
    prismaMock.board.findFirst.mockResolvedValue({ columns: [] });
    await createColumn(baseInput);
    expect(createdData().order).toBe(1000);
  });
});
