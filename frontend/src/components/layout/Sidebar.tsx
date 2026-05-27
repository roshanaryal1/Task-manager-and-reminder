import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CheckSquare, Bell, Calendar, Columns2,
  Timer, Settings, LogOut, Zap, ChevronLeft,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/kanban', icon: Columns2, label: 'Kanban' },
  { to: '/pomodoro', icon: Timer, label: 'Pomodoro' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const location = useLocation();

  return (
    <AnimatePresence>
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex-shrink-0 h-screen flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-20 overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-bold text-slate-900 dark:text-white text-lg whitespace-nowrap"
                >
                  TaskFlow
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors flex-shrink-0"
          >
            <motion.div animate={{ rotate: sidebarOpen ? 0 : 180 }}>
              <ChevronLeft className="w-4 h-4" />
            </motion.div>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                  ${active
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-2 space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`
            }
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Settings</span>}
          </NavLink>

          {/* User avatar */}
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                {user?.name?.[0]?.toUpperCase()}
              </span>
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {sidebarOpen && (
              <button
                onClick={logout}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
