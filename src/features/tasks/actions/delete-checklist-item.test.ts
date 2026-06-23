import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: USER_ID })),
}));

const prismaMock = vi.hoisted(() => ({
  checklistItem: { findFirst: vi.fn(), delete: vi.fn() },
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { deleteChecklistItem } from "./delete-checklist-item";

const baseInput = { id: "item-1", taskId: "task-1", boardId: "board-1" };

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.checklistItem.findFirst.mockResolvedValue({ id: "item-1" });
  prismaMock.checklistItem.delete.mockResolvedValue({ id: "item-1" });
});

describe("deleteChecklistItem", () => {
  it("returns NOT_FOUND when the item is not on an editable task", async () => {
    prismaMock.checklistItem.findFirst.mockResolvedValue(null);

    const result = await deleteChecklistItem(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(prismaMock.checklistItem.delete).not.toHaveBeenCalled();
  });

  it("deletes the item by id once access is verified", async () => {
    const result = await deleteChecklistItem(baseInput);

    expect(result.ok).toBe(true);
    expect(prismaMock.checklistItem.delete).toHaveBeenCalledWith({ where: { id: "item-1" } });
  });
});
