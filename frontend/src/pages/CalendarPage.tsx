import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { useTaskStore } from '../stores/taskStore';
import { useUIStore } from '../stores/uiStore';
import { Task } from '../types';

const PRIORITY_DOTS: Record<string, string> = {
  LOW: 'bg-emerald-500',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500',
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const { tasks, fetchTasks } = useTaskStore();
  const { openTaskModal } = useUIStore();

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getTasksForDay = (day: Date): Task[] =>
    tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));

  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendar</h1>
        <button onClick={() => openTaskModal()} className="btn-primary">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="card p-5 lg:col-span-2">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1))}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1))}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 dark:text-slate-500 py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map(day => {
              const dayTasks = getTasksForDay(day);
              const inMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              const selected = selectedDay && isSameDay(day, selectedDay);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(selected ? null : day)}
                  className={`relative flex flex-col items-center justify-start p-2 rounded-xl min-h-[3.5rem] transition-all text-sm
                    ${!inMonth ? 'opacity-30' : ''}
                    ${selected ? 'bg-indigo-600 text-white' : today ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}
                  `}
                >
                  <span className={`font-medium w-6 h-6 flex items-center justify-center rounded-full ${today && !selected ? 'bg-indigo-600 text-white text-xs' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                      {dayTasks.slice(0, 3).map(t => (
                        <div key={t.id} className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-white/70' : PRIORITY_DOTS[t.priority]}`} />
                      ))}
                      {dayTasks.length > 3 && (
                        <span className={`text-[9px] ${selected ? 'text-white/70' : 'text-slate-400'}`}>+{dayTasks.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
            {selectedDay ? format(selectedDay, 'EEEE, MMM d') : 'Select a day'}
          </h3>

          {selectedDay ? (
            selectedDayTasks.length === 0 ? (
              <div className="text-sm text-slate-400 flex flex-col items-center py-8">
                <p>No tasks due this day</p>
                <button
                  onClick={() => openTaskModal()}
                  className="mt-3 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  + Add task
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayTasks.map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${PRIORITY_DOTS[task.priority]}`} />
                    <div>
                      <p className={`text-sm font-medium text-slate-900 dark:text-white ${task.status === 'COMPLETED' ? 'line-through opacity-60' : ''}`}>
                        {task.title}
                      </p>
                      {task.dueTime && <p className="text-xs text-slate-400 mt-0.5">⏰ {task.dueTime}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">Click a day to see tasks</p>
          )}
        </div>
      </div>
    </div>
  );
}
