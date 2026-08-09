'use client';

/**
 * MusicWidget — homepage music player card body.
 *
 * The outer chrome (title bar, drag handle, controls) is provided by the
 * WidgetFrame wrapper on the homepage. This component only renders the
 * player internals.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Music } from 'lucide-react';
import { useMusicPlayer, useTranslation } from '@/hooks';

function formatTime(time: number) {
  if (!time || Number.isNaN(time)) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MusicWidget() {
  const player = useMusicPlayer();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const progressPercent = useMemo(() => {
    return player.duration ? (player.currentTime / player.duration) * 100 : 0;
  }, [player.currentTime, player.duration]);

  if (!mounted) {
    return <div className="p-5 h-full min-h-[140px]" style={{ background: 'var(--bg-secondary)' }} />;
  }

  return (
    <div className="p-5 h-full flex flex-col" style={{ background: 'var(--bg-secondary)' }}>
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-12 h-12 flex items-center justify-center flex-shrink-0 border-2"
          style={{
            background: 'var(--accent-primary)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <Music className="w-6 h-6" style={{ color: 'var(--bg-primary)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {player.currentSong?.title || t.music.unknownTrack}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {player.currentSong?.artist || t.music.unknownArtist}
          </p>
        </div>
      </div>

      <div className="h-2 border-2 mb-1 overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
        <motion.div
          className="h-full"
          style={{ background: 'var(--accent-secondary)', width: `${progressPercent}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono mb-4" style={{ color: 'var(--text-muted)' }}>
        <span>{formatTime(player.currentTime)}</span>
        <span>{formatTime(player.duration)}</span>
      </div>

      <div className="flex items-center justify-center gap-3 mt-auto">
        <button
          onClick={player.prev}
          className="p-2 border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          type="button"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={player.togglePlay}
          className="p-2.5 border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
          style={{
            background: 'var(--accent-primary)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--bg-primary)',
          }}
          type="button"
        >
          {player.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <button
          onClick={player.next}
          className="p-2 border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          type="button"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
