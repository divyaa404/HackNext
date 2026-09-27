import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Create an event (Organizer only)
router.post('/', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { name, start_date, end_date, tracks, prizes_config } = req.body;
    const startDt = new Date(start_date || Date.now());
    const endDt = new Date(end_date || Date.now() + 72 * 60 * 60 * 1000);

    const regEnd = new Date(startDt.getTime() + 24 * 60 * 60 * 1000);
    const subEnd = new Date(startDt.getTime() + 48 * 60 * 60 * 1000);
    const evalEnd = new Date(startDt.getTime() + 60 * 60 * 60 * 1000);
    const voteEnd = new Date(startDt.getTime() + 68 * 60 * 60 * 1000);

    const event = await prisma.event.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000),
        start_date: startDt,
        end_date: endDt,
        tracks: tracks || [],
        prizes_config: prizes_config || {},
        created_by: (req as any).user.id,
        timeline_items: {
          create: [
            {
              title: 'Registration',
              description: 'Team formation, participant onboarding, and problem statement release.',
              start_datetime: startDt,
              end_datetime: subEnd,
              sort_order: 1
            },
            {
              title: 'Project Submission',
              description: 'Repository commit freeze, project deck, and video demo submission.',
              start_datetime: startDt,
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
              end_datetime: endDt,
              sort_order: 5
            }
          ]
        },
        rubrics: {
          create: [
            { name: 'Innovation & Originality', description: 'Novelty of the concept and creative problem solving', weight: 25.0, max_score: 10.0, sort_order: 1 },
            { name: 'Technical Execution & Architecture', description: 'Code quality, software architecture, complexity, and robustness', weight: 30.0, max_score: 10.0, sort_order: 2 },
            { name: 'UI / UX Design & Polish', description: 'Visual aesthetics, user intuition, and interface responsiveness', weight: 25.0, max_score: 10.0, sort_order: 3 },
            { name: 'Real-world Impact & Presentation', description: 'Market viability, practical utility, and pitch quality', weight: 20.0, max_score: 10.0, sort_order: 4 }
          ]
        }
      },
      include: {
        timeline_items: { orderBy: { sort_order: 'asc' } },
        rubrics: { orderBy: { sort_order: 'asc' } }
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        creator: { select: { email: true } },
        timeline_items: { orderBy: { sort_order: 'asc' } }
      }
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get organizer's events
router.get('/my-events', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { created_by: (req as any).user.id },
      include: {
        _count: {
          select: { teams: true, submissions: true, judges: true }
        }
      }
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific event details for Organizer
router.get('/:id/organizer-details', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        teams: {
          include: { members: { include: { user: { select: { email: true, name: true, phone: true } } } } }
        },
        submissions: true,
        judges: {
          include: { user: { select: { email: true, name: true, staff_id: true } } }
        },
        timeline_items: { orderBy: { sort_order: 'asc' } },
        rubrics: { orderBy: { sort_order: 'asc' } },
        certificates: true
      }
    });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
