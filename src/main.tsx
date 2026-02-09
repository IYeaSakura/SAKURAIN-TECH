import { StrictMode, useEffect, useState } from 'react';
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

// 直接导入页面组件（不使用懒加载）
import DocsPage from './pages/Docs/index';
import FriendsPage from './pages/Friends/index';
import BlogPage from './pages/Blog/index';
import BlogPostPage from './pages/Blog/[slug]';
import NotesPage from './pages/Notes/index';
import AboutPage from './pages/About/index';
import NotFoundPage from './pages/NotFound/index';

// 预加载函数（保留以兼容现有代码）
export function preloadDocs() {
  return Promise.resolve();
}

export function preloadFriends() {
  return Promise.resolve();
}

export function preloadBlog() {
  return Promise.resolve();
}



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
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/docs/:categoryId" element={<DocsPage />} />
          <Route path="/docs/:categoryId/:itemId" element={<DocsPage />} />
          <Route path="/docs/:categoryId/:itemId/:chapterId" element={<DocsPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </PageLayout>
      </GlobalLayout>
    </BrowserRouter>
  </StrictMode>,
);
