'use client';

/**
 * Earth Online 地球展示容器。
 *
 * 仅渲染 Cesium 3D 地球（含卫星弹幕）；原中国区域地图与演示切换 UI 已移除。
 * 支持懒加载、全屏 / 退出全屏、运行指示与在线玩家统计。
 */
import { memo, useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Globe, Maximize2, X, Play } from 'lucide-react';
import { LoadingPlaceholder } from '@/components/ui/loading-placeholder';
import { useTheme, useTranslation } from '@/hooks';

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

interface GlobeSceneProps {
  isDark: boolean;
  isLoaded: boolean;
  onLoad: () => void;
}

const GlobeScene = ({ isDark, isLoaded, onLoad }: GlobeSceneProps) => {
  const { t } = useTranslation();

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
            <button onClick={onLoad} className="flex flex-col items-center gap-3">
              <Play className="w-10 h-10" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {t.earth.loadScene}
              </span>
            </button>
          </motion.div>
        </div>
      )}

      {isLoaded && (
        <Suspense fallback={<LoadingPlaceholder />}>
          <CesiumGlobe isDark={isDark} />
        </Suspense>
      )}
    </div>
  );
};

export interface GlobeShowcaseProps {
  /** Container class name. */
  className?: string;
}

/** Earth Online showcase: a single Cesium globe with fullscreen and status overlays. */
export const GlobeShowcase = memo(function GlobeShowcase({ className = '' }: GlobeShowcaseProps) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme !== 'light';

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

  // Auto-load the globe on mount (no manual click needed on this page).
  useEffect(() => {
    setIsLoaded(true);
  }, []);

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
        <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="flex items-center gap-2 px-3 py-1.5 shrink-0"
              style={{
                background: 'var(--bg-primary)',
                border: '2px solid var(--accent-primary)',
              }}
            >
              <Globe className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span
                className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}
              >
                {t.earth.earthOnlineTitle}
              </span>
            </div>

            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 shrink-0"
              style={{
                background: 'var(--bg-primary)',
                border: '2px solid var(--accent-primary)',
              }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
              >
                {t.earth.renderer}
              </span>
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}
              >
                Cesium
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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

        {/* Content area */}
        <div className="absolute inset-0 pt-16">
          <GlobeScene isDark={isDark} isLoaded={isLoaded} onLoad={handleLoad} />
        </div>

        {/* Online players stats */}
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
});

export default GlobeShowcase;
