import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: USER_ID })),
}));

const prismaMock = vi.hoisted(() => ({
  task: { findFirst: vi.fn() },
  checklistItem: { create: vi.fn() },
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { createChecklistItem } from "./create-checklist-item";

const baseInput = { taskId: "task-1", boardId: "board-1", content: "Step one" };

function createdData() {
  const call = prismaMock.checklistItem.create.mock.calls[0] as unknown as [
    { data: Record<string, unknown> },
  ];
  return call[0].data;
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.task.findFirst.mockResolvedValue({ checklistItems: [{ order: 3000 }] });
  prismaMock.checklistItem.create.mockResolvedValue({ id: "item-1" });
});

describe("createChecklistItem", () => {
  it("returns NOT_FOUND when the task is not editable", async () => {
    prismaMock.task.findFirst.mockResolvedValue(null);

    const result = await createChecklistItem(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(prismaMock.checklistItem.create).not.toHaveBeenCalled();
  });

  it("appends past the last item's order", async () => {
    await createChecklistItem(baseInput);
    expect(createdData()).toMatchObject({ taskId: "task-1", content: "Step one", order: 4000 });
  });

  it("uses the first slot for an empty checklist", async () => {
    prismaMock.task.findFirst.mockResolvedValue({ checklistItems: [] });
    await createChecklistItem(baseInput);
    expect(createdData().order).toBe(1000);
  });

  it("rejects blank content via the schema", async () => {
    const result = await createChecklistItem({ ...baseInput, content: "  " });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.VALIDATION);
    expect(prismaMock.task.findFirst).not.toHaveBeenCalled();
  });
});
