import { prisma } from '../utils/prisma';
import { sendPushToUser } from '../controllers/pushController';

// Polls every 30 seconds for due reminders — fires push notifications server-side
// The frontend also polls /api/reminders/pending every 10s for the popup modal
export const startReminderScheduler = () => {
  console.log('⏰ Reminder scheduler started');

  setInterval(async () => {
    try {
      const now = new Date();

      // Find all pending/snoozed reminders that are due
      const dueReminders = await prisma.reminder.findMany({
        where: {
          status: { in: ['PENDING', 'SNOOZED'] },
          remindAt: { lte: now },
        },
        include: {
          user: { select: { id: true, name: true } },
          task: { select: { id: true, title: true } },
        },
      });

      if (dueReminders.length === 0) return;

      // Mark as triggered
      await prisma.reminder.updateMany({
        where: { id: { in: dueReminders.map(r => r.id) } },
        data: { status: 'TRIGGERED', triggeredAt: now },
      });

      // Send push notification + create in-app notification for each
      for (const reminder of dueReminders) {
        const payload = {
          title: reminder.title,
          body: reminder.message || reminder.task?.title || 'Time to check your task!',
          tag: reminder.id,
          data: { reminderId: reminder.id, taskId: reminder.taskId },
        };

        await Promise.all([
          sendPushToUser(reminder.userId, payload),
          prisma.notification.create({
            data: {
              userId: reminder.userId,
              type: 'REMINDER',
              title: reminder.title,
              message: reminder.message || 'Your reminder is due.',
              data: { reminderId: reminder.id, taskId: reminder.taskId },
            },
          }),
        ]);
      }

      console.log(`⏰ Triggered ${dueReminders.length} reminder(s)`);
    } catch (err) {
      console.error('Reminder scheduler error:', err);
    }
  }, 30_000); // every 30 seconds

  // Also check for overdue tasks every 5 minutes
  setInterval(async () => {
    try {
      const now = new Date();
      const overdueTasksWithoutNotification = await prisma.task.findMany({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lt: now },
          // Only notify once per task by checking if an overdue notification exists
        },
        select: { id: true, userId: true, title: true },
        take: 50,
      });

      for (const task of overdueTasksWithoutNotification) {
        const exists = await prisma.notification.findFirst({
          where: {
            userId: task.userId,
            type: 'TASK_OVERDUE',
            data: { path: ['taskId'], equals: task.id },
          },
        });

        if (!exists) {
          await prisma.notification.create({
            data: {
              userId: task.userId,
              type: 'TASK_OVERDUE',
              title: 'Task overdue',
              message: `"${task.title}" is overdue.`,
              data: { taskId: task.id },
            },
          });
        }
      }
    } catch (err) {
      console.error('Overdue task check error:', err);
    }
  }, 5 * 60_000);
};
