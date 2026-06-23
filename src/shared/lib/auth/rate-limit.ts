import "server-only";

import { headers } from "next/headers";

// ── In-memory fallback (single-instance only) ────────────────────────────────

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function purgeExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function checkInMemory(key: string, limit: number, windowMs: number): boolean {
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

// ── Public API ────────────────────────────────────────────────────────────────

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  return checkInMemory(key, limit, windowMs);
}

export async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  const xRealIp = requestHeaders.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    return ips[ips.length - 1]!;
  }
  return "unknown";
}
