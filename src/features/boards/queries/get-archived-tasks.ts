"use server";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/shared/lib/db/prisma";
import { verifySession } from "@/shared/lib/auth/dal";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";
import { ok, err, ErrorCode } from "@/shared/lib/actions/result";

const archivedTaskSelect = {
  id: true,
  title: true,
  priority: true,
  createdAt: true,
  completedAt: true,
  archivedAt: true,
  assignee: { select: { name: true } },
  assignedBy: { select: { name: true } },
  archivedBy: { select: { name: true } },
  column: { select: { title: true } },
} satisfies Prisma.TaskSelect;

export type ArchivedTask = Prisma.TaskGetPayload<{ select: typeof archivedTaskSelect }>;

// Returns archived tasks for a board; callable as a Server Action from client components.
export async function getArchivedTasks(boardId: string) {
  const { userId } = await verifySession();

  const board = await prisma.board.findFirst({
    where: { id: boardId, ...boardAccessFilter(userId) },
    select: { id: true },
  });
  if (!board) return err(ErrorCode.NOT_FOUND);

  const tasks = await prisma.task.findMany({
    where: { column: { boardId }, status: "ARCHIVED" },
    select: archivedTaskSelect,
    orderBy: { archivedAt: "desc" },
  });

  return ok(tasks);
}
