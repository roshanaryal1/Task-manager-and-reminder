import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { useReminderStore } from './stores/reminderStore';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import RemindersPage from './pages/RemindersPage';
import CalendarPage from './pages/CalendarPage';
import KanbanPage from './pages/KanbanPage';
import SettingsPage from './pages/SettingsPage';
import PomodoroPage from './pages/PomodoroPage';

// Layout
import AppLayout from './components/layout/AppLayout';
import ReminderPopup from './components/reminders/ReminderPopup';

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

export default function App() {
  const { token, fetchMe } = useAuthStore();
  const { theme } = useUIStore();
  const { checkPendingReminders } = useReminderStore();

  // Rehydrate user on app load
  useEffect(() => {
    if (token) fetchMe();
  }, [token, fetchMe]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Poll for due reminders every 10 seconds
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(checkPendingReminders, 10_000);
    return () => clearInterval(interval);
  }, [token, checkPendingReminders]);

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected app routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="reminders" element={<RemindersPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="pomodoro" element={<PomodoroPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Global reminder popup overlay */}
      <ReminderPopup />
    </>
  );
}
