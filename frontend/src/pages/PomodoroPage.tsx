import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Timer, Settings2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

type Mode = 'work' | 'break' | 'longBreak';

const MODE_CONFIG: Record<Mode, { label: string; color: string; bg: string }> = {
  work: { label: 'Focus Time', color: 'text-indigo-600', bg: 'bg-indigo-600' },
  break: { label: 'Short Break', color: 'text-emerald-600', bg: 'bg-emerald-500' },
  longBreak: { label: 'Long Break', color: 'text-blue-600', bg: 'bg-blue-500' },
};

const playBell = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  } catch {/* */}
};

export default function PomodoroPage() {
  const { user } = useAuthStore();
  const workMins = user?.settings?.pomodoroWorkMinutes ?? 25;
  const breakMins = user?.settings?.pomodoroBreakMinutes ?? 5;

  const [mode, setMode] = useState<Mode>('work');
  const [seconds, setSeconds] = useState(workMins * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [totalFocused, setTotalFocused] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = mode === 'work' ? workMins * 60 : mode === 'break' ? breakMins * 60 : 15 * 60;
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;

  const reset = useCallback(() => {
    setRunning(false);
    setSeconds(totalSeconds);
  }, [totalSeconds]);

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setRunning(false);
    const secs = m === 'work' ? workMins * 60 : m === 'break' ? breakMins * 60 : 15 * 60;
    setSeconds(secs);
  }, [workMins, breakMins]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            // Session complete
            clearInterval(intervalRef.current!);
            setRunning(false);
            playBell();
            if (mode === 'work') {
              setSessions(n => n + 1);
              setTotalFocused(t => t + workMins);
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode, workMins]);

  const min = Math.floor(seconds / 60).toString().padStart(2, '0');
  const sec = (seconds % 60).toString().padStart(2, '0');
  const cfg = MODE_CONFIG[mode];

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pomodoro Timer</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Focus in 25-minute sessions, then take a break</p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        {(['work', 'break', 'longBreak'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${mode === m
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            {m === 'work' ? '🎯 Focus' : m === 'break' ? '☕ Break' : '🌙 Long Break'}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="card p-10 flex flex-col items-center">
        <p className={`text-sm font-semibold uppercase tracking-widest mb-8 ${cfg.color}`}>{cfg.label}</p>

        <div className="relative">
          <svg width="280" height="280" className="-rotate-90">
            <circle cx="140" cy="140" r="120" fill="none" stroke="#e2e8f0" strokeWidth="8" className="dark:stroke-slate-800" />
            <motion.circle
              cx="140" cy="140" r="120" fill="none"
              className={`stroke-current ${cfg.color}`}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5 }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {min}:{sec}
            </span>
            <span className="text-sm text-slate-400 mt-2">
              {running ? 'Focusing...' : seconds === totalSeconds ? 'Ready' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-8">
          <button
            onClick={reset}
            className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setRunning(v => !v)}
            className={`${cfg.bg} text-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg`}
          >
            {running ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </motion.button>

          <button className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 text-center">
          <Timer className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{sessions}</p>
          <p className="text-sm text-slate-500">Sessions today</p>
        </div>
        <div className="card p-5 text-center">
          <Coffee className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalFocused}m</p>
          <p className="text-sm text-slate-500">Time focused</p>
        </div>
      </div>
    </div>
  );
}
