import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Organizer or Admin creates an instant staff account
router.post('/create', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { role, name, email, designation } = req.body;
    if (!role || !['judge', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Valid role required (judge or admin)' });
    }

    // Clean email: convert empty string/whitespace to null so unique constraint on email doesn't fail
    const cleanEmail = email && typeof email === 'string' && email.trim().length > 0 ? email.trim().toLowerCase() : null;

    if (cleanEmail) {
      const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (existingUser) {
        return res.status(400).json({ error: `A user with email ${cleanEmail} already exists` });
      }
    }

    const prefix = role === 'judge' ? 'JDG-' : 'ADM-';
    
    // Ensure unique staff_id
    let staff_id = '';
    let isUnique = false;
    while (!isUnique) {
      staff_id = prefix + crypto.randomBytes(4).toString('hex').toUpperCase();
      const existing = await prisma.user.findUnique({ where: { staff_id } });
      if (!existing) isUnique = true;
    }

    const tempPassword = crypto.randomBytes(6).toString('hex');
    
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(tempPassword, salt);

    const newUser = await prisma.user.create({
      data: {
        staff_id,
        role,
        name: name && typeof name === 'string' && name.trim().length > 0 ? name.trim() : null,
        email: cleanEmail,
        designation: designation && typeof designation === 'string' && designation.trim().length > 0 ? designation.trim() : (role === 'judge' ? 'Judge' : 'Admin'),
        password_hash,
        temp_pass_key: tempPassword,
        must_change_password: true
      }
    });

    // If role is judge, also ensure a Judge record exists for the current/latest event
    if (role === 'judge') {
      try {
        const activeEvent = await prisma.event.findFirst({ orderBy: { start_date: 'desc' } });
        if (activeEvent) {
          await prisma.judge.create({
            data: {
              user_id: newUser.id,
              event_id: activeEvent.id,
              display_name: newUser.name || newUser.email || newUser.staff_id,
              designation: newUser.designation || 'Judge',
              show_publicly: false
            }
          });
        }
      } catch (judgeErr) {
        console.warn('Note: Could not link Judge record to event:', judgeErr);
      }
    }

    res.json({ 
      staff_id,
      tempPassword,
      name: newUser.name,
      email: newUser.email,
      designation: newUser.designation
    });
  } catch (error: any) {
    console.error('Invite create error:', error);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

// User accepts invite
router.post('/accept', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    const invite = await prisma.inviteToken.findUnique({ where: { token } });
    if (!invite) {
      return res.status(404).json({ error: 'Invalid invite link' });
    }
    
    if (new Date() > invite.expires_at) {
      return res.status(400).json({ error: 'Invite link has expired' });
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create the user or update if exists
    const user = await prisma.user.upsert({
      where: { email: invite.email },
      update: {
        password_hash,
        role: invite.role
      },
      create: {
        email: invite.email,
        password_hash,
        role: invite.role
      }
    });

    // Delete the token
    await prisma.inviteToken.delete({ where: { token } });

    res.json({ message: 'Account created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
