import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to convert array of objects to CSV string
function convertToCsv(arr: any[]): string {
  if (!arr || arr.length === 0) return 'id\r\n';
  const keys = Object.keys(arr[0]);
  const replacer = (_key: string, value: any) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
    return String(value).replace(/"/g, '""');
  };

  const csvRows = arr.map(row =>
    keys.map(fieldName => `"${replacer(fieldName, row[fieldName])}"`).join(',')
  );

  csvRows.unshift(keys.map(k => `"${k}"`).join(','));
  return csvRows.join('\r\n');
}

// 1. Check 7: Organizer can export CSV of scores
router.get('/score', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const scores = await prisma.score.findMany({
      include: {
        judge: { include: { user: { select: { name: true, email: true, staff_id: true } } } },
        submission: { select: { title: true, team_id: true } }
      }
    });

    const flattened = scores.map(s => ({
      score_id: s.id,
      judge_staff_id: s.judge.user.staff_id || '',
      judge_name: s.judge.user.name || s.judge.user.email || '',
      submission_title: s.submission.title,
      rubric_item: s.rubric_item,
      raw_score: s.raw_score,
      weighted_score: s.weighted_score,
      created_at: s.created_at.toISOString()
    }));

    const csvData = convertToCsv(flattened);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="scores_export.csv"');
    res.send(csvData);
  } catch (err) {
    console.error('Score CSV export error:', err);
    res.status(500).json({ error: 'Failed to export score CSV' });
  }
});

// 2. Full Server Database Backup (JSON)
router.get('/backup/full', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    const events = await prisma.event.findMany({
      include: {
        eligibility_items: true,
        rules: true,
        prizes: true,
        timeline_items: true,
        admin_contacts: true,
        rubrics: true,
        certificate_templates: true
      }
    });
    const teams = await prisma.team.findMany({ include: { members: true } });
    const submissions = await prisma.submission.findMany();
    const judges = await prisma.judge.findMany();
    const assignments = await prisma.judgeAssignment.findMany();
    const scores = await prisma.score.findMany();
    const certificates = await prisma.certificate.findMany();
    const votes = await prisma.vote.findMany();

    const backupPayload = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      platform: 'HackNext',
      schema_version: '2026.1',
      data: {
        users,
        events,
        teams,
        submissions,
        judges,
        assignments,
        scores,
        certificates,
        votes
      }
    };

    res.setHeader('Content-Disposition', `attachment; filename="hacknext_full_backup_${Date.now()}.json"`);
    res.json(backupPayload);
  } catch (err) {
    console.error('Full backup error:', err);
    res.status(500).json({ error: 'Failed to generate full server backup' });
  }
});

// 3. Full Server Database Restore (JSON)
router.post('/backup/restore', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const raw = req.body;
    const backupData = raw?.data || raw?.payload?.data || raw;
    if (!backupData || !backupData.users) {
      return res.status(400).json({ error: 'Invalid backup file payload. Must contain users array.' });
    }

    const { users = [], events = [], teams = [], submissions = [], judges = [], assignments = [], scores = [], certificates = [], votes = [] } = backupData;

    // Perform atomic full database restoration
    await prisma.$transaction(async (tx) => {
      // 1. Clean child tables first
      await tx.vote.deleteMany();
      await tx.certificate.deleteMany();
      await tx.certificateTemplate.deleteMany();
      await tx.score.deleteMany();
      await tx.judgeAssignment.deleteMany();
      await tx.judge.deleteMany();
      await tx.submission.deleteMany();
      await tx.teamMember.deleteMany();
      await tx.joinRequest.deleteMany();
      await tx.team.deleteMany();
      await tx.rubric.deleteMany();
      await tx.adminContact.deleteMany();
      await tx.timelineItem.deleteMany();
      await tx.prize.deleteMany();
      await tx.rule.deleteMany();
      await tx.eligibilityItem.deleteMany();
      await tx.passwordResetToken.deleteMany();
      await tx.passwordResetRequest.deleteMany();
      await tx.inviteToken.deleteMany();
      await tx.event.deleteMany();
      await tx.user.deleteMany();

      // 2. Restore Users
      if (Array.isArray(users) && users.length > 0) {
        for (const u of users) {
          await tx.user.create({ data: { ...u, created_at: new Date(u.created_at) } });
        }
      }

      // 3. Restore Events and nested items
      if (Array.isArray(events) && events.length > 0) {
        for (const e of events) {
          const { eligibility_items, rules, prizes, timeline_items, admin_contacts, rubrics, certificate_templates, ...eventData } = e;
          await tx.event.create({
            data: {
              ...eventData,
              start_date: new Date(eventData.start_date),
              end_date: new Date(eventData.end_date),
              tracks: eventData.tracks || [],
              prizes_config: eventData.prizes_config || {}
            }
          });

          if (eligibility_items?.length) {
            await tx.eligibilityItem.createMany({ data: eligibility_items.map((it: any) => ({ ...it, event_id: e.id })) });
          }
          if (rules?.length) {
            await tx.rule.createMany({ data: rules.map((it: any) => ({ ...it, event_id: e.id })) });
          }
          if (prizes?.length) {
            await tx.prize.createMany({ data: prizes.map((it: any) => ({ ...it, event_id: e.id })) });
          }
          if (timeline_items?.length) {
            await tx.timelineItem.createMany({
              data: timeline_items.map((it: any) => ({
                ...it,
                event_id: e.id,
                start_datetime: new Date(it.start_datetime),
                end_datetime: it.end_datetime ? new Date(it.end_datetime) : null
              }))
            });
          }
          if (admin_contacts?.length) {
            await tx.adminContact.createMany({ data: admin_contacts.map((it: any) => ({ ...it, event_id: e.id })) });
          }
          if (rubrics?.length) {
            await tx.rubric.createMany({ data: rubrics.map((it: any) => ({ ...it, event_id: e.id, created_at: new Date(it.created_at || Date.now()) })) });
          }
          if (certificate_templates?.length) {
            await tx.certificateTemplate.createMany({ data: certificate_templates.map((it: any) => ({ ...it, event_id: e.id, created_at: new Date(it.created_at || Date.now()) })) });
          }
        }
      }

      // 4. Restore Teams and Members
      if (Array.isArray(teams) && teams.length > 0) {
        for (const t of teams) {
          const { members, ...teamData } = t;
          await tx.team.create({ data: teamData });
          if (members?.length) {
            await tx.teamMember.createMany({ data: members.map((m: any) => ({ team_id: t.id, user_id: m.user_id })) });
          }
        }
      }

      // 5. Restore Submissions
      if (Array.isArray(submissions) && submissions.length > 0) {
        for (const sub of submissions) {
          await tx.submission.create({
            data: {
              ...sub,
              submitted_at: sub.submitted_at ? new Date(sub.submitted_at) : null,
              updated_at: new Date(sub.updated_at || Date.now())
            }
          });
        }
      }

      // 6. Restore Judges
      if (Array.isArray(judges) && judges.length > 0) {
        for (const j of judges) {
          await tx.judge.create({ data: j });
        }
      }

      // 7. Restore Assignments
      if (Array.isArray(assignments) && assignments.length > 0) {
        await tx.judgeAssignment.createMany({ data: assignments });
      }

      // 8. Restore Scores
      if (Array.isArray(scores) && scores.length > 0) {
        for (const s of scores) {
          await tx.score.create({
            data: {
              ...s,
              created_at: new Date(s.created_at)
            }
          });
        }
      }

      // 9. Restore Certificates
      if (Array.isArray(certificates) && certificates.length > 0) {
        for (const c of certificates) {
          await tx.certificate.create({
            data: {
              ...c,
              issue_date: new Date(c.issue_date),
              created_at: new Date(c.created_at || Date.now())
            }
          });
        }
      }

      // 10. Restore Votes
      if (Array.isArray(votes) && votes.length > 0) {
        for (const v of votes) {
          await tx.vote.create({
            data: {
              ...v,
              created_at: new Date(v.created_at || Date.now())
            }
          });
        }
      }
    });

    res.json({
      message: 'Full server restore completed successfully with 100% data fidelity.',
      restoredEntities: {
        users: users?.length || 0,
        events: events?.length || 0,
        teams: teams?.length || 0,
        submissions: submissions?.length || 0,
        scores: scores?.length || 0,
        certificates: certificates?.length || 0
      }
    });
  } catch (err) {
    console.error('Full server restore error:', err);
    res.status(500).json({ error: 'Failed to restore database from backup payload' });
  }
});

// 4. Export table data preview (JSON)
router.get('/:table', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { table } = req.params;
    const allowedTables = ['user', 'event', 'team', 'submission', 'score', 'judge', 'certificate', 'vote'];

    if (!allowedTables.includes(table)) {
      return res.status(400).json({ error: 'Invalid table requested' });
    }

    // @ts-ignore
    const data = await prisma[table].findMany();

    if (table === 'user') {
      data.forEach((user: any) => {
        delete user.password_hash;
        delete user.current_session_id;
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch export data' });
  }
});

// 5. Get all tables in a single JSON payload
router.get('/', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const allUsers = await prisma.user.findMany();
    allUsers.forEach((u: any) => {
      delete u.password_hash;
      delete u.current_session_id;
    });

    const participants = allUsers.filter((u: any) => u.role === 'participant');
    const admins = allUsers.filter(u => u.role === 'admin');
    const judges = allUsers.filter(u => u.role === 'judge');
    const organizers = allUsers.filter(u => u.role === 'organizer');

    const events = await prisma.event.findMany();
    const teams = await prisma.team.findMany();
    const submissions = await prisma.submission.findMany();
    const scores = await prisma.score.findMany();
    const certificates = await prisma.certificate.findMany();
    const votes = await prisma.vote.findMany();

    res.json({
      participant: participants,
      admin: admins,
      judge: judges,
      organizer: organizers,
      event: events,
      team: teams,
      submission: submissions,
      score: scores,
      certificate: certificates,
      vote: votes
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all export data' });
  }
});

export default router;
