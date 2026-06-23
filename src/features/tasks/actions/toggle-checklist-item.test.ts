import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: USER_ID })),
}));

const prismaMock = vi.hoisted(() => ({
  checklistItem: { findFirst: vi.fn(), update: vi.fn() },
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { toggleChecklistItem } from "./toggle-checklist-item";

const baseInput = { id: "item-1", taskId: "task-1", boardId: "board-1", done: true };

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.checklistItem.findFirst.mockResolvedValue({ id: "item-1" });
  prismaMock.checklistItem.update.mockResolvedValue({ id: "item-1" });
});

describe("toggleChecklistItem", () => {
  it("returns NOT_FOUND when the item is not on an editable task", async () => {
    prismaMock.checklistItem.findFirst.mockResolvedValue(null);

    const result = await toggleChecklistItem(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(prismaMock.checklistItem.update).not.toHaveBeenCalled();
  });

  it("writes the requested done state", async () => {
    await toggleChecklistItem({ ...baseInput, done: false });

    expect(prismaMock.checklistItem.update).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: { done: false },
    });
  });
});
