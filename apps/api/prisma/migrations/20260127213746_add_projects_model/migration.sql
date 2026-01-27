/*
  Warnings:

  - You are about to drop the column `status` on the `projects` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "projects_status_idx";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "status";
