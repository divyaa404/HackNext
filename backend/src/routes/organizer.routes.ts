import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { calculateEventLeaderboardWithProof } from '../utils/evaluation';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Setup Multer for image uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Use organizer/admin auth
router.use(requireAuth, requireRole('organizer', 'admin'));

// Upload image endpoint
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Upload error', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Update event details and visibility
router.all(['/events/:id', '/events/:id/certificates/toggle'], async (req, res, next) => {
  if (req.method !== 'PATCH' && req.method !== 'POST' && req.method !== 'PUT') return next();
  try {
    const eventId = req.params.id;
    const updateData = { ...req.body };
    
    // Validate ownership or admin role
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    const user = (req as any).user;
    if (!event || (event.created_by !== user.id && user.role !== 'admin' && user.role !== 'organizer')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check certificate toggle requirement: only allow show_certificates: true if certificates exist
    if (updateData.show_certificates === true || updateData.show_certificates === 'true') {
      const certCount = await prisma.certificate.count({ where: { event_id: eventId } });
      if (certCount === 0) {
        return res.status(400).json({
          error: 'Cannot enable certificate visibility yet. Please generate certificates for this event first in the Certificate Studio.'
        });
      }
      updateData.show_certificates = true;
    } else if (updateData.show_certificates !== undefined) {
      updateData.show_certificates = Boolean(updateData.show_certificates);
    }

    // Convert date strings to Date objects if provided
    if (updateData.start_date) {
      const parsedStart = new Date(updateData.start_date);
      if (!isNaN(parsedStart.getTime())) {
        updateData.start_date = parsedStart;
      } else {
        delete updateData.start_date;
      }
    } else if (updateData.start_date === '') {
      delete updateData.start_date;
    }

    if (updateData.end_date) {
      const parsedEnd = new Date(updateData.end_date);
      if (!isNaN(parsedEnd.getTime())) {
        updateData.end_date = parsedEnd;
      } else {
        delete updateData.end_date;
      }
    } else if (updateData.end_date === '') {
      delete updateData.end_date;
    }

    if (updateData.team_size_min !== undefined) {
      updateData.team_size_min = updateData.team_size_min !== null && updateData.team_size_min !== '' ? parseInt(updateData.team_size_min, 10) : null;
    }
    if (updateData.team_size_max !== undefined) {
      updateData.team_size_max = updateData.team_size_max !== null && updateData.team_size_max !== '' ? parseInt(updateData.team_size_max, 10) : null;
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: updateData
    });
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Bulk update content (eligibility, rules, prizes, timeline, contacts)
router.put('/events/:id/content/:type', async (req, res) => {
  try {
    const eventId = req.params.id;
    const type = req.params.type;
    const items = req.body.items || [];

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await prisma.$transaction(async (tx) => {
      if (type === 'rules') {
        await tx.rule.deleteMany({ where: { event_id: eventId } });
        if (items.length) {
          await tx.rule.createMany({ data: items.map((i: any, idx: number) => ({ ...i, sort_order: idx + 1, event_id: eventId, id: undefined })) });
        }
      } else if (type === 'eligibility') {
        await tx.eligibilityItem.deleteMany({ where: { event_id: eventId } });
        if (items.length) {
          await tx.eligibilityItem.createMany({ data: items.map((i: any, idx: number) => ({ ...i, sort_order: idx + 1, event_id: eventId, id: undefined })) });
        }
      } else if (type === 'prizes') {
        await tx.prize.deleteMany({ where: { event_id: eventId } });
        if (items.length) {
          await tx.prize.createMany({ data: items.map((i: any, idx: number) => ({ ...i, sort_order: idx + 1, event_id: eventId, id: undefined })) });
        }
      } else if (type === 'timeline') {
        await tx.timelineItem.deleteMany({ where: { event_id: eventId } });
        if (items.length) {
          await tx.timelineItem.createMany({ 
            data: items.map((i: any, idx: number) => {
              let startDt = new Date(i.start_datetime);
              if (isNaN(startDt.getTime())) {
                startDt = event.start_date ? new Date(event.start_date) : new Date();
              }
              let endDt: Date | null = null;
              if (i.end_datetime) {
                const parsedEnd = new Date(i.end_datetime);
                if (!isNaN(parsedEnd.getTime())) {
                  endDt = parsedEnd;
                }
              }
              return {
                title: i.title ? String(i.title).trim() : `Round ${idx + 1}`,
                description: i.description || null,
                start_datetime: startDt,
                end_datetime: endDt,
                status: i.status || null,
                sort_order: idx + 1,
                event_id: eventId 
              };
            }) 
          });
        }
      } else if (type === 'contacts') {
        await tx.adminContact.deleteMany({ where: { event_id: eventId } });
        if (items.length) {
          await tx.adminContact.createMany({ data: items.map((i: any, idx: number) => ({ ...i, sort_order: idx + 1, event_id: eventId, id: undefined })) });
        }
      } else {
        throw new Error('Invalid content type');
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Predefined 5-step timeline generator: Registration -> Project Submission -> Evaluation -> Community Voting -> Result Out
router.post('/events/:id/timeline/init-default', async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const start = new Date(event.start_date || Date.now());
    const regEnd = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const subEnd = new Date(start.getTime() + 48 * 60 * 60 * 1000);
    const evalEnd = new Date(start.getTime() + 60 * 60 * 60 * 1000);
    const voteEnd = new Date(start.getTime() + 68 * 60 * 60 * 1000);
    const resultEnd = new Date(start.getTime() + 72 * 60 * 60 * 1000);

    const defaultTimeline = [
      {
        title: 'Registration',
        description: 'Team formation, participant onboarding, and problem statement release.',
        start_datetime: start,
        end_datetime: subEnd,
        sort_order: 1
      },
      {
        title: 'Project Submission',
        description: 'Repository commit freeze, project deck, and video demo submission.',
        start_datetime: start,
        end_datetime: subEnd,
        sort_order: 2
      },
      {
        title: 'Evaluation',
        description: 'Jury score evaluations across weighted multi-factor rubrics.',
        start_datetime: subEnd,
        end_datetime: evalEnd,
        sort_order: 3
      },
      {
        title: 'Community Voting',
        description: 'Public and participant community voting on submitted project gallery.',
        start_datetime: evalEnd,
        end_datetime: voteEnd,
        sort_order: 4
      },
      {
        title: 'Result Out',
        description: 'Official leaderboard reveal, podium ranking, and winner ceremony.',
        start_datetime: voteEnd,
        end_datetime: resultEnd,
        sort_order: 5
      }
    ];

    await prisma.timelineItem.deleteMany({ where: { event_id: eventId } });
    await prisma.timelineItem.createMany({
      data: defaultTimeline.map(it => ({ ...it, event_id: eventId }))
    });

    res.json({ message: 'Predefined 5-step timeline initialized successfully.', timeline: defaultTimeline });
  } catch (err) {
    console.error('Init timeline error:', err);
    res.status(500).json({ error: 'Failed to initialize default timeline' });
  }
});

// Extend active or targeted timeline item by +1 hour
router.post('/events/:id/timeline/extend-hour', async (req, res) => {
  try {
    const eventId = req.params.id;
    const { itemId } = req.body;

    let targetItem = null;
    if (itemId) {
      targetItem = await prisma.timelineItem.findUnique({ where: { id: itemId } });
    } else {
      // Find currently active item or last item
      const now = new Date();
      const items = await prisma.timelineItem.findMany({
        where: { event_id: eventId },
        orderBy: { sort_order: 'asc' }
      });
      targetItem = items.find(it => it.end_datetime && new Date(it.end_datetime) > now) || items[items.length - 1];
    }

    if (!targetItem) {
      return res.status(404).json({ error: 'No timeline round found to extend' });
    }

    const currentEnd = targetItem.end_datetime ? new Date(targetItem.end_datetime) : new Date();
    const newEnd = new Date(currentEnd.getTime() + 60 * 60 * 1000); // +1 hour (3600000 ms)

    const updated = await prisma.timelineItem.update({
      where: { id: targetItem.id },
      data: { end_datetime: newEnd }
    });

    res.json({
      message: `Successfully extended "${targetItem.title}" by +1 hour until ${newEnd.toLocaleTimeString()}`,
      updatedItem: updated
    });
  } catch (err) {
    console.error('Extend timeline error:', err);
    res.status(500).json({ error: 'Failed to extend timeline' });
  }
});

router.post('/events/:id/timeline/:itemId/extend', async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const hours = Number(req.body.hours) || 1;
    const targetItem = await prisma.timelineItem.findUnique({ where: { id: itemId } });
    if (!targetItem) {
      return res.status(404).json({ error: 'Timeline round not found' });
    }
    const currentEnd = targetItem.end_datetime ? new Date(targetItem.end_datetime) : new Date();
    const newEnd = new Date(currentEnd.getTime() + hours * 60 * 60 * 1000);
    const updated = await prisma.timelineItem.update({
      where: { id: itemId },
      data: { end_datetime: newEnd }
    });
    res.json({ message: `Successfully extended "${targetItem.title}" by +${hours} hour(s)`, updatedItem: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to extend timeline' });
  }
});

// Close active phase immediately
router.post('/events/:id/timeline/close-phase', async (req, res) => {
  try {
    const eventId = req.params.id;
    const { itemId } = req.body;

    let targetItem = null;
    if (itemId) {
      targetItem = await prisma.timelineItem.findUnique({ where: { id: itemId } });
    } else {
      const now = new Date();
      const items = await prisma.timelineItem.findMany({
        where: { event_id: eventId },
        orderBy: { sort_order: 'asc' }
      });
      targetItem = items.find(it => !it.end_datetime || new Date(it.end_datetime) > now);
    }

    if (!targetItem) {
      return res.status(404).json({ error: 'No active phase found to close' });
    }

    const now = new Date();
    const updated = await prisma.timelineItem.update({
      where: { id: targetItem.id },
      data: { end_datetime: now }
    });

    res.json({
      message: `Successfully closed "${targetItem.title}" phase immediately.`,
      updatedItem: updated
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to close timeline phase' });
  }
});

// Update judge profile
router.patch('/judges/:id', async (req, res) => {
  try {
    const judgeId = req.params.id;
    const judge = await prisma.judge.findUnique({ where: { id: judgeId }, include: { event: true } });
    if (!judge) {
      return res.status(404).json({ error: 'Judge not found' });
    }
    const updated = await prisma.judge.update({
      where: { id: judgeId },
      data: req.body
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get existing admins
router.get('/users/admins', async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['admin', 'organizer'] } },
      select: { id: true, name: true, email: true, phone: true }
    });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// Z-Score Score Normalization Proof & Calculations Endpoint
router.get('/events/:id/normalization-proof', async (req, res) => {
  try {
    let eventId = req.params.id;
    let event = null;

    if (eventId === 'latest' || !eventId) {
      event = await prisma.event.findFirst({ orderBy: { start_date: 'desc' } });
    } else {
      event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) {
        event = await prisma.event.findFirst({ where: { slug: eventId } });
      }
    }

    if (!event) return res.status(404).json({ error: 'No active event found' });

    const submissions = await prisma.submission.findMany({
      where: { event_id: event.id, status: 'submitted' },
      include: {
        team: true,
        scores: {
          include: {
            judge: {
              include: { user: { select: { name: true, email: true, staff_id: true } } }
            }
          }
        }
      }
    });

    const result = calculateEventLeaderboardWithProof(
      event.id,
      event.name,
      submissions as any
    );

    res.json({
      eventId: event.id,
      eventName: event.name,
      displayParameters: result.displayParameters,
      judgeStats: Object.values(result.judgeStats).map(j => ({
        judgeName: j.judgeName,
        staffId: j.staffId,
        mean: j.mu,
        stdDev: j.sigma,
        isZeroSigma: j.isZeroSigma,
        reviewsCompleted: j.count
      })),
      leaderboard: result.leaderboard
    });
  } catch (error) {
    console.error('Normalization proof calculation error:', error);
    res.status(500).json({ error: 'Failed to generate normalization proof' });
  }
});

export default router;
