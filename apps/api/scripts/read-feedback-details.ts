import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  for (const num of [51, 52, 53, 54]) {
    const fb = await prisma.feedback.findFirst({
      where: { title: { startsWith: `Feature #${num} -` } },
      include: {
        comments: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        },
        createdBy: { select: { name: true } },
      },
    });
    if (!fb) {
      console.log(`\n=== Feature #${num}: NOT FOUND ===\n`);
      continue;
    }
    console.log(`\n=== Feature #${num} ===`);
    console.log(`Title: ${fb.title}`);
    console.log(`Status: ${fb.status}`);
    console.log(`Priority: ${fb.priority || 'none'}`);
    console.log(`Type: ${fb.type}`);
    console.log(`Created by: ${fb.createdBy.name}`);
    console.log(`Description:\n${fb.description || '(no description)'}`);
    if (fb.comments.length > 0) {
      console.log(`\nComments (${fb.comments.length}):`);
      for (const c of fb.comments) {
        console.log(`  [${c.user.name}]: ${c.content}`);
      }
    } else {
      console.log(`Comments: none`);
    }
  }
}

main().finally(() => prisma.$disconnect());
