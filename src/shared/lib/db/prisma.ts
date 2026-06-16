import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/shared/lib/env";

// Reuse a single PrismaClient across hot-reloads in dev to avoid exhausting DB connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
