import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
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
      updateData.start_date = new Date(updateData.start_date);
    }
    if (updateData.end_date) {
      updateData.end_date = new Date(updateData.end_date);
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
    console.error(error);
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
            data: items.map((i: any, idx: number) => ({ 
              title: i.title,
              description: i.description || null,
              start_datetime: new Date(i.start_datetime),
              end_datetime: i.end_datetime ? new Date(i.end_datetime) : null,
              status: i.status || null,
              sort_order: idx + 1,
              event_id: eventId 
            })) 
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

    if (eventId === 'latest' || !eventId) {
      const latestEvent = await prisma.event.findFirst({ orderBy: { start_date: 'desc' } });
      if (!latestEvent) return res.status(404).json({ error: 'No active event found' });
      eventId = latestEvent.id;
    }

    const submissions = await prisma.submission.findMany({
      where: { event_id: eventId },
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

    const judgeScoresMap: Record<string, { judgeName: string; rawScores: number[] }> = {};

    submissions.forEach(sub => {
      sub.scores.forEach(s => {
        const judgeId = s.judge_id;
        const judgeName = s.judge.user.name || s.judge.user.email || s.judge.user.staff_id || judgeId;
        if (!judgeScoresMap[judgeId]) {
          judgeScoresMap[judgeId] = { judgeName, rawScores: [] };
        }
        judgeScoresMap[judgeId].rawScores.push(s.raw_score);
      });
    });

    const judgeStats: Record<string, { judgeName: string; mu: number; sigma: number; count: number }> = {};
    Object.keys(judgeScoresMap).forEach(jId => {
      const { judgeName, rawScores } = judgeScoresMap[jId];
      const count = rawScores.length;
      const sum = rawScores.reduce((a, b) => a + b, 0);
      const mu = count > 0 ? sum / count : 0;
      const variance = count > 0 ? rawScores.reduce((a, b) => a + Math.pow(b - mu, 2), 0) / count : 0;
      const sigma = Math.sqrt(variance);

      judgeStats[jId] = { judgeName, mu, sigma, count };
    });

    const globalTargetMean = 65;
    const globalTargetStd = 15;

    const proofResults = submissions.map(sub => {
      const teamName = sub.team?.name || 'Unknown Team';
      const submissionTitle = sub.title;

      let totalRaw = 0;
      let totalNormalized = 0;
      const judgeBreakdown: any[] = [];

      sub.scores.forEach(s => {
        const stats = judgeStats[s.judge_id];
        totalRaw += s.raw_score;

        let zScore = 0;
        let normalizedScore = globalTargetMean;

        if (stats && stats.sigma > 0) {
          zScore = (s.raw_score - stats.mu) / stats.sigma;
          normalizedScore = Math.min(100, Math.max(0, (zScore * globalTargetStd) + globalTargetMean));
        } else if (stats) {
          normalizedScore = Math.min(100, Math.max(0, (s.raw_score + (globalTargetMean - stats.mu)) * 10));
        }

        totalNormalized += normalizedScore;
        judgeBreakdown.push({
          judgeId: s.judge_id,
          judgeName: stats?.judgeName || 'Unknown Judge',
          rawScore: s.raw_score,
          judgeMean: stats ? Number(stats.mu.toFixed(2)) : 0,
          judgeStdDev: stats ? Number(stats.sigma.toFixed(2)) : 0,
          zScore: Number(zScore.toFixed(2)),
          normalizedScore: Number(normalizedScore.toFixed(2))
        });
      });

      const avgRawScore = sub.scores.length > 0 ? totalRaw / sub.scores.length : 0;
      const finalNormalizedScore = sub.scores.length > 0 ? totalNormalized / sub.scores.length : 0;

      return {
        submissionId: sub.id,
        teamName,
        submissionTitle,
        rawScoreTotal: Number(avgRawScore.toFixed(2)),
        normalizedScore: Number(finalNormalizedScore.toFixed(2)),
        judgeEvaluations: judgeBreakdown
      };
    });

    proofResults.sort((a, b) => b.normalizedScore - a.normalizedScore);

    res.json({
      eventId,
      judgeStats: Object.values(judgeStats).map(j => ({
        judgeName: j.judgeName,
        mean: Number(j.mu.toFixed(2)),
        stdDev: Number(j.sigma.toFixed(2)),
        reviewsCompleted: j.count
      })),
      leaderboard: proofResults
    });
  } catch (error) {
    console.error('Normalization proof calculation error:', error);
    res.status(500).json({ error: 'Failed to generate normalization proof' });
  }
});

export default router;
