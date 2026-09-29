import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from './models/db';

import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';
import inviteRoutes from './routes/invite.routes';
import userRoutes from './routes/users.routes';
import exportRoutes from './routes/export.routes';
import resetRoutes from './routes/resets.routes';
import teamRoutes from './routes/teams.routes';
import submissionRoutes from './routes/submissions.routes';
import publicRoutes from './routes/public.routes';
import organizerRoutes from './routes/organizer.routes';
import certificateRoutes from './routes/certificate.routes';
import votingRoutes from './routes/voting.routes';
import rubricRoutes from './routes/rubrics.routes';
import judgeRoutes from './routes/judge.routes';
import evaluationRoutes from './routes/evaluation.routes';

// Load environment variables
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/public/events', publicRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/resets', resetRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/rubrics', rubricRoutes);
app.use('/api/judge', judgeRoutes);
app.use('/api/evaluation', evaluationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', platform: 'HackNext' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT as number, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (0.0.0.0)`);
});
