import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all password reset requests
router.get('/', requireAuth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const requests = await prisma.passwordResetRequest.findMany({
      include: {
        user: { select: { email: true, name: true, role: true } },
        tokens: { select: { expires_at: true, used_at: true, created_by: true } }
      },
      orderBy: { requested_at: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reset requests' });
  }
});

// Generate a passkey for a specific request
router.post('/:id/generate', requireAuth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user.id;

    const request = await prisma.passwordResetRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    // Generate random passkey
    const rawPasskey = `RST-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const tokenHash = crypto.createHash('sha256').update(rawPasskey.trim().toUpperCase()).digest('hex');

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    await prisma.$transaction([
      prisma.passwordResetToken.create({
        data: {
          request_id: id,
          user_id: request.user_id,
          token_hash: tokenHash,
          expires_at: expiresAt,
          created_by: adminId
        }
      }),
      prisma.passwordResetRequest.update({
        where: { id },
        data: { status: 'PASSKEY_GENERATED' }
      }),
      prisma.user.update({
        where: { id: request.user_id },
        data: {
          temp_pass_key: rawPasskey,
          must_change_password: true
        }
      })
    ]);

    // Return the raw passkey EXACTLY ONCE to the admin
    res.json({ message: 'Passkey generated successfully', passkey: rawPasskey, expiresAt: expiresAt });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate passkey' });
  }
});

// Cancel a request
router.post('/:id/cancel', requireAuth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Invalidate tokens
    await prisma.passwordResetToken.updateMany({
      where: { request_id: id, used_at: null },
      data: { expires_at: new Date() }
    });

    const request = await prisma.passwordResetRequest.update({
      where: { id },
      data: { status: 'CANCELLED', resolved_at: new Date() }
    });

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to cancel request' });
  }
});

export default router;
