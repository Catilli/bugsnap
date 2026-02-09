import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FEEDBACK_ITEMS = [
  {
    title: 'Add ADMIN role to UserRole enum',
    description: 'Add ADMIN as the 4th role in the UserRole enum. ADMIN has full system access, bypasses all ownership checks, and can manage all projects and users.',
  },
  {
    title: 'Create reusable requireRole API middleware',
    description: 'Create requireRole(minRole) and requireProjectRole(minRole) preHandler factories in apps/api/src/middleware/. These enforce role hierarchy: VIEWER(0) < DEVELOPER(1) < MANAGER(2) < ADMIN(3).',
  },
  {
    title: 'Create frontend useRole hook for UI guards',
    description: 'Create useRole() hook, useProjectRole(projectId) hook, and <RoleGate minRole="..."> component for conditional rendering based on user role.',
  },
  {
    title: 'Admin: Global project and team management',
    description: 'ADMIN bypasses ownership checks in all routes. getUserProjects() returns ALL projects for ADMIN. isMemberOfProject() returns true for ADMIN.',
  },
  {
    title: 'Admin: System settings and data export',
    description: 'Placeholder for future admin features: system settings panel, data export, user management dashboard. Stays OPEN until these features are built.',
  },
  {
    title: 'PM/QA (MANAGER): Issue lifecycle management',
    description: 'Guards on assign/priority/delete require MANAGER+. Fix projects.ts PATCH bug (member.role === "admin" should be "MANAGER"). Frontend wraps priority/assign in RoleGate.',
  },
  {
    title: 'Team Member (DEVELOPER): Scoped access restrictions',
    description: 'DEVELOPER can only update status on issues assigned to them or created by them. Cannot change title, type, visibility on others\' issues.',
  },
  {
    title: 'Viewer (VIEWER): Read-only access enforcement',
    description: 'VIEWER gets 403 on all write operations. Frontend hides all edit controls, disables kanban drag-and-drop, hides comment input and submit buttons.',
  },
  // ── Kanban Bug Dashboard & Reporting ──────────────────────────────
  {
    title: 'Kanban Board – workflow stages and status mapping',
    description:
      'Visual Kanban Board that summarises all reported bugs/issues for quick overview. ' +
      'Four workflow stages: NEW (newly reported bugs logged by PM/QA), IN PROGRESS (issues actively being addressed by the dev team), ' +
      'READY FOR QA (fixes completed and ready for validation/testing), COMPLETED (verified and resolved issues). ' +
      'Map each stage to the underlying Issue status values and define transition rules (who can move items between stages, validation on transitions). ' +
      'Tags: Kanban, Reporting, QA cycle.',
  },
  {
    title: 'Multiple Kanban reports per QA cycle with unique URLs',
    description:
      'Each QA cycle can generate a separate Kanban report with a unique, shareable URL. ' +
      'Project Manager / QA can track issues per QA iteration independently. ' +
      'A new report is generated when a QA round begins; existing reports remain accessible for historical reference. ' +
      'Tags: Kanban, Reporting, QA cycle.',
  },
  {
    title: 'Unified All-Reports view with filters and historical context',
    description:
      'Optional mode to combine multiple Kanban reports into a single, aggregated view for full project visibility. ' +
      'Filters include: QA cycle, status, priority, assignee, and page. ' +
      'Maintains historical context from previous QA cycles while enabling high-level tracking across the entire project. ' +
      'Tags: Kanban, Reporting, QA cycle.',
  },
  {
    title: 'Real-time updates for annotations and issue status in Kanban',
    description:
      'Dynamic updates: changes to annotations or issue status are reflected in the Kanban board in real time. ' +
      'Leverage existing SSE infrastructure or introduce WebSocket/polling as needed so that all team members see the latest state ' +
      'without manual page refreshes. ' +
      'Tags: Kanban, Reporting, Real-time.',
  },
  {
    title: 'QA cycle management and advanced filters (priority, assignee, page, tag)',
    description:
      'Generate a new report for each QA round or continue tracking using an existing Kanban report. ' +
      'Advanced filters & views: filter by priority, assignee, page, or tag for focused analysis within a single report or across all reports. ' +
      'Support creating, naming, and closing QA cycles as first-class entities. ' +
      'Tags: Kanban, Reporting, QA cycle, Filters.',
  },
];

async function main() {
  // Find admin user to promote
  const adminUser = await prisma.user.findUnique({
    where: { email: 'developer2018team@gmail.com' },
  });

  if (!adminUser) {
    // Fallback: find first existing user
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      console.error('ERROR: No users exist in the database. Please register at least one user first.');
      process.exit(1);
    }
    console.log(`WARNING: developer2018team@gmail.com not found. Using ${firstUser.email} as creator.`);

    await createFeedbackItems(firstUser.id);
    return;
  }

  // Promote to ADMIN
  await prisma.user.update({
    where: { id: adminUser.id },
    data: { role: 'ADMIN' },
  });
  console.log(`Promoted ${adminUser.email} to ADMIN role.`);

  await createFeedbackItems(adminUser.id);
}

async function createFeedbackItems(creatorId: string) {
  // Count existing FEATURE feedback to determine next number
  const existingFeatures = await prisma.feedback.findMany({
    where: { type: 'FEATURE' },
    select: { title: true },
    orderBy: { createdAt: 'desc' },
  });

  let nextNumber = 1;
  if (existingFeatures.length > 0) {
    for (const fb of existingFeatures) {
      const match = fb.title.match(/Feature #(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num >= nextNumber) nextNumber = num + 1;
      }
    }
  }

  let created = 0;
  let skipped = 0;

  for (const item of FEEDBACK_ITEMS) {
    // Check if already exists (idempotent)
    const existing = existingFeatures.find((fb) =>
      fb.title.includes(item.title)
    );

    if (existing) {
      console.log(`  SKIP: "${item.title}" (already exists)`);
      skipped++;
      continue;
    }

    await prisma.feedback.create({
      data: {
        type: 'FEATURE',
        title: `Feature #${nextNumber} - ${item.title}`,
        description: item.description,
        priority: 'high',
        status: 'OPEN',
        createdById: creatorId,
      },
    });

    console.log(`  CREATED: Feature #${nextNumber} - ${item.title}`);
    nextNumber++;
    created++;
  }

  console.log(`\nSeed complete: ${created} created, ${skipped} skipped.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
