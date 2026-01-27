/*
  Warnings:

  - You are about to drop the column `teamId` on the `bug_reports` table. All the data in the column will be lost.
  - You are about to drop the `team_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teams` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "bug_reports" DROP CONSTRAINT "bug_reports_teamId_fkey";

-- DropForeignKey
ALTER TABLE "team_members" DROP CONSTRAINT "team_members_teamId_fkey";

-- DropForeignKey
ALTER TABLE "team_members" DROP CONSTRAINT "team_members_userId_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_ownerId_fkey";

-- DropIndex
DROP INDEX "bug_reports_teamId_idx";

-- AlterTable
ALTER TABLE "bug_reports" DROP COLUMN "teamId";

-- DropTable
DROP TABLE "team_members";

-- DropTable
DROP TABLE "teams";
