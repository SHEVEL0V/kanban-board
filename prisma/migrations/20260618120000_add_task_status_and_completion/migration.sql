-- Add isCompletion flag to Column
ALTER TABLE "Column" ADD COLUMN "isCompletion" BOOLEAN NOT NULL DEFAULT false;

-- Add TaskStatus enum
CREATE TYPE "TaskStatus" AS ENUM ('ACTIVE', 'PENDING_REVIEW', 'ARCHIVED');

-- Add new fields to Task
ALTER TABLE "Task" ADD COLUMN "status" "TaskStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Task" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "assignedById" TEXT;
ALTER TABLE "Task" ADD COLUMN "archivedById" TEXT;

-- Add foreign keys
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedById_fkey"
  FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT "Task_archivedById_fkey"
  FOREIGN KEY ("archivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_assignedById_idx" ON "Task"("assignedById");
