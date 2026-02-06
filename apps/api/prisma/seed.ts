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
