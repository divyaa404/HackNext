import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Create an event (Organizer only)
router.post('/', requireAuth, requireRole('organizer'), async (req, res) => {
  try {
    const { name, start_date, end_date, tracks, prizes_config } = req.body;
    const startDt = new Date(start_date);
    const endDt = new Date(end_date);
    const event = await prisma.event.create({
      data: {
        name,
        start_date: startDt,
        end_date: endDt,
        tracks: tracks || [],
        prizes_config: prizes_config || {},
        created_by: (req as any).user.id,
        timeline_items: {
          create: [
            {
              title: 'Registration',
              description: 'Team registration and team formation period',
              start_datetime: startDt,
              end_datetime: endDt,
              sort_order: 1
            },
            {
              title: 'Submission',
              description: 'Project and demo video submission period',
              start_datetime: startDt,
              end_datetime: endDt,
              sort_order: 2
            }
          ]
        }
      },
      include: {
        timeline_items: { orderBy: { sort_order: 'asc' } }
      }
    });
    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all events (Public or filtered)
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
router.get('/my-events', requireAuth, requireRole('organizer'), async (req, res) => {
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
router.get('/:id/organizer-details', requireAuth, requireRole('organizer'), async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        teams: {
          include: { members: { include: { user: { select: { email: true } } } } }
        },
        submissions: true,
        judges: {
          include: { user: { select: { email: true } } }
        }
      }
    });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.created_by !== (req as any).user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this event' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
