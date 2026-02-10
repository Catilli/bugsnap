-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'DEVELOPER', 'VIEWER');

-- Convert users.role from TEXT to UserRole enum
-- Map old text values to new enum values
UPDATE "users" SET "role" = 'MANAGER' WHERE "role" NOT IN ('ADMIN', 'MANAGER', 'DEVELOPER', 'VIEWER');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'MANAGER'::"UserRole";

-- Convert project_members.role from TEXT to UserRole enum
UPDATE "project_members" SET "role" = 'DEVELOPER' WHERE "role" NOT IN ('ADMIN', 'MANAGER', 'DEVELOPER', 'VIEWER');
ALTER TABLE "project_members" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "project_members" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";
ALTER TABLE "project_members" ALTER COLUMN "role" SET DEFAULT 'DEVELOPER'::"UserRole";
