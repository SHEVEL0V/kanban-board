import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: USER_ID })),
}));

const prismaMock = vi.hoisted(() => {
  const m = {
    board: { create: vi.fn(async () => ({ id: "board-new" })) },
    column: { createMany: vi.fn() },
    $transaction: vi.fn(),
  };
  m.$transaction.mockImplementation(async (cb: (tx: typeof m) => unknown) => cb(m));
  return m;
});
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { createBoard } from "./create-board";

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof prismaMock) => unknown) =>
    cb(prismaMock),
  );
  prismaMock.board.create.mockResolvedValue({ id: "board-new" });
  prismaMock.column.createMany.mockResolvedValue({ count: 0 });
});

describe("createBoard", () => {
  it("creates an empty board owned by the caller", async () => {
    const result = await createBoard({ title: "Roadmap" });

    expect(result).toEqual({ ok: true, data: { id: "board-new" } });
    expect(prismaMock.board.create).toHaveBeenCalledWith({
      data: { title: "Roadmap", ownerId: USER_ID },
      select: { id: true },
    });
    // No template columns → no bulk insert.
    expect(prismaMock.column.createMany).not.toHaveBeenCalled();
  });

  it("seeds template columns scoped to the new board", async () => {
    await createBoard({
      title: "Sprint",
      columns: [
        { title: "To Do", order: 1000 },
        { title: "Done", order: 2000, wipLimit: 3, isCompletion: true },
      ],
    });

    const call = prismaMock.column.createMany.mock.calls[0] as unknown as [
      { data: Record<string, unknown>[] },
    ];
    expect(call[0].data).toEqual([
      { boardId: "board-new", title: "To Do", order: 1000, wipLimit: null, isCompletion: false },
      { boardId: "board-new", title: "Done", order: 2000, wipLimit: 3, isCompletion: true },
    ]);
  });

  it("rejects a blank title before any DB access", async () => {
    const result = await createBoard({ title: "   " });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.VALIDATION);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
