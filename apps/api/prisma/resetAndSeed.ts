import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10; // matches authService.ts

async function main() {
  // Guard: block production
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Cannot run reset in production.');
    process.exit(1);
  }

  console.log('Seeding default ADMIN user...');

  const hashedPassword = await bcrypt.hash('admin1989', SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email: 'cath@murphyconsulting.us' },
    update: { password: hashedPassword, role: 'ADMIN', name: 'Cath' },
    create: {
      email: 'cath@murphyconsulting.us',
      password: hashedPassword,
      name: 'Cath',
      role: 'ADMIN',
    },
  });

  console.log('ADMIN user seeded: cath@murphyconsulting.us');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
