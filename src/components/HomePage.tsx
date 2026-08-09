'use client';

/**
 * HomePage — modular desktop-style personal dashboard.
 *
 * Widgets are wrapped in draggable window chrome so the landing page feels
 * like a bento desktop. Order, pin and collapse states are persisted in
 * localStorage and restored on the client after hydration.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Terminal,
  BookOpen,
  Camera,
  Navigation,
  MessageSquare,
  Music,
  CalendarDays,
  Search,
  Quote,
  Heart,
  Code2,
  RotateCcw,
} from 'lucide-react';

import { Footer } from '@/components/sections/Footer';
import { BlogListItem } from '@/components/blog/components/BlogListItem';
import { RecentDevLog } from '@/components/home/RecentDevLog';
import { MusicWidget } from '@/components/home/MusicWidget';
import { CalendarWidget } from '@/components/home/CalendarWidget';
import { AMapWidget } from '@/components/home/AMapWidget';
import { SearchWidget } from '@/components/home/SearchWidget';
import { DailyQuoteWidget } from '@/components/home/DailyQuoteWidget';
import { FriendsStatusWidget } from '@/components/home/FriendsStatusWidget';
import { LanguageStatsWidget } from '@/components/home/LanguageStatsWidget';
import { WidgetFrame } from '@/components/home/WidgetFrame';
import { DesktopStatusBar } from '@/components/home/DesktopStatusBar';
import { useWidgetLayout, type WidgetId } from '@/components/home/useWidgetLayout';
import {
  useTheme,
  useStylePreset,
  useAnimationEnabled,
  useNavigation,
  useTranslation,
} from '@/hooks';
import type { SiteData } from '@/types';
import type { Note } from '@/lib/content/notes';
import type { BlogPost } from '@/components/blog/types';

interface HomePageProps {
  posts: BlogPost[];
  notes: Note[];
}

const RECENT_POSTS_COUNT = 3;

function QuickLinksStrip() {
  const { t } = useTranslation();
  const animationEnabled = useAnimationEnabled();
  const { navigateTo } = useNavigation();
  const { setPreset } = useStylePreset();

  const links = [
    { icon: BookOpen, label: t.home.readBlog, href: '/blog', color: 'var(--accent-primary)' },
    { icon: Camera, label: t.home.viewMoments, href: '/moments', color: 'var(--accent-secondary)' },
    { icon: Terminal, label: t.home.terminalMode, action: () => setPreset('terminal'), color: 'var(--accent-tertiary)' },
  ];

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex flex-wrap gap-2"
    >
      {links.map((item) => (
        <button
          key={item.label}
          onClick={() => (item.action ? item.action() : navigateTo(item.href))}
          className="flex items-center gap-2 px-4 py-2 border-2 text-xs font-mono uppercase tracking-wider transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
            boxShadow: '3px 3px 0 var(--border-subtle)',
          }}
        >
          <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
          {item.label}
        </button>
      ))}
    </motion.div>
  );
}

function RecentPostsBody({ posts }: { posts: BlogPost[] }) {
  const { t } = useTranslation();
  const { navigateTo } = useNavigation();
  const recentPosts = posts.slice(0, RECENT_POSTS_COUNT);

  return (
    <div className="p-5 h-full flex flex-col" style={{ background: 'var(--bg-secondary)' }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {t.home.recentPosts}
        </span>
        <button
          onClick={() => navigateTo('/blog')}
          className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider transition-opacity hover:opacity-70"
          style={{ color: 'var(--accent-primary)' }}
          type="button"
        >
          {t.home.allPosts}
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 space-y-3">
        {recentPosts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
            {t.home.noPosts}
          </div>
        ) : (
          recentPosts.map((post, index) => (
            <BlogListItem key={post.slug} post={post} index={index} />
          ))
        )}
      </div>
    </div>
  );
}

const MAIN_WIDGETS: WidgetId[] = ['map', 'recent-posts', 'recent-devlog'];
const SIDEBAR_WIDGETS: WidgetId[] = ['music', 'calendar', 'search', 'daily-quote', 'friends-status', 'language-stats'];

const WIDGET_CONFIG: Record<
  WidgetId,
  {
    title: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    minHeight?: string;
    render: (props: { posts: BlogPost[]; notes: Note[] }) => React.ReactNode;
  }
> = {
  map: { title: 'Travel Map', icon: Navigation, minHeight: 'min-h-[340px] sm:min-h-[400px]', render: () => <AMapWidget /> },
  'recent-posts': { title: 'Recent Posts', icon: BookOpen, minHeight: 'min-h-[320px]', render: ({ posts }) => <RecentPostsBody posts={posts} /> },
  'recent-devlog': { title: 'Dev Log', icon: MessageSquare, render: ({ notes }) => <RecentDevLog notes={notes} maxItems={3} /> },
  music: { title: 'Music', icon: Music, minHeight: 'min-h-[160px]', render: () => <MusicWidget /> },
  calendar: { title: 'Clock', icon: CalendarDays, minHeight: 'min-h-[160px]', render: () => <CalendarWidget /> },
  search: { title: 'Search', icon: Search, minHeight: 'min-h-[120px]', render: () => <SearchWidget /> },
  'daily-quote': { title: 'Daily Quote', icon: Quote, minHeight: 'min-h-[120px]', render: () => <DailyQuoteWidget /> },
  'friends-status': { title: 'Friends', icon: Heart, minHeight: 'min-h-[100px]', render: () => <FriendsStatusWidget /> },
  'language-stats': { title: 'Languages', icon: Code2, minHeight: 'min-h-[200px]', render: () => <LanguageStatsWidget /> },
};

export default function HomePage({ posts, notes }: HomePageProps) {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { t, locale } = useTranslation();
  const animationEnabled = useAnimationEnabled();
  const { order, pinned, collapsed, hydrated, moveWidget, togglePin, toggleCollapse, resetLayout } = useWidgetLayout();
  useTheme();

  useEffect(() => {
    fetch('/data/site-data.json')
      .then((res) => res.json())
      .then((data: SiteData) => {
        setSiteData(data);
        setDataLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load site data:', error);
        setDataLoaded(true);
      });
  }, []);

  const sortedMain = MAIN_WIDGETS.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const sortedSidebar = SIDEBAR_WIDGETS.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b));

  if (!dataLoaded || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center font-mono">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: 'var(--accent-primary)',
              borderTopColor: 'transparent',
            }}
          />
          <p style={{ color: 'var(--text-muted)' }}>{'>'} {t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero / welcome */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 12 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h1
                className="text-2xl sm:text-4xl font-bold uppercase tracking-tight mb-1"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
              >
                SAKURAIN
              </h1>
              <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
                {t.home.intro}
              </p>
            </div>
            <QuickLinksStrip />
          </div>
        </motion.section>

        <DesktopStatusBar />

        {/* Asymmetric dashboard */}
        <section className="flex flex-col lg:flex-row gap-4 lg:gap-5">
          {/* Main column */}
          <div className="flex-1 flex flex-col gap-4 lg:gap-5 min-w-0">
            {sortedMain.map((id) => {
              const config = WIDGET_CONFIG[id];
              return (
                <div key={id} className={config.minHeight || ''}>
                  <WidgetFrame
                    id={id}
                    title={config.title}
                    icon={config.icon}
                    isPinned={pinned.has(id)}
                    isCollapsed={collapsed.has(id)}
                    onTogglePin={togglePin}
                    onToggleCollapse={toggleCollapse}
                    onDrop={(targetId) => moveWidget(id, targetId)}
                  >
                    {config.render({ posts, notes })}
                  </WidgetFrame>
                </div>
              );
            })}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[360px] flex flex-col gap-4 lg:gap-5 shrink-0">
            {sortedSidebar.map((id) => {
              const config = WIDGET_CONFIG[id];
              return (
                <div key={id} className={config.minHeight || ''}>
                  <WidgetFrame
                    id={id}
                    title={config.title}
                    icon={config.icon}
                    isPinned={pinned.has(id)}
                    isCollapsed={collapsed.has(id)}
                    onTogglePin={togglePin}
                    onToggleCollapse={toggleCollapse}
                    onDrop={(targetId) => moveWidget(id, targetId)}
                  >
                    {config.render({ posts, notes })}
                  </WidgetFrame>
                </div>
              );
            })}
          </div>
        </section>

        {/* Layout controls */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={resetLayout}
            className="flex items-center gap-2 px-3 py-2 border-2 text-[10px] font-mono uppercase tracking-wider transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
              boxShadow: '3px 3px 0 var(--border-subtle)',
            }}
            type="button"
          >
            <RotateCcw className="w-3 h-3" />
            {locale === 'zh' ? '重置布局' : 'Reset layout'}
          </button>
        </div>
      </main>

      {siteData && <Footer data={siteData.footer} />}
    </div>
  );
}
