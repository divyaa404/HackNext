import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../models/db';

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    const targetRole = role || 'participant';

    if (targetRole === 'participant') {
      const eventCount = await prisma.event.count();
      if (eventCount === 0) {
        return res.status(400).json({ 
          error: 'Registration is not open yet because no hackathon event has been created by the organizer.' 
        });
      }
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        role: targetRole
      }
    });
    
    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, staff_id } = req.body;
    
    // Find by either email (participants) or staff_id (organizers/admins/judges)
    const orConditions: any[] = [];
    if (email) orConditions.push({ email });
    if (staff_id) orConditions.push({ staff_id });

    if (orConditions.length === 0) {
      return res.status(400).json({ error: 'Email or Staff ID required' });
    }

    const user = await prisma.user.findFirst({ 
      where: { OR: orConditions } 
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    let isMatch = await bcrypt.compare(password, user.password_hash);

    // If standard password fails, check if input matches their active temporary passkey
    if (!isMatch && user.temp_pass_key) {
      const inputPass = String(password).trim();
      if (inputPass === user.temp_pass_key || inputPass.toUpperCase() === user.temp_pass_key.toUpperCase()) {
        isMatch = true;
      }
    }
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Generate new session ID to invalidate old logins
    const crypto = require('crypto');
    const sessionId = crypto.randomUUID();

    await prisma.user.update({
      where: { id: user.id },
      data: { current_session_id: sessionId }
    });
    
    const token = jwt.sign({ id: user.id, role: user.role, sessionId }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
    
    res.json({ token, user: { id: user.id, email: user.email, staff_id: user.staff_id, role: user.role, must_change_password: user.must_change_password } });
  } catch (error) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Server error: ' + message });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    // req.user is set by the requireAuth middleware
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      id: user.id, 
      email: user.email, 
      staff_id: user.staff_id,
      role: user.role, 
      must_change_password: user.must_change_password,
      name: user.name,
      college: user.college,
      year: user.year,
      branch: user.branch,
      gender: user.gender,
      dob: user.dob,
      phone: user.phone,
      city: user.city,
      bio: (user as any).bio,
      github_url: (user as any).github_url,
      linkedin_url: (user as any).linkedin_url,
      instagram_url: (user as any).instagram_url,
      portfolio_url: (user as any).portfolio_url
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password_hash,
        temp_pass_key: null,
        must_change_password: false,
      }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: 'Please enter your registered email address or Staff ID.' });
    }

    const cleanInput = String(email).trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanInput, mode: 'insensitive' } },
          { staff_id: { equals: cleanInput, mode: 'insensitive' } }
        ]
      }
    });
    
    if (user) {
      // Check if there is already an active PENDING or PASSKEY_GENERATED request
      const existingReq = await prisma.passwordResetRequest.findFirst({
        where: {
          user_id: user.id,
          status: { in: ['PENDING', 'PASSKEY_GENERATED'] }
        },
        orderBy: { requested_at: 'desc' }
      });

      if (!existingReq) {
        await prisma.passwordResetRequest.create({
          data: {
            user_id: user.id,
            status: 'PENDING'
          }
        });
      }
    }

    // Generic friendly response to prevent enumeration while confirming creation
    res.json({ 
      message: 'Password reset request submitted successfully! If an account exists, your request is now queued. Please contact your hackathon organizer to receive your temporary reset passkey.' 
    });
  } catch (error: any) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ error: error?.message || 'Failed to submit password reset request. Please try again.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { passkey, newPassword, email } = req.body;
    
    if (!passkey || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Please enter a valid passkey and a new password (min 6 characters).' });
    }

    const cleanPasskey = String(passkey).trim();
    const upperPasskey = cleanPasskey.toUpperCase();
    const crypto = require('crypto');

    // Hash the incoming passkey to compare with the database (both raw & uppercase)
    const hashUpper = crypto.createHash('sha256').update(upperPasskey).digest('hex');
    const hashRaw = crypto.createHash('sha256').update(cleanPasskey).digest('hex');

    let token = await prisma.passwordResetToken.findFirst({
      where: {
        token_hash: { in: [hashUpper, hashRaw] },
        used_at: null,
        expires_at: { gt: new Date() }
      },
      include: {
        request: true
      }
    });

    let targetUserId = token ? token.user_id : null;

    // Fallback: check if any user has this temp_pass_key directly
    if (!targetUserId) {
      const userWithTempKey = await prisma.user.findFirst({
        where: {
          OR: [
            { temp_pass_key: cleanPasskey },
            { temp_pass_key: upperPasskey }
          ]
        }
      });
      if (userWithTempKey) {
        targetUserId = userWithTempKey.id;
      }
    }

    // Fallback 2: check if email was supplied and matches
    if (!targetUserId && email) {
      const cleanEmail = String(email).trim().toLowerCase();
      const userByEmail = await prisma.user.findFirst({
        where: { email: { equals: cleanEmail, mode: 'insensitive' } }
      });
      if (userByEmail && (userByEmail.temp_pass_key === cleanPasskey || userByEmail.temp_pass_key === upperPasskey)) {
        targetUserId = userByEmail.id;
      }
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'Invalid or expired passkey. Please ensure you have entered the exact code provided by your event organizer.' });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Update user password and invalidate sessions
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        password_hash,
        temp_pass_key: null,
        must_change_password: false,
        current_session_id: crypto.randomUUID() // invalidate old sessions
      }
    });

    // Mark token as used if token existed
    if (token) {
      await prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { used_at: new Date() }
      });

      if (token.request_id) {
        await prisma.passwordResetRequest.update({
          where: { id: token.request_id },
          data: { status: 'RESOLVED', resolved_at: new Date() }
        });
      }
    } else {
      // Resolve any pending requests for this user
      await prisma.passwordResetRequest.updateMany({
        where: { user_id: targetUserId, status: { in: ['PENDING', 'PASSKEY_GENERATED'] } },
        data: { status: 'RESOLVED', resolved_at: new Date() }
      });
    }

    res.json({ message: 'Password reset successfully! You can now log in with your new password.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getSetupStatus = async (req: Request, res: Response) => {
  try {
    const count = await prisma.user.count({
      where: { role: { in: ['organizer', 'admin'] } }
    });
    res.json({ isSetupRequired: count === 0, organizerCount: count });
  } catch (error) {
    console.error('Setup status check error:', error);
    res.status(500).json({ error: 'Server error checking setup status' });
  }
};

export const firstTimeSetup = async (req: Request, res: Response) => {
  try {
    const existingCount = await prisma.user.count({
      where: { role: { in: ['organizer', 'admin'] } }
    });

    if (existingCount > 0) {
      return res.status(403).json({ error: 'First-time setup has already been completed. An organizer account exists.' });
    }

    const { name, email, password, orgName } = req.body;
    const crypto = require('crypto');
    const finalPassword = password && password.trim().length >= 6 ? password.trim() : crypto.randomBytes(6).toString('hex');
    const finalStaffId = 'ORG-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(finalPassword, salt);
    const sessionId = crypto.randomUUID();

    const orgClean = orgName ? orgName.toLowerCase().replace(/[^a-z0-9]/g, '') : 'hackathon';
    const finalEmail = email && email.trim() ? email.trim() : `organizer@${orgClean || 'hackathon'}.local`;

    const user = await prisma.user.create({
      data: {
        staff_id: finalStaffId,
        email: finalEmail,
        name: name && name.trim() ? name.trim() : 'Lead Organizer',
        college: orgName && orgName.trim() ? orgName.trim() : 'Hackathon Org',
        password_hash,
        role: 'organizer',
        must_change_password: false,
        current_session_id: sessionId
      }
    });

    const jwtSecret = process.env.JWT_SECRET || 'dev_secret_key_change_in_production';
    const token = jwt.sign({ id: user.id, role: user.role, sessionId }, jwtSecret, { expiresIn: '7d' });

    res.status(201).json({
      message: 'First organizer account created successfully',
      staff_id: finalStaffId,
      email: user.email,
      password: finalPassword,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        staff_id: user.staff_id,
        role: user.role,
        must_change_password: false
      }
    });
  } catch (error: any) {
    console.error('First time setup error:', error);
    res.status(500).json({ error: error?.message || 'Failed to complete first-time organizer setup' });
  }
};

