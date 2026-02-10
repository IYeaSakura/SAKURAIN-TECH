import { useState, useEffect, Suspense, lazy, memo } from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import {
  ScrollProgress,
  SecurityProtection,
  LightBeam,
} from '@/components/effects';
import { Navigation } from '@/components/sections/Navigation';
import { Hero } from '@/components/sections/Hero';
import { WelcomeModal } from '@/components/WelcomeModal';
import { LoadingPlaceholder } from '@/components/ui/loading-placeholder';
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

// 简单的加载占位组件
const SectionFallback = memo(() => (
  <div className="min-h-[300px] flex items-center justify-center">
    <div
      className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
      style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
    />
  </div>
));

SectionFallback.displayName = 'SectionFallback';

function App() {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [statsChartsData, setStatsChartsData] = useState<StatsChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme, isTransitioning, toggleTheme } = useTheme();

  useEffect(() => {
    // 并行加载数据
    Promise.all([
      fetch('/data/site-data.json').then((res) => res.json()),
      fetch('/data/timeline.json').then((res) => res.json()),
      fetch('/data/stats-charts.json').then((res) => res.json()),
    ])
      .then(([site, timeline, stats]: [SiteData, TimelineData, StatsChartsData]) => {
        setSiteData(site);
        setTimelineData(timeline);
        setStatsChartsData(stats);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load site data:', error);
        setLoading(false);
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

  if (loading) {
    return <LoadingPlaceholder />;
  }

  if (!siteData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <p style={{ color: 'var(--text-muted)' }} className="mb-4">无法加载网站数据</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg text-white"
            style={{ background: 'var(--accent-primary)' }}
          >
            重试
          </button>
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

        {/* 其他区域懒加载 */}
        <Suspense fallback={<SectionFallback />}>
          <Services data={siteData.services} />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <TechStack data={siteData.techStack} />
        </Suspense>

        {statsChartsData && (
          <Suspense fallback={<SectionFallback />}>
            <StatsCharts data={statsChartsData} />
          </Suspense>
        )}

        {timelineData && (
          <Suspense fallback={<SectionFallback />}>
            <Timeline data={timelineData} />
          </Suspense>
        )}

        <Suspense fallback={<SectionFallback />}>
          <Pricing data={siteData.pricing} />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <Process data={siteData.process} />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <Comparison data={siteData.comparison} />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <Contact data={siteData.contact} />
        </Suspense>
      </main>

      <Suspense fallback={<SectionFallback />}>
        <Footer data={siteData.footer} />
      </Suspense>

      {/* 底部光剑 */}
      <LightBeam position="bottom" color="var(--accent-secondary)" intensity={0.2} />

      {/* 贴边铃铛 - 打开欢迎弹窗 */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2, duration: 0.5 }}
        onClick={() => window.dispatchEvent(new CustomEvent('open-welcome-modal'))}
        id="welcome-bell"
        className="fixed left-0 top-[20%] z-50 hidden xl:flex flex-col items-center justify-center gap-1"
        style={{
          width: '28px',
          height: '64px',
          background: 'linear-gradient(180deg, var(--accent-primary) 0%, color-mix(in srgb, var(--accent-primary) 70%, var(--accent-secondary)) 100%)',
          border: 'none',
          borderRadius: '0 8px 8px 0',
          boxShadow: '2px 0 12px var(--accent-glow), inset -2px 0 4px rgba(255,255,255,0.2)',
        }}
        whileHover={{ 
          width: '32px',
          x: 4,
        }}
      >
        <Bell 
          className="w-4 h-4" 
          style={{ color: 'white' }} 
        />
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
      </motion.button>
    </div>
  );
}

export default App;
