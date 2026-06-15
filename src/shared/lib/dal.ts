import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { decrypt, getSessionCookie } from "@/shared/lib/session";
import { prisma } from "@/shared/lib/prisma";

export type AuthenticatedSession = {
  userId: string;
};

// Memoized per request: cheap to call from layouts, pages, and Server Actions alike.
export const verifySession = cache(async (): Promise<AuthenticatedSession> => {
  const session = await decrypt(await getSessionCookie());

  if (!session?.userId) {
    redirect("/login");
  }

  return { userId: session.userId };
});

export const getCurrentUser = cache(async () => {
  const session = await decrypt(await getSessionCookie());
  if (!session?.userId) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true },
  });
});
