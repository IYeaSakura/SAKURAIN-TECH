'use client';

/**
 * DesktopStatusBar — system-style status strip for the top of the homepage.
 *
 * Shows the site brand, live clock and current music state in a compact
 * pixel-monospace bar that reinforces the desktop dashboard metaphor.
 */

import { useState, useEffect, useMemo } from 'react';
import { Music, Search, Terminal, Activity } from 'lucide-react';
import { useTranslation, useMusicPlayer, useStylePreset } from '@/hooks';
import { useGlobalSearch } from '@/components/search';

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function DesktopStatusBar() {
  const { t, locale } = useTranslation();
  const player = useMusicPlayer();
  const { open: openSearch } = useGlobalSearch();
  const { cyclePreset } = useStylePreset();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = useMemo(() => {
    if (!now) return '--:--';
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }, [now]);

  const dateStr = useMemo(() => {
    if (!now) return '';
    return now.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  }, [now, locale]);

  return (
    <div
      className="flex items-center justify-between gap-3 px-3 py-2 border-2 mb-4 text-[10px] font-mono uppercase tracking-wider"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
        boxShadow: '3px 3px 0 var(--border-subtle)',
        color: 'var(--text-muted)',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 font-bold" style={{ color: 'var(--accent-primary)' }}>
          SAKURAIN_OS
        </span>
        <span className="hidden sm:inline">{dateStr}</span>
        <span style={{ color: 'var(--text-primary)' }}>{timeStr}</span>
      </div>

      <div className="flex-1 min-w-0 flex items-center justify-center gap-2 truncate">
        {player.currentSong && (
          <>
            <Music className="w-3 h-3 shrink-0" style={{ color: 'var(--accent-secondary)' }} />
            <span className="truncate">
              {player.isPlaying ? '▶' : '⏸'} {player.currentSong.title} — {player.currentSong.artist}
            </span>
          </>
        )}
        {!player.currentSong && (
          <>
            <Activity className="w-3 h-3 shrink-0" style={{ color: 'var(--accent-tertiary)' }} />
            <span className="hidden sm:inline">{locale === 'zh' ? '系统运行正常' : 'System online'}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={openSearch}
          className="flex items-center gap-1 px-2 py-1 border transition-colors hover:bg-[var(--bg-tertiary)]"
          style={{ borderColor: 'var(--border-subtle)' }}
          type="button"
        >
          <Search className="w-3 h-3" />
          <span className="hidden sm:inline">{t.common.search}</span>
        </button>
        <button
          onClick={cyclePreset}
          className="flex items-center gap-1 px-2 py-1 border transition-colors hover:bg-[var(--bg-tertiary)]"
          style={{ borderColor: 'var(--border-subtle)' }}
          type="button"
        >
          <Terminal className="w-3 h-3" />
          <span className="hidden sm:inline">TERM</span>
        </button>
      </div>
    </div>
  );
}
