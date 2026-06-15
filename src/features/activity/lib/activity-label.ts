import type { Dictionary } from "@/shared/i18n/get-dictionary";
import type { ActivityEntry } from "@/features/activity/queries/get-activity-log";

// Renders a single activity entry as a localized, human-readable sentence.
export function activityLabel(entry: ActivityEntry, dict: Dictionary, currentUserId: string): string {
  const actor = entry.actorId === currentUserId ? dict.boards.you : entry.actor.name;

  switch (entry.action) {
    case "CREATED":
      return dict.activity.created.replace("{actor}", actor).replace("{task}", entry.taskTitle);
    case "UPDATED":
      return dict.activity.updated.replace("{actor}", actor).replace("{task}", entry.taskTitle);
    case "MOVED":
      return dict.activity.moved
        .replace("{actor}", actor)
        .replace("{task}", entry.taskTitle)
        .replace("{from}", entry.fromColumn ?? "")
        .replace("{to}", entry.toColumn ?? "");
    case "DELETED":
      return dict.activity.deleted.replace("{actor}", actor).replace("{task}", entry.taskTitle);
  }
}
