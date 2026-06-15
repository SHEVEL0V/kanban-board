import "server-only";

import { prisma } from "@/shared/lib/prisma";
import { verifySession } from "@/shared/lib/dal";
import { boardAccessFilter } from "@/shared/lib/board-access";

export async function getBoards() {
  const { userId } = await verifySession();

  return prisma.board.findMany({
    where: boardAccessFilter(userId),
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, createdAt: true, ownerId: true, owner: { select: { name: true } } },
  });
}
