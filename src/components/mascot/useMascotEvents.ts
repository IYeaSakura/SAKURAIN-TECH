'use client';

/**
 * useMascotEvents — makes SAKU-CHAN react to site-wide events.
 *
 * Watches music playback, theme/preset changes, route transitions and fast
 * scrolling, then triggers mood changes and short commentary bubbles.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/hooks';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useStylePreset } from '@/contexts/StylePresetContext';
import type { Mood } from './types';

interface UseMascotEventsOptions {
  mode: 'idle' | 'roaming' | 'dragging' | 'sleeping';
  locale: 'en' | 'zh';
  greeting: string;
  expressMood: (mood: Mood, duration?: number) => void;
  speak: (text: string) => void;
}

export function useMascotEvents({
  mode,
  locale,
  greeting,
  expressMood,
  speak,
}: UseMascotEventsOptions) {
  const player = useMusicPlayer();
  const { theme } = useTheme();
  const { preset } = useStylePreset();
  const pathname = usePathname();

  const prevPlayingRef = useRef(player.isPlaying);
  const prevThemeRef = useRef(theme);
  const prevPresetRef = useRef(preset.id);
  const prevPathRef = useRef(pathname);

  // React to music play/pause.
  useEffect(() => {
    if (mode === 'sleeping') return;

    if (player.isPlaying && !prevPlayingRef.current) {
      expressMood('love', 4000);
      speak(locale === 'zh' ? '音乐响起，我要跳舞了！' : 'Music is on, time to dance!');
    } else if (!player.isPlaying && prevPlayingRef.current) {
      expressMood('happy', 2000);
      speak(locale === 'zh' ? '休息一下~' : 'Taking a break.');
    }

    prevPlayingRef.current = player.isPlaying;
  }, [player.isPlaying, mode, locale, expressMood, speak]);

  // React to light/dark theme switches.
  useEffect(() => {
    if (mode === 'sleeping') return;
    if (theme === prevThemeRef.current) return;

    expressMood('curious', 3000);
    speak(
      theme === 'dark'
        ? locale === 'zh'
          ? '切换到深色模式了，好酷'
          : 'Dark mode, nice.'
        : locale === 'zh'
          ? '亮起来了~'
          : 'So bright!'
    );
    prevThemeRef.current = theme;
  }, [theme, mode, locale, expressMood, speak]);

  // React to style preset changes.
  useEffect(() => {
    if (mode === 'sleeping') return;
    if (preset.id === prevPresetRef.current) return;

    expressMood('curious', 3000);
    speak(locale === 'zh' ? '风格变了，真新鲜' : 'New style, fresh look!');
    prevPresetRef.current = preset.id;
  }, [preset.id, mode, locale, expressMood, speak]);

  // Greet the user after route changes.
  useEffect(() => {
    if (mode === 'sleeping') return;
    if (pathname === prevPathRef.current) return;

    prevPathRef.current = pathname;
    const timer = setTimeout(() => {
      expressMood('curious', 2500);
      speak(greeting);
    }, 800);

    return () => clearTimeout(timer);
  }, [pathname, mode, greeting, expressMood, speak]);

  // React to fast scrolling.
  useEffect(() => {
    if (mode === 'sleeping') return;
    if (typeof window === 'undefined') return;

    let lastScrollY = window.scrollY;
    let lastTime = Date.now();

    const handleScroll = () => {
      const now = Date.now();
      const dt = Math.max(1, now - lastTime);
      const distance = Math.abs(window.scrollY - lastScrollY);
      const speed = (distance / dt) * 1000;

      if (speed > 2200) {
        expressMood('surprised', 1400);
      }

      lastScrollY = window.scrollY;
      lastTime = now;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mode, expressMood]);
}
