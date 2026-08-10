'use client';

/**
 * HomePage —— asymmetric bento-style personal dashboard.
 *
 * The layout keeps the site's neo-brutalist + pixel character while
 * feeling like a dense, functional home screen. A wide main column holds
 * the map and long-form content widgets; a narrower sidebar stacks
 * utility widgets of varying heights for an intentionally uneven rhythm.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Terminal, BookOpen, Camera } from 'lucide-react';

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

function RecentPostsWidget({ posts }: { posts: BlogPost[] }) {
  const { t } = useTranslation();
  const animationEnabled = useAnimationEnabled();
  const { navigateTo } = useNavigation();
  const recentPosts = posts.slice(0, RECENT_POSTS_COUNT);

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="min-h-[320px] p-5 border-2 flex flex-col"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
        boxShadow: '4px 4px 0 var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {t.home.recentPosts}
          </span>
        </div>
        <button
          onClick={() => navigateTo('/blog')}
          className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider transition-opacity hover:opacity-70"
          style={{ color: 'var(--accent-primary)' }}
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
    </motion.div>
  );
}

export default function HomePage({ posts, notes }: HomePageProps) {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { t } = useTranslation();
  const animationEnabled = useAnimationEnabled();
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

  if (!dataLoaded) {
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
      <main
        className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8"
      >
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

        {/* Asymmetric dashboard */}
        <section className="flex flex-col lg:flex-row gap-4 lg:gap-5">
          {/* Main column — wide, content-heavy */}
          <div className="flex-1 flex flex-col gap-4 lg:gap-5 min-w-0">
            <div className="min-h-[380px] sm:min-h-[460px]">
              <AMapWidget />
            </div>
            <RecentPostsWidget posts={posts} />
            <RecentDevLog notes={notes} maxItems={3} />
          </div>

          {/* Sidebar — narrow, utility widgets */}
          <div className="w-full lg:w-[360px] flex flex-col gap-4 lg:gap-5 shrink-0">
            <div className="min-h-[180px]">
              <MusicWidget />
            </div>

            <div className="min-h-[160px]">
              <CalendarWidget />
            </div>

            <div className="min-h-[120px]">
              <SearchWidget />
            </div>

            <div className="min-h-[140px]">
              <DailyQuoteWidget />
            </div>

            <div className="min-h-[120px]">
              <FriendsStatusWidget />
            </div>

            <div className="min-h-[240px]">
              <LanguageStatsWidget />
            </div>
          </div>
        </section>
      </main>

      {siteData && <Footer data={siteData.footer} />}
    </div>
  );
}
