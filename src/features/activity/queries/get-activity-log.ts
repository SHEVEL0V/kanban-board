import "server-only";

import { notFound } from "next/navigation";
import { prisma } from "@/shared/lib/db/prisma";
import { verifySession } from "@/shared/lib/auth/dal";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";

export async function getActivityLog(boardId: string) {
  const { userId } = await verifySession();

  const board = await prisma.board.findFirst({
    where: { id: boardId, ...boardAccessFilter(userId) },
    select: { id: true },
  });

  if (!board) {
    notFound();
  }

  return prisma.activity.findMany({
    where: { boardId },
    include: { actor: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export type ActivityEntry = Awaited<ReturnType<typeof getActivityLog>>[number];
