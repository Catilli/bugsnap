/**
 * Script to mark RBAC feedback items (#42–#49) as RESOLVED.
 *
 * Run with: npx tsx scripts/resolve-rbac-feedback.ts
 *
 * Requires DATABASE_URL environment variable to be set.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TITLES_TO_RESOLVE = [
  'Add ADMIN role to UserRole enum',                    // #42
  'Create reusable requireRole API middleware',          // #43
  'Create frontend useRole hook for UI guards',          // #44
  'Admin: Global project and team management',           // #45
  'Admin: System settings and data export',              // #46
  'PM/QA (MANAGER): Issue lifecycle management',         // #47
  'Team Member (DEVELOPER): Scoped access restrictions', // #48
  'Viewer (VIEWER): Read-only access enforcement',       // #49
];

async function main() {
  console.log('Marking RBAC feedback items as RESOLVED...\n');

  for (const title of TITLES_TO_RESOLVE) {
    const result = await prisma.feedback.updateMany({
      where: {
        title: { contains: title.substring(0, 30) },
        status: { not: 'RESOLVED' },
      },
      data: { status: 'RESOLVED' },
    });

    if (result.count > 0) {
      console.log(`  RESOLVED: "${title}" (${result.count} matched)`);
    } else {
      console.log(`  SKIPPED:  "${title}" (already resolved or not found)`);
    }
  }

  console.log('\nDone.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
