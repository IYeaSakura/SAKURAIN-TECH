'use client';

/**
 * Dynamic Island —— 全局灵动岛组件。
 *
 * 设计灵感来自 Apple Dynamic Island：顶部居中的黑色胶囊可根据交互态
 * 平滑形变为音乐控制台、命令面板或系统状态条。终端极客元素以功能
 * 组件形式融入（命令提示符、状态码、系统指标）。
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  Terminal,
  X,
  Radio,
} from 'lucide-react';
import { useMusicPlayer } from '@/hooks';
import { useNavigation } from '@/hooks';
import { useAnimationEnabled } from '@/hooks';

/** 灵动岛显示模式 */
type IslandMode = 'compact' | 'music' | 'command';

const QUICK_LINKS = [
  { label: '首页', href: '/', shortcut: '⌘1' },
  { label: '博客', href: '/blog', shortcut: '⌘2' },
  { label: '项目', href: '/projects', shortcut: '⌘3' },
  { label: '说说', href: '/shuoshuo', shortcut: '⌘4' },
  { label: '友链', href: '/friends', shortcut: '⌘5' },
  { label: '关于', href: '/about', shortcut: '⌘6' },
];

/** 格式化秒数为 mm:ss */
function formatTime(time: number) {
  if (!time || isNaN(time)) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function DynamicIsland() {
  const [mode, setMode] = useState<IslandMode>('compact');
  const [now, setNow] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const animationEnabled = useAnimationEnabled();
  const player = useMusicPlayer();
  const { navigateTo } = useNavigation();

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 键盘快捷键：/ 打开命令面板，Esc 关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMode('compact');
        return;
      }
      if (e.key === '/' && mode !== 'command') {
        e.preventDefault();
        setMode('command');
      }
      if (e.key >= '1' && e.key <= '6' && mode === 'command') {
        e.preventDefault();
        const link = QUICK_LINKS[parseInt(e.key, 10) - 1];
        if (link) {
          setMode('compact');
          navigateTo(link.href);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, navigateTo]);

  const toggleMusic = useCallback(() => {
    setMode((prev) => (prev === 'music' ? 'compact' : 'music'));
  }, []);

  const openCommand = useCallback(() => {
    setMode((prev) => (prev === 'command' ? 'compact' : 'command'));
  }, []);

  const timeStr = useMemo(() => {
    if (!now) return '--:--';
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }, [now]);

  const progressPercent = player.duration
    ? (player.currentTime / player.duration) * 100
    : 0;

  if (!mounted) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100]">
      <motion.div
        layout
        initial={animationEnabled ? { opacity: 0, y: -20, scale: 0.9 } : undefined}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 320,
          damping: 28,
          mass: 0.8,
        }}
        className="apple-island relative overflow-hidden cursor-pointer select-none"
        style={{
          minWidth: mode === 'compact' ? 140 : undefined,
          maxWidth: mode === 'compact' ? 220 : 420,
          width: mode === 'command' ? 360 : mode === 'music' ? 380 : undefined,
          height: mode === 'compact' ? 40 : 'auto',
          padding: mode === 'compact' ? '0 14px' : '14px',
        }}
      >
        <AnimatePresence mode="wait">
          {mode === 'compact' && (
            <motion.div
              key="compact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between w-full gap-3"
              onClick={openCommand}
            >
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium">SAKURAIN</span>
              </div>
              <div className="flex items-center gap-2">
                {player.isPlaying && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="flex items-center gap-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMusic();
                    }}
                  >
                    <span className="w-1 h-3 bg-accent-primary rounded-full" />
                    <span className="w-1 h-2 bg-accent-primary rounded-full" />
                    <span className="w-1 h-4 bg-accent-primary rounded-full" />
                  </motion.div>
                )}
                <span className="text-xs font-mono opacity-80">{timeStr}</span>
              </div>
            </motion.div>
          )}

          {mode === 'music' && (
            <motion.div
              key="music"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-accent-primary" />
                  <span className="text-xs font-medium opacity-80">NOW PLAYING</span>
                </div>
                <button
                  onClick={() => setMode('compact')}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <motion.div
                  animate={player.isPlaying ? { rotate: 360 } : {}}
                  transition={player.isPlaying ? { duration: 8, repeat: Infinity, ease: 'linear' } : {}}
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #0a84ff, #30d158)',
                  }}
                >
                  <Music className="w-7 h-7 text-white" />
                </motion.div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{player.currentSong?.title || 'Unknown Track'}</p>
                  <p className="text-xs opacity-70 truncate">{player.currentSong?.artist || 'Unknown Artist'}</p>
                  <div className="mt-2 h-1 rounded-full bg-white/20 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-accent-primary"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] opacity-60 mt-1 font-mono">
                    <span>{formatTime(player.currentTime)}</span>
                    <span>{formatTime(player.duration)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mt-4">
                <button onClick={player.prev} className="p-2 rounded-full hover:bg-white/10">
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={player.togglePlay}
                  className="p-3 rounded-full bg-white text-black hover:scale-105 transition-transform"
                >
                  {player.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button onClick={player.next} className="p-2 rounded-full hover:bg-white/10">
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {mode === 'command' && (
            <motion.div
              key="command"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-accent-secondary" />
                  <span className="text-xs font-medium opacity-80">COMMAND PALETTE</span>
                </div>
                <button
                  onClick={() => setMode('compact')}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 mb-3">
                <span className="text-accent-secondary font-mono text-sm">{'>'}</span>
                <span className="text-sm opacity-70">quick nav</span>
                <span className="apple-caret" />
              </div>

              <div className="space-y-1">
                {QUICK_LINKS.map((link, index) => (
                  <button
                    key={link.href}
                    onClick={() => {
                      setMode('compact');
                      navigateTo(link.href);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-50 w-4">{index + 1}</span>
                      <span className="text-sm">{link.label}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-40">{link.shortcut}</span>
                  </button>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] opacity-40 font-mono">
                <span>Press / to toggle</span>
                <span>Esc to close</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
