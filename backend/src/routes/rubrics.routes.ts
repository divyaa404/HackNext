import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const DEFAULT_RUBRICS = [
  {
    name: 'Innovation & Originality',
    description: 'Novelty of the concept, creative problem solving, and uniqueness in the market.',
    weight: 25.0,
    max_score: 10.0,
    sort_order: 1
  },
  {
    name: 'Technical Execution & Architecture',
    description: 'Code quality, software architecture, complexity, database design, and robustness.',
    weight: 30.0,
    max_score: 10.0,
    sort_order: 2
  },
  {
    name: 'UI / UX Design & Polish',
    description: 'Visual aesthetics, user intuition, interface responsiveness, and accessibility.',
    weight: 25.0,
    max_score: 10.0,
    sort_order: 3
  },
  {
    name: 'Real-world Impact & Presentation',
    description: 'Market viability, practical utility, pitch quality, and live demonstration effectiveness.',
    weight: 20.0,
    max_score: 10.0,
    sort_order: 4
  }
];

// 1. Get all rubrics for an event (Auto-seeds default 4 rubrics if empty)
router.get('/events/:id', async (req, res) => {
  try {
    let eventId = req.params.id;
    if (eventId === 'latest') {
      const latest = await prisma.event.findFirst({ orderBy: { start_date: 'desc' } });
      if (!latest) return res.json([]);
      eventId = latest.id;
    }

    let rubrics = await prisma.rubric.findMany({
      where: { event_id: eventId },
      orderBy: { sort_order: 'asc' }
    });

    if (rubrics.length === 0) {
      // Auto-initialize default 4 rubrics
      const createdRubrics: any[] = [];
      for (const def of DEFAULT_RUBRICS) {
        const item = await prisma.rubric.create({
          data: {
            event_id: eventId,
            name: def.name,
            description: def.description,
            weight: def.weight,
            max_score: def.max_score,
            sort_order: def.sort_order
          }
        });
        createdRubrics.push(item);
      }
      rubrics = createdRubrics;
    }

    res.json(rubrics);
  } catch (err) {
    console.error('Failed to fetch rubrics:', err);
    res.status(500).json({ error: 'Failed to fetch rubrics' });
  }
});

// 2. Create single rubric
router.post('/events/:id', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const eventId = req.params.id;
    const { name, description, weight, max_score } = req.body;

    if (!name) return res.status(400).json({ error: 'Rubric name is required' });

    const count = await prisma.rubric.count({ where: { event_id: eventId } });

    const rubric = await prisma.rubric.create({
      data: {
        event_id: eventId,
        name,
        description: description || null,
        weight: parseFloat(weight) || 25.0,
        max_score: parseFloat(max_score) || 10.0,
        sort_order: count + 1
      }
    });

    res.status(201).json(rubric);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create rubric' });
  }
});

// 3. Bulk update / re-weight rubrics
router.put('/events/:id', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const eventId = req.params.id;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.rubric.deleteMany({ where: { event_id: eventId } });
      if (items.length > 0) {
        await tx.rubric.createMany({
          data: items.map((it: any, i: number) => ({
            event_id: eventId,
            name: it.name,
            description: it.description || null,
            weight: parseFloat(it.weight) || 25.0,
            max_score: parseFloat(it.max_score) || 10.0,
            sort_order: it.sort_order || (i + 1)
          }))
        });
      }
    });

    const updated = await prisma.rubric.findMany({
      where: { event_id: eventId },
      orderBy: { sort_order: 'asc' }
    });

    res.json(updated);
  } catch (err) {
    console.error('Failed to update rubrics:', err);
    res.status(500).json({ error: 'Failed to update rubrics' });
  }
});

// 4. Delete single rubric
router.delete('/:id', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.rubric.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete rubric' });
  }
});

export default router;
