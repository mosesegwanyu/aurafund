import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'ChangeThisSuperSecretPassword123!';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: 'admin@aurafund.app' },
    update: { passwordHash: hashedPassword },
    create: {
      email: 'admin@aurafund.app',
      name: 'System Administrator',
      phone: '0700000000',
      passwordHash: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Secure Admin Account Provisioned');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
