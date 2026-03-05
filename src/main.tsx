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
import { CommandPalette } from '@/components/CommandPalette';
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

// 路由懒加载（代码分割）
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
const AlgoVizPage = lazy(() => import('./pages/AlgoViz/index'));
const ToolboxPage = lazy(() => import('./pages/Tools/index'));
const AnalyticsDashboardPage = lazy(() => import('./components/AnalyticsDashboard'));

// 全局布局
function GlobalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalContextMenu />
      <DebugProtection />
      <MusicPlayer />
      <CommandPalette />
      {children}
    </>
  );
}

// 页面布局（包含导航和特效）
function PageLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const { performanceSettings } = usePerformance();
  
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    fetch('/config/site-data.json')
      .then(res => res.json())
      .then(data => setSiteData(data))
      .catch(err => console.error('Failed to load site data:', err));
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Navigation 
        siteData={siteData} 
        currentPath={location.pathname}
        onNavigate={(path) => navigate(path)}
      />
      
      <main className="pt-16">
        {children}
      </main>
      
      {/* 特效 - 根据性能设置调整 */}
      {!isMobile && performanceSettings.cursorEffects && <MagneticCursor />}
      {!isMobile && performanceSettings.particleEffects && <TwinklingStars />}
    </div>
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
                <Route path="/docs/*" element={
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
                <Route path="/analytics" element={
                  <Suspense fallback={<RouteLoader />}>
                    <AnalyticsDashboardPage />
                  </Suspense>
                } />
                <Route path="/algo-viz" element={
                  <Suspense fallback={<RouteLoader />}>
                    <AlgoVizPage />
                  </Suspense>
                } />
                <Route path="/tools/*" element={
                  <Suspense fallback={<RouteLoader />}>
                    <ToolboxPage />
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
