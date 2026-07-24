'use client';

/**
 * SystemHeader —— Apple 风格系统状态栏。
 *
 * 以功能组件形式保留终端极客元素：实时时间、系统状态、运行指标。
 * 采用玻璃质感胶囊与柔和渐变，融入 Apple 设计语言。
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, CalendarDays, Activity, Cpu } from 'lucide-react';
import { useAnimationEnabled } from '@/hooks';

function pad(n: number) {
  return n.toString().padStart(2, '0');
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
      weekday: 'short',
    });
  }, [now]);

  if (!mounted || !now) {
    return (
      <div className="w-full flex justify-center py-4">
        <div className="apple-glass rounded-2xl px-6 py-3 w-full max-w-5xl">
          <div className="h-5 w-32 bg-muted/20 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: -12 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full flex justify-center py-4 px-4"
    >
      <div className="apple-glass rounded-2xl px-4 sm:px-6 py-3 w-full max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 系统状态 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-secondary" />
              </span>
              <span className="apple-mono-label">ONLINE</span>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                Next.js 14
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Static
              </span>
            </div>
          </div>

          {/* 时间与日期 */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-accent-primary" />
              <span className="font-mono text-base sm:text-lg tracking-wider" style={{ color: 'var(--text-primary)' }}>
                {timeStr}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{dateStr}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
