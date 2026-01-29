/*
  Warnings:

  - You are about to drop the column `taskNumber` on the `tasks` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "tasks_projectId_taskNumber_key";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "taskNumber";
