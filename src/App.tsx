import { useState, useEffect, Suspense, lazy } from 'react';
import { usePerformance } from '@/contexts/PerformanceContext';
import {
  ScrollProgress,
  SecurityProtection,
  LightBeam,
} from '@/components/effects';
import { Navigation } from '@/components/sections/Navigation';
import { Hero } from '@/components/sections/Hero';
import { WelcomeModal } from '@/components/WelcomeModal';
import { SectionLoadingPlaceholder } from '@/components/ui/loading-placeholder';
import { useTheme } from '@/hooks';
import type { SiteData } from '@/types';
import { preloadDocs, preloadFriends } from '@/main';
import './styles/globals.css';

// 懒加载非首屏组件
const Services = lazy(() => import('@/components/sections/Services').then(m => ({ default: m.Services })));
const TechStack = lazy(() => import('@/components/sections/TechStack').then(m => ({ default: m.TechStack })));
const StatsCharts = lazy(() => import('@/components/sections/StatsCharts').then(m => ({ default: m.StatsCharts })));
const Timeline = lazy(() => import('@/components/sections/Timeline').then(m => ({ default: m.Timeline })));
const Pricing = lazy(() => import('@/components/sections/Pricing').then(m => ({ default: m.Pricing })));
const Process = lazy(() => import('@/components/sections/Process').then(m => ({ default: m.Process })));
const Comparison = lazy(() => import('@/components/sections/Comparison').then(m => ({ default: m.Comparison })));
const Contact = lazy(() => import('@/components/sections/Contact').then(m => ({ default: m.Contact })));
const Footer = lazy(() => import('@/components/sections/Footer').then(m => ({ default: m.Footer })));

interface TimelineData {
  title: string;
  subtitle: string;
  events: any[];
}

interface StatsChartsData {
  title: string;
  subtitle: string;
  stats: any[];
  charts: any[];
}

/**
 * 错峰加载的底部光剑 - 延迟显示避免首屏动画冲突
 */
function StaggeredLightBeam() {
  const [visible, setVisible] = useState(false);
  const { effectiveQuality } = usePerformance();

  useEffect(() => {
    // 延迟加载底部光剑，避免与其他动画同时开始
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || effectiveQuality === 'low') return null;

  return <LightBeam position="bottom" color="var(--accent-secondary)" intensity={0.2} />;
}

/**
 * 错峰加载的悬浮按钮
 */
function StaggeredFloatingButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 延迟显示，避免首屏动画拥堵
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('open-welcome-modal'))}
      id="welcome-bell"
      className="fixed left-0 top-[20%] z-50 hidden xl:flex flex-col items-center justify-center gap-1 animate-slide-in-left"
      style={{
        width: '28px',
        height: '64px',
        background: 'linear-gradient(180deg, var(--accent-primary) 0%, color-mix(in srgb, var(--accent-primary) 70%, var(--accent-secondary)) 100%)',
        border: 'none',
        borderRadius: '0 8px 8px 0',
        boxShadow: '2px 0 12px var(--accent-glow), inset -2px 0 4px rgba(255,255,255,0.2)',
        animation: 'slideInLeft 0.5s ease-out',
      }}
    >
      <svg 
        className="w-4 h-4" 
        style={{ color: 'white' }}
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      <span 
        className="text-[9px] font-bold tracking-wider"
        style={{ 
          color: 'white',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
        }}
      >
        欢迎
      </span>
      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </button>
  );
}

function App() {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [statsChartsData, setStatsChartsData] = useState<StatsChartsData | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { theme, isTransitioning, toggleTheme } = useTheme();

  useEffect(() => {
    // 并行加载数据
    Promise.all([
      fetch(`/data/site-data.json?v=${Date.now()}`, { cache: 'no-store' }).then((res) => res.json()),
      fetch(`/data/timeline.json?v=${Date.now()}`, { cache: 'no-store' }).then((res) => res.json()),
      fetch(`/data/stats-charts.json?v=${Date.now()}`, { cache: 'no-store' }).then((res) => res.json()),
    ])
      .then(([site, timeline, stats]: [SiteData, TimelineData, StatsChartsData]) => {
        setSiteData(site);
        setTimelineData(timeline);
        setStatsChartsData(stats);
        setDataLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load site data:', error);
        setDataLoaded(true);
      });
  }, []);

  useEffect(() => {
    // 预加载路由页面组件
    const preloadTimer = setTimeout(() => {
      preloadDocs();
      preloadFriends();
    }, 2000);

    return () => clearTimeout(preloadTimer);
  }, []);

  if (!dataLoaded || !siteData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--text-muted)' }}>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* 欢迎弹窗 */}
      <WelcomeModal />

      {/* 安全保护 */}
      <SecurityProtection />

      {/* 全局特效 */}
      <ScrollProgress />

      <Navigation
        data={siteData.navigation}
        theme={theme}
        onThemeToggle={toggleTheme}
        isThemeTransitioning={isTransitioning}
      />
      <main className="relative z-10">
        {/* Hero 首屏直接渲染，无需懒加载 */}
        <Hero data={siteData.hero} />

        {/* 其他区域懒加载，使用统一的加载占位符 */}
        <Suspense fallback={<SectionLoadingPlaceholder />}>
          <Services data={siteData.services} />
        </Suspense>

        <Suspense fallback={<SectionLoadingPlaceholder />}>
          <TechStack data={siteData.techStack} />
        </Suspense>

        {statsChartsData && (
          <Suspense fallback={<SectionLoadingPlaceholder />}>
            <StatsCharts data={statsChartsData} />
          </Suspense>
        )}

        {timelineData && (
          <Suspense fallback={<SectionLoadingPlaceholder />}>
            <Timeline data={timelineData} />
          </Suspense>
        )}

        <Suspense fallback={<SectionLoadingPlaceholder />}>
          <Pricing data={siteData.pricing} />
        </Suspense>

        <Suspense fallback={<SectionLoadingPlaceholder />}>
          <Process data={siteData.process} />
        </Suspense>

        <Suspense fallback={<SectionLoadingPlaceholder />}>
          <Comparison data={siteData.comparison} />
        </Suspense>

        <Suspense fallback={<SectionLoadingPlaceholder />}>
          <Contact data={siteData.contact} />
        </Suspense>
      </main>

      <Suspense fallback={<SectionLoadingPlaceholder />}>
        <Footer data={siteData.footer} />
      </Suspense>

      {/* 错峰加载的底部光剑 */}
      <StaggeredLightBeam />

      {/* 错峰加载的悬浮按钮 */}
      <StaggeredFloatingButton />
    </div>
  );
}

export default App;
