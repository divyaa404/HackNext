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

// Load both backend/.env and root .env for maximum portability
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();

app.use(cors());
app.use(express.json());
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const checkAndInitOrganizer = async () => {
  try {
    const count = await prisma.user.count({
      where: { role: { in: ['organizer', 'admin'] } }
    });

    if (count === 0) {
      const email = process.env.INITIAL_ORGANIZER_EMAIL?.trim();
      const password = process.env.INITIAL_ORGANIZER_PASSWORD?.trim();
      const name = process.env.INITIAL_ORGANIZER_NAME?.trim() || 'Root Organizer';
      const orgName = process.env.INITIAL_ORG_NAME?.trim() || 'HackNext Platform';

      if (email && password) {
        const staff_id = 'ORG-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        await prisma.user.create({
          data: {
            staff_id,
            email,
            name,
            college: orgName,
            password_hash,
            role: 'organizer',
            must_change_password: false
          }
        });
        console.log(`\n[HackNext Setup] Created initial Root Organizer (${staff_id} / ${email}) from environment variables.`);
      } else {
        console.log('\n[HackNext Setup] No organizer account detected. Complete first-run setup at /setup in your browser or run setup.sh.');
      }
    }
  } catch (err) {
    console.warn('[HackNext Setup] Could not verify organizer setup status on startup:', err);
  }
};

const PORT = process.env.PORT || 4000;
app.listen(PORT as number, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT} (0.0.0.0)`);
  await checkAndInitOrganizer();
});


