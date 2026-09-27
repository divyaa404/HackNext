import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// 1. Get all projects for community voting (Public & Authenticated)
// Returns project title, description, team name, and voting status
router.get(['/events/:slug/projects', '/event/:slug/projects'], async (req, res) => {
  try {
    const { slug } = req.params;
    let event = await prisma.event.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug }
        ]
      },
      include: {
        timeline_items: { orderBy: { sort_order: 'asc' } }
      }
    });

    if (!event) {
      event = await prisma.event.findFirst({
        orderBy: { start_date: 'desc' },
        include: { timeline_items: { orderBy: { sort_order: 'asc' } } }
      });
    }

    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Check if community voting is enabled or within timeline
    const now = new Date();
    const votingItem = event.timeline_items.find(t => 
      (t.title || '').toLowerCase().includes('voting') || (t.title || '').toLowerCase().includes('community')
    );

    const isVotingWindowActive = votingItem 
      ? (now >= new Date(votingItem.start_datetime) && (!votingItem.end_datetime || now <= new Date(votingItem.end_datetime)))
      : event.community_voting_open;

    const isVotingEnded = votingItem && votingItem.end_datetime && now > new Date(votingItem.end_datetime);

    const submissions = await prisma.submission.findMany({
      where: {
        event_id: event.id,
        status: 'submitted'
      },
      include: {
        team: { select: { id: true, name: true } },
        _count: { select: { votes: true } }
      }
    });

    const projects = submissions.map(sub => ({
      id: sub.id,
      title: sub.title,
      description: sub.description,
      teamId: sub.team_id,
      teamName: sub.team?.name || 'Unknown Team',
      votesCount: (isVotingEnded || !event?.show_public_voting) ? sub._count.votes : undefined
    }));

    // If voting ended, sort by votes descending
    if (isVotingEnded) {
      projects.sort((a, b) => (b.votesCount || 0) - (a.votesCount || 0));
    }

    res.json({
      eventId: event.id,
      eventName: event.name,
      isVotingWindowActive: isVotingWindowActive || event.community_voting_open,
      isVotingEnded,
      totalProjects: projects.length,
      projects
    });
  } catch (err) {
    console.error('Failed to fetch voting projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// 2. Get logged-in user's active vote
router.get('/events/:eventId/my-vote', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = (req as any).user.id;

    const vote = await prisma.vote.findUnique({
      where: {
        event_id_user_id: {
          event_id: eventId,
          user_id: userId
        }
      },
      include: {
        submission: { select: { id: true, title: true, team: { select: { name: true } } } }
      }
    });

    res.json(vote ? {
      hasVoted: true,
      projectId: vote.project_id,
      projectTitle: vote.submission.title,
      teamName: vote.submission.team?.name,
      votedAt: vote.created_at
    } : { hasVoted: false });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user vote' });
  }
});

// 3. Cast a vote for a project (Strictly 1 vote per user per event)
router.post('/events/:eventId/vote', requireAuth, requireRole('participant'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { projectId } = req.body;
    const userId = (req as any).user.id;
    const clientIp = req.ip || req.headers['x-forwarded-for']?.toString() || '127.0.0.1';

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { timeline_items: true }
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Validate submission belongs to event
    const submission = await prisma.submission.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: { members: true }
        }
      }
    });

    if (!submission || submission.event_id !== eventId) {
      return res.status(404).json({ error: 'Target project not found in this event' });
    }

    // Check if voter belongs to this team (prevent voting for own project)
    const isOwnTeam = submission.team.members.some(m => m.user_id === userId);
    if (isOwnTeam) {
      return res.status(403).json({ error: 'You cannot vote for your own team project!' });
    }

    // Check if user already voted (Upsert or replace vote)
    const existingVote = await prisma.vote.findUnique({
      where: {
        event_id_user_id: {
          event_id: eventId,
          user_id: userId
        }
      }
    });

    if (existingVote) {
      // Update vote to new project
      const updated = await prisma.vote.update({
        where: { id: existingVote.id },
        data: {
          project_id: projectId,
          voter_ip: clientIp,
          created_at: new Date()
        }
      });
      return res.json({ message: 'Vote successfully changed!', vote: updated });
    }

    // Create new vote
    const vote = await prisma.vote.create({
      data: {
        event_id: eventId,
        project_id: projectId,
        user_id: userId,
        voter_ip: clientIp
      }
    });

    res.status(201).json({ message: 'Vote cast successfully!', vote });
  } catch (err) {
    console.error('Voting error:', err);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// 4. Retract vote
router.delete('/events/:eventId/vote', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = (req as any).user.id;

    await prisma.vote.deleteMany({
      where: {
        event_id: eventId,
        user_id: userId
      }
    });

    res.json({ message: 'Vote successfully retracted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retract vote' });
  }
});

// 5. Organizer toggle community voting
router.post('/events/:eventId/toggle', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        community_voting_open: !event.community_voting_open
      }
    });

    res.json({
      community_voting_open: updated.community_voting_open,
      message: `Community voting ${updated.community_voting_open ? 'opened' : 'closed'} successfully.`
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle community voting' });
  }
});

// 6. Direct project vote endpoint (Check 8)
router.post('/projects/:submissionId/vote', requireAuth, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = (req as any).user.id;
    const clientIp = req.ip || req.headers['x-forwarded-for']?.toString() || '127.0.0.1';

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        team: { include: { members: true } }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Project submission not found' });
    }

    const eventId = submission.event_id;

    // Prevent voting for own team
    const isOwnTeam = submission.team.members.some(m => m.user_id === userId);
    if (isOwnTeam) {
      return res.status(403).json({ error: 'You cannot vote for your own team project!' });
    }

    // Check if user already voted in this event
    const existingVote = await prisma.vote.findUnique({
      where: {
        event_id_user_id: {
          event_id: eventId,
          user_id: userId
        }
      }
    });

    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted in this event! Strictly 1 vote per user.' });
    }

    const vote = await prisma.vote.create({
      data: {
        event_id: eventId,
        project_id: submissionId,
        user_id: userId,
        voter_ip: clientIp
      }
    });

    res.status(201).json({ message: 'Vote recorded successfully', vote });
  } catch (err) {
    console.error('Direct vote error:', err);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

export default router;
