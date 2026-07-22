'use client';

/**
 * ClientEffects —— 全局布局层（迁移自旧 Vite 项目 src/main.tsx 的 GlobalLayout / PageLayout）。
 *
 * 承担职责：
 * - MobileProvider / PerformanceProvider 全局 Provider
 * - Navigation 顶部导航（按路径白名单显隐，usePathname 替代 useLocation）
 * - MusicPlayer 全局音乐播放器（ssr:false，挂在 layout 内切换页面不中断）
 * - GlobalContextMenu 自定义右键菜单
 * - DebugProtection 调试保护
 * - 全局特效层：MagneticCursor / VelocityCursor / TwinklingStars /
 *   FlowingGradient / LightBeam，保留旧版错峰加载策略（phase1~5）
 * - 首屏 Loading 覆盖层（LoadingPlaceholder）
 *
 * 与旧版差异：
 * - 旧版 isLoading 期间不渲染 children；Next 下改为固定定位覆盖层，
 *   children 始终挂载，避免阻塞 SSR/水合与重复挂载首页重组件。
 * - 旧版 react-lazy 的 preloadDocs/preloadBlog 等路由预加载已移除
 *   （Next 页面自带代码分割与预取）。
 */
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import { MobileProvider, useIsMobile } from '@/contexts/MobileContext';
import { PerformanceProvider, usePerformance } from '@/contexts/PerformanceContext';
import { useTheme } from '@/hooks';
import { Navigation } from '@/components/sections/Navigation';
import { GlobalContextMenu } from '@/components/CustomContextMenu';
import { DebugProtection } from '@/components/DebugProtection';
import { LoadingPlaceholder } from '@/components/ui/loading-placeholder';
import {
  MagneticCursor,
  VelocityCursor,
  TwinklingStars,
  FlowingGradient,
  LightBeam,
} from '@/components/effects';
import type { SiteData } from '@/types';

// 音乐播放器体积大且纯客户端，ssr:false 动态加载
const MusicPlayer = dynamic(
  () => import('@/components/MusicPlayer').then((m) => m.MusicPlayer),
  { ssr: false }
);

/**
 * 错峰加载 Hook - 控制特效和动画的渐进式加载（与旧版 main.tsx 一致）
 */
function useStaggeredLoad(isReady: boolean) {
  const [phases, setPhases] = useState({
    phase1: false, // 基础内容
    phase2: false, // 鼠标效果
    phase3: false, // 星星背景
    phase4: false, // 渐变背景
    phase5: false, // 光束效果
  });

  useEffect(() => {
    if (!isReady) return;

    const timers = [
      setTimeout(() => setPhases((p) => ({ ...p, phase1: true })), 0),
      setTimeout(() => setPhases((p) => ({ ...p, phase2: true })), 100),
      setTimeout(() => setPhases((p) => ({ ...p, phase3: true })), 300),
      setTimeout(() => setPhases((p) => ({ ...p, phase4: true })), 500),
      setTimeout(() => setPhases((p) => ({ ...p, phase5: true })), 700),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isReady]);

  return phases;
}

/**
 * 首屏加载管理器 - 加载关键资源（站点数据/字体）并就绪后放行，
 * 同时返回站点数据供 Navigation 使用（合并旧版 useInitialLoad 与
 * PageLayout 中重复的 site-data 拉取）。
 */
function useInitialLoad() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const { effectiveQuality } = usePerformance();

  useEffect(() => {
    let mounted = true;

    const loadCriticalResources = async () => {
      try {
        const [data] = await Promise.all([
          fetch(`/data/site-data.json?v=${Date.now()}`, { cache: 'no-store' })
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null),
          document.fonts.ready,
          new Promise((resolve) => requestAnimationFrame(resolve)),
        ]);

        if (effectiveQuality === 'low') {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }

        if (mounted) {
          setSiteData(data);
          setIsReady(true);
          setTimeout(() => {
            if (mounted) setIsLoading(false);
          }, 150);
        }
      } catch (error) {
        console.error('Failed to load critical resources:', error);
        if (mounted) {
          setIsReady(true);
          setIsLoading(false);
        }
      }
    };

    loadCriticalResources();

    return () => {
      mounted = false;
    };
  }, [effectiveQuality]);

  return { isReady, isLoading, siteData };
}

/** Navigation 显隐白名单（与旧版 PageLayout showNavPaths 一致） */
const SHOW_NAV_PATHS = [
  '/',
  '/blog',
  '/docs',
  '/friends',
  '/friends-circle',
  '/about',
  '/notes',
  '/earth-online',
  '/studio',
  '/algo-viz',
  '/projects',
  '/dev-log',
  '/tools',
];

function GlobalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isMobile = useIsMobile();
  const { enableMouseEffects, effectiveQuality } = usePerformance();
  const { theme, isTransitioning, toggleTheme } = useTheme();
  const { isReady, isLoading, siteData } = useInitialLoad();
  const phases = useStaggeredLoad(isReady);

  // 根据性能级别调整特效参数（与旧版一致）
  const starCount =
    effectiveQuality === 'low' ? 10 : effectiveQuality === 'medium' ? 20 : 30;
  const gradientSpeed = effectiveQuality === 'low' ? 25 : 18;
  const gradientOpacity = effectiveQuality === 'low' ? 0.02 : 0.04;
  const beamIntensity = effectiveQuality === 'low' ? 0.15 : 0.25;

  const enableEffects = isReady && effectiveQuality !== 'low';

  // 导航显隐：白名单 + /tools/* + /docs/*；/blog 仅列表页
  const shouldShowNav =
    SHOW_NAV_PATHS.includes(pathname) ||
    pathname.startsWith('/tools/') ||
    pathname.startsWith('/docs/');
  // 算法可视化页面导航不固定
  const isStickyNav = pathname !== '/algo-viz';

  return (
    <>
      <GlobalContextMenu />
      <DebugProtection />
      <Toaster position="top-center" />

      {/* 全局鼠标指针效果 - 错峰加载 */}
      {phases.phase2 && !isMobile && enableMouseEffects && (
        <>
          <MagneticCursor />
          <VelocityCursor />
        </>
      )}

      {/* 首页专属背景特效 - 错峰加载 */}
      {enableEffects && isHomePage && (
        <>
          {phases.phase3 && (
            <div className="fixed inset-0 pointer-events-none z-0">
              <TwinklingStars
                count={starCount}
                color="var(--accent-primary)"
                secondaryColor="var(--accent-secondary)"
                shootingStars={effectiveQuality === 'high'}
              />
            </div>
          )}

          {phases.phase4 && (
            <div className="fixed inset-0 pointer-events-none z-0">
              <FlowingGradient
                colors={[
                  'var(--accent-primary)',
                  'var(--accent-secondary)',
                  'var(--accent-tertiary)',
                ]}
                speed={gradientSpeed}
                opacity={gradientOpacity}
              />
            </div>
          )}

          {phases.phase5 && (
            <LightBeam
              position="top"
              color="var(--accent-primary)"
              intensity={beamIntensity}
            />
          )}
        </>
      )}

      {/* 顶部导航（按路径白名单显隐） */}
      {shouldShowNav && siteData?.navigation && (
        <Navigation
          data={siteData.navigation}
          theme={theme}
          onThemeToggle={toggleTheme}
          isThemeTransitioning={isTransitioning}
          sticky={isStickyNav}
        />
      )}

      {children}

      {/* 全局音乐播放器 - 挂在 layout 内，切换页面不会中断 */}
      <MusicPlayer />

      {/* 首屏 Loading 覆盖层：children 保持挂载，加载完成后移除 */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999]">
          <LoadingPlaceholder />
        </div>
      )}
    </>
  );
}

export default function ClientEffects({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileProvider>
      <PerformanceProvider>
        <GlobalShell>{children}</GlobalShell>
      </PerformanceProvider>
    </MobileProvider>
  );
}
