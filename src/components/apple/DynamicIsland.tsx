'use client';

/**
 * Dynamic Island —— unified navigation, music and system control center.
 *
 * The island absorbs the old top Navigation so the UI has a single control
 * surface. It keeps a compact capsule when idle and expands into a modular
 * panel with nav links, music controls and system toggles.
 *
 * Visual language is a brutalism / pixel / early-web fusion: sharp corners,
 * thick borders, monospace/pixel fonts and high-contrast accent blocks.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  X,
  Terminal,
  Layout,
  Sun,
  Moon,
  Home,
  BookOpen,
  FolderKanban,
  MessageSquare,
  Users,
  User,
  Menu,
} from 'lucide-react';
import { useMusicPlayer, useAnimationEnabled, useStylePreset, useTheme, useNavigation } from '@/hooks';

const NAV_LINKS = [
  { label: '首页', href: '/', icon: Home },
  { label: '博客', href: '/blog', icon: BookOpen },
  { label: '项目', href: '/projects', icon: FolderKanban },
  { label: '说说', href: '/shuoshuo', icon: MessageSquare },
  { label: '友链', href: '/friends', icon: Users },
  { label: '关于', href: '/about', icon: User },
];

function formatTime(time: number) {
  if (!time || Number.isNaN(time)) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function DynamicIsland() {
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const animationEnabled = useAnimationEnabled();
  const player = useMusicPlayer();
  const { preset, cyclePreset } = useStylePreset();
  const { theme, toggleTheme } = useTheme();
  const { navigateTo } = useNavigation();

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const timeStr = useMemo(() => {
    if (!now) return '--:--';
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }, [now]);

  const progressPercent = player.duration
    ? (player.currentTime / player.duration) * 100
    : 0;

  const handleNav = useCallback(
    (href: string) => {
      setExpanded(false);
      navigateTo(href);
    },
    [navigateTo]
  );

  const handleTerminalToggle = useCallback(() => {
    setExpanded(false);
    cyclePreset();
  }, [cyclePreset]);

  if (!mounted) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100]">
      <motion.div
        layout
        initial={animationEnabled ? { opacity: 0, y: -20 } : undefined}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
        className="island-shell relative overflow-hidden cursor-pointer select-none"
        style={{
          width: expanded ? 360 : 'auto',
          minWidth: expanded ? 320 : 160,
          height: expanded ? 'auto' : 44,
        }}
      >
        <AnimatePresence mode="wait">
          {!expanded ? (
            <motion.button
              key="compact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              onClick={() => setExpanded(true)}
              className="flex items-center justify-between w-full h-full px-3 gap-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-6 h-6 flex items-center justify-center text-[10px] font-bold border-2 shrink-0"
                  style={{
                    borderColor: 'var(--accent-primary)',
                    color: 'var(--accent-primary)',
                    fontFamily: 'var(--font-pixel)',
                  }}
                >
                  SK
                </span>
                <span
                  className="text-xs font-bold tracking-wider uppercase"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                >
                  SAKURAIN
                </span>
              </div>
              <div className="flex items-center gap-2">
                {player.isPlaying && (
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="flex items-end gap-0.5 h-3"
                  >
                    <span className="w-1 h-1 bg-[var(--accent-primary)]" />
                    <span className="w-1 h-3 bg-[var(--accent-primary)]" />
                    <span className="w-1 h-2 bg-[var(--accent-primary)]" />
                  </motion.div>
                )}
                <span
                  className="text-xs font-mono opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {timeStr}
                </span>
                <Menu className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </div>
            </motion.button>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 flex items-center justify-center text-xs font-bold border-2"
                    style={{
                      borderColor: 'var(--accent-primary)',
                      color: 'var(--accent-primary)',
                      fontFamily: 'var(--font-pixel)',
                    }}
                  >
                    SK
                  </span>
                  <span
                    className="text-sm font-bold tracking-wider uppercase"
                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                  >
                    Control
                  </span>
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="p-1.5 border-2 transition-colors hover:bg-[var(--accent-primary)] hover:text-[var(--bg-primary)]"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => handleNav(link.href)}
                    className="flex flex-col items-center justify-center gap-1 p-2 border-2 transition-all hover:bg-[var(--accent-primary)] hover:text-[var(--bg-primary)] hover:border-[var(--accent-primary)]"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <link.icon className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                      {link.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Music section */}
              <div
                className="border-2 p-3 mb-4"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-11 h-11 flex items-center justify-center border-2 shrink-0"
                    style={{
                      borderColor: 'var(--accent-primary)',
                      background: 'var(--accent-primary)',
                    }}
                  >
                    <Music className="w-5 h-5 text-[var(--bg-primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {player.currentSong?.title || 'Unknown Track'}
                    </p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {player.currentSong?.artist || 'Unknown Artist'}
                    </p>
                  </div>
                </div>
                <div className="h-2 border-2 mb-1 overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
                  <motion.div
                    className="h-full"
                    style={{ background: 'var(--accent-primary)', width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono mb-2" style={{ color: 'var(--text-muted)' }}>
                  <span>{formatTime(player.currentTime)}</span>
                  <span>{formatTime(player.duration)}</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={player.prev}
                    className="p-2 border-2 transition-colors hover:bg-[var(--bg-tertiary)]"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={player.togglePlay}
                    className="p-2 border-2 transition-colors hover:opacity-90"
                    style={{
                      borderColor: 'var(--accent-primary)',
                      background: 'var(--accent-primary)',
                      color: 'var(--bg-primary)',
                    }}
                  >
                    {player.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <button
                    onClick={player.next}
                    className="p-2 border-2 transition-colors hover:bg-[var(--bg-tertiary)]"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* System toggles */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center gap-2 p-2 border-2 transition-all hover:bg-[var(--accent-secondary)] hover:text-[var(--bg-primary)] hover:border-[var(--accent-secondary)]"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  <span className="text-[10px] font-bold uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                    {theme === 'light' ? 'Dark' : 'Light'}
                  </span>
                </button>
                <button
                  onClick={handleTerminalToggle}
                  className="flex items-center justify-center gap-2 p-2 border-2 transition-all hover:bg-[var(--accent-primary)] hover:text-[var(--bg-primary)] hover:border-[var(--accent-primary)]"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {preset.id === 'default' ? <Terminal className="w-4 h-4" /> : <Layout className="w-4 h-4" />}
                  <span className="text-[10px] font-bold uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                    {preset.id === 'default' ? 'Term' : 'Visual'}
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
