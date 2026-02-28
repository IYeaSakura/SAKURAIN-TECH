/**
 * 工作室子页
 *
 * 原主页内容迁移至此，展示团队服务、技术栈、案例等商业信息
 *
 * @author SAKURAIN
 */
import { useState, useEffect, Suspense, lazy } from 'react';
import { usePerformance } from '@/contexts/PerformanceContext';
import {
  ScrollProgress,
  SecurityProtection,
  LightBeam,
} from '@/components/effects';

import { Hero } from '@/components/sections/Hero';
import { WelcomeModal } from '@/components/WelcomeModal';
import { SectionLoadingPlaceholder } from '@/components/ui/loading-placeholder';
import { useTheme } from '@/hooks';
import { RouteLoader } from '@/components/RouterTransition';
import type { SiteData } from '@/types';

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

export default function StudioPage() {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [statsChartsData, setStatsChartsData] = useState<StatsChartsData | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  useTheme();

  useEffect(() => {
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

  if (!dataLoaded || !siteData) {
    return <RouteLoader />;
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

      <main className="relative z-10">
        {/* Hero 首屏 */}
        <Hero data={siteData.hero} />

        {/* 服务区域 */}
        <Suspense fallback={<SectionLoadingPlaceholder />}>
          <Services data={siteData.services} />
        </Suspense>

        {/* 技术栈 */}
        <Suspense fallback={<SectionLoadingPlaceholder />}>
          <TechStack data={siteData.techStack} />
        </Suspense>

        {/* 统计数据 */}
        {statsChartsData && (
          <Suspense fallback={<SectionLoadingPlaceholder />}>
            <StatsCharts data={statsChartsData} />
          </Suspense>
        )}

        {/* 时间线 */}
        {timelineData && (
          <Suspense fallback={<SectionLoadingPlaceholder />}>
            <Timeline data={timelineData} />
          </Suspense>
        )}

        {/* 定价 */}
        <Suspense fallback={<SectionLoadingPlaceholder />}>
          <Pricing data={siteData.pricing} />
        </Suspense>

        {/* 工作流程 */}
        <Suspense fallback={<SectionLoadingPlaceholder />}>
          <Process data={siteData.process} />
        </Suspense>

        {/* 对比 */}
        <Suspense fallback={<SectionLoadingPlaceholder />}>
          <Comparison data={siteData.comparison} />
        </Suspense>

        {/* 联系 */}
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
