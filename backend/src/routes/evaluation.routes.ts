import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { 
  checkKFeasibility, 
  generateReproducibleAssignments, 
  calculateEventLeaderboardWithProof 
} from '../utils/evaluation';

const router = express.Router();
const prisma = new PrismaClient();

// 1. Check K Feasibility for an event
router.get('/event/:eventId/feasibility', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    let { eventId } = req.params;
    const requestedK = Number(req.query.k || 2);
    const maxLoad = Number(req.query.maxLoad || 25);

    if (eventId === 'latest' || !eventId) {
      const latest = await prisma.event.findFirst({ orderBy: { start_date: 'desc' } });
      if (!latest) return res.status(404).json({ error: 'No active event found' });
      eventId = latest.id;
    }

    const [submissionsCount, judgesCount] = await Promise.all([
      prisma.submission.count({ where: { event_id: eventId, status: 'submitted' } }),
      prisma.judge.count({ where: { event_id: eventId } })
    ]);

    const check = checkKFeasibility(submissionsCount, judgesCount, requestedK, maxLoad);
    res.json(check);
  } catch (error) {
    console.error('Feasibility check error:', error);
    res.status(500).json({ error: 'Failed to check feasibility' });
  }
});

// 2. Auto-generate reproducible judge assignments strictly respecting capacity
router.post('/event/:eventId/assign', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    let { eventId } = req.params;
    const { k, seed, maxLoadPerJudge } = req.body;

    if (eventId === 'latest' || !eventId) {
      const latest = await prisma.event.findFirst({ orderBy: { start_date: 'desc' } });
      if (!latest) return res.status(404).json({ error: 'No active event found' });
      eventId = latest.id;
    }

    const [submissions, judges] = await Promise.all([
      prisma.submission.findMany({
        where: { event_id: eventId, status: 'submitted' },
        select: { id: true, title: true }
      }),
      prisma.judge.findMany({
        where: { event_id: eventId },
        select: { id: true, user: { select: { name: true, staff_id: true, email: true } } }
      })
    ]);

    if (submissions.length === 0) {
      return res.status(400).json({ error: 'No submitted projects found to assign.' });
    }
    if (judges.length === 0) {
      return res.status(400).json({ error: 'No judges assigned to this event yet. Please onboard judges first.' });
    }

    const assignmentSeed = seed && String(seed).trim().length > 0 
      ? String(seed).trim() 
      : `HNX-${eventId.substring(0, 8)}-${Date.now()}`;

    const maxLoad = Number(maxLoadPerJudge) || 25;
    const requestedK = Number(k) || 2;

    const result = generateReproducibleAssignments(
      submissions,
      judges.map(j => ({ id: j.id })),
      { k: requestedK, seed: assignmentSeed, maxLoadPerJudge: maxLoad }
    );

    // Clear previous assignments for this event's submissions
    const subIds = submissions.map(s => s.id);
    await prisma.judgeAssignment.deleteMany({
      where: { submission_id: { in: subIds } }
    });

    // Bulk insert new reproducible assignments
    if (result.assignments.length > 0) {
      await prisma.judgeAssignment.createMany({
        data: result.assignments
      });
    }

    res.json({
      message: `Successfully generated ${result.assignments.length} reproducible assignments (Depth K = ${result.feasibility.effectiveK} judges/project, Max load: ${result.maxWorkload}/${maxLoad}).`,
      seed: result.seed,
      feasibility: result.feasibility,
      assignmentsCount: result.assignments.length,
      judgeWorkloads: result.judgeWorkloads,
      minWorkload: result.minWorkload,
      maxWorkload: result.maxWorkload
    });
  } catch (error) {
    console.error('Assign error:', error);
    res.status(500).json({ error: 'Failed to generate assignments' });
  }
});

// 3. Get full Z-score normalized leaderboard with step-by-step mathematical proof
router.get('/event/:eventId/leaderboard', async (req, res) => {
  try {
    let { eventId } = req.params;

    let event = null;
    if (eventId === 'latest' || !eventId) {
      event = await prisma.event.findFirst({ orderBy: { start_date: 'desc' } });
    } else {
      event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) {
        event = await prisma.event.findFirst({ where: { slug: eventId } });
      }
    }

    if (!event) return res.status(404).json({ error: 'Event not found' });

    const submissions = await prisma.submission.findMany({
      where: { event_id: event.id, status: 'submitted' },
      include: {
        team: { select: { name: true } },
        scores: {
          include: {
            judge: {
              include: {
                user: { select: { name: true, email: true, staff_id: true } }
              }
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

    res.json(result);
  } catch (error) {
    console.error('Leaderboard calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate normalized leaderboard' });
  }
});

// 4. Get specific submission proof trace
router.get('/event/:eventId/proof/:submissionId', async (req, res) => {
  try {
    let { eventId, submissionId } = req.params;

    let event = null;
    if (eventId === 'latest' || !eventId) {
      event = await prisma.event.findFirst({ orderBy: { start_date: 'desc' } });
    } else {
      event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) {
        event = await prisma.event.findFirst({ where: { slug: eventId } });
      }
    }

    if (!event) return res.status(404).json({ error: 'Event not found' });

    const submissions = await prisma.submission.findMany({
      where: { event_id: event.id, status: 'submitted' },
      include: {
        team: { select: { name: true } },
        scores: {
          include: {
            judge: {
              include: {
                user: { select: { name: true, email: true, staff_id: true } }
              }
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

    const projectProof = result.leaderboard.find(l => l.submissionId === submissionId);
    if (!projectProof) {
      return res.status(404).json({ error: 'Submission proof not found' });
    }

    res.json({
      eventId: event.id,
      eventName: event.name,
      displayParameters: result.displayParameters,
      judgeStats: result.judgeStats,
      projectProof
    });
  } catch (error) {
    console.error('Proof error:', error);
    res.status(500).json({ error: 'Failed to fetch score proof' });
  }
});

export default router;
