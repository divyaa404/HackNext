import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get data for a specific table
router.get('/:table', requireAuth, requireRole('organizer'), async (req, res) => {
  try {
    const { table } = req.params;
    
    // Whitelist allowed tables to prevent arbitrary DB access
    const allowedTables = ['user', 'event', 'team', 'submission', 'score', 'judge'];
    
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ error: 'Invalid table requested' });
    }

    // @ts-ignore - dynamic model access
    const data = await prisma[table].findMany();

    // Strip sensitive fields if it's the User table
    if (table === 'user') {
      data.forEach((user: any) => {
        delete user.password_hash;
        delete user.current_session_id;
      });
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch export data' });
  }
});

// Get all tables at once
router.get('/', requireAuth, requireRole('organizer'), async (req, res) => {
  try {
    const allUsers = await prisma.user.findMany();
    allUsers.forEach((u: any) => {
      delete u.password_hash;
      delete u.current_session_id;
    });

    const participants = allUsers.filter((u: any) => u.role === 'participant').map((u: any) => {
      // Remove staff-specific fields for participants
      const p: any = { ...u };
      delete p.designation;
      delete p.staff_id;
      return p;
    });
    
    const admins = allUsers.filter(u => u.role === 'admin');
    const judges = allUsers.filter(u => u.role === 'judge');
    const organizers = allUsers.filter(u => u.role === 'organizer');

    const events = await prisma.event.findMany();
    const teams = await prisma.team.findMany();
    const submissions = await prisma.submission.findMany();
    const scores = await prisma.score.findMany();

    res.json({
      participant: participants,
      admin: admins,
      judge: judges,
      organizer: organizers,
      event: events,
      team: teams,
      submission: submissions,
      score: scores
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch all export data' });
  }
});

export default router;
