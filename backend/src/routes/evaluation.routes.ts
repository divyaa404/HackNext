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
      event = await prisma.event.findFirst({ 
        orderBy: { start_date: 'desc' },
        include: { timeline_items: { orderBy: { sort_order: 'asc' } } }
      });
    } else {
      event = await prisma.event.findUnique({ 
        where: { id: eventId },
        include: { timeline_items: { orderBy: { sort_order: 'asc' } } }
      });
      if (!event) {
        event = await prisma.event.findFirst({ 
          where: { slug: eventId },
          include: { timeline_items: { orderBy: { sort_order: 'asc' } } }
        });
      }
    }

    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Check if voting ended
    const now = new Date();
    const votingItem = event.timeline_items?.find((t: any) => 
      (t.title || '').toLowerCase().includes('voting') || (t.title || '').toLowerCase().includes('community')
    );
    const isVotingEnded = Boolean(
      (votingItem && votingItem.end_datetime && now > new Date(votingItem.end_datetime)) ||
      (!event.community_voting_open && event.show_public_results)
    );

    const submissions = await prisma.submission.findMany({
      where: { event_id: event.id, status: 'submitted' },
      include: {
        team: { select: { name: true } },
        _count: { select: { votes: true } },
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
      submissions as any,
      { isVotingEnded }
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

// 5. Get Real-Time Judges Evaluation Progress & Completion Metrics
router.get(['/judges-progress', '/event/:eventId/judges-progress'], requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    let eventId = req.params.eventId;
    let event = null;

    if (!eventId || eventId === 'latest') {
      event = await prisma.event.findFirst({ orderBy: { start_date: 'desc' } });
    } else {
      event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) {
        event = await prisma.event.findFirst({ where: { slug: eventId } });
      }
    }

    if (!event) {
      event = await prisma.event.findFirst({ orderBy: { start_date: 'desc' } });
    }

    // Fetch all judges and their assignments + scores
    const judgeWhere = event ? { event_id: event.id } : {};
    let judges = await prisma.judge.findMany({
      where: judgeWhere,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            staff_id: true,
            designation: true
          }
        },
        assignments: {
          select: {
            id: true,
            submission_id: true
          }
        },
        scores: {
          select: {
            id: true,
            submission_id: true,
            raw_score: true,
            weighted_score: true
          }
        }
      },
      orderBy: { sort_order: 'asc' }
    });

    if (judges.length === 0) {
      // Fallback: fetch judges across all events or user role='judge'
      judges = await prisma.judge.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              staff_id: true,
              designation: true
            }
          },
          assignments: {
            select: {
              id: true,
              submission_id: true
            }
          },
          scores: {
            select: {
              id: true,
              submission_id: true,
              raw_score: true,
              weighted_score: true
            }
          }
        }
      });
    }

    let totalAssigned = 0;
    let totalEvaluated = 0;

    const judgeProgressList = judges.map(j => {
      const assignedCount = j.assignments.length;
      // Unique submissions evaluated by this judge
      const evaluatedSubmissions = new Set(j.scores.map(s => s.submission_id));
      const evaluatedCount = evaluatedSubmissions.size;
      const pendingCount = Math.max(0, assignedCount - evaluatedCount);
      const percentage = assignedCount > 0 
        ? Math.min(100, Math.round((evaluatedCount / assignedCount) * 100)) 
        : (evaluatedCount > 0 ? 100 : 0);

      totalAssigned += assignedCount;
      totalEvaluated += evaluatedCount;

      let status: 'Completed' | 'In Progress' | 'Not Started' | 'Unassigned' = 'Not Started';
      if (assignedCount === 0) {
        status = evaluatedCount > 0 ? 'Completed' : 'Unassigned';
      } else if (evaluatedCount >= assignedCount && assignedCount > 0) {
        status = 'Completed';
      } else if (evaluatedCount > 0) {
        status = 'In Progress';
      }

      const rawSum = j.scores.reduce((acc, s) => acc + Number(s.raw_score || 0), 0);
      const avgScore = j.scores.length > 0 ? Number((rawSum / j.scores.length).toFixed(2)) : null;

      const judgeName = j.user?.name || j.display_name || j.user?.staff_id || j.user?.email?.split('@')[0] || `Judge-${j.id.substring(0, 6)}`;

      return {
        id: j.id,
        judgeId: j.id,
        userId: j.user_id,
        name: judgeName,
        email: j.user?.email || '',
        staffId: j.user?.staff_id || '',
        designation: j.designation || j.user?.designation || 'Jury Panel Member',
        assignedCount,
        evaluatedCount,
        pendingCount,
        percentage,
        status,
        avgScoreGiven: avgScore,
        totalScoreRecords: j.scores.length
      };
    });

    const totalPending = Math.max(0, totalAssigned - totalEvaluated);
    const overallPercentage = totalAssigned > 0 
      ? Math.min(100, Math.round((totalEvaluated / totalAssigned) * 100)) 
      : 0;

    res.json({
      eventId: event?.id || null,
      eventName: event?.name || 'Hackathon Event',
      overall: {
        totalJudges: judges.length,
        totalAssignedReviews: totalAssigned,
        totalCompletedReviews: totalEvaluated,
        totalPendingReviews: totalPending,
        completionPercentage: overallPercentage
      },
      judges: judgeProgressList
    });
  } catch (error) {
    console.error('Judges progress calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate judges progress' });
  }
});

export default router;
