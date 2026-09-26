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
      return res.status(400).json({ error: 'Valid role required' });
    }

    const prefix = role === 'judge' ? 'JDG-' : 'ADM-';
    const staff_id = prefix + crypto.randomBytes(4).toString('hex').toUpperCase();
    const tempPassword = crypto.randomBytes(6).toString('hex');
    
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(tempPassword, salt);

    await prisma.user.create({
      data: {
        staff_id,
        role,
        name,
        email,
        designation,
        password_hash,
        temp_pass_key: tempPassword,
        must_change_password: true
      }
    });

    res.json({ 
      staff_id,
      tempPassword
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
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
