import { StrictMode, Suspense, lazy, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router';
import './index.css';
import './styles/globals.css';
import App from './App.tsx';
import { GlobalContextMenu } from '@/components/CustomContextMenu';
import { DebugProtection } from '@/components/DebugProtection';
import { Navigation } from '@/components/sections/Navigation';
import { useTheme } from '@/hooks';
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

// 懒加载页面
const DocsPage = lazy(() => import('./pages/Docs/index'));
const FriendsPage = lazy(() => import('./pages/Friends/index'));
const BlogPage = lazy(() => import('./pages/Blog/index'));
const BlogPostPage = lazy(() => import('./pages/Blog/[slug]'));
const NotesPage = lazy(() => import('./pages/Notes/index'));
const AboutPage = lazy(() => import('./pages/About/index'));
const NotFoundPage = lazy(() => import('./pages/NotFound/index'));

// 预加载加载器
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

// 简单的加载占位组件
const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
    <div className="flex flex-col items-center gap-4">
      <div
        className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
      />
      <p style={{ color: 'var(--text-muted)' }}>加载中...</p>
    </div>
  </div>
);

// 带导航的布局组件 - 只在指定列表页显示导航
function PageLayout({ children }: { children: React.ReactNode }) {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const { theme, isTransitioning, toggleTheme } = useTheme();
  const location = useLocation();
  
  useEffect(() => {
    fetch('/data/site-data.json')
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
  return (
    <>
      <GlobalContextMenu />
      <DebugProtection />
      <MagneticCursor />
      <VelocityCursor />

      <div className="fixed inset-0 pointer-events-none z-0 hidden lg:block">
        <TwinklingStars count={35} color="var(--accent-primary)" secondaryColor="var(--accent-secondary)" />
      </div>

      <div className="fixed inset-0 pointer-events-none z-0">
        <FlowingGradient
          colors={['var(--accent-primary)', 'var(--accent-secondary)', 'var(--accent-tertiary)']}
          speed={15}
          opacity={0.05}
        />
      </div>

      <LightBeam position="top" color="var(--accent-primary)" intensity={0.3} />

      {children}
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RedirectHandler />
      <GlobalLayout>
        <PageLayout>
          <Routes>
          <Route path="/" element={<App />} />
          <Route path="/docs" element={
            <Suspense fallback={<PageFallback />}>
              <DocsPage />
            </Suspense>
          } />
          <Route path="/docs/:categoryId" element={
            <Suspense fallback={<PageFallback />}>
              <DocsPage />
            </Suspense>
          } />
          <Route path="/docs/:categoryId/:itemId" element={
            <Suspense fallback={<PageFallback />}>
              <DocsPage />
            </Suspense>
          } />
          <Route path="/docs/:categoryId/:itemId/:chapterId" element={
            <Suspense fallback={<PageFallback />}>
              <DocsPage />
            </Suspense>
          } />
          <Route path="/friends" element={
            <Suspense fallback={<PageFallback />}>
              <FriendsPage />
            </Suspense>
          } />
          <Route path="/blog" element={
            <Suspense fallback={<PageFallback />}>
              <BlogPage />
            </Suspense>
          } />
          <Route path="/blog/:slug" element={
            <Suspense fallback={<PageFallback />}>
              <BlogPostPage />
            </Suspense>
          } />
          <Route path="/notes" element={
            <Suspense fallback={<PageFallback />}>
              <NotesPage />
            </Suspense>
          } />
          <Route path="/about" element={
            <Suspense fallback={<PageFallback />}>
              <AboutPage />
            </Suspense>
          } />
          <Route path="*" element={
            <Suspense fallback={<PageFallback />}>
              <NotFoundPage />
            </Suspense>
          } />
        </Routes>
        </PageLayout>
      </GlobalLayout>
    </BrowserRouter>
  </StrictMode>,
);
