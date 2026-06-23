import { TaskPriority } from "@/generated/prisma/browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DUE_SOON_WINDOW_MS,
  EMPTY_TASK_FILTERS,
  type TaskFilters,
  hasActiveFilters,
  taskMatchesFilters,
} from "./task-filters";

type Task = Parameters<typeof taskMatchesFilters>[0];

const NOW = new Date("2026-06-23T12:00:00.000Z").getTime();

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    title: "Write report",
    description: "quarterly numbers",
    priority: TaskPriority.MEDIUM,
    dueDate: null,
    assignee: null,
    labels: [],
    ...overrides,
  };
}

function withFilters(overrides: Partial<TaskFilters> = {}): TaskFilters {
  return { ...EMPTY_TASK_FILTERS, ...overrides };
}

describe("hasActiveFilters", () => {
  it("is false for the empty preset", () => {
    expect(hasActiveFilters(EMPTY_TASK_FILTERS)).toBe(false);
  });

  it("treats whitespace-only search as inactive", () => {
    expect(hasActiveFilters(withFilters({ search: "   " }))).toBe(false);
  });

  it("is true when any dimension is set", () => {
    expect(hasActiveFilters(withFilters({ search: "x" }))).toBe(true);
    expect(hasActiveFilters(withFilters({ priority: TaskPriority.HIGH }))).toBe(true);
    expect(hasActiveFilters(withFilters({ dueDate: "overdue" }))).toBe(true);
    expect(hasActiveFilters(withFilters({ assigneeId: "u1" }))).toBe(true);
    expect(hasActiveFilters(withFilters({ labelId: "l1" }))).toBe(true);
  });
});

describe("taskMatchesFilters", () => {
  it("matches everything under the empty preset", () => {
    expect(taskMatchesFilters(makeTask(), EMPTY_TASK_FILTERS)).toBe(true);
  });

  describe("search", () => {
    it("matches title or description case-insensitively", () => {
      expect(taskMatchesFilters(makeTask(), withFilters({ search: "REPORT" }))).toBe(true);
      expect(taskMatchesFilters(makeTask(), withFilters({ search: "quarterly" }))).toBe(true);
    });

    it("excludes non-matching text", () => {
      expect(taskMatchesFilters(makeTask(), withFilters({ search: "invoice" }))).toBe(false);
    });

    it("tolerates a null description", () => {
      const task = makeTask({ description: null });
      expect(taskMatchesFilters(task, withFilters({ search: "report" }))).toBe(true);
      expect(taskMatchesFilters(task, withFilters({ search: "quarterly" }))).toBe(false);
    });
  });

  describe("priority", () => {
    it("keeps only the matching priority", () => {
      const task = makeTask({ priority: TaskPriority.HIGH });
      expect(taskMatchesFilters(task, withFilters({ priority: TaskPriority.HIGH }))).toBe(true);
      expect(taskMatchesFilters(task, withFilters({ priority: TaskPriority.LOW }))).toBe(false);
    });
  });

  describe("dueDate", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW);
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("noDueDate keeps only undated tasks", () => {
      expect(taskMatchesFilters(makeTask({ dueDate: null }), withFilters({ dueDate: "noDueDate" }))).toBe(true);
      expect(
        taskMatchesFilters(makeTask({ dueDate: new Date(NOW) }), withFilters({ dueDate: "noDueDate" })),
      ).toBe(false);
    });

    it("excludes undated tasks from date-bound filters", () => {
      expect(taskMatchesFilters(makeTask({ dueDate: null }), withFilters({ dueDate: "overdue" }))).toBe(false);
      expect(taskMatchesFilters(makeTask({ dueDate: null }), withFilters({ dueDate: "dueSoon" }))).toBe(false);
    });

    it("overdue matches strictly past due dates", () => {
      expect(
        taskMatchesFilters(makeTask({ dueDate: new Date(NOW - 1000) }), withFilters({ dueDate: "overdue" })),
      ).toBe(true);
      expect(
        taskMatchesFilters(makeTask({ dueDate: new Date(NOW + 1000) }), withFilters({ dueDate: "overdue" })),
      ).toBe(false);
    });

    it("dueSoon matches the window from now through the horizon, inclusive", () => {
      expect(taskMatchesFilters(makeTask({ dueDate: new Date(NOW) }), withFilters({ dueDate: "dueSoon" }))).toBe(
        true,
      );
      expect(
        taskMatchesFilters(
          makeTask({ dueDate: new Date(NOW + DUE_SOON_WINDOW_MS) }),
          withFilters({ dueDate: "dueSoon" }),
        ),
      ).toBe(true);
      expect(
        taskMatchesFilters(
          makeTask({ dueDate: new Date(NOW + DUE_SOON_WINDOW_MS + 1) }),
          withFilters({ dueDate: "dueSoon" }),
        ),
      ).toBe(false);
    });
  });

  describe("assignee & labels", () => {
    it("filters by assignee id", () => {
      const task = makeTask({ assignee: { id: "u1" } });
      expect(taskMatchesFilters(task, withFilters({ assigneeId: "u1" }))).toBe(true);
      expect(taskMatchesFilters(task, withFilters({ assigneeId: "u2" }))).toBe(false);
      expect(taskMatchesFilters(makeTask({ assignee: null }), withFilters({ assigneeId: "u1" }))).toBe(false);
    });

    it("matches when the task carries the requested label", () => {
      const task = makeTask({ labels: [{ id: "l1" }, { id: "l2" }] });
      expect(taskMatchesFilters(task, withFilters({ labelId: "l2" }))).toBe(true);
      expect(taskMatchesFilters(task, withFilters({ labelId: "l3" }))).toBe(false);
    });
  });

  it("requires all active dimensions to match (AND semantics)", () => {
    const task = makeTask({ priority: TaskPriority.HIGH, assignee: { id: "u1" } });
    expect(
      taskMatchesFilters(task, withFilters({ priority: TaskPriority.HIGH, assigneeId: "u1", search: "report" })),
    ).toBe(true);
    expect(
      taskMatchesFilters(task, withFilters({ priority: TaskPriority.HIGH, assigneeId: "u2" })),
    ).toBe(false);
  });
});
