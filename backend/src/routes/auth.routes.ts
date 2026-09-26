import express from 'express';
import { signup, login, me, changePassword, forgotPassword, resetPassword, getSetupStatus, firstTimeSetup } from '../auth/authController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.get('/setup-status', getSetupStatus);
router.post('/first-time-setup', firstTimeSetup);

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', requireAuth, me);
router.post('/change-password', requireAuth, changePassword);

export default router;
