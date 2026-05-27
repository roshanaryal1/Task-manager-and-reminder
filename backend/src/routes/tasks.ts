import { Router } from 'express';
import {
  getTasks, getTask, createTask, updateTask, deleteTask,
  reorderTasks, bulkUpdateTasks,
} from '../controllers/taskController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.patch('/reorder', reorderTasks);
router.patch('/bulk', bulkUpdateTasks);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
