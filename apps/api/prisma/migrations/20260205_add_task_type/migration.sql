-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('BUG', 'FEATURE', 'TASK');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "type" "TaskType" NOT NULL DEFAULT 'TASK';

-- CreateIndex
CREATE INDEX "tasks_type_idx" ON "tasks"("type");
