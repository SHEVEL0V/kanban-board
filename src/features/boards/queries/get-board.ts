import "server-only";

import { notFound } from "next/navigation";
import { prisma } from "@/shared/lib/prisma";
import { verifySession } from "@/shared/lib/dal";
import { boardAccessFilter } from "@/shared/lib/board-access";

export async function getBoard(boardId: string) {
  const { userId } = await verifySession();

  const board = await prisma.board.findFirst({
    where: { id: boardId, ...boardAccessFilter(userId) },
    include: {
      owner: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      columns: {
        orderBy: { order: "asc" },
        include: {
          tasks: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!board) {
    notFound();
  }

  return board;
}

export type BoardWithColumns = NonNullable<Awaited<ReturnType<typeof getBoard>>>;
