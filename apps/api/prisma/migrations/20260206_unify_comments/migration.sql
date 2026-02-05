-- Unify feedback_comments and comments into a single comments table
-- Step 1: Make taskId nullable (was required) and add feedbackId column
ALTER TABLE "comments" ALTER COLUMN "taskId" DROP NOT NULL;
ALTER TABLE "comments" ADD COLUMN "feedbackId" TEXT;

-- Step 2: Copy all feedback_comments into comments (with feedbackId set, taskId NULL)
INSERT INTO "comments" ("id", "taskId", "feedbackId", "userId", "content", "createdAt", "updatedAt")
SELECT "id", NULL, "feedbackId", "userId", "content", "createdAt", "updatedAt"
FROM "feedback_comments";

-- Step 3: Add foreign key from comments.feedbackId -> feedback.id with cascade delete
ALTER TABLE "comments"
  ADD CONSTRAINT "comments_feedbackId_fkey"
  FOREIGN KEY ("feedbackId") REFERENCES "feedback"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Add index on feedbackId for query performance
CREATE INDEX "comments_feedbackId_idx" ON "comments"("feedbackId");

-- Step 5: Add CHECK constraint — exactly one of taskId or feedbackId must be set
ALTER TABLE "comments"
  ADD CONSTRAINT "comments_exactly_one_parent"
  CHECK (
    ("taskId" IS NOT NULL AND "feedbackId" IS NULL)
    OR
    ("taskId" IS NULL AND "feedbackId" IS NOT NULL)
  );

-- Step 6: Drop the old feedback_comments table (data already migrated)
DROP TABLE "feedback_comments";
