import { Router } from 'express';
import { signup, login, getMe, updateProfile, updateSettings, changePassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);
router.patch('/settings', authenticate, updateSettings);
router.patch('/password', authenticate, changePassword);

export default router;
