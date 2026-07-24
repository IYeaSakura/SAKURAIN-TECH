'use client';

/**
 * CalendarWidget —— homepage date & time card.
 *
 * A simple live clock and calendar display for the personal blog dashboard.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, CalendarDays } from 'lucide-react';
import { useAnimationEnabled } from '@/hooks';

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function CalendarWidget() {
  const animationEnabled = useAnimationEnabled();
  const [now, setNow] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
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

  if (!mounted) {
    return (
      <div
        className="p-5 h-full min-h-[180px] border-2"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
      />
    );
  }

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="p-5 h-full flex flex-col border-2"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
        boxShadow: '4px 4px 0 var(--border-subtle)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-4 h-4" style={{ color: 'var(--accent-tertiary)' }} />
        <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Today
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          <span
            className="text-3xl sm:text-4xl font-mono tracking-wider"
            style={{ color: 'var(--text-primary)' }}
          >
            {timeStr}
          </span>
        </div>
        <p className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
          {dateStr}
        </p>
      </div>
    </motion.div>
  );
}
