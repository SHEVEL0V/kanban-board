-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('CREATED', 'UPDATED', 'MOVED', 'DELETED');

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "taskTitle" TEXT NOT NULL,
    "fromColumn" TEXT,
    "toColumn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_boardId_createdAt_idx" ON "Activity"("boardId", "createdAt");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
