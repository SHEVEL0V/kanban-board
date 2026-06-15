import "server-only";

import { notFound } from "next/navigation";
import { prisma } from "@/shared/lib/prisma";
import { verifySession } from "@/shared/lib/dal";

export async function getBoard(boardId: string) {
  const { userId } = await verifySession();

  const board = await prisma.board.findFirst({
    where: { id: boardId, ownerId: userId },
    include: {
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
