import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Grid, List, Sparkles, X, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { MagneticCursor, VelocityCursor, AmbientGlow, FloatingBubbles, TwinklingStars, FlowingGradient, LightBeam } from '@/components/effects';
import { ThemeToggle } from '@/components/atoms';
import { useTheme } from '@/hooks';
import { BlogCard } from './components/BlogCard';
import { BlogListItem } from './components/BlogListItem';
import { getBlogIndex } from './utils';
import { Heart } from 'lucide-react';
import { BlogArchiveHeatmap } from '@/components/BlogArchiveHeatmap';
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

export default function BlogIndex() {
  const navigate = useNavigate();
  const { theme, isTransitioning, toggleTheme } = useTheme();
  const [data, setData] = useState<BlogIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showStats, setShowStats] = useState(false);
  const [tagsData, setTagsData] = useState<TagsResponse | null>(null);

  const { data: archiveData, loading: archiveLoading } = useBlogArchive();
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
            className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
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
            className="px-4 py-2 rounded-lg text-white mt-4"
            style={{ background: 'var(--accent-primary)' }}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <MagneticCursor />
      <VelocityCursor />

      <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(var(--accent-primary) 1px, transparent 1px),
                linear-gradient(90deg, var(--accent-primary) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
          <AmbientGlow position="top-left" color="var(--accent-primary)" size={500} opacity={0.12} />
          <AmbientGlow position="bottom-right" color="var(--accent-secondary)" size={400} opacity={0.08} />
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 0%, var(--bg-primary) 70%)',
            }}
          />
          <FlowingGradient
            colors={['var(--accent-primary)', 'var(--accent-secondary)', 'var(--accent-tertiary)']}
            speed={15}
            opacity={0.05}
          />
          <LightBeam position="top" color="var(--accent-primary)" intensity={0.3} />
        </div>

        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed top-0 left-0 right-0 z-50 mc-navbar"
        >
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-20">
              <motion.button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">返回首页</span>
              </motion.button>

              <div className="flex items-center gap-3">
                <img
                  src="/image/logo.webp"
                  alt="SAKURAIN"
                  className="w-8 h-8 object-contain"
                />
                <span
                  className="font-pixel text-xl hidden sm:block"
                  style={{ color: 'var(--text-primary)' }}
                >
                  SAKURAIN
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200"
                  style={{
                    background: showStats ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    color: showStats ? 'white' : 'var(--text-primary)',
                  }}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:block">统计</span>
                </button>

                <button
                  onClick={() => setShowArchive(!showArchive)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200"
                  style={{
                    background: showArchive ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    color: showArchive ? 'white' : 'var(--text-primary)',
                  }}
                >
                  <Grid className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:block">归档</span>
                </button>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="搜索文章..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg text-sm w-40 sm:w-64 transition-all duration-200"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-all duration-200 ${viewMode === 'grid' ? 'text-white' : ''}`}
                    style={{
                      background: viewMode === 'grid' ? 'var(--accent-primary)' : 'transparent',
                      color: viewMode === 'grid' ? 'white' : 'var(--text-secondary)',
                    }}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-all duration-200 ${viewMode === 'list' ? 'text-white' : ''}`}
                    style={{
                      background: viewMode === 'list' ? 'var(--accent-primary)' : 'transparent',
                      color: viewMode === 'list' ? 'white' : 'var(--text-secondary)',
                    }}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                <ThemeToggle theme={theme} onToggle={toggleTheme} isTransitioning={isTransitioning} />
              </div>
            </div>
          </div>
        </motion.header>

        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 lg:pt-28 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                博客
              </span>
            </motion.div>

            <h1
              className="font-pixel text-4xl sm:text-5xl lg:text-6xl font-black mb-6"
              style={{
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {data.title}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg max-w-2xl mx-auto font-primary"
              style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
            >
              {data.description}
            </motion.p>
          </motion.div>

          {featuredPosts.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-16"
            >
              <h2
                className="font-pixel text-2xl mb-8"
                style={{
                  color: 'var(--text-primary)',
                  textShadow: '2px 2px 0 color-mix(in srgb, var(--bg-secondary) 50%, black)',
                }}
              >
                精选文章
              </h2>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {featuredPosts.map((post, index) => (
                  viewMode === 'grid' ? (
                    <BlogCard key={post.slug} post={post} index={index} />
                  ) : (
                    <BlogListItem key={post.slug} post={post} index={index} />
                  )
                ))}
              </div>
            </motion.section>
          )}

          {sortedMonths.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h2
                className="font-pixel text-2xl mb-8"
                style={{
                  color: 'var(--text-primary)',
                  textShadow: '2px 2px 0 color-mix(in srgb, var(--bg-secondary) 50%, black)',
                }}
              >
                全部文章
              </h2>

              {regularPostsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div
                    className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-12">
                    {sortedMonths.map((yearMonth, monthIndex) => {
                      const posts = postsByMonth[yearMonth];
                      const [year, month] = yearMonth.split('-');
                      void monthIndex;

                      return (
                        <div key={yearMonth}>
                          <div className="flex items-center gap-3 mb-6">
                            <h3
                              className="font-pixel text-xl font-bold"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {year}年{parseInt(month)}月
                            </h3>
                            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                            <span
                              className="text-sm px-3 py-1 rounded-full"
                              style={{
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-muted)'
                              }}
                            >
                              {posts.length} 篇
                            </span>
                          </div>
                          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                            {posts.map((post, index) => (
                              viewMode === 'grid' ? (
                                <BlogCard key={post.slug} post={post} index={index} />
                              ) : (
                                <BlogListItem key={post.slug} post={post} index={index} />
                              )
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify gap-2 mt-12">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
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
                            className="w-10 h-10 rounded-lg transition-all duration-200 font-medium"
                            style={{
                              background: page === currentPage ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                              border: '1px solid var(--border-subtle)',
                              color: page === currentPage ? 'white' : 'var(--text-primary)',
                            }}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
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

        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0, 0, 0, 0.8)' }}
              onClick={() => setShowStats(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl max-h-[80vh] overflow-auto rounded-2xl p-6 relative"
                style={{
                  background: 'var(--bg-card)',
                  border: '2px solid var(--border-subtle)',
                }}
              >
                <button
                  onClick={() => setShowStats(false)}
                  className="absolute top-4 right-4 p-2 rounded-lg transition-all duration-200 hover:scale-105"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-8">
                  <div>
                    <h2
                      className="font-pixel text-2xl mb-4"
                      style={{
                        color: 'var(--text-primary)',
                        textShadow: '2px 2px 0 color-mix(in srgb, var(--bg-secondary) 50%, black)',
                      }}
                    >
                      博客统计
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div
                        className="p-4 rounded-xl text-center"
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-primary)' }}>
                          {data?.posts.length || 0}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          精选文章
                        </div>
                      </div>

                      <div
                        className="p-4 rounded-xl text-center"
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-secondary)' }}>
                          {regularPosts?.length || 0}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          普通文章
                        </div>
                      </div>

                      <div
                        className="p-4 rounded-xl text-center"
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-tertiary)' }}>
                          {tagsData?.total || 0}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          标签总数
                        </div>
                      </div>

                      <div
                        className="p-4 rounded-xl text-center"
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                          {archiveData?.months.length || 0}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          归档月份
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2
                      className="font-pixel text-2xl mb-4"
                      style={{
                        color: 'var(--text-primary)',
                        textShadow: '2px 2px 0 color-mix(in srgb, var(--bg-secondary) 50%, black)',
                      }}
                    >
                      文章发布热力图
                    </h2>
                    {archiveLoading ? (
                      <div className="flex items-center justify-center py-20">
                        <div
                          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                          style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
                        />
                      </div>
                    ) : (
                      <BlogArchiveHeatmap
                        data={archiveData}
                        onSelectMonth={(month) => {
                          setSelectedMonth(month);
                        }}
                        selectedMonth={selectedMonth}
                      />
                    )}
                  </div>

                  <div>
                    <h2
                      className="font-pixel text-2xl mb-4"
                      style={{
                        color: 'var(--text-primary)',
                        textShadow: '2px 2px 0 color-mix(in srgb, var(--bg-secondary) 50%, black)',
                      }}
                    >
                      标签词云
                    </h2>
                    {tagsData ? (
                      <BlogTagCloud
                        tags={tagsData.tags}
                        selectedTag={null}
                        onSelectTag={() => {}}
                      />
                    ) : (
                      <div className="flex items-center justify-center py-20">
                        <div
                          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                          style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showArchive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0, 0, 0, 0.8)' }}
              onClick={() => setShowArchive(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl max-h-[80vh] overflow-auto rounded-2xl p-6 relative"
                style={{
                  background: 'var(--bg-card)',
                  border: '2px solid var(--border-subtle)',
                }}
              >
                <button
                  onClick={() => setShowArchive(false)}
                  className="absolute top-4 right-4 p-2 rounded-lg transition-all duration-200 hover:scale-105"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <X className="w-5 h-5" />
                </button>

                {archiveLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div
                      className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
                    />
                  </div>
                ) : (
                  <BlogArchiveHeatmap
                    data={archiveData}
                    onSelectMonth={(month) => {
                      setSelectedMonth(month);
                      setShowArchive(false);
                    }}
                    selectedMonth={selectedMonth}
                  />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer
          className="relative py-16 overflow-hidden"
          style={{ borderTop: '4px solid var(--border-subtle)' }}
        >
          {/* Floating bubbles */}
          <div className="absolute inset-0 pointer-events-none opacity-15">
            <FloatingBubbles count={8} colors={['var(--accent-primary)', 'var(--accent-secondary)']} />
          </div>

          {/* Twinkling stars */}
          <div className="absolute inset-0 pointer-events-none hidden lg:block">
            <TwinklingStars count={20} color="var(--accent-primary)" secondaryColor="var(--accent-secondary)" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p
              className="flex items-center justify-center gap-2 font-primary"
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--text-muted)',
              }}
            >
              © {new Date().getFullYear()} SAKURAIN 技术工作室
              <Heart className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              用代码构建未来
            </p>
            {/* 备案信息 */}
            <div
              className="mt-4 flex flex-wrap flex-col md:flex-row items-center justify-center gap-4 font-primary"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
              }}
            >
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ transition: 'color 0.2s ease' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                皖ICP备2025073165号-1
              </a>
              <span>|</span>
              <a
                href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=34130202000598"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline flex items-centerx gap-1"
                style={{ transition: 'color 0.2s ease' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <img
                  src="/image/ghs.png"
                  alt="公安备案图标"
                  className="w-3 h-3"
                />
                皖公网安备34130202000598号
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
