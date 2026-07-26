'use client';

/**
 * WorldClockWidget —— displays time across multiple cities.
 *
 * Updates every second. The local timezone is always shown first so
 * visitors can compare with other locations at a glance.
 */

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useTranslation, useAnimationEnabled } from '@/hooks';

interface CityTime {
  name: string;
  timezone: string;
}

const CITIES: CityTime[] = [
  { name: 'Beijing', timezone: 'Asia/Shanghai' },
  { name: 'Tokyo', timezone: 'Asia/Tokyo' },
  { name: 'London', timezone: 'Europe/London' },
  { name: 'New York', timezone: 'America/New_York' },
];

export function WorldClockWidget() {
  const { t } = useTranslation();
  const animationEnabled = useAnimationEnabled();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const times = useMemo(() => {
    if (!now) return [];
    return CITIES.map((city) => {
      const timeString = now.toLocaleTimeString('en-US', {
        timeZone: city.timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });
      const parts = timeString.split(':');
      return {
        ...city,
        hour: parts[0],
        minute: parts[1],
      };
    });
  }, [now]);

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="h-full min-h-[180px] p-5 border-2 flex flex-col"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
        boxShadow: '4px 4px 0 var(--border-subtle)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-4 h-4" style={{ color: 'var(--accent-tertiary)' }} />
        <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {t.widgets.worldClock}
        </span>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3">
        {times.map((city) => (
          <div
            key={city.name}
            className="flex flex-col justify-center items-center p-2 border-2"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-primary)' }}
          >
            <span className="text-[10px] font-mono uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
              {city.name}
            </span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                {city.hour}
              </span>
              <span className="text-lg font-bold font-mono animate-pulse" style={{ color: 'var(--text-muted)' }}>
                :
              </span>
              <span className="text-lg font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                {city.minute}
              </span>
            </div>
          </div>
        ))}
        {times.length === 0 &&
          CITIES.map((city) => (
            <div
              key={city.name}
              className="flex flex-col justify-center items-center p-2 border-2"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-primary)' }}
            >
              <span className="text-[10px] font-mono uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                {city.name}
              </span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-bold font-mono" style={{ color: 'var(--text-muted)' }}>
                  --
                </span>
                <span className="text-lg font-bold font-mono" style={{ color: 'var(--text-muted)' }}>
                  :
                </span>
                <span className="text-lg font-bold font-mono" style={{ color: 'var(--text-muted)' }}>
                  --
                </span>
              </div>
            </div>
          ))}
      </div>
    </motion.div>
  );
}
