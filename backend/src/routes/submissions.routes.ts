import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { checkSubmissionStatus } from '../utils/timeline';
import { generateReproducibleAssignments } from '../utils/evaluation';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Ensure uploads folder exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'submission-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Get my team's submission
router.get('/my-submission', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const team = await prisma.team.findFirst({
      where: {
        members: { some: { user_id: userId } }
      }
    });

    if (!team) return res.json(null);

    const submission = await prisma.submission.findFirst({
      where: { team_id: team.id }
    });

    res.json(submission || null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// Create or update submission
router.post('/', requireAuth, requireRole('participant'), upload.single('pdf'), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { title, description, repo_url, demo_video_url } = req.body;
    const file = req.file;

    const team = await prisma.team.findFirst({
      where: {
        members: { some: { user_id: userId } }
      },
      include: { 
        members: true,
        event: { include: { timeline_items: { orderBy: { sort_order: 'asc' } } } }
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'You are not in a team' });
    }

    if (team.members[0].user_id !== userId) {
      return res.status(403).json({ error: 'Only the team leader can submit.' });
    }

    // Validate Submission Timeline
    if (team.event) {
      const subStatus = checkSubmissionStatus(team.event);
      if (!subStatus.isOpen) {
        return res.status(403).json({ 
          error: subStatus.message,
          code: subStatus.isLocked ? 'SUBMISSIONS_LOCKED' : 'SUBMISSIONS_CLOSED',
          opensAt: subStatus.opensAt,
          closesAt: subStatus.closesAt
        });
      }
    }

    const existingSubmission = await prisma.submission.findFirst({
      where: { team_id: team.id }
    });

    let pdf_url = existingSubmission?.pdf_url;
    if (file) {
      pdf_url = `/uploads/${file.filename}`;
    }

    if (existingSubmission) {
      const updated = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          title,
          description,
          repo_url,
          demo_video_url,
          pdf_url,
          status: 'submitted',
          submitted_at: new Date()
        }
      });
      // Clear alert on team
      await prisma.team.update({
        where: { id: team.id },
        data: { submission_alert: null }
      });
      return res.json(updated);
    } else {
      const created = await prisma.submission.create({
        data: {
          team_id: team.id,
          event_id: team.event_id,
          title,
          description,
          repo_url,
          demo_video_url,
          pdf_url,
          status: 'submitted',
          submitted_at: new Date()
        }
      });
      // Clear alert on team
      await prisma.team.update({
        where: { id: team.id },
        data: { submission_alert: null }
      });
      return res.json(created);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save submission' });
  }
});

// Auto-assign submissions equally among judges (Admin & Organizer)
router.post('/assign-equal', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    // 1. Fetch all judges
    const judgeUsers = await prisma.user.findMany({
      where: { role: 'judge' }
    });

    if (judgeUsers.length === 0) {
      return res.status(400).json({ error: 'No judges found. Please provision judge accounts first.' });
    }

    // 2. Resolve event
    let targetEvent = await prisma.event.findFirst({ orderBy: { start_date: 'desc' } });
    if (!targetEvent) {
      let adminUser = await prisma.user.findFirst({ where: { role: { in: ['organizer', 'admin'] } } });
      targetEvent = await prisma.event.create({
        data: {
          name: 'HackNext Hackathon',
          slug: `hacknext-hackathon-${Date.now()}`,
          start_date: new Date(),
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          tracks: [],
          prizes_config: {},
          created_by: adminUser ? adminUser.id : judgeUsers[0].id
        }
      });
    }

    // 3. Ensure Judge records exist for each judge user
    const judges: any[] = [];
    for (const jUser of judgeUsers) {
      let judgeRecord = await prisma.judge.findFirst({
        where: { user_id: jUser.id }
      });
      if (!judgeRecord) {
        judgeRecord = await prisma.judge.create({
          data: {
            user_id: jUser.id,
            event_id: targetEvent.id,
            display_name: jUser.name || jUser.email || jUser.staff_id,
            designation: jUser.designation || 'Judge'
          }
        });
      }
      judges.push(judgeRecord);
    }

    // 4. Fetch all submissions
    const submissions = await prisma.submission.findMany({
      orderBy: { submitted_at: 'desc' }
    });

    if (submissions.length === 0) {
      return res.status(400).json({ error: 'No submissions found to assign.' });
    }

    const J = judges.length;
    const S = submissions.length;

    // 5. Adaptive Dynamic Multi-Judge & Workload Balancer with K-feasibility & seed reproducibility
    const { k, seed, maxLoadPerJudge } = req.body || {};
    const maxLoad = Number(maxLoadPerJudge) || 25;
    const requestedK = k ? Number(k) : Math.min(3, Math.max(1, Math.floor((judges.length * maxLoad) / submissions.length)));
    const assignmentSeed = seed && String(seed).trim().length > 0 ? String(seed).trim() : `HNX-ASSIGN-${Date.now()}`;

    const assignmentResult = generateReproducibleAssignments(
      submissions,
      judges.map(j => ({ id: j.id })),
      { k: requestedK, seed: assignmentSeed, maxLoadPerJudge: maxLoad }
    );

    // Clear old assignments for clean re-distribution
    const submissionIds = submissions.map(s => s.id);
    await prisma.judgeAssignment.deleteMany({
      where: { submission_id: { in: submissionIds } }
    });

    if (assignmentResult.assignments.length > 0) {
      await prisma.judgeAssignment.createMany({
        data: assignmentResult.assignments
      });
    }

    res.json({
      message: `Adaptive assignment engine successfully generated ${assignmentResult.assignments.length} assignments with depth K = ${assignmentResult.feasibility.effectiveK} judge(s)/project (Seed: ${assignmentResult.seed})!`,
      seed: assignmentResult.seed,
      feasibility: assignmentResult.feasibility,
      totalSubmissions: submissions.length,
      totalJudges: judges.length,
      dynamicJudgesPerProject: assignmentResult.feasibility.effectiveK,
      totalAssignments: assignmentResult.assignments.length,
      avgProjectsPerJudge: Number((assignmentResult.assignments.length / judges.length).toFixed(1)),
      workloadMinMax: `${assignmentResult.minWorkload} - ${assignmentResult.maxWorkload} projects/judge`
    });
  } catch (error) {
    console.error('Error assigning submissions:', error);
    res.status(500).json({ error: 'Failed to assign submissions' });
  }
});

// Get assigned submissions for logged-in judge
router.get('/my-assigned', requireAuth, requireRole('judge'), async (req, res) => {
  try {
    const userId = (req as any).user.id;

    let judge = await prisma.judge.findFirst({
      where: { user_id: userId }
    });

    if (!judge) {
      const event = await prisma.event.findFirst();
      if (!event) return res.json([]);
      const user = await prisma.user.findUnique({ where: { id: userId } });
      judge = await prisma.judge.create({
        data: {
          user_id: userId,
          event_id: event.id,
          display_name: user?.name || user?.email || user?.staff_id,
          designation: user?.designation || 'Judge'
        }
      });
    }

    const assignments = await prisma.judgeAssignment.findMany({
      where: { judge_id: judge.id },
      include: {
        submission: {
          include: {
            team: {
              include: {
                members: {
                  include: {
                    user: {
                      select: { id: true, name: true, email: true, role: true }
                    }
                  }
                }
              }
            },
            scores: {
              where: { judge_id: judge.id }
            }
          }
        }
      }
    });

    const assignedSubmissions = assignments.map(a => a.submission);
    res.json(assignedSubmissions);
  } catch (error) {
    console.error('Error fetching judge assigned submissions:', error);
    res.status(500).json({ error: 'Failed to fetch assigned submissions' });
  }
});

// Judge score submission (Single or Multi-Factor Rubric)
router.post('/:id/score', requireAuth, requireRole('judge'), async (req, res) => {
  try {
    const { id } = req.params;
    const { raw_score, weighted_score, rubric_item, items, time_spent_seconds } = req.body;
    const userId = (req as any).user.id;

    const judge = await prisma.judge.findFirst({ where: { user_id: userId } });
    if (!judge) return res.status(404).json({ error: 'Judge profile not found' });

    // If multi-factor items array is provided
    if (items && Array.isArray(items) && items.length > 0) {
      await prisma.score.deleteMany({
        where: {
          judge_id: judge.id,
          submission_id: id
        }
      });

      const records = items.map((it: any) => ({
        judge_id: judge.id,
        submission_id: id,
        rubric_item: it.rubric_item,
        raw_score: parseFloat(it.raw_score) || 0,
        weighted_score: parseFloat(it.weighted_score !== undefined ? it.weighted_score : it.raw_score) || 0
      }));

      await prisma.score.createMany({
        data: records
      });

      const totalScore = records.reduce((sum: number, r: any) => sum + r.raw_score, 0);
      return res.json({ message: 'Evaluation saved successfully', totalScore, time_spent_seconds, scores: records });
    }

    // Fallback single rubric item
    const score = await prisma.score.create({
      data: {
        judge_id: judge.id,
        submission_id: id,
        rubric_item: rubric_item || 'Overall Score',
        raw_score: parseFloat(raw_score) || 0,
        weighted_score: parseFloat(weighted_score || raw_score) || 0
      }
    });

    res.json(score);
  } catch (error) {
    console.error('Error scoring submission:', error);
    res.status(500).json({ error: 'Failed to score submission' });
  }
});

// Get all submissions (for admin & organizer)
router.get('/all', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'organizer' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const submissions = await prisma.submission.findMany({
      include: {
        team: true,
        assignments: {
          include: {
            judge: {
              include: {
                user: { select: { id: true, name: true, staff_id: true, email: true } }
              }
            }
          }
        }
      },
      orderBy: {
        submitted_at: 'desc'
      }
    });
    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get remaining teams pending submission (for admin & organizer)
router.get('/pending-teams', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { event_id } = req.query;

    let targetEventId: string | undefined = typeof event_id === 'string' && event_id ? event_id : undefined;
    if (!targetEventId) {
      const latestEvent = await prisma.event.findFirst({ orderBy: { start_date: 'desc' } });
      if (latestEvent) {
        targetEventId = latestEvent.id;
      }
    }

    const eventFilter = targetEventId ? { event_id: targetEventId } : {};

    // Get all teams in this event with members and submissions
    const allTeams = await prisma.team.findMany({
      where: eventFilter,
      include: {
        event: {
          select: { id: true, name: true, start_date: true, end_date: true, team_size_min: true, team_size_max: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true, college: true }
            }
          },
          orderBy: { id: 'asc' }
        },
        submissions: {
          select: { id: true, title: true, status: true, submitted_at: true }
        }
      },
      orderBy: { id: 'desc' }
    });

    const pendingTeams = allTeams.filter(t => {
      const hasCompletedSubmission = t.submissions.some(s => s.status === 'submitted');
      return !hasCompletedSubmission;
    });

    const submittedTeamsCount = allTeams.length - pendingTeams.length;

    res.json({
      pendingTeams,
      stats: {
        totalTeams: allTeams.length,
        submittedTeams: submittedTeamsCount,
        pendingTeams: pendingTeams.length
      }
    });
  } catch (error) {
    console.error('Error fetching pending submission teams:', error);
    res.status(500).json({ error: 'Failed to fetch pending submission teams' });
  }
});

// Notify a specific team to submit fast
router.post('/notify-pending/:teamId', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { teamId } = req.params;
    const { message } = req.body;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        submissions: true,
        members: { include: { user: { select: { email: true, name: true } } } }
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const alertMessage = message && typeof message === 'string' && message.trim()
      ? message.trim()
      : '⚠️ URGENT: The organizers request that your team submit your project fast before the deadline closes!';

    const updated = await prisma.team.update({
      where: { id: teamId },
      data: {
        submission_alert: alertMessage,
        last_notified_at: new Date()
      }
    });

    res.json({
      message: `Alert sent successfully to team "${team.name}"!`,
      team: {
        id: updated.id,
        name: updated.name,
        submission_alert: updated.submission_alert,
        last_notified_at: updated.last_notified_at
      }
    });
  } catch (error) {
    console.error('Error notifying team:', error);
    res.status(500).json({ error: 'Failed to send alert to team' });
  }
});

// Notify all remaining pending teams in an event
router.post('/notify-all-pending', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { event_id, message } = req.body;

    let targetEventId: string | undefined = event_id;
    if (!targetEventId) {
      const latestEvent = await prisma.event.findFirst({ orderBy: { start_date: 'desc' } });
      if (latestEvent) {
        targetEventId = latestEvent.id;
      }
    }

    const eventFilter = targetEventId ? { event_id: targetEventId } : {};

    const teams = await prisma.team.findMany({
      where: eventFilter,
      include: { submissions: true }
    });

    const pendingTeamIds = teams
      .filter(t => !t.submissions.some(s => s.status === 'submitted'))
      .map(t => t.id);

    if (pendingTeamIds.length === 0) {
      return res.json({ message: 'All teams have already submitted their projects!', count: 0 });
    }

    const alertMessage = message && typeof message === 'string' && message.trim()
      ? message.trim()
      : '⚠️ URGENT: The organizers request that your team submit your project fast before the deadline closes!';

    const updateResult = await prisma.team.updateMany({
      where: { id: { in: pendingTeamIds } },
      data: {
        submission_alert: alertMessage,
        last_notified_at: new Date()
      }
    });

    res.json({
      message: `Successfully notified ${updateResult.count} pending team(s) to submit!`,
      count: updateResult.count
    });
  } catch (error) {
    console.error('Error notifying all pending teams:', error);
    res.status(500).json({ error: 'Failed to notify pending teams' });
  }
});

export default router;
