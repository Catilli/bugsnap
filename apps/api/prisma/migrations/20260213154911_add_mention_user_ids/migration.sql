-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "mentionedUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
