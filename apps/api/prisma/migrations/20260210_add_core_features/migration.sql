-- Add severity field to tasks (Issue model maps to "tasks" table)
ALTER TABLE "tasks" ADD COLUMN "severity" TEXT;

-- Create share_tokens table
CREATE TABLE "share_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "issueId" TEXT,
    "projectId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "share_tokens_token_key" ON "share_tokens"("token");

ALTER TABLE "share_tokens" ADD CONSTRAINT "share_tokens_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "share_tokens" ADD CONSTRAINT "share_tokens_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create attachments table
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "attachments_issueId_idx" ON "attachments"("issueId");

ALTER TABLE "attachments" ADD CONSTRAINT "attachments_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create notifications table
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "issueId" TEXT,
    "projectId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create activity_logs table
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "issueId" TEXT,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "activity_logs_issueId_idx" ON "activity_logs"("issueId");
CREATE INDEX "activity_logs_projectId_idx" ON "activity_logs"("projectId");
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
