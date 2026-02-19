import { StrictMode, useEffect, useState, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router';
import './index.css';
import './styles/globals.css';
import App from './App.tsx';
import { GlobalContextMenu } from '@/components/CustomContextMenu';
import { DebugProtection } from '@/components/DebugProtection';
import { MusicPlayer } from '@/components/MusicPlayer';
import { Navigation } from '@/components/sections/Navigation';
import { useTheme, useIsMobile } from '@/hooks';
import { PerformanceProvider, usePerformance } from '@/contexts/PerformanceContext';
import { MobileProvider } from '@/contexts/MobileContext';
import { RouteLoader } from '@/components/RouterTransition';
import { LoadingPlaceholder } from '@/components/ui/loading-placeholder';
import type { SiteData } from '@/types';
import {
  MagneticCursor,
  VelocityCursor,
  TwinklingStars,
  FlowingGradient,
  LightBeam,
} from '@/components/effects';

// 处理静态部署硬跳转重定向
function RedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = sessionStorage.getItem('spa-redirect');
    if (redirect) {
      sessionStorage.removeItem('spa-redirect');
      navigate(redirect, { replace: true });
    }
  }, [navigate]);

  return null;
}

// 路由懒加载（代码分割）- 使用统一的加载占位符
const DocsPage = lazy(() => import('./pages/Docs/index'));
const FriendsPage = lazy(() => import('./pages/Friends/index'));
const FeedPage = lazy(() => import('./pages/Feed/index'));
const BlogPage = lazy(() => import('./pages/Blog/index'));
const BlogPostPage = lazy(() => import('./pages/Blog/[slug]'));
const NotesPage = lazy(() => import('./pages/Notes/index'));
const AboutPage = lazy(() => import('./pages/About/index'));
const EarthOnlinePage = lazy(() => import('./pages/EarthOnline/index'));
const StudioPage = lazy(() => import('./pages/Studio/index'));
const NotFoundPage = lazy(() => import('./pages/NotFound/index'));

// 预加载函数
let docsLoader: Promise<any> | null = null;
let friendsLoader: Promise<any> | null = null;
let blogLoader: Promise<any> | null = null;

export function preloadDocs() {
  if (!docsLoader) {
    docsLoader = import('./pages/Docs/index');
  }
  return docsLoader;
}

export function preloadFriends() {
  if (!friendsLoader) {
    friendsLoader = import('./pages/Friends/index');
  }
  return friendsLoader;
}

export function preloadBlog() {
  if (!blogLoader) {
    blogLoader = import('./pages/Blog/index');
  }
  return blogLoader;
}

/**
 * 错峰加载 Hook - 控制特效和动画的渐进式加载
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

    // 错峰启动各个特效，避免同时开始动画
    const timers = [
      setTimeout(() => setPhases(p => ({ ...p, phase1: true })), 0),
      setTimeout(() => setPhases(p => ({ ...p, phase2: true })), 100),
      setTimeout(() => setPhases(p => ({ ...p, phase3: true })), 300),
      setTimeout(() => setPhases(p => ({ ...p, phase4: true })), 500),
      setTimeout(() => setPhases(p => ({ ...p, phase5: true })), 700),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isReady]);

  return phases;
}

/**
 * 首屏加载管理器 - 确保关键资源加载完成后再显示内容
 */
function useInitialLoad() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { effectiveQuality } = usePerformance();

  useEffect(() => {
    let mounted = true;

    const loadCriticalResources = async () => {
      try {
        // 并行加载关键资源
        const loadPromises = [
          // 加载站点数据
          fetch(`/data/site-data.json?v=${Date.now()}`, { cache: 'no-store' })
            .then(res => res.ok ? res.json() : null)
            .catch(() => null),
          // 预加载关键字体
          document.fonts.ready,
          // 给浏览器时间处理初始渲染
          new Promise(resolve => requestAnimationFrame(resolve)),
        ];

        await Promise.all(loadPromises);

        // 低性能设备额外等待时间确保渲染完成
        if (effectiveQuality === 'low') {
          await new Promise(resolve => setTimeout(resolve, 150));
        }

        if (mounted) {
          setIsReady(true);
          // 延迟隐藏加载状态，确保平滑过渡
          setTimeout(() => setIsLoading(false), 150);
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

  return { isReady, isLoading };
}

// 带导航的布局组件 - 只在指定列表页显示导航
function PageLayout({ children }: { children: React.ReactNode }) {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const { theme, isTransitioning, toggleTheme } = useTheme();
  const location = useLocation();
  const { isReady, isLoading } = useInitialLoad();

  useEffect(() => {
    if (isReady) {
      fetch(`/data/site-data.json?v=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => setSiteData(data))
        .catch(err => console.error('Failed to load site data:', err));
    }
  }, [isReady]);

  // 只在以下路径显示导航：首页、博客列表、文档列表、友链、朋友圈、关于、说说、地球Online、工作室
  const showNavPaths = ['/', '/blog', '/docs', '/friends', '/friends-circle', '/about', '/notes', '/earth-online', '/studio'];
  const shouldShowNav = showNavPaths.includes(location.pathname);

  // 首屏加载期间显示加载占位符（保持音乐播放器）
  if (isLoading) {
    return (
      <>
        <LoadingPlaceholder />
        {/* 全局音乐播放器 - 切换页面不会中断 */}
        <MusicPlayer />
      </>
    );
  }

  return (
    <>
      {shouldShowNav && siteData?.navigation && (
        <Navigation
          data={siteData.navigation}
          theme={theme}
          onThemeToggle={toggleTheme}
          isThemeTransitioning={isTransitioning}
        />
      )}
      {children}
      
      {/* 全局音乐播放器 - 切换页面不会中断 */}
      <MusicPlayer />
    </>
  );
}

function GlobalLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isMobile = useIsMobile();
  const { enableMouseEffects, effectiveQuality } = usePerformance();
  const { isReady } = useInitialLoad();
  const phases = useStaggeredLoad(isReady);

  // 根据性能级别调整特效参数
  const starCount = effectiveQuality === 'low' ? 10 : effectiveQuality === 'medium' ? 20 : 30;
  const gradientSpeed = effectiveQuality === 'low' ? 25 : 18;
  const gradientOpacity = effectiveQuality === 'low' ? 0.02 : 0.04;
  const beamIntensity = effectiveQuality === 'low' ? 0.15 : 0.25;

  // 是否启用特效
  const enableEffects = isReady && effectiveQuality !== 'low';

  return (
    <>
      <GlobalContextMenu />
      <DebugProtection />

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
          {/* Phase 3: 星星背景 */}
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

          {/* Phase 4: 渐变背景 */}
          {phases.phase4 && (
            <div className="fixed inset-0 pointer-events-none z-0">
              <FlowingGradient
                colors={['var(--accent-primary)', 'var(--accent-secondary)', 'var(--accent-tertiary)']}
                speed={gradientSpeed}
                opacity={gradientOpacity}
              />
            </div>
          )}

          {/* Phase 5: 光束效果 */}
          {phases.phase5 && (
            <LightBeam position="top" color="var(--accent-primary)" intensity={beamIntensity} />
          )}
        </>
      )}

      {children}
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MobileProvider>
      <PerformanceProvider>
        <BrowserRouter>
          <RedirectHandler />
          <GlobalLayout>
            <PageLayout>
              <Routes>
                <Route path="/" element={<App />} />
                <Route path="/docs" element={
                  <Suspense fallback={<RouteLoader />}>
                    <DocsPage />
                  </Suspense>
                } />
                <Route path="/docs/:categoryId" element={
                  <Suspense fallback={<RouteLoader />}>
                    <DocsPage />
                  </Suspense>
                } />
                <Route path="/docs/:categoryId/:itemId" element={
                  <Suspense fallback={<RouteLoader />}>
                    <DocsPage />
                  </Suspense>
                } />
                <Route path="/docs/:categoryId/:itemId/:chapterId" element={
                  <Suspense fallback={<RouteLoader />}>
                    <DocsPage />
                  </Suspense>
                } />
                <Route path="/friends" element={
                  <Suspense fallback={<RouteLoader />}>
                    <FriendsPage />
                  </Suspense>
                } />
                <Route path="/friends-circle" element={
                  <Suspense fallback={<RouteLoader />}>
                    <FeedPage />
                  </Suspense>
                } />
                <Route path="/blog" element={
                  <Suspense fallback={<RouteLoader />}>
                    <BlogPage />
                  </Suspense>
                } />
                <Route path="/blog/:slug" element={
                  <Suspense fallback={<RouteLoader />}>
                    <BlogPostPage />
                  </Suspense>
                } />
                <Route path="/notes" element={
                  <Suspense fallback={<RouteLoader />}>
                    <NotesPage />
                  </Suspense>
                } />
                <Route path="/about" element={
                  <Suspense fallback={<RouteLoader />}>
                    <AboutPage />
                  </Suspense>
                } />
                <Route path="/earth-online" element={
                  <Suspense fallback={<RouteLoader />}>
                    <EarthOnlinePage />
                  </Suspense>
                } />
                <Route path="/studio" element={
                  <Suspense fallback={<RouteLoader />}>
                    <StudioPage />
                  </Suspense>
                } />
                <Route path="*" element={
                  <Suspense fallback={<RouteLoader />}>
                    <NotFoundPage />
                  </Suspense>
                } />
              </Routes>
            </PageLayout>
          </GlobalLayout>
        </BrowserRouter>
      </PerformanceProvider>
    </MobileProvider>
  </StrictMode>,
);
