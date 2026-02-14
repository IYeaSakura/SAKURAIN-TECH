import { StrictMode, useEffect, useState, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router';
import './index.css';
import './styles/globals.css';
import App from './App.tsx';
import { GlobalContextMenu } from '@/components/CustomContextMenu';
import { DebugProtection } from '@/components/DebugProtection';
import { Navigation } from '@/components/sections/Navigation';
import { useTheme, useMobile } from '@/hooks';
import { PerformanceProvider, usePerformance } from '@/contexts/PerformanceContext';
import { RouteLoader } from '@/components/RouterTransition';
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
const BlogPage = lazy(() => import('./pages/Blog/index'));
const BlogPostPage = lazy(() => import('./pages/Blog/[slug]'));
const NotesPage = lazy(() => import('./pages/Notes/index'));
const AboutPage = lazy(() => import('./pages/About/index'));
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

// 带导航的布局组件 - 只在指定列表页显示导航
function PageLayout({ children }: { children: React.ReactNode }) {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const { theme, isTransitioning, toggleTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    fetch(`/data/site-data.json?v=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setSiteData(data))
      .catch(err => console.error('Failed to load site data:', err));
  }, []);

  // 只在以下路径显示导航：首页、博客列表、文档列表、友链、关于、说说
  const showNavPaths = ['/', '/blog', '/docs', '/friends', '/about', '/notes'];
  const shouldShowNav = showNavPaths.includes(location.pathname);

  if (!shouldShowNav) {
    return <>{children}</>;
  }

  return (
    <>
      {siteData && (
        <Navigation
          data={siteData.navigation}
          theme={theme}
          onThemeToggle={toggleTheme}
          isThemeTransitioning={isTransitioning}
        />
      )}
      {children}
    </>
  );
}

function GlobalLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isMobile = useMobile();
  const { enableMouseEffects, effectiveQuality } = usePerformance();

  // 根据性能级别调整特效参数
  const starCount = effectiveQuality === 'low' ? 15 : effectiveQuality === 'medium' ? 25 : 35;
  const gradientSpeed = effectiveQuality === 'low' ? 20 : 15;
  const gradientOpacity = effectiveQuality === 'low' ? 0.03 : 0.05;
  const beamIntensity = effectiveQuality === 'low' ? 0.2 : 0.3;

  return (
    <>
      <GlobalContextMenu />
      <DebugProtection />

      {/* 全局鼠标指针效果 - 仅桌面端显示且非低性能模式 */}
      {!isMobile && enableMouseEffects && (
        <>
          <MagneticCursor />
          <VelocityCursor />
        </>
      )}

      {/* 首页专属背景特效 - 根据性能级别降级 */}
      {isHomePage && effectiveQuality !== 'low' && (
        <>
          <div className="fixed inset-0 pointer-events-none z-0">
            <TwinklingStars 
              count={starCount} 
              color="var(--accent-primary)" 
              secondaryColor="var(--accent-secondary)"
              shootingStars={effectiveQuality === 'high'}
            />
          </div>

          <div className="fixed inset-0 pointer-events-none z-0">
            <FlowingGradient
              colors={['var(--accent-primary)', 'var(--accent-secondary)', 'var(--accent-tertiary)']}
              speed={gradientSpeed}
              opacity={gradientOpacity}
            />
          </div>

          <LightBeam position="top" color="var(--accent-primary)" intensity={beamIntensity} />
        </>
      )}

      {children}
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
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
  </StrictMode>,
);
