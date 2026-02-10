/**
 * One-time script: Mark feedback items #51–#54 as RESOLVED.
 * These features are verified as fully implemented.
 *
 * Usage: npx tsx scripts/resolve-feedback-51-54.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FEATURE_NUMBERS = [51, 52, 53, 54];

const RESOLUTION_NOTES: Record<number, string> = {
  51: 'QA cycles have dedicated Kanban boards at unique URLs (/dashboard/projects/[id]/cycles/[cycleId]). Full CRUD API (7 endpoints) with role-based access, Zod validation, input sanitization, activity logging, and SSE real-time updates. Cycle list + detail pages with create modal, add/remove issues, drag-and-drop.',
  52: 'Unified view on main project page with QA cycle filter dropdown. Selecting a cycle filters the Kanban to show only that cycle\'s issues. Default shows all issues. Cycle filter combines with type, status, priority, assignee, and search filters, all URL-persisted.',
  53: 'Real-time SSE updates across all views: Feedback page receives feedback:created/updated/deleted events via /api/feedback/events. Project Kanban receives issue:* events. QA cycle detail receives qacycle:* + issue:updated events. All with JWT auth, 30s keep-alive, proper cleanup.',
  54: 'Full QA cycle management (CRUD, status transitions, issue linking, role-based access). URL-persisted filters on project page (7 filters: search, type, status, priority, assignee, cycle, group-by-URL) and feedback page (3 filters: search, type, priority). Bookmarkable/shareable.',
};

async function main() {
  // List current status of target feedback items
  const allFeedback = await prisma.feedback.findMany({
    where: {
      title: { startsWith: 'Feature #' },
    },
    select: { id: true, title: true, status: true, priority: true },
    orderBy: { title: 'asc' },
  });

  console.log('\n=== Current Feedback Items (Feature #) ===');
  for (const f of allFeedback) {
    const match = f.title.match(/Feature #(\d+)/);
    const num = match ? parseInt(match[1]) : 0;
    const isTarget = FEATURE_NUMBERS.includes(num);
    console.log(`  ${isTarget ? '>>>' : '   '} [${f.status}] ${f.title} (id: ${f.id})`);
  }

  console.log('\n=== Updating #51–#54 to RESOLVED ===');

  for (const num of FEATURE_NUMBERS) {
    const feedback = await prisma.feedback.findFirst({
      where: { title: { startsWith: `Feature #${num} -` } },
    });

    if (!feedback) {
      console.log(`  Feature #${num}: NOT FOUND — skipping`);
      continue;
    }

    if (feedback.status === 'RESOLVED') {
      console.log(`  Feature #${num}: Already RESOLVED — skipping`);
      continue;
    }

    // Update status to RESOLVED
    await prisma.feedback.update({
      where: { id: feedback.id },
      data: { status: 'RESOLVED' },
    });

    // Log resolution activity
    const note = RESOLUTION_NOTES[num] || 'Feature verified as implemented.';
    await prisma.activityLog.create({
      data: {
        feedbackId: feedback.id,
        userId: feedback.createdById,
        action: 'status_changed',
        field: 'status',
        oldValue: feedback.status,
        newValue: 'RESOLVED',
        metadata: { resolutionNote: note },
      },
    });

    console.log(`  Feature #${num}: ${feedback.status} → RESOLVED`);
    console.log(`    Note: ${note}`);
  }

  console.log('\n=== Done ===\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
