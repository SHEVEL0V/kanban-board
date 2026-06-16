-- DropIndex
DROP INDEX "Column_boardId_idx";

-- DropIndex
DROP INDEX "Task_columnId_idx";

-- CreateIndex
CREATE INDEX "Column_boardId_order_idx" ON "Column"("boardId", "order");

-- CreateIndex
CREATE INDEX "Task_columnId_order_idx" ON "Task"("columnId", "order");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
