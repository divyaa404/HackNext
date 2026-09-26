import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=======================================');
  console.log('  DogFood Platform - Master Setup CLI');
  console.log('=======================================\n');

  try {
    const existingCount = await prisma.user.count({
      where: { role: { in: ['admin', 'organizer'] } }
    });

    if (existingCount > 0) {
      console.log('❌ Setup has already been completed. An organizer/admin account exists.');
      process.exit(0);
    }

    console.log('Generating Master Organizer account...\n');
    
    // Generate secure ID and temporary password
    const staff_id = 'ORG-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const tempPassword = crypto.randomBytes(6).toString('hex');
    
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(tempPassword, salt);

    await prisma.user.create({
      data: {
        staff_id,
        password_hash,
        role: 'organizer',
        must_change_password: true,
      }
    });

    console.log('\n✅ Master Organizer created successfully!');
    console.log('\nIMPORTANT: SAVE THESE CREDENTIALS NOW.');
    console.log('--------------------------------------------------');
    console.log(`Admin Portal:      http://localhost:5173/admin/login`);
    console.log(`ID Number:         ${staff_id}`);
    console.log(`Temporary Password: ${tempPassword}`);
    console.log('--------------------------------------------------');
    console.log('The temporary password will be invalidated after your first successful login.');
    console.log('You will be forced to create a permanent password.');
    console.log('\nStore this securely!\n');

  } catch (error) {
    console.error('\n❌ An error occurred during setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
