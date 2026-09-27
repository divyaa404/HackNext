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
router.put('/profile', requireAuth, requireRole('participant'), async (req, res) => {
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
    
    const cleanEmail = email && typeof email === 'string' && email.trim().length > 0 ? email.trim().toLowerCase() : null;

    if (cleanEmail) {
      const existing = await prisma.user.findFirst({
        where: { email: cleanEmail, NOT: { id } }
      });
      if (existing) {
        return res.status(400).json({ error: `Email ${cleanEmail} is already in use by another user` });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { 
        name: name && typeof name === 'string' && name.trim().length > 0 ? name.trim() : null, 
        email: cleanEmail, 
        designation: designation && typeof designation === 'string' && designation.trim().length > 0 ? designation.trim() : null 
      }
    });
    
    res.json(updatedUser);
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error?.message || 'Failed to update user' });
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

    // Resolve related Judge IDs and PasswordResetRequest IDs
    const judgeRecords = await prisma.judge.findMany({ where: { user_id: id } });
    const judgeIds = judgeRecords.map(j => j.id);

    const resetRequests = await prisma.passwordResetRequest.findMany({ where: { user_id: id } });
    const resetReqIds = resetRequests.map(r => r.id);

    // Clean up all related records in an atomic transaction
    await prisma.$transaction(async (tx) => {
      // Reassign events created by this user to the performing organizer/admin
      await tx.event.updateMany({
        where: { created_by: id },
        data: { created_by: currentUserId }
      });

      // Clear tokens generated by this admin user
      await tx.passwordResetToken.deleteMany({
        where: { created_by: id }
      });

      if (judgeIds.length > 0) {
        await tx.score.deleteMany({ where: { judge_id: { in: judgeIds } } });
        await tx.judgeAssignment.deleteMany({ where: { judge_id: { in: judgeIds } } });
        await tx.judge.deleteMany({ where: { user_id: id } });
      }

      if (resetReqIds.length > 0) {
        await tx.passwordResetToken.deleteMany({ where: { request_id: { in: resetReqIds } } });
        await tx.passwordResetRequest.deleteMany({ where: { user_id: id } });
      }

      await tx.joinRequest.deleteMany({ where: { user_id: id } });
      await tx.teamMember.deleteMany({ where: { user_id: id } });
      await tx.user.delete({ where: { id } });
    });

    res.json({ message: 'User deleted successfully', deletedId: id });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user: ' + (error?.message || String(error)) });
  }
});

export default router;
