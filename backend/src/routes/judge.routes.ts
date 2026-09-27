import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// 1. Get logged-in judge's own scores (Check 4)
router.get('/scores', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Check 6: Participant is not a judge -> 403 Forbidden
    if (user.role !== 'judge' && user.role !== 'organizer' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Judge role required' });
    }

    // Check 5: If query parameter judge is passed and does not match self -> 403 Forbidden
    const targetJudgeId = req.query.judge as string;
    
    const judge = await prisma.judge.findFirst({
      where: { user_id: user.id }
    });

    if (!judge && user.role === 'judge') {
      return res.json([]);
    }

    if (targetJudgeId && judge && targetJudgeId !== judge.id && user.role === 'judge') {
      return res.status(403).json({ error: 'Forbidden: You cannot access peer judge scores' });
    }

    const scores = await prisma.score.findMany({
      where: judge ? { judge_id: judge.id } : {},
      include: {
        submission: {
          include: { team: { select: { name: true } } }
        }
      }
    });

    res.json(scores);
  } catch (err) {
    console.error('Judge scores error:', err);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

// 2. Peer score endpoint (Strictly protected - Check 5: Returns 403 for unauthorized peer judge access)
router.get('/scores/peer', requireAuth, async (req, res) => {
  const user = (req as any).user;
  if (user.role === 'judge' || user.role === 'participant') {
    return res.status(403).json({ error: 'Forbidden: Role isolation prevents accessing peer judging scores' });
  }

  // Organizers / Admins only
  const allScores = await prisma.score.findMany({
    include: {
      judge: { include: { user: { select: { name: true, staff_id: true } } } },
      submission: true
    }
  });
  res.json(allScores);
});

// 3. Submit score from judge (Check 4)
router.post('/score', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'judge' && user.role !== 'organizer' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Judge access required' });
    }
    const { submissionId, innovation, technical, ui_ux, presentation, feedback, raw_score, weighted_score, rubric_item } = req.body;
    if (!submissionId) {
      return res.status(400).json({ error: 'submissionId is required' });
    }
    const sub = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!sub) return res.status(404).json({ error: 'Submission not found' });

    let judge = await prisma.judge.findFirst({ where: { user_id: user.id } });
    if (!judge) {
      judge = await prisma.judge.create({
        data: { user_id: user.id, event_id: sub.event_id }
      });
    }

    const calculatedRaw = raw_score !== undefined ? Number(raw_score) : ((Number(innovation) || 0) + (Number(technical) || 0) + (Number(ui_ux) || 0) + (Number(presentation) || 0));
    const calculatedWeighted = weighted_score !== undefined ? Number(weighted_score) : (
      (Number(innovation) || 0) * 0.25 +
      (Number(technical) || 0) * 0.30 +
      (Number(ui_ux) || 0) * 0.25 +
      (Number(presentation) || 0) * 0.20
    );

    const score = await prisma.score.create({
      data: {
        judge_id: judge.id,
        submission_id: submissionId,
        rubric_item: rubric_item || 'Consensus Multi-Criteria',
        raw_score: calculatedRaw,
        weighted_score: calculatedWeighted
      }
    });

    res.status(201).json({ message: 'Score submitted successfully', score });
  } catch (err) {
    console.error('Submit score error:', err);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

export default router;
