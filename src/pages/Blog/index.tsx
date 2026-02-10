import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid, List, X, ChevronLeft, ChevronRight, BarChart3, BookOpen, Calendar, Tag, Sparkles } from 'lucide-react';
import { AmbientGlow, GradientText, LightBeam } from '@/components/effects';
import { Footer } from '@/components/sections/Footer';
import { useMobile } from '@/hooks';
import type { SiteData } from '@/types';

import { BlogCard } from './components/BlogCard';
import { BlogListItem } from './components/BlogListItem';
import { getBlogIndex } from './utils';
import { BlogTagCloud } from '@/components/BlogTagCloud';
import { useBlogArchive, useMultipleMonthArchives } from '@/hooks/useBlogArchive';
import type { BlogIndex } from './types';

interface TagData {
  name: string;
  count: number;
}

interface TagsResponse {
  tags: TagData[];
  total: number;
  generatedAt: string;
}

type ViewMode = 'grid' | 'list';

const POSTS_PER_PAGE = 9;

// CSS clip-path helpers - 像素风格
const clipPathRounded = (r: number) => `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

// 玻璃卡片组件
function GlassCard({
  children,
  className = '',
  hoverScale = 1.01,
  accentColor = 'var(--accent-primary)',
}: {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  accentColor?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: hoverScale, y: -3 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`relative ${className}`}
    >
      {/* 玻璃反光层 */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, transparent 60%)',
          opacity: isHovered ? 1 : 0.6,
        }}
      />
      {/* 悬浮边缘发光 */}
      <div
        className="absolute -inset-[1px] rounded-2xl transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, ${accentColor}60, transparent 50%)`,
          opacity: isHovered ? 0.4 : 0,
          filter: 'blur(4px)',
          zIndex: -1,
        }}
      />
      <div className="relative h-full">{children}</div>
    </motion.div>
  );
}

// 统计卡片组件
function StatCard({
  icon: Icon,
  value,
  label,
  color,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  value: number;
  label: string;
  color: string;
  delay?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + delay * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.05, y: -4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative p-6 text-center cursor-default group"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '2px solid rgba(255, 255, 255, 0.08)',
        clipPath: clipPathRounded(6),
      }}
    >
      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, var(--accent-glow), transparent 70%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.5 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <Icon className="w-6 h-6 mx-auto mb-3" style={{ color }} />
      <div className="font-sans font-bold text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </motion.div>
  );
}

export default function BlogIndex() {
  const [data, setData] = useState<BlogIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useMobile();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showStats, setShowStats] = useState(false);
  const [tagsData, setTagsData] = useState<TagsResponse | null>(null);
  const [footerData, setFooterData] = useState<SiteData['footer'] | null>(null);

  const { data: archiveData } = useBlogArchive();
  const monthsToLoad = useMemo(() => {
    if (!archiveData?.months.length) return [];
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    return archiveData.months.slice(startIndex, endIndex);
  }, [archiveData, currentPage]);

  const { data: regularPosts, loading: regularPostsLoading } = useMultipleMonthArchives(monthsToLoad);

  useEffect(() => {
    getBlogIndex()
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load blog index:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch('/blog/tags.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load tags data');
        return res.json();
      })
      .then((data: TagsResponse) => {
        setTagsData(data);
      })
      .catch((error) => {
        console.error('Failed to load tags data:', error);
      });
  }, []);

  useEffect(() => {
    fetch('/data/site-data.json')
      .then(res => res.json())
      .then((data: SiteData) => {
        setFooterData(data.footer);
      })
      .catch(console.error);
  }, []);

  const filteredRegularPosts = useMemo(() => {
    if (!regularPosts) return [];
    const query = searchQuery.toLowerCase();
    const hasQuery = query.trim().length > 0;

    return regularPosts.filter((post) => {
      const matchesQuery = !hasQuery ||
        post.title.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query));

      return matchesQuery;
    });
  }, [regularPosts, searchQuery]);

  const featuredPosts = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data.posts.filter(post => post.featured);

    const query = searchQuery.toLowerCase();
    return data.posts.filter(post =>
      post.featured && (
        post.title.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
      )
    );
  }, [data, searchQuery]);

  const postsByMonth = useMemo(() => {
    const grouped: Record<string, typeof filteredRegularPosts> = {};

    filteredRegularPosts.forEach(post => {
      const date = new Date(post.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const yearMonth = `${year}-${month}`;

      if (!grouped[yearMonth]) {
        grouped[yearMonth] = [];
      }

      grouped[yearMonth].push(post);
    });

    return grouped;
  }, [filteredRegularPosts]);

  const sortedMonths = useMemo(() => {
    return Object.keys(postsByMonth).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [postsByMonth]);

  const totalPages = useMemo(() => {
    if (!archiveData?.months.length) return 1;
    return Math.ceil(archiveData.months.length / POSTS_PER_PAGE);
  }, [archiveData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-2 border-t-transparent animate-spin"
            style={{ 
              borderColor: 'var(--accent-primary)', 
              borderTopColor: 'transparent',
              clipPath: clipPathRounded(6),
            }}
          />
          <p style={{ color: 'var(--text-muted)' }}>加载中...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p style={{ color: '#ef4444' }}>加载失败</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 mt-4 text-white transition-all hover:scale-105"
            style={{ 
              background: 'var(--accent-primary)',
              clipPath: clipPathRounded(4),
            }}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        {/* 统一背景特效 */}
        <div className="fixed inset-0 pointer-events-none">
          <AmbientGlow color="var(--accent-primary)" opacity={0.15} position="top-right" />
          <AmbientGlow color="var(--accent-secondary)" opacity={0.1} position="bottom-left" />
          <AmbientGlow color="var(--accent-primary)" opacity={0.08} position="center" size={600} />
          
          {/* 网格背景 */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255, 0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255, 0.1) 1px, transparent 1px)`,
              backgroundSize: '80px 80px'
            }}
          />
        </div>

        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-32 lg:pt-36 pb-12">
          {/* 顶部工具栏 - 固定定位 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed top-16 lg:top-20 left-0 right-0 z-40 px-4 sm:px-6 lg:px-8 py-3"
            style={{ 
              background: 'linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-primary) 80%, transparent 100%)'
            }}
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              {/* 搜索框 */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="搜索文章..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm transition-all duration-200"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    clipPath: clipPathRounded(4),
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                {/* 统计按钮 */}
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="flex items-center gap-2 px-3 py-2 transition-all duration-200"
                  style={{
                    background: showStats ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    color: showStats ? 'white' : 'var(--text-primary)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:block">统计</span>
                </button>

                {/* 视图切换 */}
                <div 
                  className="flex items-center gap-1 p-1" 
                  style={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-subtle)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  <button
                    onClick={() => setViewMode('grid')}
                    className="p-2 transition-all duration-200"
                    style={{
                      background: viewMode === 'grid' ? 'var(--accent-primary)' : 'transparent',
                      color: viewMode === 'grid' ? 'white' : 'var(--text-secondary)',
                      clipPath: clipPathRounded(2),
                    }}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className="p-2 transition-all duration-200"
                    style={{
                      background: viewMode === 'list' ? 'var(--accent-primary)' : 'transparent',
                      color: viewMode === 'list' ? 'white' : 'var(--text-secondary)',
                      clipPath: clipPathRounded(2),
                    }}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Hero - 非对称布局 */}
          <section className="relative pt-8 pb-16 overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute top-20 right-20 w-64 h-64 opacity-20"
                style={{ background: 'radial-gradient(circle, var(--accent-glow), transparent 70%)' }}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* 左侧：标题和描述 */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-2 mb-6"
                  style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  <BookOpen className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>博客</span>
                </motion.div>

                <h1
                  className="font-sans font-bold text-4xl md:text-5xl lg:text-6xl mb-6"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  探索博客
                </h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-lg md:text-xl leading-relaxed max-w-xl"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {data.description}
                </motion.p>
              </motion.div>

              {/* 右侧：统计卡片 */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2, type: 'spring', stiffness: 100 }}
                className="grid grid-cols-3 gap-4"
              >
                <StatCard 
                  icon={Calendar} 
                  value={sortedMonths.length} 
                  label="月份归档" 
                  color="var(--accent-primary)" 
                  delay={0}
                />
                <StatCard 
                  icon={Tag} 
                  value={tagsData?.tags.length || 0} 
                  label="标签" 
                  color="var(--accent-secondary)" 
                  delay={1}
                />
                <StatCard 
                  icon={BookOpen} 
                  value={(data?.posts?.length || 0) + (regularPosts?.length || 0)} 
                  label="文章总数" 
                  color="#22c55e" 
                  delay={2}
                />
              </motion.div>
            </div>
          </section>

          {/* 精选文章 - Bento Grid 风格 */}
          {featuredPosts.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-16"
            >
              <div className="flex items-center gap-4 mb-8">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex items-center justify-center w-12 h-12 relative overflow-hidden"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    clipPath: clipPathRounded(6),
                  }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: 'radial-gradient(circle at 50% 50%, var(--accent-glow), transparent 70%)' }}
                    animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <Sparkles className="w-6 h-6 relative z-10" style={{ color: 'var(--accent-primary)' }} />
                </motion.div>
                <div>
                  <h2
                    className="font-sans font-bold text-2xl"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    精选文章
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>编辑推荐的高质量内容</p>
                </div>
              </div>

              {/* 动态网格布局 */}
              <div className={`
                grid gap-6 auto-rows-min
                ${featuredPosts.length === 1 ? 'grid-cols-1' : ''}
                ${featuredPosts.length === 2 ? 'grid-cols-1 md:grid-cols-2' : ''}
                ${featuredPosts.length >= 3 ? 'grid-cols-1 md:grid-cols-3' : ''}
              `}>
                {featuredPosts.map((post, index) => {
                  let spanClass = '';
                  if (featuredPosts.length >= 3 && index === 0) {
                    spanClass = 'md:col-span-2 md:row-span-2';
                  }
                  return (
                    <GlassCard
                      key={post.slug}
                      className={spanClass}
                      hoverScale={1.02}
                      accentColor="var(--accent-primary)"
                    >
                      <div className="h-full">
                        {viewMode === 'grid' ? (
                          <BlogCard post={post} index={index} featured={true} />
                        ) : (
                          <BlogListItem post={post} index={index} featured={true} />
                        )}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* 全部文章 */}
          {sortedMonths.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex items-center justify-center w-12 h-12 relative overflow-hidden"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    clipPath: clipPathRounded(6),
                  }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: 'radial-gradient(circle at 50% 50%, var(--accent-glow), transparent 70%)' }}
                    animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <BookOpen className="w-6 h-6 relative z-10" style={{ color: 'var(--accent-secondary)' }} />
                </motion.div>
                <div>
                  <h2
                    className="font-sans font-bold text-2xl"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-tertiary))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    全部文章
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>按月份归档的所有文章</p>
                </div>
              </div>

              {regularPostsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div
                    className="w-12 h-12 border-2 border-t-transparent animate-spin"
                    style={{ 
                      borderColor: 'var(--accent-primary)', 
                      borderTopColor: 'transparent',
                      clipPath: clipPathRounded(6),
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-12">
                    {sortedMonths.map((yearMonth, monthIndex) => {
                      const posts = postsByMonth[yearMonth];
                      const [year, month] = yearMonth.split('-');

                      return (
                        <motion.div 
                          key={yearMonth}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: '-50px' }}
                          transition={{ duration: 0.5, delay: monthIndex * 0.1 }}
                        >
                          {/* 月份标题 */}
                          <div className="flex items-center gap-3 mb-6">
                            <div
                              className="flex items-center justify-center w-10 h-10"
                              style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '2px solid rgba(255, 255, 255, 0.1)',
                                clipPath: clipPathRounded(4),
                              }}
                            >
                              <Calendar className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                            </div>
                            <h3
                              className="font-sans font-bold text-xl"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {year}年{parseInt(month)}月
                            </h3>
                            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                            <span
                              className="text-sm px-3 py-1"
                              style={{
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-muted)',
                                clipPath: clipPathRounded(4),
                              }}
                            >
                              {posts.length} 篇
                            </span>
                          </div>

                          {/* 文章网格 */}
                          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                            {posts.map((post, index) => (
                              viewMode === 'grid' ? (
                                <BlogCard key={post.slug} post={post} index={index} />
                              ) : (
                                <BlogListItem key={post.slug} post={post} index={index} />
                              )
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* 分页 */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-12">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-4 py-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          clipPath: clipPathRounded(4),
                        }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">上一页</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className="w-10 h-10 transition-all duration-200 font-medium"
                            style={{
                              background: page === currentPage ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                              border: '1px solid var(--border-subtle)',
                              color: page === currentPage ? 'white' : 'var(--text-primary)',
                              clipPath: clipPathRounded(4),
                            }}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-4 py-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          clipPath: clipPathRounded(4),
                        }}
                      >
                        <span className="text-sm font-medium">下一页</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.section>
          )}

          {/* 无结果 */}
          {filteredRegularPosts.length === 0 && !regularPostsLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
              style={{ color: 'var(--text-muted)' }}
            >
              没有找到匹配的文章
            </motion.div>
          )}
        </main>

        {/* 统计弹窗 */}
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl max-h-[80vh] overflow-auto p-6 relative"
                style={{
                  background: 'var(--bg-card)',
                  border: '2px solid var(--border-subtle)',
                  clipPath: clipPathRounded(12),
                }}
              >
                <button
                  onClick={() => setShowStats(false)}
                  className="absolute top-4 right-4 p-2 transition-all duration-200 hover:scale-105"
                  style={{ 
                    background: 'var(--bg-secondary)', 
                    color: 'var(--text-primary)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-8">
                  <div>
                    <h2 className="font-sans font-bold text-2xl mb-4" style={{ color: 'var(--text-primary)' }}>
                      博客统计
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { value: data?.posts.length || 0, label: '精选文章', color: 'var(--accent-primary)' },
                        { value: regularPosts?.length || 0, label: '普通文章', color: 'var(--accent-secondary)' },
                        { value: tagsData?.total || 0, label: '标签总数', color: '#22c55e' },
                        { value: archiveData?.months.length || 0, label: '归档月份', color: 'var(--text-primary)' },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="p-4 text-center"
                          style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                            clipPath: clipPathRounded(6),
                          }}
                        >
                          <div className="text-3xl font-bold mb-1 font-sans font-bold" style={{ color: stat.color }}>
                            {stat.value}
                          </div>
                          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-sans font-bold text-xl mb-4">
                      <GradientText animate={true}>标签词云</GradientText>
                    </h3>
                    {tagsData ? (
                      <BlogTagCloud tags={tagsData.tags} selectedTag={null} onSelectTag={() => {}} />
                    ) : (
                      <div className="flex items-center justify-center py-20">
                        <div
                          className="w-8 h-8 border-2 border-t-transparent animate-spin"
                          style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        {footerData && <Footer data={footerData} />}

        {/* 底部光剑 */}
        {!isMobile && <LightBeam position="bottom" color="var(--accent-secondary)" intensity={0.2} />}
      </div>
    </>
  );
}
