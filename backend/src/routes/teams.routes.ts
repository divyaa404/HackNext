import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { requireAuth, requireRole } from '../middleware/auth';
import { checkRegistrationStatus } from '../utils/timeline';

const router = express.Router();
const prisma = new PrismaClient();

const generateInviteCode = () => {
  // 6-digit uppercase alphanumeric
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Helper to check profile completion
const isProfileComplete = (user: any) => {
  return user.name && user.college && user.year && user.branch && user.gender && user.dob && user.phone && user.city;
};

// Create a team
router.post('/create', requireAuth, requireRole('participant'), async (req, res) => {
  try {
    let { name, event_id } = req.body;
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!isProfileComplete(user)) {
      return res.status(400).json({ error: 'Please complete your profile first.', requiresProfile: true });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Team name is required.' });
    }

    // Resolve event_id if missing or invalid
    let validEvent = null;
    if (event_id) {
      validEvent = await prisma.event.findUnique({ 
        where: { id: event_id },
        include: { timeline_items: { orderBy: { sort_order: 'asc' } } }
      });
    }

    if (!validEvent) {
      validEvent = await prisma.event.findFirst({
        orderBy: { start_date: 'desc' },
        include: { timeline_items: { orderBy: { sort_order: 'asc' } } }
      });
    }

    if (!validEvent) {
      return res.status(400).json({ 
        error: 'No active hackathon event found. An organizer must create an event before teams can be formed.' 
      });
    }

    event_id = validEvent.id;

    // Check if user is ALREADY in a team (or leader of a team) for this event
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        user_id: userId,
        team: { event_id }
      },
      include: { team: true }
    });

    if (existingMembership) {
      return res.status(400).json({
        error: `You are already part of team "${existingMembership.team.name}". A participant cannot create or join multiple teams in the same event.`
      });
    }

    // Validate Registration Timeline
    const regStatus = checkRegistrationStatus(validEvent);
    if (!regStatus.isOpen) {
      return res.status(403).json({ 
        error: regStatus.message || (regStatus.isNotOpenYet ? 'Registration has not started yet.' : 'Registration has closed for this event.'),
        code: regStatus.isNotOpenYet ? 'REGISTRATION_NOT_OPEN' : 'REGISTRATION_CLOSED',
        opensAt: regStatus.opensAt,
        closesAt: regStatus.closesAt
      });
    }

    let invite_code = generateInviteCode();
    // Ensure unique 6-digit code
    while (await prisma.team.findUnique({ where: { invite_code } })) {
      invite_code = generateInviteCode();
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        event_id,
        invite_code,
        members: {
          create: {
            user_id: userId
          }
        }
      },
      include: { members: true }
    });

    res.json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Join a team
router.post('/join', requireAuth, requireRole('participant'), async (req, res) => {
  try {
    const { invite_code } = req.body;
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!isProfileComplete(user)) {
      return res.status(400).json({ error: 'Please complete your profile first.', requiresProfile: true });
    }

    if (!invite_code || invite_code.length !== 6) {
      return res.status(400).json({ error: 'Invalid 6-digit invite code' });
    }

    const team = await prisma.team.findUnique({ 
      where: { invite_code: invite_code.toUpperCase() },
      include: { 
        members: true,
        event: { include: { timeline_items: { orderBy: { sort_order: 'asc' } } } } 
      }
    });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check registration timeline
    if (team.event) {
      const regStatus = checkRegistrationStatus(team.event);
      if (!regStatus.isOpen) {
        return res.status(403).json({ 
          error: regStatus.message || (regStatus.isNotOpenYet ? 'Registration has not started yet.' : 'Registration has closed for this event.'),
          code: regStatus.isNotOpenYet ? 'REGISTRATION_NOT_OPEN' : 'REGISTRATION_CLOSED',
          opensAt: regStatus.opensAt,
          closesAt: regStatus.closesAt
        });
      }
    }

    // Check if user is ALREADY in a team (or leader of a team) for this event
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        user_id: userId,
        team: { event_id: team.event_id }
      },
      include: { team: true }
    });

    if (existingMembership) {
      if (existingMembership.team_id === team.id) {
        return res.status(400).json({ error: 'You are already a member of this team.' });
      }
      return res.status(400).json({ 
        error: `You are already part of team "${existingMembership.team.name}". A participant cannot join multiple teams in the same event.` 
      });
    }

    // Check max team capacity
    const maxMembers = team.event?.team_size_max || 4;
    if (team.members.length >= maxMembers) {
      return res.status(400).json({ error: `This team is already full (maximum ${maxMembers} members allowed).` });
    }

    await prisma.teamMember.create({
      data: {
        team_id: team.id,
        user_id: userId
      }
    });

    res.json({ message: 'Joined team successfully', team_id: team.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to join team' });
  }
});

// Get user's teams
router.get('/my-teams', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: { user_id: userId }
        }
      },
      include: {
        event: { 
          select: { 
            name: true, 
            start_date: true, 
            end_date: true,
            timeline_items: { orderBy: { sort_order: 'asc' } }
          } 
        },
        members: {
          include: { user: { select: { name: true, email: true } } }
        }
      }
    });
    res.json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// ─────────────────────────────────────────
// Get MY single team (for TeamDetails page)
// ─────────────────────────────────────────
router.get('/my-team', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const team = await prisma.team.findFirst({
      where: {
        members: { some: { user_id: userId } }
      },
      include: {
        event: { 
          select: { 
            id: true, 
            name: true, 
            team_size_min: true, 
            team_size_max: true, 
            mode: true,
            start_date: true,
            end_date: true,
            timeline_items: { orderBy: { sort_order: 'asc' } }
          } 
        },
        members: {
          include: {
            user: true
          }
        },
        submissions: {
          select: { id: true, title: true, status: true, submitted_at: true, pdf_url: true, repo_url: true, demo_video_url: true }
        }
      }
    });

    res.json(team || null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Get all teams for view teams page
router.get('/all', requireAuth, async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        event: {
          select: {
            id: true,
            name: true,
            team_size_min: true,
            team_size_max: true,
            start_date: true,
            end_date: true,
            timeline_items: { orderBy: { sort_order: 'asc' } }
          }
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      },
      orderBy: { id: 'desc' }
    });
    res.json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch all teams' });
  }
});

// Request to join a team
router.post('/request-join', requireAuth, requireRole('participant'), async (req, res) => {
  try {
    const { team_id } = req.body;
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!isProfileComplete(user)) {
      return res.status(400).json({ error: 'Please complete your profile first.', requiresProfile: true });
    }

    const team = await prisma.team.findUnique({ 
      where: { id: team_id },
      include: { 
        members: true,
        event: { include: { timeline_items: { orderBy: { sort_order: 'asc' } } } } 
      }
    });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Timeline validation
    if (team.event) {
      const regStatus = checkRegistrationStatus(team.event);
      if (!regStatus.isOpen) {
        return res.status(403).json({ 
          error: regStatus.message || (regStatus.isNotOpenYet ? 'Registration has not started yet.' : 'Registration has closed for this event.'),
          code: regStatus.isNotOpenYet ? 'REGISTRATION_NOT_OPEN' : 'REGISTRATION_CLOSED',
          opensAt: regStatus.opensAt,
          closesAt: regStatus.closesAt
        });
      }
    }

    // Check if user is ALREADY in a team for this event
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        user_id: userId,
        team: { event_id: team.event_id }
      },
      include: { team: true }
    });

    if (existingMembership) {
      if (existingMembership.team_id === team.id) {
        return res.status(400).json({ error: 'You are already a member of this team.' });
      }
      return res.status(400).json({ 
        error: `You are already part of team "${existingMembership.team.name}". A participant cannot join multiple teams in the same event.` 
      });
    }

    // Check max team capacity
    const maxMembers = team.event?.team_size_max || 4;
    if (team.members.length >= maxMembers) {
      return res.status(400).json({ error: `This team is already full (maximum ${maxMembers} members allowed).` });
    }

    // Check if already requested
    const existingReq = await prisma.joinRequest.findUnique({
      where: { user_id_team_id: { user_id: userId, team_id } }
    });
    if (existingReq && existingReq.status === 'PENDING') {
      return res.status(400).json({ error: 'Join request already pending' });
    }

    await prisma.joinRequest.upsert({
      where: { user_id_team_id: { user_id: userId, team_id } },
      update: { status: 'PENDING' },
      create: { user_id: userId, team_id, status: 'PENDING' }
    });

    res.json({ message: 'Request sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// Get team's join requests
router.get('/join-requests', requireAuth, requireRole('participant'), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    // Find team where user is leader
    const team = await prisma.team.findFirst({
      where: { members: { some: { user_id: userId } } },
      include: { members: { orderBy: { id: 'asc' } } }
    });
    if (!team) return res.json([]);
    if (team.members[0].user_id !== userId) return res.json([]); // Only leader

    const requests = await prisma.joinRequest.findMany({
      where: { team_id: team.id, status: 'PENDING' },
      include: { user: { select: { id: true, name: true, email: true, college: true } } }
    });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get requests' });
  }
});

// Accept join request
router.post('/join-requests/:id/accept', requireAuth, requireRole('participant'), async (req, res) => {
  try {
    const reqId = req.params.id;
    const userId = (req as any).user.id;

    const joinReq = await prisma.joinRequest.findUnique({ 
      where: { id: reqId }, 
      include: { 
        team: { 
          include: { 
            members: { orderBy: { id: 'asc' } },
            event: { include: { timeline_items: { orderBy: { sort_order: 'asc' } } } }
          } 
        } 
      } 
    });
    if (!joinReq) return res.status(404).json({ error: 'Request not found' });

    if (joinReq.team.members[0].user_id !== userId) return res.status(403).json({ error: 'Only leader can accept' });
    
    const maxMembers = joinReq.team.event?.team_size_max || 4;
    if (joinReq.team.members.length >= maxMembers) return res.status(400).json({ error: `Team is full (maximum ${maxMembers} members allowed).` });

    // Check if candidate is already in any team for this event
    const candidateMembership = await prisma.teamMember.findFirst({
      where: {
        user_id: joinReq.user_id,
        team: { event_id: joinReq.team.event_id }
      },
      include: { team: true }
    });

    if (candidateMembership) {
      await prisma.joinRequest.update({ where: { id: reqId }, data: { status: 'REJECTED' } });
      return res.status(400).json({ error: `This participant has already joined team "${candidateMembership.team.name}".` });
    }

    // Timeline validation
    if (joinReq.team.event) {
      const regStatus = checkRegistrationStatus(joinReq.team.event);
      if (!regStatus.isOpen) {
        return res.status(403).json({ 
          error: regStatus.message || (regStatus.isNotOpenYet ? 'Registration has not started yet.' : 'Registration has closed for this event.'),
          code: regStatus.isNotOpenYet ? 'REGISTRATION_NOT_OPEN' : 'REGISTRATION_CLOSED',
          opensAt: regStatus.opensAt,
          closesAt: regStatus.closesAt
        });
      }
    }

    await prisma.$transaction([
      prisma.joinRequest.update({ where: { id: reqId }, data: { status: 'ACCEPTED' } }),
      prisma.teamMember.create({ data: { user_id: joinReq.user_id, team_id: joinReq.team_id } })
    ]);
    res.json({ message: 'Accepted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to accept' });
  }
});

// Reject join request
router.post('/join-requests/:id/reject', requireAuth, requireRole('participant'), async (req, res) => {
  try {
    const reqId = req.params.id;
    const userId = (req as any).user.id;

    const joinReq = await prisma.joinRequest.findUnique({ where: { id: reqId }, include: { team: { include: { members: { orderBy: { id: 'asc' } } } } } });
    if (!joinReq) return res.status(404).json({ error: 'Request not found' });
    if (joinReq.team.members[0].user_id !== userId) return res.status(403).json({ error: 'Only leader can reject' });

    await prisma.joinRequest.update({ where: { id: reqId }, data: { status: 'REJECTED' } });
    res.json({ message: 'Rejected successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject' });
  }
});

// Delete team (Leader or Organizer/Admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: { orderBy: { id: 'asc' } }
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const isLeader = team.members.length > 0 && team.members[0].user_id === userId;
    const isPrivileged = userRole === 'organizer' || userRole === 'admin';

    if (!isLeader && !isPrivileged) {
      return res.status(403).json({ error: 'Only the team leader can delete this team.' });
    }

    await prisma.team.delete({
      where: { id: teamId }
    });

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

export default router;