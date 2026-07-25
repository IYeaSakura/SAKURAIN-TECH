'use client';

/**
 * Earth Online showcase container.
 * Reuses the 3D globe / map display from the homepage hero section.
 * Supports fullscreen, effect switching and lazy loading of 3D assets.
 */
import { memo, useState, useCallback, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Map, Maximize2, X, Layers, ChevronDown, Play } from 'lucide-react';
import { LoadingPlaceholder } from '@/components/ui/loading-placeholder';
import { useTheme, useTranslation } from '@/hooks';
import type { Dictionary } from '@/i18n/types';

// Vendor-prefixed fullscreen APIs not covered by standard TS DOM types.
type VendorFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
};
type VendorFullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
  webkitFullscreenElement?: Element | null;
  msFullscreenElement?: Element | null;
};

const CesiumGlobe = lazy(() => import('./CesiumGlobe').then(m => ({ default: m.CesiumGlobe })));
const ChinaMap3D = lazy(() => import('./ChinaMap3D').then(m => ({ default: m.ChinaMap3D })));

export type DemoType = 'cesium' | 'chinamap';

export interface DemoConfig {
  id: DemoType;
  icon: typeof Globe;
  label: string;
  title: string;
  description: string;
}

export const getDemos = (earth: Dictionary['earth']): DemoConfig[] => [
  {
    id: 'cesium',
    icon: Globe,
    label: earth.cesiumLabel,
    title: earth.cesiumTitle,
    description: earth.cesiumDescription,
  },
  {
    id: 'chinamap',
    icon: Map,
    label: earth.chinaMapLabel,
    title: earth.chinaMapTitle,
    description: earth.chinaMapDescription,
  },
];

/** @deprecated Use getDemos(t.earth) for translated labels. */
export const DEMOS: DemoConfig[] = [
  {
    id: 'cesium',
    icon: Globe,
    label: 'Cesium Globe',
    title: 'Earth Online',
    description: 'Global real-time data visualization with CesiumJS 3D earth rendering',
  },
  {
    id: 'chinamap',
    icon: Map,
    label: 'China Map',
    title: 'Earth Online - China',
    description: 'High-precision 3D China map with stereo terrain rendering',
  },
];

interface DemoContentProps {
  demo: {
    type: DemoType;
    isFullscreen: boolean;
    onFullscreenToggle: () => void;
  };
  isDark: boolean;
  isLoaded: boolean;
  onLoad: () => void;
}

const DemoContent = ({ demo, isDark, isLoaded, onLoad }: DemoContentProps) => {
  const { t } = useTranslation();
  const isCesium = demo.type === 'cesium';
  const isChinaMap = demo.type === 'chinamap';

  return (
    <div className="relative w-full h-full">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center gap-3 p-6 rounded-xl"
            style={{
              background: 'var(--bg-card)',
              border: '2px solid var(--accent-primary)',
              boxShadow: '0 0 30px var(--accent-glow)',
            }}
          >
            <button
              onClick={onLoad}
              className="flex flex-col items-center gap-3"
            >
              <Play className="w-10 h-10" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {t.earth.loadScene}
              </span>
            </button>
          </motion.div>
        </div>
      )}

      {isLoaded && (
        <div
          className="absolute inset-0 transition-opacity duration-500 ease-in-out"
          style={{
            opacity: isCesium ? 1 : 0,
            pointerEvents: isCesium ? 'auto' : 'none',
            zIndex: isCesium ? 1 : 0,
          }}
        >
          <Suspense fallback={<LoadingPlaceholder />}>
            <CesiumGlobe isDark={isDark} />
          </Suspense>
        </div>
      )}

      {isLoaded && (
        <div
          className="absolute inset-0 transition-opacity duration-500 ease-in-out"
          style={{
            opacity: isChinaMap ? 1 : 0,
            pointerEvents: isChinaMap ? 'auto' : 'none',
            zIndex: isChinaMap ? 1 : 0,
          }}
        >
          <Suspense fallback={<LoadingPlaceholder />}>
            <ChinaMap3D isDark={isDark} />
          </Suspense>
        </div>
      )}
    </div>
  );
};

const getDemoConfig = (demos: DemoConfig[], demo: DemoType): DemoConfig => {
  return demos.find(d => d.id === demo) || demos[0];
};

const getNextDemo = (demos: DemoConfig[], current: DemoType): DemoType => {
  const currentIndex = demos.findIndex(d => d.id === current);
  const nextIndex = (currentIndex + 1) % demos.length;
  return demos[nextIndex].id as DemoType;
};

export interface GlobeShowcaseProps {
  /** Whether to render as a standalone page mode (fills the right-hand area). */
  pageMode?: boolean;
  /** Initial demo type to display. */
  initialDemo?: DemoType;
  /** Container class name. */
  className?: string;
}

/**
 * Earth Online showcase container.
 *
 * Features:
 * - Supports two display modes: 3D globe and China map.
 * - Supports fullscreen / exit fullscreen.
 * - Supports effect switching.
 * - Lazily loads 3D assets after a user click.
 */
export const GlobeShowcase = memo(function GlobeShowcase({
  pageMode = false,
  initialDemo = 'cesium',
  className = ''
}: GlobeShowcaseProps) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [currentDemo, setCurrentDemo] = useState<DemoType>(initialDemo);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme !== 'light';
  const demos = useMemo(() => getDemos(t.earth), [t.earth]);
  const demoConfig = getDemoConfig(demos, currentDemo);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const enterFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      const el = container as VendorFullscreenElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      const doc = document as VendorFullscreenDocument;
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      }
    } catch (error) {
      console.error('Exit fullscreen error:', error);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as VendorFullscreenDocument;
      const isFs = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isFs);
      if (!isFs) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleSwitchDemo = useCallback(() => {
    setIsLoaded(false);
    setCurrentDemo(prev => getNextDemo(demos, prev));
  }, [demos]);

  const handleSelectDemo = useCallback((demoId: DemoType) => {
    setIsLoaded(false);
    setCurrentDemo(demoId);
    setShowDropdown(false);
  }, []);

  // Auto-load in page mode.
  useEffect(() => {
    if (pageMode && !isLoaded) {
      setIsLoaded(true);
    }
  }, [pageMode, isLoaded]);

  // Page mode layout
  if (pageMode) {
    return (
      <div
        ref={containerRef}
        className={`relative w-full h-full ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="relative w-full h-full"
          style={{
            background: 'var(--bg-secondary)',
            border: '2px solid',
            borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)',
            boxShadow: isHovered
              ? '4px 4px 0 var(--accent-primary)'
              : '4px 4px 0 var(--border-subtle)',
          }}
        >
          {/* Top control bar */}
          <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between">
            <div
              className="flex items-center gap-2 px-3 py-1.5"
              style={{
                background: 'var(--bg-primary)',
                border: '2px solid var(--accent-primary)',
              }}
            >
              <Globe className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}
              >
                {demoConfig.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Effect switch button */}
              <button
                onClick={handleSwitchDemo}
                className="flex items-center gap-1.5 px-3 py-1.5 transition-all duration-200 uppercase bg-[var(--bg-primary)] text-[var(--accent-primary)] border-2 border-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-[var(--bg-primary)]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                }}
                title={t.earth.switchEffects}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t.earth.switch}</span>
              </button>

              {/* Dropdown selector */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 transition-all duration-200 uppercase bg-[var(--bg-primary)] text-[var(--accent-primary)] border-2 border-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-[var(--bg-primary)]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                  }}
                >
                  <demoConfig.icon className="w-3.5 h-3.5" />
                  <span>{demoConfig.label}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full right-0 mt-2 w-40 z-50"
                      style={{
                        background: 'var(--bg-primary)',
                        border: '2px solid var(--accent-primary)',
                        boxShadow: '4px 4px 0 var(--accent-primary)',
                      }}
                    >
                      {DEMOS.map((demo) => {
                        const Icon = demo.icon;
                        const isActive = currentDemo === demo.id;
                        return (
                          <button
                            key={demo.id}
                            onClick={() => handleSelectDemo(demo.id)}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-left transition-all duration-200 uppercase hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-primary)]"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '10px',
                              letterSpacing: '0.05em',
                              background: isActive ? 'var(--accent-primary)' : 'var(--bg-primary)',
                              color: isActive ? 'var(--bg-primary)' : 'var(--text-muted)',
                              borderBottom: '2px solid var(--border-subtle)',
                              cursor: 'pointer',
                            }}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{demo.label}</span>
                            {isActive && (
                              <span className="ml-auto w-1.5 h-1.5" style={{ background: 'var(--bg-primary)' }} />
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Fullscreen button */}
              <button
                onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                className="flex items-center justify-center w-8 h-8 transition-all duration-200 bg-[var(--bg-primary)] text-[var(--accent-primary)] border-2 border-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-[var(--bg-primary)]"
                style={{ cursor: 'pointer' }}
                title={isFullscreen ? t.earth.exitFullscreen : t.earth.enterFullscreen}
              >
                {isFullscreen ? (
                  <X className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>

              <div
                className="flex items-center gap-1.5 ml-1 px-2 py-1"
                style={{
                  background: 'var(--bg-primary)',
                  border: '2px solid var(--border-subtle)',
                }}
              >
                <span className="w-2 h-2 animate-pulse" style={{ background: '#22c55e' }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
                >
                  {t.earth.running}
                </span>
              </div>
            </div>
          </div>

          {/* Renderer info tag */}
          <div className="absolute top-14 left-4 z-30 flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-1.5"
              style={{
                background: 'var(--bg-primary)',
                border: '2px solid var(--accent-primary)',
              }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
              >
                {t.earth.renderer}
              </span>
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}
              >
                {currentDemo === 'cesium' ? 'Cesium' : 'Three.js'}
              </span>
            </div>
          </div>

          {/* Content area */}
          <div
            className="absolute inset-0 pt-24 globe-showcase-content"
          >
            <DemoContent
              demo={{
                type: currentDemo,
                isFullscreen,
                onFullscreenToggle: isFullscreen ? exitFullscreen : enterFullscreen
              }}
              isDark={isDark}
              isLoaded={isLoaded}
              onLoad={handleLoad}
            />
          </div>

          {/* Bottom cesium stats */}
          {currentDemo === 'cesium' && (
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5"
                style={{
                  background: 'var(--bg-primary)',
                  border: '2px solid var(--border-subtle)',
                }}
              >
                <span className="w-1.5 h-1.5 animate-pulse" style={{ background: '#22c55e' }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
                >
                  {t.earth.globalPlayers}
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}
                >
                  8.045B
                </span>
                <span
                  className="ml-3 text-[10px] font-bold uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
                >
                  {t.earth.chinaPlayers}:
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}
                >
                  1.412B
                </span>
              </div>
            </div>
          )}

          {/* Decorative corner brackets */}
          <div className="absolute top-0 right-0 w-20 h-20 opacity-30">
            <div className="absolute top-3 right-3 w-8 h-0.5" style={{ background: 'var(--accent-primary)' }} />
            <div className="absolute top-3 right-3 w-0.5 h-8" style={{ background: 'var(--accent-primary)' }} />
          </div>
          <div className="absolute bottom-0 left-0 w-20 h-20 opacity-30">
            <div className="absolute bottom-3 left-3 w-8 h-0.5" style={{ background: 'var(--accent-primary)' }} />
            <div className="absolute bottom-3 left-3 w-0.5 h-8" style={{ background: 'var(--accent-primary)' }} />
          </div>
        </div>
      </div>
    );
  }

  // Homepage mode - original card style.
  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`relative hidden xl:block ${isFullscreen ? 'fixed inset-0 z-50 flex items-center justify-center bg-black fullscreen-container' : 'xl:mr-[-60px] 2xl:mr-[-100px]'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isFullscreen && isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.2 }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-lg pointer-events-none"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--accent-primary)',
            boxShadow: '0 4px 12px var(--accent-glow)',
          }}
        >
          <span className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--accent-primary)' }}>
            {t.earth.doubleClickFullscreen}
          </span>
          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
            style={{
              background: 'var(--bg-card)',
              borderRight: '1px solid var(--accent-primary)',
              borderBottom: '1px solid var(--accent-primary)',
            }}
          />
        </motion.div>
      )}

      {!isFullscreen && (
        <div
          className="absolute -inset-4 rounded-3xl transition-all duration-500"
          style={{
            background: isHovered
              ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary), var(--accent-tertiary), var(--accent-primary))'
              : 'transparent',
            backgroundSize: '300% 300%',
            animation: isHovered ? 'gradient-shift 4s ease infinite' : 'none',
            opacity: isHovered ? 0.5 : 0,
            filter: 'blur(20px)',
          }}
        />
      )}

      <div
        className={`relative rounded-2xl overflow-hidden transition-all duration-500 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-[500px] h-[500px]'
        }`}
        style={{
          background: '#0D0D0D',
          border: isFullscreen ? 'none' : '2px solid',
          borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)',
          boxShadow: isHovered && !isFullscreen
            ? '0 25px 50px -12px var(--accent-glow), inset 0 0 60px var(--accent-primary)10'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span
              className="text-sm font-bold tracking-wider"
              style={{
                color: 'var(--accent-primary)',
                textShadow: '0 0 10px var(--accent-glow)',
              }}
            >
              {demoConfig.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {!isFullscreen && (
              <button
                onClick={handleSwitchDemo}
                className="flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200 hover:bg-white/10"
                style={{
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  cursor: 'pointer',
                }}
                title={t.earth.switchEffects}
              >
                <Layers className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />
              </button>
            )}

            <button
              onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              className="flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200 hover:bg-white/10"
              style={{
                border: '1px solid rgba(59, 130, 246, 0.3)',
                background: 'rgba(0, 0, 0, 0.5)',
                cursor: 'pointer',
              }}
              title={isFullscreen ? t.earth.exitFullscreen : t.earth.enterFullscreen}
            >
              {isFullscreen ? (
                <X className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />
              )}
            </button>

            <div className="flex items-center gap-1.5 ml-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.earth.running}</span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isFullscreen && (
            <>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute top-14 left-4 z-30 flex items-center gap-3"
              >
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.earth.renderer}</span>
                  <span className="text-xs font-mono font-bold" style={{ color: '#fbbf24' }}>
                    {currentDemo === 'cesium' ? 'Cesium' : 'Three.js'}
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-14 left-4 right-4 z-30 flex items-center justify-center gap-4"
              >
                <button
                  onClick={handleSwitchDemo}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white/10"
                  style={{
                    border: '1px solid rgba(59, 130, 246, 0.5)',
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Layers className="w-4 h-4" style={{ color: '#60a5fa' }} />
                  <span className="text-sm font-medium" style={{ color: '#60a5fa' }}>{t.earth.switchEffects}</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
                    style={{
                      border: '1px solid rgba(59, 130, 246, 0.5)',
                      background: 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <demoConfig.icon className="w-4 h-4" style={{ color: '#60a5fa' }} />
                    <span className="text-sm font-medium" style={{ color: '#60a5fa' }}>{demoConfig.label}</span>
                    <ChevronDown className="w-4 h-4" style={{ color: '#60a5fa' }} />
                  </button>

                  <AnimatePresence>
                    {showDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 mt-2 w-40 rounded-lg overflow-hidden"
                        style={{
                          background: 'rgba(0, 0, 0, 0.8)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                        }}
                      >
                        {DEMOS.map((demo) => {
                          const Icon = demo.icon;
                          const isActive = currentDemo === demo.id;
                          return (
                            <button
                              key={demo.id}
                              onClick={() => handleSelectDemo(demo.id)}
                              className="flex items-center gap-2 w-full px-4 py-2.5 text-left transition-all duration-200 hover:bg-white/10"
                            >
                              <Icon
                                className="w-4 h-4"
                                style={{ color: isActive ? '#60a5fa' : 'rgba(156, 163, 175, 0.8)' }}
                              />
                              <span
                                className="text-sm"
                                style={{ color: isActive ? '#60a5fa' : 'rgba(156, 163, 175, 0.8)' }}
                              >
                                {demo.label}
                              </span>
                              {isActive && (
                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                              )}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div
          className={`absolute inset-0 ${isFullscreen ? 'pt-24' : 'pt-8'} globe-showcase-content`}
          onDoubleClick={isFullscreen ? undefined : enterFullscreen}
        >
          <DemoContent
            demo={{
              type: currentDemo,
              isFullscreen,
              onFullscreenToggle: isFullscreen ? exitFullscreen : enterFullscreen
            }}
            isDark={isDark}
            isLoaded={isLoaded}
            onLoad={handleLoad}
          />
        </div>

        {currentDemo === 'cesium' && (
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
              <span style={{ color: 'var(--text-muted)' }}>{t.earth.globalPlayers}</span>
              <span className="font-mono font-bold" style={{ color: '#60a5fa' }}>8.045B</span>
              <span className="ml-3" style={{ color: 'var(--text-muted)' }}>{t.earth.chinaPlayers}:</span>
              <span className="font-mono font-bold" style={{ color: '#fbbf24' }}>1.412B</span>
            </div>
          </div>
        )}

        <div className="absolute top-0 right-0 w-20 h-20 opacity-30">
          <div className="absolute top-3 right-3 w-8 h-px" style={{ background: 'var(--accent-primary)' }} />
          <div className="absolute top-3 right-3 w-px h-8" style={{ background: 'var(--accent-primary)' }} />
        </div>
        <div className="absolute bottom-0 left-0 w-20 h-20 opacity-30">
          <div className="absolute bottom-3 left-3 w-8 h-px" style={{ background: 'var(--accent-primary)' }} />
          <div className="absolute bottom-3 left-3 w-px h-8" style={{ background: 'var(--accent-primary)' }} />
        </div>
      </div>
    </motion.div>
  );
});

export default GlobeShowcase;
