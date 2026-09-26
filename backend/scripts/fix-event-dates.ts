import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Fixing Event Dates and Timeline Items ---');
  const now = new Date();
  const futureEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days ahead
  futureEnd.setHours(23, 59, 59, 999);

  const events = await prisma.event.findMany({
    include: { timeline_items: true }
  });

  console.log(`Found ${events.length} events in database.`);

  for (const event of events) {
    console.log(`Checking event: ${event.name} (${event.slug || event.id})`);
    
    // If end_date is past or timeline has closed dates, update them
    let newStart = new Date(event.start_date);
    let newEnd = new Date(event.end_date);

    if (newEnd <= now) {
      newEnd = futureEnd;
      console.log(`  Updating end_date to: ${newEnd.toISOString()}`);
    }

    await prisma.event.update({
      where: { id: event.id },
      data: {
        start_date: newStart,
        end_date: newEnd,
      }
    });

    // Check timeline items
    const regItem = event.timeline_items.find(it => {
      const t = (it.title || '').toLowerCase();
      return t.includes('registration') || t.includes('register');
    });

    const subItem = event.timeline_items.find(it => {
      const t = (it.title || '').toLowerCase().trim();
      return t === 'submission' || t === 'project submission' || t === 'submissions';
    });

    if (regItem) {
      const regEnd = regItem.end_datetime ? new Date(regItem.end_datetime) : null;
      if (!regEnd || regEnd <= now) {
        await prisma.timelineItem.update({
          where: { id: regItem.id },
          data: {
            title: 'Registration',
            start_datetime: newStart,
            end_datetime: newEnd
          }
        });
        console.log(`  Updated Registration timeline deadline to: ${newEnd.toISOString()}`);
      }
    } else {
      await prisma.timelineItem.create({
        data: {
          title: 'Registration',
          description: 'Team registration and team formation period',
          start_datetime: newStart,
          end_datetime: newEnd,
          sort_order: 1,
          event_id: event.id
        }
      });
      console.log(`  Created predefined Registration timeline item`);
    }

    if (subItem) {
      const subEnd = subItem.end_datetime ? new Date(subItem.end_datetime) : null;
      if (!subEnd || subEnd <= now) {
        await prisma.timelineItem.update({
          where: { id: subItem.id },
          data: {
            title: 'Submission',
            start_datetime: newStart,
            end_datetime: newEnd
          }
        });
        console.log(`  Updated Submission timeline deadline to: ${newEnd.toISOString()}`);
      }
    } else {
      await prisma.timelineItem.create({
        data: {
          title: 'Submission',
          description: 'Project and demo video submission period',
          start_datetime: newStart,
          end_datetime: newEnd,
          sort_order: 2,
          event_id: event.id
        }
      });
      console.log(`  Created predefined Submission timeline item`);
    }
  }

  console.log('--- All events and timeline items successfully updated ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
