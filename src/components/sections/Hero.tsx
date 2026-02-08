import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { motion,
AnimatePresence } from 'framer-motion';
import { ArrowRight, Terminal, Cpu, Code2, Sparkles, ChevronDown, Globe, Map, Maximize2, X, Layers, Terminal as TerminalIcon } from 'lucide-react';
import {
  AmbientGlow,
  TwinklingStars,
  WebTerminal,
} from '@/components/effects';
import { CesiumGlobe } from '@/components/effects/CesiumGlobe';
import { ChinaMap3D } from '@/components/effects/ChinaMap3D';
import { GradientText } from '@/components/effects/TextEffects';
import { useTheme } from '@/hooks';
import { usePrefersReducedMotion, useThrottledScroll, useIsMobile } from '@/lib/performance';
import type { SiteData } from '@/types';



interface DemoConfig {
  id: DemoType;
  icon: typeof Globe;
  label: string;
  title: string;
}

const DEMOS: DemoConfig[] = [
  { id: 'cesium', icon: Globe, label: 'Cesium 地球', title: '地球Online' },
  { id: 'chinamap', icon: Map, label: '中国地图', title: '地球Online-国服' },
  { id: 'terminal', icon: TerminalIcon, label: 'Web终端', title: 'WebContainer Terminal' },
];

type DemoType = 'cesium' | 'chinamap' | 'terminal';

// FPS 计数器 Hook
function useFPS() {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let rafId: number;

    const updateFPS = () => {
      frameCount.current++;
      const now = performance.now();
      const delta = now - lastTime.current;

      if (delta >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / delta));
        frameCount.current = 0;
        lastTime.current = now;
      }

      rafId = requestAnimationFrame(updateFPS);
    };

    rafId = requestAnimationFrame(updateFPS);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return fps;
}

interface HeroProps {
  data: SiteData['hero'];
}

// 使用 CSS 动画替代 JS 动画 - 性能更好
const CodeDecoration = memo(({ className }: { className?: string }) => {
  return (
    <div
      className={`absolute font-mono text-xs sm:text-sm opacity-20 pointer-events-none animate-float-slow ${className}`}
    >
      <div className="text-[var(--accent-primary)]">{'<System.init>'}</div>
      <div className="text-[var(--accent-secondary)] ml-2">performance: optimized</div>
      <div className="text-[var(--accent-tertiary)] ml-2">status: ready</div>
      <div className="text-[var(--text-muted)]">{'</System.init>'}</div>
    </div>
  );
});

CodeDecoration.displayName = 'CodeDecoration';

// 简化浮动图标 - 纯 CSS 动画
const FloatingIcon = memo(({
  icon: Icon,
  className,
  color = 'var(--accent-primary)'
}: {
  icon: typeof Terminal;
  className?: string;
  color?: string;
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className={`absolute ${className} opacity-30`}>
        <Icon className="w-6 h-6 sm:w-8 sm:h-8" style={{ color }} />
      </div>
    );
  }

  return (
    <div className={`absolute ${className} opacity-30 animate-float`}>
      <Icon className="w-6 h-6 sm:w-8 sm:h-8" style={{ color }} />
    </div>
  );
});

FloatingIcon.displayName = 'FloatingIcon';

// 统计卡片 - 带光效
const StatCard = memo(({
  stat,
  index,
}: {
  stat: { value: string; label: string };
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const color = 'var(--accent-primary)';

  if (prefersReducedMotion || isMobile) {
    return (
      <div
        className="relative p-5 sm:p-6 text-center overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '3px solid var(--border-subtle)',
        }}
      >
        <div
          className="font-primary text-3xl sm:text-4xl font-extrabold mb-2"
          style={{ color: 'var(--accent-primary)' }}
        >
          {stat.value}
        </div>
        <div
          className="font-primary text-xs sm:text-sm font-bold uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          {stat.label}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.6 + index * 0.1,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative cursor-default group"
      style={{ perspective: '1000px' }}
    >
      {/* 发光边框效果 */}
      <div
        className="absolute -inset-[2px] rounded-lg transition-opacity duration-500"
        style={{
          background: isHovered
            ? `linear-gradient(45deg, var(--accent-primary), var(--accent-secondary), var(--accent-tertiary), var(--accent-primary))`
            : 'transparent',
          backgroundSize: '300% 300%',
          animation: isHovered ? 'gradient-shift 3s ease infinite' : 'none',
          opacity: isHovered ? 1 : 0,
          filter: 'blur(4px)',
          zIndex: -1,
        }}
      />
      <div
        className="relative p-5 sm:p-6 text-center overflow-hidden transition-all duration-300"
        style={{
          background: 'var(--bg-card)',
          border: '3px solid',
          borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)',
          transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'none',
          boxShadow: isHovered
            ? `0 20px 40px var(--accent-glow), 0 0 30px ${color}20, inset -4px -4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 4px 4px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)`
            : 'inset -4px -4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 4px 4px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)',
        }}
      >
        {/* Glow background - 顶部径向渐变 */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${color}20, transparent 60%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Shine effect - 斜向光泽 */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${color}15 45%, ${color}30 50%, ${color}15 55%, transparent 60%)`,
            transform: 'translateX(-100%)',
          }}
          animate={isHovered ? { x: '200%' } : { x: '-100%' }}
          transition={{ duration: 0.6 }}
        />

        {/* 内容 */}
        <div
          className="font-primary text-3xl sm:text-4xl font-extrabold mb-2 transition-all duration-300 relative z-10"
          style={{
            color: 'var(--accent-primary)',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            textShadow: isHovered ? `0 0 20px ${color}, 0 0 40px ${color}40` : 'none',
          }}
        >
          {stat.value}
        </div>
        <div
          className="font-primary text-xs sm:text-sm font-bold uppercase tracking-wider relative z-10"
          style={{ color: 'var(--text-secondary)' }}
        >
          {stat.label}
        </div>
      </div>
    </motion.div>
  );
});

StatCard.displayName = 'StatCard';

// 主按钮 - 带光效
const PrimaryButton = memo(({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex items-center gap-3 overflow-hidden font-primary rounded-xl transition-all duration-300"
      style={{
        padding: '18px 36px',
        fontSize: 'var(--text-base)',
        fontWeight: 700,
        letterSpacing: '0.05em',
        color: 'white',
        background: 'linear-gradient(135deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 80%, var(--accent-secondary)))',
        boxShadow: isHovered
          ? '0 8px 30px var(--accent-glow), 0 0 60px var(--accent-primary)40, inset 0 0 20px rgba(255,255,255,0.2)'
          : '0 4px 20px var(--accent-glow)',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* 光效背景 */}
      <div
        className="absolute inset-0 transition-transform duration-600"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
          transition: 'transform 0.6s ease',
        }}
      />
      {/* 脉冲光环 */}
      <div
        className="absolute inset-0 rounded-xl transition-opacity duration-300"
        style={{
          boxShadow: `inset 0 0 20px rgba(255,255,255,0.3), 0 0 30px var(--accent-primary)`,
          opacity: isHovered ? 0.6 : 0,
        }}
      />
      <span className="relative z-10 flex items-center gap-2">
        {children}
        <span className="animate-bounce-x">
          <ArrowRight className="w-5 h-5" />
        </span>
      </span>
    </button>
  );
});

PrimaryButton.displayName = 'PrimaryButton';

// 次要按钮 - 带光效
const SecondaryButton = memo(({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex items-center gap-3 overflow-hidden font-primary rounded-xl transition-all duration-300"
      style={{
        padding: '18px 36px',
        fontSize: 'var(--text-base)',
        fontWeight: 700,
        letterSpacing: '0.05em',
        color: isHovered ? 'var(--accent-primary)' : 'var(--text-primary)',
        background: 'transparent',
        border: '2px solid',
        borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)',
        boxShadow: isHovered
          ? '0 0 30px var(--accent-glow), inset 0 0 20px var(--accent-primary)10'
          : 'none',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* 悬停光晕 */}
      <div
        className="absolute inset-0 rounded-xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at center, var(--accent-primary)20, transparent 70%)`,
          opacity: isHovered ? 1 : 0,
        }}
      />
      <span className="relative z-10">{children}</span>
    </button>
  );
});

SecondaryButton.displayName = 'SecondaryButton';

// 发光徽章
const GlowBadge = memo(({ text }: { text: string }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  if (prefersReducedMotion || isMobile) {
    return (
      <div className="inline-flex items-center gap-2 mb-6 sm:mb-8 relative">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{
            background: 'var(--bg-card)',
            border: '2px solid var(--accent-primary)',
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--accent-primary)' }}
          />
          <span
            className="font-primary text-sm font-bold uppercase tracking-wider"
            style={{ color: 'var(--accent-primary)' }}
          >
            {text}
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="inline-flex items-center gap-2 mb-6 sm:mb-8 relative"
    >
      {/* 外发光 */}
      <div
        className="absolute -inset-2 rounded-xl animate-pulse-glow"
        style={{
          background: `linear-gradient(45deg, var(--accent-primary), var(--accent-secondary))`,
          filter: 'blur(15px)',
          opacity: 0.4,
          zIndex: -1,
        }}
      />
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 relative overflow-hidden group"
        style={{
          background: 'var(--bg-card)',
          border: '2px solid color-mix(in srgb, var(--accent-primary) 80%, transparent)',
          boxShadow: '0 0 20px var(--accent-glow), inset 0 0 10px var(--accent-primary)10',
        }}
      >
        {/* 内部光效 */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(90deg, transparent, var(--accent-primary)20, transparent)`,
          }}
        />
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            background: 'var(--accent-primary)',
            boxShadow: '0 0 10px var(--accent-primary), 0 0 20px var(--accent-primary)',
          }}
        />
        <span
          className="font-primary text-sm font-bold uppercase tracking-wider relative z-10"
          style={{ color: 'var(--accent-primary)' }}
        >
          {text}
        </span>
      </div>
    </motion.div>
  );
});

GlowBadge.displayName = 'GlowBadge';

// 发光标题
const GlowTitle = memo(({ children }: { children: React.ReactNode }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  if (prefersReducedMotion || isMobile) {
    return (
      <div className="overflow-hidden mb-6 sm:mb-8">
        <h1
          className="font-primary"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {children}
        </h1>
      </div>
    );
  }

  return (
    <div className="overflow-hidden mb-6 sm:mb-8 relative">
      {/* 多层光晕 */}
      <div
        className="absolute inset-0 pointer-events-none animate-pulse-slow"
        style={{
          background: 'radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, var(--accent-primary)20 0%, transparent 50%)',
          filter: 'blur(40px)',
          animation: 'pulse-glow 3s ease-in-out infinite',
        }}
      />
      <motion.h1
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{
          duration: 0.8,
          ease: [0.16, 1, 0.3, 1],
          delay: 0.1,
        }}
        className="font-primary relative"
        style={{
          fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          textShadow: `
            4px 4px 0 color-mix(in srgb, var(--bg-secondary) 50%, black),
            0 0 40px var(--accent-glow),
            0 0 80px var(--accent-glow),
            0 0 120px var(--accent-primary)40
          `,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        {children}
      </motion.h1>
    </div>
  );
});

GlowTitle.displayName = 'GlowTitle';

// 发光滚动指示器
const GlowScrollIndicator = memo(({ onClick }: { onClick: () => void }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  if (prefersReducedMotion || isMobile) {
    return (
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer"
        onClick={onClick}
      >
        <span
          className="font-primary text-xs uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          向下滚动
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer group"
      onClick={onClick}
    >
      {/* 发光底座 */}
      <div
        className="absolute inset-0 -m-4 rounded-full transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle, var(--accent-primary)30, transparent 70%)`,
          filter: 'blur(10px)',
        }}
      />
      <div className="flex flex-col items-center gap-2 animate-bounce-slow relative">
        <span
          className="font-primary text-xs uppercase tracking-widest transition-colors duration-300"
          style={{ color: 'var(--text-muted)' }}
        >
          向下滚动
        </span>
        <ChevronDown
          className="w-6 h-6 transition-all duration-300 group-hover:scale-125"
          style={{
            color: 'var(--accent-primary)',
            filter: 'drop-shadow(0 0 10px var(--accent-primary))',
          }}
        />
      </div>
    </motion.div>
  );
});

GlowScrollIndicator.displayName = 'GlowScrollIndicator';

// 演示内容渲染
const DemoContent = ({ demo, isDark }: { demo: { type: DemoType; isFullscreen: boolean; onFullscreenToggle: () => void }; isDark: boolean }) => {
  switch (demo.type) {
    case 'cesium':
      return <CesiumGlobe isDark={isDark} />;
    case 'chinamap':
      return <ChinaMap3D isDark={isDark} />;
    case 'terminal':
      return <WebTerminal isFullscreen={demo.isFullscreen} onFullscreenToggle={demo.onFullscreenToggle} />;
    default:
      return <CesiumGlobe isDark={isDark} />;
  }
};

// 获取演示配置
const getDemoConfig = (demo: DemoType): DemoConfig => {
  return DEMOS.find(d => d.id === demo) || DEMOS[0];
};

// 获取下一个演示
const getNextDemo = (current: DemoType): DemoType => {
  const currentIndex = DEMOS.findIndex(d => d.id === current);
  const nextIndex = (currentIndex + 1) % DEMOS.length;
  return DEMOS[nextIndex].id as DemoType;
};

// 地球展示卡片
const GlobeShowcase = memo(() => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentDemo, setCurrentDemo] = useState<DemoType>('cesium');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme !== 'light';
  const fps = useFPS();

  const demoConfig = getDemoConfig(currentDemo);

  // 进入全屏
  const enterFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if ((container as any).webkitRequestFullscreen) {
        await (container as any).webkitRequestFullscreen();
      } else if ((container as any).msRequestFullscreen) {
        await (container as any).msRequestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  // 退出全屏
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error('Exit fullscreen error:', error);
    }
  }, []);

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
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

  // 切换下一个演示
  const handleSwitchDemo = useCallback(() => {
    setCurrentDemo(prev => getNextDemo(prev));
  }, []);

  // 选择特定演示
  const handleSelectDemo = useCallback((demoId: DemoType) => {
    setCurrentDemo(demoId);
    setShowDropdown(false);
  }, []);

  // 监听打开地球Online事件
  useEffect(() => {
    const handleOpenEarthOnline = () => {
      enterFullscreen();
    };

    window.addEventListener('open-earth-online', handleOpenEarthOnline);

    return () => {
      window.removeEventListener('open-earth-online', handleOpenEarthOnline);
    };
  }, [enterFullscreen]);

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
      {/* 双击全屏悬浮提示 - 放在最外层避免被裁剪 */}
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
            双击全屏体验
          </span>
          {/* 小三角箭头 */}
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

      {/* 外发光边框 */}
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

      {/* 主容器 */}
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
        {/* 顶部标签栏 */}
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

          {/* 右侧按钮组 */}
          <div className="flex items-center gap-1.5">
            {/* 切换按钮 - 在非全屏时显示 */}
            {!isFullscreen && (
              <button
                onClick={handleSwitchDemo}
                className="flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200 hover:bg-white/10"
                style={{
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  cursor: 'pointer',
                }}
                title="切换特效"
              >
                <Layers className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />
              </button>
            )}

            {/* 全屏/退出按钮 */}
            <button
              onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              className="flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200 hover:bg-white/10"
              style={{
                border: '1px solid rgba(59, 130, 246, 0.3)',
                background: 'rgba(0, 0, 0, 0.5)',
                cursor: 'pointer',
              }}
              title={isFullscreen ? "退出全屏" : "全屏观看"}
            >
              {isFullscreen ? (
                <X className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />
              )}
            </button>

            {/* 运行中状态 */}
            <div className="flex items-center gap-1.5 ml-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>运行中</span>
            </div>
          </div>
        </div>

        {/* 全屏模式下的控制栏 */}
        <AnimatePresence>
          {isFullscreen && (
            <>
              {/* 左上方 - 渲染器信息 */}
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
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>渲染器:</span>
                  <span className="text-xs font-mono font-bold" style={{ color: '#fbbf24' }}>
                    {currentDemo === 'cesium' ? 'Cesium' : 'Three.js'}
                  </span>
                </div>
              </motion.div>

              {/* 右上方 - FPS */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-4 right-32 z-30"
              >
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>FPS:</span>
                  <span className="text-xs font-mono font-bold" style={{ color: '#22c55e' }}>
                    {fps}
                  </span>
                </div>
              </motion.div>

              {/* 中间控制栏 - 切换按钮和下拉选择 */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-14 left-4 right-4 z-30 flex items-center justify-center gap-4"
              >
                {/* 切换按钮 */}
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
                  <span className="text-sm font-medium" style={{ color: '#60a5fa' }}>切换特效</span>
                </button>

                {/* 下拉选择 */}
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

                  {/* 下拉菜单 */}
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

        {/* WebGL 演示内容 */}
        <div
          className={`absolute inset-0 ${isFullscreen ? 'pt-24' : 'pt-8'}`}
          style={{ cursor: 'default' }}
          onDoubleClick={isFullscreen ? undefined : enterFullscreen}
        >
          <DemoContent
            key={currentDemo}
            demo={{
              type: currentDemo,
              isFullscreen,
              onFullscreenToggle: isFullscreen ? exitFullscreen : enterFullscreen
            }}
            isDark={isDark}
          />
        </div>

        {/* 底部信息 - 只在地球Online页显示 */}
        {currentDemo === 'cesium' && (
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
              <span style={{ color: 'var(--text-muted)' }}>全球玩家</span>
              <span className="font-mono font-bold" style={{ color: '#60a5fa' }}>80.45亿</span>
              <span className="ml-3" style={{ color: 'var(--text-muted)' }}>国服玩家:</span>
              <span className="font-mono font-bold" style={{ color: '#fbbf24' }}>14.12亿</span>
            </div>
          </div>
        )}

        {/* 角落装饰 */}
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

GlobeShowcase.displayName = 'GlobeShowcase';

export const Hero = memo(function Hero({ data }: HeroProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const { scrollY } = useThrottledScroll(16);

  // 计算滚动动画值
  const scrollProgress = Math.min(scrollY / 300, 1);
  const opacity = prefersReducedMotion ? 1 : 1 - scrollProgress;
  const scale = prefersReducedMotion ? 1 : 1 - scrollProgress * 0.1;

  const scrollToSection = useCallback((href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  }, [prefersReducedMotion]);

  const primaryCta = data.cta.find(c => c.primary);
  const secondaryCta = data.cta.find(c => !c.primary);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 静态网格背景 */}
      <div
        className="absolute inset-0 -z-20 pointer-events-none opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(var(--accent-primary) 1px, transparent 1px),
            linear-gradient(90deg, var(--accent-primary) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* 环境光效 - 桌面端显示 */}
      {!isMobile && (
        <>
          <AmbientGlow position="top-left" color="var(--accent-primary)" size={500} opacity={0.15} />
          <AmbientGlow position="bottom-right" color="var(--accent-secondary)" size={400} opacity={0.1} />

          {/* 闪烁星星 */}
          <div className="absolute inset-0">
            <TwinklingStars count={20} color="var(--accent-secondary)" secondaryColor="var(--mc-gold)" />
          </div>
        </>
      )}

      {/* 径向渐变遮罩 */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, var(--bg-primary) 70%)`,
        }}
      />

      {/* 浮动代码装饰 */}
      <CodeDecoration className="top-20 left-4 sm:left-10 hidden sm:block" />
      <CodeDecoration className="bottom-32 right-4 sm:right-10 hidden sm:block" />

      {/* 浮动图标 */}
      <FloatingIcon
        icon={Terminal}
        className="top-1/4 left-[5%] hidden lg:block"
        color="var(--accent-primary)"
      />
      <FloatingIcon
        icon={Cpu}
        className="top-1/3 right-[8%] hidden lg:block"
        color="var(--accent-secondary)"
      />
      <FloatingIcon
        icon={Code2}
        className="bottom-1/4 left-[10%] hidden lg:block"
        color="var(--accent-tertiary)"
      />
      <FloatingIcon
        icon={Sparkles}
        className="bottom-1/3 right-[5%] hidden lg:block"
        color="var(--mc-gold)"
      />

      {/* 主内容 - 左右布局 */}
      <div
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32"
        style={{
          opacity,
          transform: `scale(${scale})`,
          willChange: prefersReducedMotion ? undefined : 'transform, opacity',
        }}
      >
        <div className="flex items-center justify-between gap-8">
          {/* 左侧内容 */}
          <div className="flex-1 text-center xl:text-left">
            {/* 发光徽章 */}
            <GlowBadge text={data.badge} />

            {/* 发光标题 */}
            <GlowTitle>
              {data.title.split('竞争优势')[0]}
              <span className="relative">
                <GradientText animate={!prefersReducedMotion}>竞争优势</GradientText>
              </span>
            </GlowTitle>

            {/* 副标题 */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.3,
              }}
              className="mb-4 font-primary"
              style={{
                fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
                fontWeight: 600,
                color: 'var(--accent-secondary)',
                letterSpacing: '0.01em',
              }}
            >
              {data.subtitle}
            </motion.p>

            {/* 描述 */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.4,
              }}
              className="max-w-xl mx-auto xl:mx-0 mb-8 sm:mb-12 font-primary"
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 400,
                color: 'var(--text-muted)',
                lineHeight: 1.7,
              }}
            >
              {data.description}
            </motion.p>

            {/* CTA 按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.5,
              }}
              className="flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-4 mb-12"
            >
              {primaryCta && (
                <PrimaryButton onClick={() => scrollToSection(primaryCta.link)}>
                  {primaryCta.text}
                </PrimaryButton>
              )}
              {secondaryCta && (
                <SecondaryButton onClick={() => scrollToSection(secondaryCta.link)}>
                  {secondaryCta.text}
                </SecondaryButton>
              )}
            </motion.div>

            {/* 统计网格 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto xl:mx-0 relative">
              {/* 统计区域背景光晕 - 桌面端显示 */}
              {!isMobile && (
                <div
                  className="absolute inset-0 -z-10 rounded-3xl animate-pulse-slow"
                  style={{
                    background: 'radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                  }}
                />
              )}
              {data.stats.map((stat, index) => (
                <StatCard key={stat.label} stat={stat} index={index} />
              ))}
            </div>
          </div>

          {/* 右侧地球展示 */}
          <GlobeShowcase />
        </div>

      </div>

      {/* 发光滚动指示器 */}
      <GlowScrollIndicator onClick={() => scrollToSection('#services')} />

      {/* 底部渐变 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, var(--bg-primary), transparent)',
        }}
      />
    </section>
  );
});
