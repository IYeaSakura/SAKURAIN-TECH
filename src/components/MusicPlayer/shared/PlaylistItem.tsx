'use client';

/**
 * Shared playlist row. The two players render the same song row (index, title,
 * artist, animated "now playing" bars) with different spacing/font sizes, so a
 * `variant` selects the class set instead of duplicating the markup.
 */
import { motion } from 'framer-motion';
import type { Song } from '@/contexts/MusicPlayerContext';
import styles from '../player.module.css';

interface PlaylistItemProps {
  song: Song;
  index: number;
  isCurrent: boolean;
  isLast: boolean;
  onSelect: (id: string) => void;
  variant?: 'mini' | 'full';
}

export function PlaylistItem({
  song,
  index,
  isCurrent,
  isLast,
  onSelect,
  variant = 'mini',
}: PlaylistItemProps) {
  const full = variant === 'full';
  return (
    <button
      onClick={() => onSelect(song.id)}
      className={`${styles.playlistRow} ${isCurrent ? styles.playlistRowActive : ''} w-full text-left ${
        full ? 'p-3' : 'p-2.5'
      }`}
      style={{
        background: isCurrent ? 'var(--bg-tertiary)' : 'transparent',
        // The full-screen list keeps a border on every row (its container
        // uses divide-y-2); the mini list omits it on the last row.
        borderBottom: full || !isLast ? '2px solid var(--border-subtle)' : 'none',
      }}
    >
      <div className={`flex items-center ${full ? 'gap-3' : 'gap-2'}`}>
        <span
          className={`${full ? 'text-xs' : 'text-[10px]'} font-mono w-5`}
          style={{ color: isCurrent ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <p
            className={`${full ? 'text-sm' : 'text-xs'} font-bold truncate`}
            style={{
              color: isCurrent ? 'var(--accent-primary)' : 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {song.title}
          </p>
          <p
            className={`${full ? 'text-xs' : 'text-[10px]'} truncate`}
            style={{ color: 'var(--text-muted)' }}
          >
            {song.artist}
          </p>
        </div>
        {isCurrent && (
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="flex items-end gap-0.5 h-3"
          >
            <span className={`${full ? 'w-1' : 'w-0.5'} h-1 bg-[var(--accent-primary)]`} />
            <span className={`${full ? 'w-1' : 'w-0.5'} h-3 bg-[var(--accent-primary)]`} />
            <span className={`${full ? 'w-1' : 'w-0.5'} h-2 bg-[var(--accent-primary)]`} />
          </motion.div>
        )}
      </div>
    </button>
  );
}
