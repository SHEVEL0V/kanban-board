import "server-only";

import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };

// In-memory fixed-window limiter. Good enough for a single-instance deploy;
// switch to a shared store (e.g. Redis) if running multiple instances.
const buckets = new Map<string, Bucket>();

function purgeExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    purgeExpired(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}

export async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return requestHeaders.get("x-real-ip") ?? "unknown";
}
