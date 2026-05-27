import { Router } from 'express';
import {
  getReminders, createReminder, updateReminder, deleteReminder,
  snoozeReminder, dismissReminder, getPendingReminders,
} from '../controllers/reminderController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getReminders);
router.get('/pending', getPendingReminders);
router.post('/', createReminder);
router.patch('/:id', updateReminder);
router.post('/:id/snooze', snoozeReminder);
router.post('/:id/dismiss', dismissReminder);
router.delete('/:id', deleteReminder);

export default router;
