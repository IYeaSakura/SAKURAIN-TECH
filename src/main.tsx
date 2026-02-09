import { StrictMode, useEffect, useState, lazy, Suspense } from 'react';
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

// 路由懒加载（代码分割）
const DocsPage = lazy(() => {
  console.log('[LazyLoad] Loading DocsPage...');
  return import('./pages/Docs/index').then(module => {
    console.log('[LazyLoad] DocsPage loaded');
    return module;
  });
});
const FriendsPage = lazy(() => {
  console.log('[LazyLoad] Loading FriendsPage...');
  return import('./pages/Friends/index').then(module => {
    console.log('[LazyLoad] FriendsPage loaded');
    return module;
  });
});
const BlogPage = lazy(() => {
  console.log('[LazyLoad] Loading BlogPage...');
  return import('./pages/Blog/index').then(module => {
    console.log('[LazyLoad] BlogPage loaded');
    return module;
  });
});
const BlogPostPage = lazy(() => {
  console.log('[LazyLoad] Loading BlogPostPage...');
  return import('./pages/Blog/[slug]').then(module => {
    console.log('[LazyLoad] BlogPostPage loaded');
    return module;
  });
});
const NotesPage = lazy(() => {
  console.log('[LazyLoad] Loading NotesPage...');
  return import('./pages/Notes/index').then(module => {
    console.log('[LazyLoad] NotesPage loaded');
    return module;
  });
});
const AboutPage = lazy(() => {
  console.log('[LazyLoad] Loading AboutPage...');
  return import('./pages/About/index').then(module => {
    console.log('[LazyLoad] AboutPage loaded');
    return module;
  });
});
const NotFoundPage = lazy(() => {
  console.log('[LazyLoad] Loading NotFoundPage...');
  return import('./pages/NotFound/index').then(module => {
    console.log('[LazyLoad] NotFoundPage loaded');
    return module;
  });
});

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

// 页面加载 Skeleton 组件
const PageSkeleton = () => {
  console.log('[PageSkeleton] Rendering loading skeleton');
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }}
        />
        <p style={{ color: '#9ca3af' }}>加载中...</p>
      </div>
    </div>
  );
};



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
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <>
      <GlobalContextMenu />
      <DebugProtection />
      
      {/* 全局鼠标指针效果 - 所有页面都显示 */}
      <MagneticCursor />
      <VelocityCursor />

      {/* 首页专属背景特效 */}
      {isHomePage && (
        <>
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
        </>
      )}

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
            <Suspense fallback={<PageSkeleton />}>
              <DocsPage />
            </Suspense>
          } />
          <Route path="/docs/:categoryId" element={
            <Suspense fallback={<PageSkeleton />}>
              <DocsPage />
            </Suspense>
          } />
          <Route path="/docs/:categoryId/:itemId" element={
            <Suspense fallback={<PageSkeleton />}>
              <DocsPage />
            </Suspense>
          } />
          <Route path="/docs/:categoryId/:itemId/:chapterId" element={
            <Suspense fallback={<PageSkeleton />}>
              <DocsPage />
            </Suspense>
          } />
          <Route path="/friends" element={
            <Suspense fallback={<PageSkeleton />}>
              <FriendsPage />
            </Suspense>
          } />
          <Route path="/blog" element={
            <Suspense fallback={<PageSkeleton />}>
              <BlogPage />
            </Suspense>
          } />
          <Route path="/blog/:slug" element={
            <Suspense fallback={<PageSkeleton />}>
              <BlogPostPage />
            </Suspense>
          } />
          <Route path="/notes" element={
            <Suspense fallback={<PageSkeleton />}>
              <NotesPage />
            </Suspense>
          } />
          <Route path="/about" element={
            <Suspense fallback={<PageSkeleton />}>
              <AboutPage />
            </Suspense>
          } />
          <Route path="*" element={
            <Suspense fallback={<PageSkeleton />}>
              <NotFoundPage />
            </Suspense>
          } />
        </Routes>
        </PageLayout>
      </GlobalLayout>
    </BrowserRouter>
  </StrictMode>,
);
