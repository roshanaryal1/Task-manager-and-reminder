import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, X, Clock, CheckCircle } from 'lucide-react';
import { useReminderStore } from '../../stores/reminderStore';
import { useAuthStore } from '../../stores/authStore';
import { format } from 'date-fns';
import { Reminder } from '../../types';

// Play a simple beep sound using Web Audio API
const playSound = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 520;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    // Audio not available
  }
};

// Request browser notification permission and send notification
const sendBrowserNotification = (reminder: Reminder) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(reminder.title, {
      body: reminder.message || 'Your reminder is due!',
      icon: '/icons/icon-192.png',
      tag: reminder.id,
      requireInteraction: true,
    });
  }
};

export default function ReminderPopup() {
  const { activeReminders, snoozeReminder, dismissReminder } = useReminderStore();
  const { user } = useAuthStore();
  const soundEnabled = user?.settings?.soundEnabled ?? true;
  const prevCount = useRef(0);

  // Play sound and send browser notification when new reminder triggers
  useEffect(() => {
    if (activeReminders.length > prevCount.current) {
      const newest = activeReminders[activeReminders.length - 1];
      if (soundEnabled) playSound();
      sendBrowserNotification(newest);
    }
    prevCount.current = activeReminders.length;
  }, [activeReminders, soundEnabled]);

  // Request notification permission on first render
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (activeReminders.length === 0) return null;

  // Show only the most recent reminder popup; others queue behind it
  const current = activeReminders[activeReminders.length - 1];

  return (
    <AnimatePresence>
      <motion.div
        key={current.id}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]"
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-elevated border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />

          <div className="p-5">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-0.5">
                  Reminder
                </p>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-tight">
                  {current.title}
                </h3>
                {current.message && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{current.message}</p>
                )}
                {current.task && (
                  <p className="text-xs text-slate-400 mt-1">📋 {current.task.title}</p>
                )}
              </div>
              <button
                onClick={() => dismissReminder(current.id)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Time */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
              <Clock className="w-3.5 h-3.5" />
              <span>Due {format(new Date(current.remindAt), 'MMM d, h:mm a')}</span>
              {activeReminders.length > 1 && (
                <span className="ml-auto px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs">
                  +{activeReminders.length - 1} more
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {[5, 10, 30].map(mins => (
                <button
                  key={mins}
                  onClick={() => snoozeReminder(current.id, mins)}
                  className="flex-1 py-2 px-3 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                >
                  +{mins}m
                </button>
              ))}
              <button
                onClick={() => dismissReminder(current.id)}
                className="flex-1 py-2 px-3 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Done
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
