import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Get users by role (Organizer and Admin)
router.get('/', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { role } = req.query;
    if (!role) return res.status(400).json({ error: 'Role query parameter required' });

    const users = await prisma.user.findMany({
      where: { role: role as string },
      select: {
        id: true,
        email: true,
        name: true,
        designation: true,
        staff_id: true,
        role: true,
        temp_pass_key: true,
        must_change_password: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Reset staff credentials
router.post('/:id/reset', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser || !['admin', 'judge'].includes(targetUser.role)) {
      return res.status(404).json({ error: 'Valid staff user not found' });
    }

    const tempPassword = crypto.randomBytes(6).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(tempPassword, salt);

    await prisma.user.update({
      where: { id },
      data: {
        password_hash,
        temp_pass_key: tempPassword,
        must_change_password: true,
        current_session_id: null // force logout
      }
    });

    res.json({
      message: 'Credentials reset successfully',
      staff_id: targetUser.staff_id,
      tempPassword
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset credentials' });
  }
});

// Update my profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { name, college, year, branch, gender, dob, phone, city, bio, github_url, linkedin_url, instagram_url, portfolio_url } = req.body;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        college,
        year,
        branch,
        gender,
        dob,
        phone,
        city,
        bio,
        github_url,
        linkedin_url,
        instagram_url,
        portfolio_url
      } as any
    });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update user details inline
router.put('/:id', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, designation } = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, email, designation }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete staff user (Admin or Judge)
router.delete('/:id', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = (req as any).user.id;

    if (id === currentUserId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.role === 'organizer') {
      return res.status(403).json({ error: 'Organizer accounts cannot be deleted' });
    }

    // Clean up relations
    await prisma.$transaction([
      prisma.score.deleteMany({ where: { judge_id: id } }),
      prisma.judge.deleteMany({ where: { user_id: id } }),
      prisma.passwordResetToken.deleteMany({ where: { user_id: id } }),
      prisma.passwordResetRequest.deleteMany({ where: { user_id: id } }),
      prisma.joinRequest.deleteMany({ where: { user_id: id } }),
      prisma.teamMember.deleteMany({ where: { user_id: id } }),
      prisma.user.delete({ where: { id } })
    ]);

    res.json({ message: 'User deleted successfully', deletedId: id });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user: ' + (error?.message || String(error)) });
  }
});

export default router;
