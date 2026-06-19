import "server-only";

import { notFound } from "next/navigation";
import { prisma } from "@/shared/lib/db/prisma";
import { verifySession } from "@/shared/lib/auth/dal";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";

export async function getBoard(boardId: string) {
  const { userId } = await verifySession();

  const board = await prisma.board.findFirst({
    where: { id: boardId, ...boardAccessFilter(userId) },
    include: {
      owner: { select: { id: true, name: true } },
      members: {
        select: { id: true, userId: true, role: true, user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      labels: {
        select: { id: true, title: true, color: true },
        orderBy: { createdAt: "asc" },
      },
      columns: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            where: { status: { not: "ARCHIVED" } },
            orderBy: { order: "asc" },
            include: {
              _count: { select: { comments: true } },
              assignee: { select: { id: true, name: true } },
              labels: {
                select: { id: true, title: true, color: true },
                orderBy: { createdAt: "asc" },
              },
              checklistItems: {
                select: { id: true, content: true, done: true, order: true },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!board) {
    notFound();
  }

  const currentUserRole =
    board.ownerId === userId
      ? ("OWNER" as const)
      : (board.members.find((m) => m.userId === userId)?.role ?? ("EDITOR" as const));

  return { ...board, currentUserRole };
}

export type BoardWithColumns = NonNullable<Awaited<ReturnType<typeof getBoard>>>;
export type TaskWithComments = BoardWithColumns["columns"][number]["tasks"][number];
export type BoardLabel = BoardWithColumns["labels"][number];
export type BoardMember = BoardWithColumns["members"][number];
export type BoardMemberUser = { id: string; name: string };
