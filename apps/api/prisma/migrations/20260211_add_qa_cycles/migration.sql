-- CreateTable
CREATE TABLE "qa_cycles" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qa_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qa_cycle_issues" (
    "id" TEXT NOT NULL,
    "qaCycleId" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qa_cycle_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "qa_cycles_projectId_idx" ON "qa_cycles"("projectId");

-- CreateIndex
CREATE INDEX "qa_cycles_status_idx" ON "qa_cycles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "qa_cycle_issues_qaCycleId_issueId_key" ON "qa_cycle_issues"("qaCycleId", "issueId");

-- AddForeignKey
ALTER TABLE "qa_cycles" ADD CONSTRAINT "qa_cycles_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qa_cycles" ADD CONSTRAINT "qa_cycles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qa_cycle_issues" ADD CONSTRAINT "qa_cycle_issues_qaCycleId_fkey" FOREIGN KEY ("qaCycleId") REFERENCES "qa_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qa_cycle_issues" ADD CONSTRAINT "qa_cycle_issues_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
