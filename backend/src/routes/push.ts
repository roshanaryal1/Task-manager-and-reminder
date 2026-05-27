import { Router } from 'express';
import { getVapidKey, subscribe, unsubscribe } from '../controllers/pushController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/vapid-key', authenticate, getVapidKey);
router.post('/subscribe', authenticate, subscribe);
router.post('/unsubscribe', authenticate, unsubscribe);

export default router;
