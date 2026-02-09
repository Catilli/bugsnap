-- Add feedbackId to share_tokens
ALTER TABLE "share_tokens" ADD COLUMN "feedbackId" TEXT;
ALTER TABLE "share_tokens" ADD CONSTRAINT "share_tokens_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Make attachments.issueId optional and add feedbackId
ALTER TABLE "attachments" ALTER COLUMN "issueId" DROP NOT NULL;
ALTER TABLE "attachments" ADD COLUMN "feedbackId" TEXT;
CREATE INDEX "attachments_feedbackId_idx" ON "attachments"("feedbackId");
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add feedbackId to notifications
ALTER TABLE "notifications" ADD COLUMN "feedbackId" TEXT;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add feedbackId to activity_logs and make projectId optional
ALTER TABLE "activity_logs" ALTER COLUMN "projectId" DROP NOT NULL;
ALTER TABLE "activity_logs" ADD COLUMN "feedbackId" TEXT;
CREATE INDEX "activity_logs_feedbackId_idx" ON "activity_logs"("feedbackId");
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
