import "server-only";

import { prisma } from "@/shared/lib/db/prisma";
import { verifySession } from "@/shared/lib/auth/dal";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";

export async function getBoards() {
  const { userId } = await verifySession();

  return prisma.board.findMany({
    where: boardAccessFilter(userId),
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      ownerId: true,
      owner: { select: { id: true, name: true } },
      members: { select: { id: true, role: true, user: { select: { id: true, name: true, email: true } } } },
    },
  });
}
