import { StrictMode, Suspense, lazy, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router';
import './index.css';
import App from './App.tsx';

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
const NotFoundPage = lazy(() => import('./pages/NotFound/index'));

// 预加载加载器
let docsLoader: Promise<any> | null = null;
let friendsLoader: Promise<any> | null = null;

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RedirectHandler />
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
        <Route path="*" element={
          <Suspense fallback={<PageFallback />}>
            <NotFoundPage />
          </Suspense>
        } />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
