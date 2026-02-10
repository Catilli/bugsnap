/**
 * One-time script: Mark feedback items #42–#50 as RESOLVED.
 * These features are verified as fully implemented.
 *
 * Usage: npx tsx scripts/resolve-feedback.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FEATURE_NUMBERS = [42, 43, 44, 45, 46, 47, 48, 49, 50];

const RESOLUTION_NOTES: Record<number, string> = {
  42: 'ADMIN role present in UserRole enum (schema.prisma). All 4 roles: ADMIN, MANAGER, DEVELOPER, VIEWER.',
  43: 'requireRole() global middleware + requireProjectRole() project-scoped middleware implemented. Used across all route files.',
  44: 'useRole() hook, useProjectRole() hook, and RoleGate component implemented. 46 usages across 14 frontend files.',
  45: 'ADMIN bypasses all ownership checks via ProjectMemberService. getUserProjects() returns ALL projects for ADMIN.',
  46: 'Admin dashboard page with system stats, user management, role changes, and CSV data export. Backend routes gated with requireRole(ADMIN).',
  47: 'MANAGER+ required for assignee/priority changes and issue deletion. Enforced in issues.ts with role hierarchy checks.',
  48: 'DEVELOPER can only update status on own/assigned issues. Cannot change title/type/visibility on others\' issues.',
  49: 'VIEWER gets 403 on all write operations. Kanban drag disabled, form controls hidden via isViewer checks across UI.',
  50: '4-column Kanban (New → In Progress → Ready for QA → Completed) with drag-and-drop. Role-gated via onStatusChange prop.',
};

async function main() {
  // First, list all high-priority feedback to see what exists
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

  console.log('\n=== Updating #42–#50 to RESOLVED ===');

  for (const num of FEATURE_NUMBERS) {
    // Find the feedback item
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
