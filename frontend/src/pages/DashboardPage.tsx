import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Clock, AlertCircle, TrendingUp, Zap,
  BarChart3, Target,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { analyticsService } from '../services/analyticsService';
import { DashboardStats, WeeklyProgress, ProductivityScore } from '../types';
import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#10b981',
  MEDIUM: '#3b82f6',
  HIGH: '#f59e0b',
  URGENT: '#ef4444',
};

const StatCard = ({
  label, value, icon: Icon, color, sub
}: {
  label: string; value: number | string; icon: React.ElementType;
  color: string; sub?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="card p-5"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{value}</p>
    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </motion.div>
);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weekly, setWeekly] = useState<WeeklyProgress[]>([]);
  const [productivity, setProductivity] = useState<ProductivityScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsService.getStats(),
      analyticsService.getWeekly(),
      analyticsService.getProductivity(),
    ]).then(([s, w, p]) => {
      setStats(s);
      setWeekly(w);
      setProductivity(p);
      setLoading(false);
    });
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} · Here's your productivity overview
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-32 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : stats && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Tasks" value={stats.total}
              icon={BarChart3} color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
              sub={`${stats.thisWeekCompleted} done this week`}
            />
            <StatCard
              label="Completed" value={stats.completed}
              icon={CheckCircle2} color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              sub={`${stats.completionRate}% completion rate`}
            />
            <StatCard
              label="In Progress" value={stats.inProgress}
              icon={Clock} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              sub={`${stats.pending} pending`}
            />
            <StatCard
              label="Overdue" value={stats.overdue}
              icon={AlertCircle} color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              sub="Need attention"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly area chart */}
            <div className="card p-5 lg:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Weekly Activity</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weekly}>
                  <defs>
                    <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={d => format(new Date(d), 'EEE')} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    labelFormatter={l => format(new Date(l), 'MMM d')}
                  />
                  <Area type="monotone" dataKey="completed" stroke="#6366f1" fill="url(#completedGrad)" strokeWidth={2} name="Completed" />
                  <Area type="monotone" dataKey="created" stroke="#10b981" fill="url(#createdGrad)" strokeWidth={2} name="Created" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Priority pie */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-5">
                <Target className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-900 dark:text-white">By Priority</h3>
              </div>
              {stats.priorityBreakdown.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={stats.priorityBreakdown}
                        dataKey="count"
                        nameKey="priority"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                      >
                        {stats.priorityBreakdown.map(entry => (
                          <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {stats.priorityBreakdown.map(p => (
                      <div key={p.priority} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: PRIORITY_COLORS[p.priority] }} />
                          <span className="text-slate-600 dark:text-slate-400">{p.priority}</span>
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{p.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No tasks yet</div>
              )}
            </div>
          </div>

          {/* Productivity score + bar chart */}
          {productivity && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Score card */}
              <div className="card p-5 flex flex-col items-center justify-center">
                <Zap className="w-6 h-6 text-indigo-600 mb-3" />
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    <circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke="#6366f1" strokeWidth="10"
                      strokeDasharray={`${(productivity.score / 100) * 251.2} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{productivity.score}</span>
                  </div>
                </div>
                <p className="mt-3 font-semibold text-slate-900 dark:text-white">Productivity Score</p>
                <p className="text-sm text-slate-500 mt-1">Last {productivity.period}</p>
              </div>

              {/* Completion bar chart */}
              <div className="card p-5 lg:col-span-2">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-5">Daily Completion (7 days)</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={weekly} barSize={24}>
                    <XAxis dataKey="date" tickFormatter={d => format(new Date(d), 'EEE')} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      labelFormatter={l => format(new Date(l), 'MMM d')}
                    />
                    <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
