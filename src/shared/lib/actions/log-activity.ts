import "server-only";

import type { ActivityAction, Prisma } from "@/generated/prisma/client";

type LogActivityInput = {
  boardId: string;
  actorId: string;
  action: ActivityAction;
  taskTitle: string;
  fromColumn?: string;
  toColumn?: string;
};

// Appends an immutable Activity row. Pass a transaction client so the log is
// written atomically with the mutation it describes. fromColumn/toColumn are
// stored as snapshots (not FKs) so entries survive task/column deletion.
export function logActivity(tx: Prisma.TransactionClient, input: LogActivityInput) {
  return tx.activity.create({ data: input });
}
