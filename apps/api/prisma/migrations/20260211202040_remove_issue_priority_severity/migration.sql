/*
  Warnings:

  - You are about to drop the column `priority` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `severity` on the `tasks` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "tasks_priority_idx";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "priority",
DROP COLUMN "severity";
