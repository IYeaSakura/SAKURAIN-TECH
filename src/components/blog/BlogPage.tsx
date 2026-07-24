'use client';

/**
 * BlogPage —— brutalist blog index.
 *
 * A content-first list with search, view switching, year grouping and a
 * lightweight stats modal. All styling uses the site-wide CSS variables so
 * color themes and intensity sliders apply automatically.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid, List, X, ChevronLeft, ChevronRight, BarChart3, BookOpen, Calendar, Tag } from 'lucide-react';
import { Footer } from '@/components/sections/Footer';
import { useAnimationEnabled } from '@/hooks';
import type { SiteData } from '@/types';

import { BlogCard } from './components/BlogCard';
import { BlogListItem } from './components/BlogListItem';
import { BlogTagCloud } from '@/components/BlogTagCloud';
import type { BlogPost } from './types';
import type { BlogTag } from '@/lib/content/blog';

interface BlogPageProps {
  /** 全部文章（服务端内容管线注入，按日期倒序，不含正文） */
  posts: BlogPost[];
  /** 标签统计 */
  tags: BlogTag[];
  /** 列表页描述文案 */
  description: string;
  /** 页脚数据（服务端注入） */
  footer: SiteData['footer'] | null;
}

type ViewMode = 'grid' | 'list';

const POSTS_PER_PAGE = 9;

function StatCard({
  icon: Icon,
  value,
  label,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  value: number;
  label: string;
  delay?: number;
}) {
  const animationEnabled = useAnimationEnabled();

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + delay * 0.1, duration: 0.4 }}
      className="p-4 sm:p-5 text-center border-2"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
        boxShadow: '4px 4px 0 var(--border-subtle)',
      }}
    >
      <Icon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" style={{ color: 'var(--accent-primary)' }} />
      <div className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
    </motion.div>
  );
}

export default function BlogIndex({ posts, tags, description, footer }: BlogPageProps) {
  const animationEnabled = useAnimationEnabled();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showStats, setShowStats] = useState(false);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return posts;
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query) ||
        post.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [posts, searchQuery]);

  const featuredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts.filter((post) => post.featured);
    const query = searchQuery.toLowerCase();
    return posts.filter(
      (post) =>
        post.featured &&
        (post.title.toLowerCase().includes(query) ||
          post.description.toLowerCase().includes(query) ||
          post.tags.some((tag) => tag.toLowerCase().includes(query)))
    );
  }, [posts, searchQuery]);

  const postsByYear = useMemo(() => {
    const grouped: Record<string, BlogPost[]> = {};
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const pagePosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

    pagePosts.forEach((post) => {
      const year = new Date(post.date).getFullYear().toString();
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(post);
    });
    return grouped;
  }, [filteredPosts, currentPage]);

  const sortedYears = useMemo(
    () => Object.keys(postsByYear).sort((a, b) => parseInt(b) - parseInt(a)),
    [postsByYear]
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE)),
    [filteredPosts]
  );

  const archiveMonthCount = useMemo(
    () => new Set(posts.map((post) => post.date.slice(0, 7)).filter(Boolean)).size,
    [posts]
  );

  const totalTagRefs = useMemo(() => tags.reduce((sum, tag) => sum + tag.count, 0), [tags]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 lg:pt-36 pb-12">
        {/* Header */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 border-2 mb-4"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <BookOpen className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
                >
                  Blog
                </span>
              </div>

              <h1
                className="text-3xl sm:text-5xl font-bold uppercase tracking-tight mb-4"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
              >
                博客
              </h1>
              <p className="text-base sm:text-lg max-w-xl" style={{ color: 'var(--text-secondary)' }}>
                {description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:w-[420px] shrink-0">
              <StatCard icon={Calendar} value={sortedYears.length} label="年份" delay={0} />
              <StatCard icon={Tag} value={tags.length} label="标签" delay={1} />
              <StatCard icon={BookOpen} value={posts.length} label="文章" delay={2} />
            </div>
          </div>
        </motion.section>

        {/* Toolbar */}
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="sticky top-20 z-30 mb-10 py-3"
          style={{ background: 'var(--bg-primary)' }}
        >
          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 border-2"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="搜索文章..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm outline-none"
                style={{
                  background: 'var(--bg-primary)',
                  border: '2px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  caretColor: 'var(--accent-primary)',
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{
                  background: showStats ? 'var(--accent-primary)' : 'var(--bg-primary)',
                  borderColor: 'var(--border-subtle)',
                  color: showStats ? 'var(--bg-primary)' : 'var(--text-primary)',
                }}
              >
                <BarChart3 className="w-4 h-4" />
                统计
              </button>

              <div className="flex items-center border-2" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  className="p-2 transition-colors"
                  style={{
                    background: viewMode === 'grid' ? 'var(--accent-primary)' : 'var(--bg-primary)',
                    color: viewMode === 'grid' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className="p-2 transition-colors"
                  style={{
                    background: viewMode === 'list' ? 'var(--accent-primary)' : 'var(--bg-primary)',
                    color: viewMode === 'list' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Featured */}
        {featuredPosts.length > 0 && (
          <motion.section
            initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-14"
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-8 h-8 flex items-center justify-center border-2"
                style={{ borderColor: 'var(--accent-primary)' }}
              >
                <Tag className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <h2
                className="text-xl font-bold uppercase tracking-tight"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
              >
                精选文章
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredPosts.slice(0, 2).map((post, index) =>
                viewMode === 'grid' ? (
                  <BlogCard key={post.slug} post={post} index={index} featured />
                ) : (
                  <BlogListItem key={post.slug} post={post} index={index} featured />
                )
              )}
            </div>
          </motion.section>
        )}

        {/* Posts by year */}
        {sortedYears.length > 0 ? (
          <motion.section
            initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-8 h-8 flex items-center justify-center border-2"
                style={{ borderColor: 'var(--accent-secondary)' }}
              >
                <BookOpen className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
              </div>
              <h2
                className="text-xl font-bold uppercase tracking-tight"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
              >
                全部文章
              </h2>
            </div>

            <div className="space-y-10">
              {sortedYears.map((year) => (
                <div key={year}>
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="text-lg font-bold font-mono"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      {year}
                    </span>
                    <div className="flex-1 h-0.5" style={{ background: 'var(--border-subtle)' }} />
                    <span
                      className="text-xs font-mono px-2 py-1 border-2"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                    >
                      {postsByYear[year].length} 篇
                    </span>
                  </div>

                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                        : 'space-y-4'
                    }
                  >
                    {postsByYear[year].map((post, index) =>
                      viewMode === 'grid' ? (
                        <BlogCard key={post.slug} post={post} index={index} />
                      ) : (
                        <BlogListItem key={post.slug} post={post} index={index} />
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一页
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className="w-10 h-10 text-sm font-bold border-2 transition-all"
                      style={{
                        background: page === currentPage ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        borderColor: 'var(--border-subtle)',
                        color: page === currentPage ? 'var(--bg-primary)' : 'var(--text-primary)',
                      }}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  下一页
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.section>
        ) : (
          <motion.div
            initial={animationEnabled ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-sm font-mono"
            style={{ color: 'var(--text-muted)' }}
          >
            没有找到匹配的文章
          </motion.div>
        )}
      </main>

      {footer && <Footer data={footer} />}

      {/* Stats modal */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)' }}
            onClick={() => setShowStats(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[80vh] overflow-auto p-6 border-2"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
                boxShadow: '8px 8px 0 var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-xl font-bold uppercase tracking-tight"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                >
                  博客统计
                </h2>
                <button
                  onClick={() => setShowStats(false)}
                  className="p-2 border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {[
                  { value: featuredPosts.length, label: '精选文章' },
                  { value: posts.length - featuredPosts.length, label: '普通文章' },
                  { value: totalTagRefs, label: '标签总数' },
                  { value: archiveMonthCount, label: '归档月份' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-4 text-center border-2"
                    style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {stat.value}
                    </div>
                    <div className="text-[10px] font-mono uppercase" style={{ color: 'var(--text-muted)' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              <h3
                className="text-sm font-bold uppercase tracking-wider mb-4"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
              >
                标签词云
              </h3>
              <BlogTagCloud tags={tags} selectedTag={null} onSelectTag={() => {}} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
