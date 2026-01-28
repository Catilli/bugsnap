/*
  Warnings:

  - You are about to drop the column `reportId` on the `annotations` table. All the data in the column will be lost.
  - You are about to drop the column `reportId` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the `bug_reports` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `taskId` to the `annotations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taskId` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Made the column `websiteUrl` on table `projects` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "annotations" DROP CONSTRAINT "annotations_reportId_fkey";

-- DropForeignKey
ALTER TABLE "bug_reports" DROP CONSTRAINT "bug_reports_createdById_fkey";

-- DropForeignKey
ALTER TABLE "bug_reports" DROP CONSTRAINT "bug_reports_projectId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_reportId_fkey";

-- DropIndex
DROP INDEX "annotations_reportId_idx";

-- DropIndex
DROP INDEX "comments_reportId_idx";

-- AlterTable
ALTER TABLE "annotations" DROP COLUMN "reportId",
ADD COLUMN     "taskId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "reportId",
ADD COLUMN     "taskId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "description",
ALTER COLUMN "websiteUrl" SET NOT NULL;

-- DropTable
DROP TABLE "bug_reports";

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "taskNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "screenshotUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "environmentData" JSONB,
    "visibility" TEXT NOT NULL DEFAULT 'members',
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_projectId_idx" ON "tasks"("projectId");

-- CreateIndex
CREATE INDEX "tasks_createdById_idx" ON "tasks"("createdById");

-- CreateIndex
CREATE INDEX "tasks_assignedToId_idx" ON "tasks"("assignedToId");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_projectId_taskNumber_key" ON "tasks"("projectId", "taskNumber");

-- CreateIndex
CREATE INDEX "annotations_taskId_idx" ON "annotations"("taskId");

-- CreateIndex
CREATE INDEX "comments_taskId_idx" ON "comments"("taskId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
