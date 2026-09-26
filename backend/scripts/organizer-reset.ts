import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function ensureDatabaseReady() {
  try {
    await prisma.user.count();
  } catch (err: any) {
    if (err?.code === 'P2021' || (err?.message && (err.message.includes('does not exist') || err.message.includes('P2021')))) {
      console.log('⚡ Initializing database schema (prisma db push)...');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    } else {
      throw err;
    }
  }
}

async function main() {
  await ensureDatabaseReady();
  const staffId = process.argv[2] || 'ORG-MASTER';
  
  const tempPassword = crypto.randomBytes(6).toString('hex');
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(tempPassword, salt);

  const user = await prisma.user.upsert({
    where: { staff_id: staffId },
    update: {
      password_hash,
      must_change_password: true,
      role: 'organizer'
    },
    create: {
      staff_id: staffId,
      email: `${staffId.toLowerCase()}@hackathon.local`,
      password_hash,
      role: 'organizer',
      must_change_password: true
    }
  });

  console.log('\n======================================================');
  console.log('✅ Master Organizer Account Provisioned / Reset');
  console.log('======================================================');
  console.log(`ID Number (Login): ${staffId}`);
  console.log(`Temporary Passkey: ${tempPassword}`);
  console.log('\nLogin here: http://localhost:3000/admin/login');
  console.log('\n⚠️  You will be forced to change this on your first login.');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
