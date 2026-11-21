'use client';

/**
 * Shared cover art surface for the mini player, expanded player and music page.
 * Uses the persistent cover cache and falls back to a theme-aware pixel grid
 * instead of an external SVG placeholder whose CSS variables would not resolve.
 */
import { useEffect, useState } from 'react';
import { Music } from 'lucide-react';
import { getCachedCoverUrl, revokeBlobUrl } from '@/lib/asset-cache';
import type { Song } from '@/contexts/MusicPlayerContext';
import styles from '../player.module.css';

interface TrackArtProps {
  song: Song;
  isPlaying?: boolean;
  className?: string;
}

export function TrackArt({ song, isPlaying = false, className = '' }: TrackArtProps) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let cancelled = false;
    let blobUrl: string | null = null;
    setSrc('');
    if (!song.cover) return;

    getCachedCoverUrl(song.cover)
      .then((cached) => {
        if (cancelled) return;
        if (cached !== song.cover) blobUrl = cached;
        setSrc(cached);
      })
      .catch(() => {
        if (!cancelled) setSrc('');
      });

    return () => {
      cancelled = true;
      if (blobUrl) revokeBlobUrl(blobUrl);
    };
  }, [song.cover, song.id]);

  return (
    <div
      className={`${styles.trackArt} ${isPlaying ? styles.trackArtPlaying : ''} ${className}`.trim()}
    >
      {src ? (
        <img
          key={src}
          src={src}
          alt=""
          className={styles.trackArtImage}
          onError={() => setSrc('')}
        />
      ) : (
        <div className={styles.trackArtPlaceholder}>
          <Music style={{ width: '45%', height: '45%', color: 'var(--accent-primary)' }} />
        </div>
      )}
    </div>
  );
}
