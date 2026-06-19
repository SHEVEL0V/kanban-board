"use server";

import { verifySession } from "@/shared/lib/auth/dal";
import { ok } from "@/shared/lib/actions/result";
import {
  fetchNotificationsCached,
  mapNotifications,
} from "@/features/notifications/queries/get-due-task-notifications";

// Client poll: reuses the same per-user cached query as SSR, so repeated polls
// (and duplicate tabs) hit the cache instead of the DB. At most one query batch
// per user per cache TTL, regardless of how many tabs are open.
export async function pollNotifications() {
  const { userId } = await verifySession();
  return ok(mapNotifications(await fetchNotificationsCached(userId)));
}
