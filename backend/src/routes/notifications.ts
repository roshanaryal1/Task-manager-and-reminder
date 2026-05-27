import { Router } from 'express';
import { getNotifications, markRead, deleteNotification, clearAll } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getNotifications);
router.patch('/read', markRead);
router.delete('/clear', clearAll);
router.delete('/:id', deleteNotification);

export default router;
