import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Clock, Trash2, Moon, Check, X } from 'lucide-react';
import { useReminderStore } from '../stores/reminderStore';
import { format, formatDistanceToNow, isPast } from 'date-fns';

export default function RemindersPage() {
  const { reminders, isLoading, fetchReminders, createReminder, deleteReminder, snoozeReminder, dismissReminder } = useReminderStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', remindAt: '' });

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.remindAt) return;
    await createReminder({ ...form, remindAt: new Date(form.remindAt).toISOString() });
    setForm({ title: '', message: '', remindAt: '' });
    setShowForm(false);
  };

  const upcoming = reminders.filter(r => !isPast(new Date(r.remindAt)));
  const past = reminders.filter(r => isPast(new Date(r.remindAt)));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reminders</h1>
          <p className="text-sm text-slate-500 mt-0.5">{reminders.length} active reminder{reminders.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Reminder
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreate} className="card p-5 space-y-4">
              <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" /> Set a Reminder
              </h3>
              <input
                type="text"
                placeholder="Reminder title..."
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="input"
                required
              />
              <input
                type="text"
                placeholder="Optional message..."
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className="input"
              />
              <input
                type="datetime-local"
                value={form.remindAt}
                onChange={e => setForm(f => ({ ...f, remindAt: e.target.value }))}
                className="input"
                required
                min={new Date().toISOString().slice(0, 16)}
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Save Reminder</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
        </div>
      ) : reminders.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-slate-400">
          <Bell className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium text-slate-600 dark:text-slate-400">No reminders</p>
          <p className="text-sm mt-1">Add a reminder to never miss a deadline</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Upcoming</h2>
              <div className="space-y-3">
                <AnimatePresence>
                  {upcoming.map(r => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="card p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                          <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-white">{r.title}</p>
                          {r.message && <p className="text-sm text-slate-500 mt-0.5">{r.message}</p>}
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs text-slate-500">
                              {format(new Date(r.remindAt), 'MMM d, yyyy · h:mm a')}
                            </span>
                            <span className="text-xs text-indigo-500 font-medium">
                              ({formatDistanceToNow(new Date(r.remindAt), { addSuffix: true })})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => snoozeReminder(r.id, 10)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                            title="Snooze 10 min"
                          >
                            <Moon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => dismissReminder(r.id)}
                            className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"
                            title="Dismiss"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteReminder(r.id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
