import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Grid, List, Sparkles } from 'lucide-react';
import { MagneticCursor, VelocityCursor, AmbientGlow } from '@/components/effects';
import { ThemeToggle } from '@/components/atoms';
import { useTheme } from '@/hooks';
import { BlogCard } from './components/BlogCard';
import { getBlogIndex } from './utils';
import type { BlogIndex } from './types';

type ViewMode = 'grid' | 'list';

export default function BlogIndex() {
  const navigate = useNavigate();
  const { theme, isTransitioning, toggleTheme } = useTheme();
  const [data, setData] = useState<BlogIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredPosts = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data.posts;

    const query = searchQuery.toLowerCase();
    return data.posts.filter((post) => 
      post.title.toLowerCase().includes(query) ||
      post.description.toLowerCase().includes(query) ||
      post.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [data, searchQuery]);

  const featuredPosts = useMemo(() => {
    return filteredPosts.filter(post => post.featured);
  }, [filteredPosts]);

  const regularPosts = useMemo(() => {
    return filteredPosts.filter(post => !post.featured);
  }, [filteredPosts]);

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPosts.map((post, index) => (
                  <BlogCard key={post.slug} post={post} index={index} />
                ))}
              </div>
            </motion.section>
          )}

          {regularPosts.length > 0 && (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularPosts.map((post, index) => (
                  <BlogCard key={post.slug} post={post} index={index} />
                ))}
              </div>
            </motion.section>
          )}

          {filteredPosts.length === 0 && (
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
      </div>
    </>
  );
}
