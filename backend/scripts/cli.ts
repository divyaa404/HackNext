import readline from 'readline';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { execSync } from 'child_process';
import os from 'os';

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => new Promise((resolve) => rl.question(query, resolve));

// Colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

async function ensureDatabaseReady(): Promise<number> {
  try {
    return await prisma.user.count({ where: { role: 'organizer' } });
  } catch (err: any) {
    if (err?.code === 'P2021' || (err?.message && (err.message.includes('does not exist') || err.message.includes('P2021')))) {
      console.log(YELLOW + '⚡ Database tables not initialized. Running database schema sync (prisma db push)...' + RESET);
      try {
        execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
        console.log(GREEN + '✅ Database schema initialized successfully!\n' + RESET);
        return await prisma.user.count({ where: { role: 'organizer' } });
      } catch (pushErr) {
        console.error(RED + '❌ Failed to push Prisma schema to database:' + RESET, pushErr);
        throw pushErr;
      }
    }

    if (err?.message && (err.message.includes('Authentication failed') || err.message.includes('password authentication failed') || err.name === 'PrismaClientInitializationError')) {
      console.log(RED + '\n❌ Database Authentication Error:' + RESET);
      console.log(YELLOW + 'The database credentials in .env do not match the existing PostgreSQL database volume.' + RESET);
      console.log('If you updated credentials or project name after starting Docker, the existing pgdata volume still uses the old credentials.');
      console.log('\n' + BOLD + '👉 Fix in Docker (Wipe old volume and re-initialize with new credentials):' + RESET);
      console.log(CYAN + '   docker compose down -v' + RESET);
      console.log(CYAN + '   docker compose up -d' + RESET);
      console.log('\n👉 Or update .env DB_USER and DB_PASSWORD to match your existing database credentials.\n');
    }
    throw err;
  }
}

async function resetMasterPassword() {
  console.log(CYAN + '\n[Reset Organizer Password]' + RESET);
  const staffId = await question('Enter the Master Organizer ID Number (e.g. ORG-XXXX): ');
  
  const user = await prisma.user.findUnique({ where: { staff_id: staffId } });
  if (!user || user.role !== 'organizer') {
    console.log(RED + '❌ Invalid Organizer ID or user is not an Organizer.' + RESET);
    return;
  }

  const tempPassword = crypto.randomBytes(6).toString('hex');
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(tempPassword, salt);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_hash,
      must_change_password: true
    }
  });

  console.log(GREEN + '\n✅ Organizer Password Reset Successfully!' + RESET);
  console.log(`ID Number:         ${BOLD}${staffId}${RESET}`);
  console.log(`New Temp Password: ${BOLD}${tempPassword}${RESET}`);
  console.log(YELLOW + 'They must change this password on next login.\n' + RESET);
}

async function resetDatabase() {
  console.log(RED + '\n⚠️  WARNING: This will DESTROY all data in the database (Events, Users, Submissions).' + RESET);
  console.log(RED + '⚠️  All organizations and associated data will be deleted completely.' + RESET);
  
  const confirm1 = await question('Type "RESET" to confirm: ');
  if (confirm1 !== 'RESET') {
    console.log('Aborted.');
    return;
  }

  const confirm2 = await question('Are you absolutely sure? Type "YES, WIPE EVERYTHING" to proceed: ');
  if (confirm2 !== 'YES, WIPE EVERYTHING') {
    console.log('Aborted.');
    return;
  }

  console.log(CYAN + '\nResetting Database...' + RESET);
  try {
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    console.log(GREEN + '\n✅ Database reset successfully! You can now create a new organization.\n' + RESET);
  } catch (err) {
    console.error(RED + '\n❌ Failed to reset database.' + RESET, err);
  }
}

async function createOrganizer() {
  const orgCount = await ensureDatabaseReady();
  if (orgCount >= 1) {
    console.log(RED + '\n❌ Only one organization can be made on this server/machine.' + RESET);
    return;
  }

  console.log(CYAN + '\n[Create New Organization / Organizer]' + RESET);
  const answer = await question('Enter the new Organizer ID (e.g. ORG-2024) [Leave blank to auto-generate]: ');
  const staffId = answer.trim() || `ORG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  
  const existing = await prisma.user.findUnique({ where: { staff_id: staffId } });
  if (existing) {
    console.log(RED + '❌ An organizer with this ID already exists!' + RESET);
    return;
  }

  const tempPassword = crypto.randomBytes(6).toString('hex');
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(tempPassword, salt);

  await prisma.user.create({
    data: {
      staff_id: staffId,
      password_hash,
      role: 'organizer',
      must_change_password: true,
      email: `${staffId.toLowerCase()}@hackathon.local`
    }
  });

  console.log(GREEN + '\n✅ New Organizer Created Successfully!' + RESET);
  console.log(`ID Number:         ${BOLD}${staffId}${RESET}`);
  console.log(`Temp Password:     ${BOLD}${tempPassword}${RESET}`);
  console.log(YELLOW + 'They must change this password on their first login.\n' + RESET);
}

async function setNgrokUrl() {
  console.log(CYAN + '\n[Set Public URL (Ngrok / Domain)]' + RESET);
  const url = await question('Enter your Ngrok or public URL (e.g., https://xyz.ngrok-free.app): ');
  if (!url.startsWith('http')) {
    console.log(RED + '❌ Invalid URL. Must start with http or https.' + RESET);
    return;
  }
  process.env.FRONTEND_URL = url.trim();
  console.log(GREEN + '\n✅ Public URL updated in this CLI session.' + RESET);
  await showSystemInfo();
}

async function showHelp() {
  const port = process.env.PORT || 4000;
  const localIp = getLocalIp();

  console.log(MAGENTA + '\n📖 HackNext CLI Help Section' + RESET);
  console.log('----------------------------------------------------');
  console.log(BOLD + 'Overview:' + RESET);
  console.log('This CLI tool securely manages the HackNext platform.');
  console.log('NOTE: Only ONE organization can be created per machine.');
  
  console.log('\n' + BOLD + 'Network & Access Info:' + RESET);
  console.log(`- Local Network IP : ${localIp}`);
  console.log(`- Backend Port     : ${port}`);
  
  console.log('\n' + BOLD + 'Production Level Setup:' + RESET);
  console.log('1. Do not use local SQLite in production. Migrate to a managed PostgreSQL database.');
  console.log('2. Set up a reverse proxy (Nginx/Caddy) to handle HTTPS certificates and route traffic to the frontend and backend.');
  console.log('3. Ensure Docker containers are running with restart=always.');
  console.log('4. Keep your master Organizer password secure. Do NOT reset database in production unless absolutely necessary.');
  
  console.log('\n' + BOLD + 'Important Links:' + RESET);
  console.log('Website / Documentation: https://hacknext-platform.com (Placeholder)');
  console.log('----------------------------------------------------\n');
}

async function showSystemInfo() {
  const port = process.env.PORT || 4000;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  console.log(CYAN + '\n🔗 Platform Links & Info' + RESET);
  console.log('----------------------------------------------------');
  console.log(`Backend Server     : ${frontendUrl.replace('3000', '4000')}`); // Best guess if using ngrok, but usually backend might be on another port or proxied. For local: http://localhost:4000
  console.log(`Participant Portal : ${BOLD}${frontendUrl}/${RESET}`);
  console.log(`Admin Portal       : ${BOLD}${frontendUrl}/admin/login${RESET}`);
  
  const orgs = await prisma.user.findMany({ 
    where: { role: 'organizer' },
    select: { staff_id: true }
  });

  if (orgs.length > 0) {
    console.log(GREEN + '\n👑 Active Organizer ID (Only 1 Allowed):' + RESET);
    orgs.forEach(org => console.log(`   - ${org.staff_id}`));
  } else {
    console.log(YELLOW + '\n👑 No Active Organizers found. Create one first.' + RESET);
  }
  console.log('----------------------------------------------------\n');
}

async function mainMenu() {
  while (true) {
    const orgCount = await ensureDatabaseReady();

    console.log(CYAN + '\n=======================================' + RESET);
    console.log(BOLD + '  HackNext Platform - Control Panel CLI' + RESET);
    console.log(CYAN + '=======================================' + RESET);

    if (orgCount === 0) {
      console.log(YELLOW + '\n⚠️  No organization found. You must create one.' + RESET);
      console.log('1. Create New Organization (Organizer)');
      console.log('2. Help');
      console.log('3. Exit');
      
      const answer = await question('\nSelect an option (1-3): ');
      switch (answer.trim()) {
        case '1': await createOrganizer(); break;
        case '2': await showHelp(); break;
        case '3':
          console.log('Goodbye!');
          rl.close();
          await prisma.$disconnect();
          return;
        default: console.log(RED + 'Invalid option.' + RESET);
      }
    } else {
      console.log('1. Show System Info & Links');
      console.log('2. Set Ngrok / Public URL');
      console.log('3. Reset Organizer Password');
      console.log('4. Reset Entire Database (DANGER)');
      console.log('5. Help');
      console.log('6. Exit');
      
      const answer = await question('\nSelect an option (1-6): ');
      switch (answer.trim()) {
        case '1': await showSystemInfo(); break;
        case '2': await setNgrokUrl(); break;
        case '3': await resetMasterPassword(); break;
        case '4': await resetDatabase(); break;
        case '5': await showHelp(); break;
        case '6':
          console.log('Goodbye!');
          rl.close();
          await prisma.$disconnect();
          return;
        default: console.log(RED + 'Invalid option.' + RESET);
      }
    }
  }
}

mainMenu().catch(err => {
  if (!err?.message?.includes('Authentication failed') && err?.name !== 'PrismaClientInitializationError') {
    console.error(err);
  }
  rl.close();
  prisma.$disconnect();
  process.exit(1);
});
