import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Sun, Moon, Bell, Volume2, Shield, User, Palette, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';
import { useUIStore } from '../stores/uiStore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const { register: rProfile, handleSubmit: hsProfile } = useForm({
    defaultValues: { name: user?.name ?? '', timezone: user?.timezone ?? 'UTC' },
  });

  const { register: rSettings, handleSubmit: hsSettings } = useForm({
    defaultValues: {
      soundEnabled: user?.settings?.soundEnabled ?? true,
      browserNotifications: user?.settings?.browserNotifications ?? true,
      reminderLeadMinutes: user?.settings?.reminderLeadMinutes ?? 5,
      pomodoroWorkMinutes: user?.settings?.pomodoroWorkMinutes ?? 25,
      pomodoroBreakMinutes: user?.settings?.pomodoroBreakMinutes ?? 5,
    },
  });

  const saveProfile = async (data: { name: string; timezone: string }) => {
    setSavingProfile(true);
    try {
      const updated = await authService.updateProfile(data);
      updateUser(updated);
      toast.success('Profile updated');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveSettings = async (data: object) => {
    setSavingSettings(true);
    try {
      const updated = await authService.updateSettings(data as Parameters<typeof authService.updateSettings>[0]);
      updateUser({ settings: updated } as Parameters<typeof updateUser>[0]);
      toast.success('Settings saved');
    } finally {
      setSavingSettings(false);
    }
  };

  const requestNotifPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      toast.success(permission === 'granted' ? 'Notifications enabled!' : 'Permission denied');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Profile</h2>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {user?.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={hsProfile(saveProfile)} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input {...rProfile('name')} className="input" />
          </div>
          <div>
            <label className="label">Timezone</label>
            <select {...rProfile('timezone')} className="input">
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Kolkata">India (IST)</option>
              <option value="Australia/Sydney">Sydney (AEDT)</option>
            </select>
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary">
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save profile'}
          </button>
        </form>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Palette className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Appearance</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Theme</p>
            <p className="text-xs text-slate-500 mt-0.5">Currently: {theme === 'dark' ? 'Dark' : 'Light'} mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform flex items-center justify-center shadow
              ${theme === 'dark' ? 'translate-x-8' : 'translate-x-1'}`}>
              {theme === 'dark' ? <Moon className="w-3 h-3 text-indigo-600" /> : <Sun className="w-3 h-3 text-slate-400" />}
            </div>
          </button>
        </div>
      </motion.div>

      {/* Notifications & Pomodoro */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Notifications & Timer</h2>
        </div>

        <form onSubmit={hsSettings(saveSettings)} className="space-y-5">
          {/* Toggles */}
          {[
            { name: 'soundEnabled', label: 'Sound alerts', desc: 'Play sound when reminders trigger' },
            { name: 'browserNotifications', label: 'Browser notifications', desc: 'Show OS-level notifications' },
          ].map(item => (
            <div key={item.name} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <input {...rSettings(item.name as 'soundEnabled' | 'browserNotifications')} type="checkbox" className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
            </div>
          ))}

          <div>
            <label className="label">Reminder lead time (minutes)</label>
            <input {...rSettings('reminderLeadMinutes', { valueAsNumber: true })} type="number" min={0} max={60} className="input w-24" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Pomodoro work (min)</label>
              <input {...rSettings('pomodoroWorkMinutes', { valueAsNumber: true })} type="number" min={1} max={90} className="input" />
            </div>
            <div>
              <label className="label">Pomodoro break (min)</label>
              <input {...rSettings('pomodoroBreakMinutes', { valueAsNumber: true })} type="number" min={1} max={30} className="input" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={savingSettings} className="btn-primary">
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save settings'}
            </button>
            <button type="button" onClick={requestNotifPermission} className="btn-secondary">
              <Bell className="w-4 h-4" /> Request permission
            </button>
          </div>
        </form>
      </motion.div>

      {/* Account */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Account</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</p>
        <p className="text-xs text-slate-400">
          To change your password, use the API endpoint <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">PATCH /api/auth/password</code>
        </p>
      </motion.div>
    </div>
  );
}
