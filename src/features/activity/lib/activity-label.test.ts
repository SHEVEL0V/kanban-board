import type { ActivityEntry } from "@/features/activity/queries/get-activity-log";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { describe, expect, it } from "vitest";
import { activityLabel } from "./activity-label";

// Distinctive templates so every assertion proves which placeholder was filled.
const dict = {
  boards: { you: "You" },
  activity: {
    created: "{actor} created [{task}]",
    updated: "{actor} updated [{task}]",
    moved: "{actor} moved [{task}] from <{from}> to <{to}>",
    deleted: "{actor} deleted [{task}]",
  },
} as unknown as Dictionary;

const CURRENT_USER = "u-self";

function entry(overrides: Partial<ActivityEntry> = {}): ActivityEntry {
  return {
    action: "CREATED",
    actorId: "u-other",
    actor: { id: "u-other", name: "Alice" },
    taskTitle: "Ship release",
    fromColumn: null,
    toColumn: null,
    ...overrides,
  } as ActivityEntry;
}

describe("activityLabel", () => {
  it("uses the actor's name when they are not the current user", () => {
    expect(activityLabel(entry(), dict, CURRENT_USER)).toBe("Alice created [Ship release]");
  });

  it('substitutes "You" when the actor is the current user', () => {
    expect(activityLabel(entry({ actorId: CURRENT_USER }), dict, CURRENT_USER)).toBe(
      "You created [Ship release]",
    );
  });

  it("renders UPDATED and DELETED actions", () => {
    expect(activityLabel(entry({ action: "UPDATED" }), dict, CURRENT_USER)).toBe(
      "Alice updated [Ship release]",
    );
    expect(activityLabel(entry({ action: "DELETED" }), dict, CURRENT_USER)).toBe(
      "Alice deleted [Ship release]",
    );
  });

  it("fills both column endpoints for MOVED", () => {
    const label = activityLabel(
      entry({ action: "MOVED", fromColumn: "To Do", toColumn: "Done" }),
      dict,
      CURRENT_USER,
    );
    expect(label).toBe("Alice moved [Ship release] from <To Do> to <Done>");
  });

  it("renders MOVED with empty strings when columns are missing", () => {
    const label = activityLabel(entry({ action: "MOVED" }), dict, CURRENT_USER);
    expect(label).toBe("Alice moved [Ship release] from <> to <>");
  });
});
