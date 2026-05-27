import { Router } from 'express';
import { getDashboardStats, getWeeklyProgress, getProductivityScore } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/weekly', getWeeklyProgress);
router.get('/productivity', getProductivityScore);

export default router;
