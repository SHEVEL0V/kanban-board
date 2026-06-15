import "server-only";

import { prisma } from "@/shared/lib/prisma";
import { verifySession } from "@/shared/lib/dal";

export async function getBoards() {
  const { userId } = await verifySession();

  return prisma.board.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, createdAt: true },
  });
}
