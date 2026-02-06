-- Remove clerkId column from users table
-- Drop the unique index first, then the column
DROP INDEX IF EXISTS "users_clerkId_key";
ALTER TABLE "users" DROP COLUMN IF EXISTS "clerkId";
