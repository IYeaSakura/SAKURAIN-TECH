import { StrictMode, Suspense, lazy, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router';
import './index.css';
import App from './App.tsx';

// 处理静态部署 404 重定向
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
const DocsPage = lazy(() => import('./pages/Docs'));
const FriendsPage = lazy(() => import('./pages/Friends'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));

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

// 提取为稳定组件，避免重新渲染时创建新的引用
function DocsPageWrapper() {
  return (
    <Suspense fallback={<PageFallback />}>
      <DocsPage />
    </Suspense>
  );
}

function FriendsPageWrapper() {
  return (
    <Suspense fallback={<PageFallback />}>
      <FriendsPage />
    </Suspense>
  );
}

function NotFoundPageWrapper() {
  return (
    <Suspense fallback={<PageFallback />}>
      <NotFoundPage />
    </Suspense>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RedirectHandler />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/docs" element={<DocsPageWrapper />} />
        <Route path="/docs/:categoryId" element={<DocsPageWrapper />} />
        <Route path="/docs/:categoryId/:itemId" element={<DocsPageWrapper />} />
        <Route path="/docs/:categoryId/:itemId/:chapterId" element={<DocsPageWrapper />} />
        <Route path="/friends" element={<FriendsPageWrapper />} />
        <Route path="*" element={<NotFoundPageWrapper />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
