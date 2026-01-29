import { useState, useEffect } from 'react';
import { ScrollProgress } from '@/components/effects';
import {
  Navigation,
  Hero,
  Services,
  TechStack,
  Pricing,
  Process,
  Comparison,
  Contact,
  Footer,
  Timeline,
  StatsCharts,
} from '@/components/sections';
import { useTheme } from '@/hooks';
import type { SiteData } from '@/types';
import './styles/globals.css';

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

function App() {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [statsChartsData, setStatsChartsData] = useState<StatsChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme, isTransitioning, toggleTheme } = useTheme();

  useEffect(() => {
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

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--text-muted)' }}>加载中...</p>
        </div>
      </div>
    );
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
      <ScrollProgress />
      <Navigation
        data={siteData.navigation}
        theme={theme}
        onThemeToggle={toggleTheme}
        isThemeTransitioning={isTransitioning}
      />
      <main>
        <Hero data={siteData.hero} />
        <Services data={siteData.services} />
        <TechStack data={siteData.techStack} />
        {statsChartsData && <StatsCharts data={statsChartsData} />}
        {timelineData && <Timeline data={timelineData} />}
        <Pricing data={siteData.pricing} />
        <Process data={siteData.process} />
        <Comparison data={siteData.comparison} />
        <Contact data={siteData.contact} />
      </main>
      <Footer data={siteData.footer} />
    </div>
  );
}

export default App;
