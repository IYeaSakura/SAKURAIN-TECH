'use client';

/**
 * HomePage —— personal blog landing page.
 *
 * Keeps the layout simple and content-first: a short intro, recent posts,
 * and recent shuoshuo. The flashy product-page hero is intentionally removed
 * so the site feels like a personal blog rather than a brand showcase.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Terminal, BookOpen, MessageSquare } from 'lucide-react';

import { Footer } from '@/components/sections/Footer';
import { BlogListItem } from '@/components/blog/components/BlogListItem';
import { RecentShuoshuo } from '@/components/home/RecentShuoshuo';
import { MusicWidget } from '@/components/home/MusicWidget';
import { CalendarWidget } from '@/components/home/CalendarWidget';
import { StatsWidget } from '@/components/home/StatsWidget';
import { useTheme, useStylePreset, useAnimationEnabled, useNavigation } from '@/hooks';
import type { SiteData } from '@/types';
import type { Note } from '@/lib/content/notes';
import type { BlogPost } from '@/components/blog/types';

interface HomePageProps {
  /** 近期文章（由服务端内容管线在构建期注入） */
  posts: BlogPost[];
  /** 近期说说数据（由服务端内容管线在构建期注入） */
  notes: Note[];
}

const RECENT_POSTS_COUNT = 5;

export default function HomePage({ posts, notes }: HomePageProps) {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { setPreset } = useStylePreset();
  const { navigateTo } = useNavigation();
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

  const recentPosts = posts.slice(0, RECENT_POSTS_COUNT);

  if (!dataLoaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="text-center font-mono">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: 'var(--accent-primary)',
              borderTopColor: 'transparent',
            }}
          />
          <p style={{ color: 'var(--text-muted)' }}>{'>'} loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-32 lg:pt-40 pb-12">
        {/* Personal intro */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <img
              src="/image/logo.webp"
              alt="SAKURAIN"
              className="w-20 h-20 object-contain border-2 bg-[var(--bg-secondary)]"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
            <div className="flex-1">
              <h1
                className="text-3xl sm:text-5xl font-bold mb-3 uppercase tracking-tight"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
              >
                SAKURAIN
              </h1>
              <p
                className="text-base sm:text-lg leading-relaxed mb-4"
                style={{ color: 'var(--text-secondary)' }}
              >
                个人博客，记录博弈算法、量化系统、数据分析与 Web 工程中的思考与实践。
                这里更像一个数字花园，而不是产品展厅。
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigateTo('/blog')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                  style={{
                    background: 'var(--accent-primary)',
                    color: 'var(--bg-primary)',
                    borderColor: 'var(--border-subtle)',
                    boxShadow: '3px 3px 0 var(--border-subtle)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <BookOpen className="w-4 h-4" />
                  阅读博客
                </button>
                <button
                  onClick={() => navigateTo('/shuoshuo')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-subtle)',
                    boxShadow: '3px 3px 0 var(--border-subtle)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  看看说说
                </button>
                <button
                  onClick={() => setPreset('terminal')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-subtle)',
                    boxShadow: '3px 3px 0 var(--border-subtle)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <Terminal className="w-4 h-4" />
                  终端模式
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Functional widgets */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MusicWidget />
            <CalendarWidget />
            <StatsWidget posts={posts} notes={notes} />
          </div>
        </motion.section>

        {/* Recent posts */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-16"
        >
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-xl sm:text-2xl font-bold uppercase tracking-tight"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
            >
              近期文章
            </h2>
            <button
              onClick={() => navigateTo('/blog')}
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors hover:opacity-80"
              style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
            >
              全部文章
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {recentPosts.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              还没有文章
            </div>
          ) : (
            <div className="space-y-4">
              {recentPosts.map((post, index) => (
                <BlogListItem key={post.slug} post={post} index={index} />
              ))}
            </div>
          )}
        </motion.section>

        {/* Recent shuoshuo */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <RecentShuoshuo notes={notes} maxItems={4} />
        </motion.section>
      </main>

      {siteData && <Footer data={siteData.footer} />}
    </div>
  );
}
