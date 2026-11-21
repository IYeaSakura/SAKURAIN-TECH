'use client';

/**
 * Shared mute button + volume slider. The "dragging volume unmutes" behaviour
 * lives in the Context's setVolume(); this component only renders the control
 * and reflects muted state in the slider value/fill. Layout classes are props
 * because the mini player uses a full-width bar and the full-screen page a
 * compact one.
 *
 * On iOS the element volume is read-only, so the slider is replaced by a hint:
 * showing a control that cannot change anything is worse than not showing it.
 */
import { Volume2, VolumeX } from 'lucide-react';
import styles from '../player.module.css';
import { supportsElementVolume } from './player-utils';

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  labels: { mute: string; unmute: string };
  buttonClassName?: string;
  sliderClassName?: string;
  /** Localized hint shown instead of the slider when the platform controls volume. */
  systemVolumeHint?: string;
}

export function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  labels,
  buttonClassName = 'p-1.5',
  sliderClassName = 'flex-1 h-2',
  systemVolumeHint,
}: VolumeControlProps) {
  const effectiveVolume = isMuted ? 0 : volume;
  const isSilent = isMuted || volume === 0;
  const canControlVolume = supportsElementVolume();
  return (
    <>
      <button
        onClick={onToggleMute}
        className={`${styles.iconButton} ${styles.iconButtonFramed} ${buttonClassName}`}
        style={{ color: isSilent ? 'var(--text-muted)' : 'var(--accent-primary)' }}
        title={isSilent ? labels.unmute : labels.mute}
        aria-label={isSilent ? labels.unmute : labels.mute}
      >
        {isSilent ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
      {canControlVolume ? (
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={effectiveVolume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          aria-label={labels.mute}
          className={`${styles.volumeSlider} ${sliderClassName}`}
          style={{
            background: `linear-gradient(90deg, var(--accent-primary) ${effectiveVolume * 100}%, var(--bg-tertiary) ${effectiveVolume * 100}%)`,
          }}
        />
      ) : (
        systemVolumeHint && (
          <span
            className="hidden sm:inline text-[10px] font-mono uppercase tracking-wider whitespace-nowrap"
            style={{ color: 'var(--text-muted)' }}
          >
            {systemVolumeHint}
          </span>
        )
      )}
    </>
  );
}
