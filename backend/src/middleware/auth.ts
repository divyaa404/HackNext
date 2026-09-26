import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    
    // Check if user exists and session is valid
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Concurrent login check: enforce single active session
    if (['organizer', 'admin', 'judge'].includes(user.role)) {
      if (user.current_session_id && user.current_session_id !== decoded.sessionId) {
        return res.status(401).json({ error: 'SESSION_INVALIDATED', message: 'You have been logged out because a new login was detected on another device.' });
      }
    }

    // Force password change on first login/reset
    // We must allow /change-password AND /me so the frontend can fetch the user object to see the flag!
    if (user.must_change_password && !req.originalUrl.includes('/change-password') && !req.originalUrl.includes('/me')) {
      return res.status(403).json({ error: 'MUST_CHANGE_PASSWORD', message: 'You must change your temporary password before accessing the system.' });
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient role' });
    }
    next();
  };
};
