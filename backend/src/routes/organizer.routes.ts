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

// Use organizer auth
router.use(requireAuth, requireRole('organizer'));

// Upload image endpoint
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return a relative URL
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Upload error', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Update event details and visibility
router.patch('/events/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const updateData = { ...req.body };
    
    // Validate ownership
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.created_by !== (req as any).user.id) {
      return res.status(403).json({ error: 'Forbidden' });
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk update content (eligibility, rules, prizes, timeline, contacts)
// To keep things simple, we'll replace the existing items with the new ones.
router.put('/events/:id/content/:type', async (req, res) => {
  try {
    const eventId = req.params.id;
    const type = req.params.type; // 'rules', 'prizes', etc.
    const items = req.body.items; // array of items

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.created_by !== (req as any).user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Use a transaction to delete old and insert new
    await prisma.$transaction(async (tx) => {
      if (type === 'rules') {
        await tx.rule.deleteMany({ where: { event_id: eventId } });
        if (items.length) {
            await tx.rule.createMany({ data: items.map((i: any) => ({ ...i, event_id: eventId, id: undefined })) });
        }
      } else if (type === 'eligibility') {
        await tx.eligibilityItem.deleteMany({ where: { event_id: eventId } });
        if (items.length) {
            await tx.eligibilityItem.createMany({ data: items.map((i: any) => ({ ...i, event_id: eventId, id: undefined })) });
        }
      } else if (type === 'prizes') {
        await tx.prize.deleteMany({ where: { event_id: eventId } });
        if (items.length) {
            await tx.prize.createMany({ data: items.map((i: any) => ({ ...i, event_id: eventId, id: undefined })) });
        }
      } else if (type === 'timeline') {
        await tx.timelineItem.deleteMany({ where: { event_id: eventId } });
        if (items.length) {
            await tx.timelineItem.createMany({ 
              data: items.map((i: any) => ({ 
                title: i.title,
                description: i.description || null,
                start_datetime: new Date(i.start_datetime),
                end_datetime: i.end_datetime ? new Date(i.end_datetime) : null,
                status: i.status || null,
                sort_order: i.sort_order || 1,
                event_id: eventId 
              })) 
            });
        }
      } else if (type === 'contacts') {
        await tx.adminContact.deleteMany({ where: { event_id: eventId } });
        if (items.length) {
            await tx.adminContact.createMany({ data: items.map((i: any) => ({ ...i, event_id: eventId, id: undefined })) });
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

// Update judge profile
router.patch('/judges/:id', async (req, res) => {
    try {
        const judgeId = req.params.id;
        const judge = await prisma.judge.findUnique({ where: { id: judgeId }, include: { event: true } });
        if (!judge || judge.event.created_by !== (req as any).user.id) {
            return res.status(403).json({ error: 'Forbidden' });
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

    // Fetch submissions with teams and scores
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

    // Group raw scores by judge to compute per-judge mean (μ) and standard deviation (σ)
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

    // Calculate mu and sigma per judge
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

    // Compute Z-Scores and Normalized Scores for each submission
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
          // Fallback when std dev is 0 (identical scores or single review)
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

    // Rank submissions descending by normalizedScore
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

