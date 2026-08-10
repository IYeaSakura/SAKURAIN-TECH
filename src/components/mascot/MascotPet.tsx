'use client';

/**
 * MascotPet — a free-roaming desktop pet version of SAKU-CHAN.
 *
 * Phase 3 adds a mood system, reactions to site-wide events, and smarter
 * roaming that prefers edges, peeks from cover zones and snaps to ledges.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useMotionValue, useSpring, animate } from 'framer-motion';
import { useTranslation, useAnimationEnabled, useIsMobile } from '@/hooks';
import { useMascotPosition, MASCOT_SIZE } from './useMascotPosition';
import { useMascotRoaming } from './useMascotRoaming';
import { useMascotLines } from './useMascotLines';
import { useMascotEvents } from './useMascotEvents';
import { MascotBubble } from './MascotBubble';
import { MascotMenu, type MascotMenuItem } from './MascotMenu';
import { MascotMoodOverlay } from './MascotMoodOverlay';
import type { RoamTarget } from './mascotEnvironment';
import type { Mood, MascotMode } from './types';

const SLEEP_DELAY = 30_000;
const Z_INDEX_FRONT = 95;
const Z_INDEX_BEHIND = 85;
const MOOD_RESET_DELAY = 3500;

type Direction = 'left' | 'right';

export function MascotPet() {
  const { locale } = useTranslation();
  const animationEnabled = useAnimationEnabled();
  const isMobile = useIsMobile();

  const { x, y, ready, persist, reset, windowSize } = useMascotPosition();
  const lines = useMascotLines(locale);

  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<MascotMode>('idle');
  const [roamingEnabled, setRoamingEnabled] = useState(true);
  const [direction, setDirection] = useState<Direction>('right');
  const [behind, setBehind] = useState(false);
  const [ledge, setLedge] = useState(false);
  const [mood, setMood] = useState<Mood>('neutral');
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zzzTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moodTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const justDraggedRef = useRef(false);

  const walkY = useMotionValue(0);
  const walkRotate = useMotionValue(0);
  const walkAnimYRef = useRef<ReturnType<typeof animate> | null>(null);
  const walkAnimRotateRef = useRef<ReturnType<typeof animate> | null>(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springConfig = { stiffness: 150, damping: 15 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);

  // Track mount state for client-only rendering.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Record user interaction and wake up from sleep.
  const touch = useCallback(() => {
    lastInteractionRef.current = Date.now();
    if (mode === 'sleeping') {
      setMode('idle');
      setMood('surprised');
      setBubbleText(null);
      if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
      moodTimerRef.current = setTimeout(() => setMood('neutral'), 1200);
    }
  }, [mode]);

  // Temporarily switch to a mood and then return to neutral.
  const expressMood = useCallback((nextMood: Mood, duration = MOOD_RESET_DELAY) => {
    setMood(nextMood);
    if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
    moodTimerRef.current = setTimeout(() => setMood('neutral'), duration);
  }, []);

  // Show a speech bubble and reset the idle timer.
  const speak = useCallback(
    (text: string) => {
      setBubbleText(text);
      touch();
    },
    [touch]
  );

  // Toggle autonomous roaming.
  const toggleRoaming = useCallback(() => {
    setRoamingEnabled((prev) => !prev);
    expressMood('curious', 2000);
    touch();
  }, [expressMood, touch]);

  // Toggle sleep mode.
  const toggleSleep = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'sleeping' ? 'idle' : 'sleeping';
      if (next === 'sleeping') {
        setMood('sleepy');
      } else {
        expressMood('surprised', 1200);
      }
      return next;
    });
    touch();
  }, [expressMood, touch]);

  // Reset the pet to the bottom-right corner.
  const resetPosition = useCallback(() => {
    reset();
    setBehind(false);
    setLedge(false);
    expressMood('happy', 2500);
    speak(locale === 'zh' ? '我回来啦！' : 'I am back!');
  }, [reset, expressMood, speak, locale]);

  // Trigger a context-aware or mood-aware line.
  const saySomething = useCallback(() => {
    speak(mood === 'neutral' ? lines.random() : lines.forMood(mood));
  }, [lines, mood, speak]);

  const menuItems: MascotMenuItem[] = [
    {
      id: 'roam',
      label: roamingEnabled
        ? locale === 'zh'
          ? '停止巡游'
          : 'Stop roaming'
        : locale === 'zh'
          ? '开始巡游'
          : 'Start roaming',
      onClick: toggleRoaming,
    },
    {
      id: 'sleep',
      label:
        mode === 'sleeping'
          ? locale === 'zh'
            ? '叫醒她'
            : 'Wake up'
          : locale === 'zh'
            ? '睡觉'
            : 'Sleep',
      onClick: toggleSleep,
    },
    {
      id: 'reset',
      label: locale === 'zh' ? '重置位置' : 'Reset position',
      onClick: resetPosition,
    },
    {
      id: 'speak',
      label: locale === 'zh' ? '说点什么' : 'Say something',
      onClick: saySomething,
    },
  ];

  // React to music, theme, preset, routing and scrolling.
  useMascotEvents({
    mode,
    locale,
    greeting: lines.greeting,
    expressMood,
    speak,
  });

  // Face follows the mouse cursor relative to the mascot center.
  useEffect(() => {
    if (!mounted || isMobile || mode === 'sleeping') return;

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = x.get() + MASCOT_SIZE / 2;
      const centerY = y.get() + MASCOT_SIZE / 2;
      const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
      const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);
      rotateY.set(deltaX * 10);
      rotateX.set(-deltaY * 10);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mounted, isMobile, mode, x, y, rotateX, rotateY]);

  // Fall asleep after a long idle period.
  useEffect(() => {
    if (!mounted || mode === 'dragging' || mode === 'sleeping' || !roamingEnabled) {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
      return;
    }

    sleepTimerRef.current = setTimeout(() => {
      setMode('sleeping');
      setMood('sleepy');
    }, SLEEP_DELAY);

    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, [mounted, mode, roamingEnabled, touch]);

  // Wake the pet on any user activity while she is sleeping.
  useEffect(() => {
    if (mode !== 'sleeping') return;

    const wake = () => touch();
    window.addEventListener('mousemove', wake);
    window.addEventListener('keydown', wake);
    window.addEventListener('pointerdown', wake);

    return () => {
      window.removeEventListener('mousemove', wake);
      window.removeEventListener('keydown', wake);
      window.removeEventListener('pointerdown', wake);
    };
  }, [mode, touch]);

  // Show an occasional zzz bubble while sleeping.
  useEffect(() => {
    if (mode !== 'sleeping') {
      if (zzzTimerRef.current) clearTimeout(zzzTimerRef.current);
      return;
    }

    const showZzz = () => {
      setBubbleText(lines.sleep());
      zzzTimerRef.current = setTimeout(showZzz, 5200);
    };

    zzzTimerRef.current = setTimeout(showZzz, 1200);
    return () => {
      if (zzzTimerRef.current) clearTimeout(zzzTimerRef.current);
    };
  }, [mode, lines]);

  // Walk-cycle animation for the sprite, mood-aware.
  useEffect(() => {
    walkAnimYRef.current?.stop();
    walkAnimRotateRef.current?.stop();

    if (!animationEnabled || mode === 'sleeping' || mode === 'dragging') {
      walkY.set(0);
      walkRotate.set(0);
      return;
    }

    const isDancing = mood === 'happy' || mood === 'love';
    const isSurprised = mood === 'surprised';

    if (mode === 'roaming' || isDancing) {
      const duration = isDancing ? 0.32 : 0.45;
      walkAnimYRef.current = animate(walkY, [0, -5, 0], {
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      });
      walkAnimRotateRef.current = animate(walkRotate, [-4, 4, -4], {
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      });
    } else if (isSurprised) {
      walkAnimYRef.current = animate(walkY, [0, -2, 0], {
        duration: 0.15,
        repeat: Infinity,
        ease: 'easeInOut',
      });
      walkAnimRotateRef.current = animate(walkRotate, [-6, 6, -6], {
        duration: 0.15,
        repeat: Infinity,
        ease: 'easeInOut',
      });
    } else {
      walkAnimYRef.current = animate(walkY, [0, -3, 0], {
        duration: 2.4,
        repeat: Infinity,
        ease: 'easeInOut',
      });
      walkAnimRotateRef.current = animate(walkRotate, [-2, 2, -2], {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      });
    }
  }, [animationEnabled, mode, mood, walkY, walkRotate]);

  // Roaming callbacks.
  const handleMoveStart = useCallback(
    (target: RoamTarget) => {
      setMode('roaming');
      setDirection(target.x >= x.get() ? 'right' : 'left');
      setBehind(target.behind);
      setLedge(target.ledge);
    },
    [x]
  );

  const handleMoveEnd = useCallback(() => {
    persist();
    setMode('idle');
  }, [persist]);

  useMascotRoaming({
    enabled: roamingEnabled && !menuOpen,
    mode,
    x,
    y,
    windowWidth: windowSize.width,
    windowHeight: windowSize.height,
    onMoveStart: handleMoveStart,
    onMoveEnd: handleMoveEnd,
  });

  const handleDragStart = useCallback(() => {
    setBubbleText(null);
    setMode('dragging');
    setBehind(false);
    setLedge(false);
    justDraggedRef.current = true;
  }, []);

  const handleDragEnd = useCallback(() => {
    persist();
    setMode('idle');
    touch();
    setTimeout(() => {
      justDraggedRef.current = false;
    }, 50);
  }, [persist, touch]);

  const handleClick = useCallback(() => {
    if (justDraggedRef.current) return;
    expressMood('happy', 2500);
    speak(mood === 'neutral' ? lines.random() : lines.forMood('happy'));
  }, [expressMood, justDraggedRef, lines, mood, speak]);

  const handleDoubleClick = useCallback(() => {
    expressMood('surprised', 600);
    setTimeout(() => expressMood('happy', 2500), 600);
    speak(locale === 'zh' ? '哇！好兴奋！' : 'Whee! So excited!');
    walkY.set(-12);
    animate(walkY, 0, { duration: 0.4, ease: 'easeOut' });
  }, [expressMood, locale, speak, walkY]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setMenuPos({ x: e.clientX, y: e.clientY });
      setMenuOpen(true);
      expressMood('curious', 2500);
      touch();
    },
    [expressMood, touch]
  );

  const dismissBubble = useCallback(() => {
    setBubbleText(null);
  }, []);

  // Cleanup mood timer on unmount.
  useEffect(() => {
    return () => {
      if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
    };
  }, []);

  if (!mounted || !ready || isMobile) return null;

  const zIndex = behind ? Z_INDEX_BEHIND : Z_INDEX_FRONT;

  return (
    <>
      <motion.div
        ref={containerRef}
        drag
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onContextMenu={handleContextMenu}
        onMouseEnter={touch}
        style={{
          x,
          y,
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex,
          cursor: mode === 'dragging' ? 'grabbing' : 'grab',
        }}
        className="pointer-events-auto relative"
        title="SAKU-CHAN"
      >
        <MascotBubble
          text={bubbleText ?? ''}
          visible={!!bubbleText}
          onDismiss={dismissBubble}
        />

        <motion.button
          type="button"
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          style={{
            y: walkY,
            rotateZ: ledge ? -75 : walkRotate,
            rotateX: rotateXSpring,
            rotateY: rotateYSpring,
            scaleX: direction === 'left' ? -1 : 1,
            scaleY: ledge ? 0.85 : 1,
            transformPerspective: 200,
            imageRendering: 'pixelated',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: mode === 'dragging' ? 'grabbing' : 'pointer',
            opacity: mode === 'sleeping' ? 0.7 : 1,
            filter:
              mood === 'love'
                ? 'brightness(1.1) sepia(0.2) hue-rotate(300deg)'
                : mood === 'sleepy'
                  ? 'grayscale(0.3)'
                  : undefined,
          }}
          className="relative w-16 h-16 block"
        >
          <img
            src="/image/mascot/saku-chan.png"
            alt="SAKU-CHAN"
            className="w-full h-full object-contain drop-shadow-md"
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
          />
        </motion.button>

        <MascotMoodOverlay mood={mood} />
      </motion.div>

      <MascotMenu
        open={menuOpen}
        x={menuPos.x}
        y={menuPos.y}
        items={menuItems}
        onClose={() => setMenuOpen(false)}
      />
    </>
  );
}
