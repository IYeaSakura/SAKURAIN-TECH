'use client';

/**
 * Dynamic Island — unified navigation, music and system control center.
 *
 * The island absorbs the old top Navigation so the UI has a single control
 * surface. It keeps a compact capsule when idle and expands into a modular
 * panel with nav links, music controls, system toggles and quick tools.
 *
 * Visual language is a brutalism / pixel / early-web fusion: sharp corners,
 * thick borders, monospace/pixel fonts and high-contrast accent blocks.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Globe,
  Heart,
  Settings,
  Search,
  ChevronUp,
  Camera,
} from 'lucide-react';
import {
  useMusicPlayer,
  useAnimationEnabled,
  useStylePreset,
  useTheme,
  useNavigation,
  useTranslation,
} from '@/hooks';

interface NavItem {
  labelKey: keyof import('@/i18n/types').Dictionary['nav'];
  href: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const NAV_LINKS: NavItem[] = [
  { labelKey: 'home', href: '/', icon: Home },
  { labelKey: 'blog', href: '/blog', icon: BookOpen },
  { labelKey: 'projects', href: '/projects', icon: FolderKanban },
  { labelKey: 'shuoshuo', href: '/shuoshuo', icon: MessageSquare },
  { labelKey: 'friends', href: '/friends', icon: Users },
  { labelKey: 'friendsCircle', href: '/friends-circle', icon: Heart },
  { labelKey: 'earth', href: '/earth-online', icon: Globe },
  { labelKey: 'photos', href: '/photos', icon: Camera },
  { labelKey: 'music', href: '/music', icon: Music },
  { labelKey: 'about', href: '/about', icon: User },
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
  const [searchQuery, setSearchQuery] = useState('');
  const animationEnabled = useAnimationEnabled();
  const player = useMusicPlayer();
  const { preset, cyclePreset } = useStylePreset();
  const { theme, toggleTheme } = useTheme();
  const { navigateTo } = useNavigation();
  const { t, locale, toggleLocale } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close the island when clicking outside.
  useEffect(() => {
    if (!expanded) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [expanded]);

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

  const handleScrollTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setExpanded(false);
  }, []);

  const handleThemeToggle = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      toggleTheme(e);
    },
    [toggleTheme]
  );

  const navLinks = useMemo(
    () =>
      NAV_LINKS.map((link) => ({
        ...link,
        label: t.nav[link.labelKey],
      })),
    [t.nav]
  );

  const filteredNav = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return navLinks;
    return navLinks.filter(
      (link) =>
        link.label.toLowerCase().includes(q) ||
        link.href.toLowerCase().includes(q)
    );
  }, [searchQuery, navLinks]);

  if (!mounted) return null;

  return (
    <div ref={containerRef} className="fixed top-3 left-1/2 -translate-x-1/2 z-[100]">
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
          width: expanded ? 380 : 'auto',
          minWidth: expanded ? 340 : 160,
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
                  {t.common.control}
                </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpanded(false)}
                    className="w-7 h-7 flex items-center justify-center border-2 transition-colors hover:bg-[var(--accent-primary)] hover:text-[var(--bg-primary)]"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                    title={t.common.close}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={toggleLocale}
                    className="w-7 h-7 flex items-center justify-center border-2 transition-colors hover:bg-[var(--accent-primary)] hover:text-[var(--bg-primary)]"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                    title={t.common.language}
                  >
                    <span className="text-[10px] font-bold uppercase leading-none" style={{ fontFamily: 'var(--font-mono)' }}>
                      {locale.toUpperCase()}
                    </span>
                  </button>
                  <button
                    onClick={() => handleNav('/settings')}
                    className="w-7 h-7 flex items-center justify-center border-2 transition-colors hover:bg-[var(--accent-primary)] hover:text-[var(--bg-primary)]"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                    title={t.common.settingsTitle}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div
                className="flex items-center gap-2 px-2 py-1.5 border-2 mb-4"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <Search className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.common.search + '...'}
                  className="flex-1 bg-transparent outline-none text-xs min-w-0"
                  style={{ color: 'var(--text-primary)', caretColor: 'var(--accent-primary)' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[10px] font-bold uppercase"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {t.common.clear}
                  </button>
                )}
              </div>

              {/* Navigation grid */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {filteredNav.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => handleNav(link.href)}
                    className="flex flex-col items-center justify-center gap-1 p-2 border-2 transition-all hover:bg-[var(--accent-primary)] hover:text-[var(--bg-primary)] hover:border-[var(--accent-primary)]"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                    title={link.label}
                  >
                    <link.icon className="w-4 h-4" />
                    <span
                      className="text-[9px] font-bold uppercase truncate w-full text-center"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
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
                      {player.currentSong?.title || t.music.unknownTrack}
                    </p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {player.currentSong?.artist || t.music.unknownArtist}
                    </p>
                  </div>
                  <button
                    onClick={() => handleNav('/music')}
                    className="px-2 py-1 text-[10px] font-bold uppercase border-2 transition-colors hover:bg-[var(--accent-primary)] hover:text-[var(--bg-primary)]"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {t.common.open}
                  </button>
                </div>
                <div
                  className="h-2 border-2 mb-1 overflow-hidden"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <motion.div
                    className="h-full"
                    style={{ background: 'var(--accent-primary)', width: `${progressPercent}%` }}
                  />
                </div>
                <div
                  className="flex justify-between text-[10px] font-mono mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
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
                  onClick={handleThemeToggle}
                  className="flex items-center justify-center gap-2 p-2 border-2 transition-all hover:bg-[var(--accent-secondary)] hover:text-[var(--bg-primary)] hover:border-[var(--accent-secondary)]"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  <span className="text-[10px] font-bold uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                    {theme === 'light' ? t.common.dark : t.common.light}
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
                    {preset.id === 'default' ? t.nav.terminal : t.common.settingsTitle}
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
