'use client';

/**
 * System header bar inspired by refact.cc.
 * Displays live time, date and a compact calendar, plus a system status badge.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, CalendarDays, Radio } from 'lucide-react';
import { useAnimationEnabled } from '@/hooks';

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function getWeekDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

export function SystemHeader() {
  const animationEnabled = useAnimationEnabled();
  const [now, setNow] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setNow(new Date());
    setMounted(true);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = useMemo(() => {
    if (!now) return '--:--:--';
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }, [now]);

  const dateStr = useMemo(() => {
    if (!now) return '';
    return now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  }, [now]);

  const calendarDays = useMemo(() => {
    if (!now) return [];
    return getWeekDays(now.getFullYear(), now.getMonth());
  }, [now]);

  const todayDay = now?.getDate() ?? null;

  if (!mounted || !now) {
    return (
      <header className="w-full border-b border-border/40 bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-accent-primary" />
              <span className="mono-label">SYSTEM ONLINE</span>
            </div>
            <div className="h-5 w-24 bg-muted/20 rounded animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <motion.header
      initial={animationEnabled ? { opacity: 0, y: -12 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full border-b border-border/40 bg-background/50 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left: system status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-primary" />
              </span>
              <span className="mono-label">SYSTEM ONLINE</span>
            </div>
            <span className="hidden sm:inline text-muted-foreground text-xs">
              v1.0 / Next.js
            </span>
          </div>

          {/* Right: time + calendar */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Live clock */}
            <div className="flex items-center gap-2 min-w-[120px]">
              <Clock className="w-4 h-4 text-accent-primary" />
              <span
                className="font-mono text-lg sm:text-xl tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                {timeStr}
              </span>
            </div>

            {/* Compact calendar */}
            <div className="hidden sm:flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-accent-secondary" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">{dateStr}</span>
                <div className="flex gap-0.5 mt-1">
                  {calendarDays.slice(0, 14).map((day, i) => {
                    const isToday = day === todayDay;
                    return (
                      <div
                        key={i}
                        className={`w-4 h-4 text-[9px] flex items-center justify-center rounded-sm ${
                          isToday
                            ? 'bg-accent-primary text-primary-foreground font-bold'
                            : day !== null
                              ? 'bg-muted/30 text-muted-foreground'
                              : 'bg-transparent'
                        }`}
                      >
                        {day ?? ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
