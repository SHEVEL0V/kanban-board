import { TaskPriority } from "@/generated/prisma/client";
import { describe, expect, it, vi } from "vitest";

// The module pulls in server-only deps at import time; stub them so we can
// import the pure mapNotifications helper in a node test.
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: {} }));
vi.mock("@/shared/lib/auth/dal", () => ({ verifySession: vi.fn() }));
vi.mock("@/shared/lib/auth/board-access", () => ({ boardAccessFilter: vi.fn() }));

import { mapNotifications } from "./get-due-task-notifications";

const due = {
  taskId: "t1",
  taskTitle: "Overdue task",
  boardId: "b1",
  boardTitle: "Board",
  dueDate: "2026-06-20T00:00:00.000Z",
  status: "overdue" as const,
};

const assigned = {
  taskId: "t2",
  taskTitle: "Assigned task",
  boardId: "b1",
  boardTitle: "Board",
  columnTitle: "Doing",
  priority: TaskPriority.HIGH,
};

const pending = {
  taskId: "t3",
  taskTitle: "Pending task",
  boardId: "b1",
  boardTitle: "Board",
  assigneeName: "Ada",
  completedAt: "2026-06-22T10:00:00.000Z",
};

describe("mapNotifications", () => {
  it("re-hydrates the due date ISO string into a Date", () => {
    const { dueNotifications } = mapNotifications({ due: [due], assigned: [], pending: [] });
    expect(dueNotifications[0]!.dueDate).toBeInstanceOf(Date);
    expect(dueNotifications[0]!.dueDate.toISOString()).toBe(due.dueDate);
    expect(dueNotifications[0]!.status).toBe("overdue");
  });

  it("passes assigned tasks through unchanged", () => {
    const { assignedTasks } = mapNotifications({ due: [], assigned: [assigned], pending: [] });
    expect(assignedTasks).toEqual([assigned]);
  });

  it("re-hydrates pending completedAt into a Date", () => {
    const { pendingConfirmation } = mapNotifications({ due: [], assigned: [], pending: [pending] });
    expect(pendingConfirmation[0]!.completedAt).toBeInstanceOf(Date);
    expect(pendingConfirmation[0]!.completedAt.toISOString()).toBe(pending.completedAt);
  });

  it("defaults pending to an empty list when the cached value omits it", () => {
    const { pendingConfirmation } = mapNotifications({ due: [], assigned: [] } as never);
    expect(pendingConfirmation).toEqual([]);
  });
});
