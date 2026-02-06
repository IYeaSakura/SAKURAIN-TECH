import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import './index.css';
import App from './App.tsx';

// 懒加载页面
const DocsPage = lazy(() => import('./pages/Docs'));
const FriendsPage = lazy(() => import('./pages/Friends'));

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
      <Routes>
        <Route path="/" element={<App />} />
        <Route 
          path="/docs" 
          element={
            <Suspense fallback={<PageFallback />}>
              <DocsPage />
            </Suspense>
          } 
        />
        <Route 
          path="/docs/:categoryId" 
          element={
            <Suspense fallback={<PageFallback />}>
              <DocsPage />
            </Suspense>
          } 
        />
        <Route 
          path="/docs/:categoryId/:itemId" 
          element={
            <Suspense fallback={<PageFallback />}>
              <DocsPage />
            </Suspense>
          } 
        />
        <Route 
          path="/docs/:categoryId/:itemId/:chapterId" 
          element={
            <Suspense fallback={<PageFallback />}>
              <DocsPage />
            </Suspense>
          } 
        />
        <Route 
          path="/friends" 
          element={
            <Suspense fallback={<PageFallback />}>
              <FriendsPage />
            </Suspense>
          } 
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
