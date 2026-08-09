'use client';

/**
 * CalendarWidget — homepage date & time card body.
 *
 * The outer chrome is provided by WidgetFrame on the homepage.
 */

import { useState, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { useTranslation } from '@/hooks';

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function CalendarWidget() {
  const { locale } = useTranslation();
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
    return now.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  }, [now, locale]);

  if (!mounted) {
    return <div className="p-5 h-full min-h-[160px]" style={{ background: 'var(--bg-secondary)' }} />;
  }

  return (
    <div className="p-5 h-full flex flex-col" style={{ background: 'var(--bg-secondary)' }}>
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
    </div>
  );
}
