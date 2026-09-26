import { PrismaClient } from '@prisma/client';
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

  // Try to find the first organizer
  let organizer = await prisma.user.findFirst({ where: { role: 'organizer' } });
  
  if (!organizer) {
    organizer = await prisma.user.create({
      data: {
        email: 'organizer@hacknext.com',
        name: 'HackNext Organizer',
        password_hash: 'hashedpassword',
        role: 'organizer',
      }
    });
  }

  // Check if event already exists
  let event = await prisma.event.findUnique({ where: { slug: 'hacknext-72-hour-hackathon' } });
  
  if (event) {
    console.log('Event already seeded.');
    return;
  }

  event = await prisma.event.create({
    data: {
      name: 'HackNext 72-Hour Hackathon',
      slug: 'hacknext-72-hour-hackathon',
      short_description: 'Build the future of coding tools.',
      full_description: '<p>Join us for 72 hours of intense building where you will create next-generation AI tools.</p>',
      category: 'Open Innovation',
      mode: 'Online',
      location: 'Mumbai',
      team_size_min: 2,
      team_size_max: 4,
      prize_pool: '₹2,50,000',
      organizer_name: 'Hackathon Raptors',
      banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
      start_date: new Date('2026-09-22T10:00:00Z'),
      end_date: new Date('2026-09-25T11:59:00Z'),
      tracks: [],
      prizes_config: {},
      created_by: organizer.id,

      show_public_teams: true,
      show_public_projects: true,
      show_public_judges: true,
      show_public_results: false,
      show_prizes: true,
      show_eligibility: true,
      show_rules: true,
      show_timeline: true,
      show_contacts: true,

      eligibility_items: {
        create: [
          { title: 'Open to all students', description: 'Undergraduate and postgraduate students.', sort_order: 1 },
          { title: 'Team Size: 2-4', description: 'Must have at least 2 members.', sort_order: 2 }
        ]
      },
      rules: {
        create: [
          { title: 'Only one submission', description: 'Per team.', sort_order: 1 },
          { title: 'Open Source', description: 'Code must be open source.', sort_order: 2 }
        ]
      },
      prizes: {
        create: [
          { title: 'Winner', amount: '₹1,50,000', description: 'Grand Prize', sort_order: 1 },
          { title: 'Runner Up', amount: '₹75,000', sort_order: 2 },
          { title: 'Special Mention', amount: '₹25,000', sort_order: 3 }
        ]
      },
      timeline_items: {
        create: [
          { title: 'Registration Opens', start_datetime: new Date('2026-09-10T10:00:00Z'), sort_order: 1 },
          { title: 'Hackathon Starts', start_datetime: new Date('2026-09-22T10:00:00Z'), status: 'live', sort_order: 2 },
          { title: 'Submission Deadline', start_datetime: new Date('2026-09-25T11:59:00Z'), sort_order: 3 }
        ]
      },
      admin_contacts: {
        create: [
          { name: 'Indresh Suresh', role: 'Organizer', email: 'indresh@hacknext.com', sort_order: 1 }
        ]
      }
    }
  });

  // Seed judges
  const judgeUser = await prisma.user.create({
    data: {
      email: 'judge@hacknext.com',
      name: 'Priya Rao',
      password_hash: 'hashed',
      role: 'judge'
    }
  });

  await prisma.judge.create({
    data: {
      user_id: judgeUser.id,
      event_id: event.id,
      display_name: 'Priya Rao',
      designation: 'Founder',
      company: 'Tech Corp',
      show_publicly: true,
      sort_order: 1
    }
  });

  console.log('Seeded event successfully:', event.slug);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
