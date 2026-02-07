import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Tag, Share2 } from 'lucide-react';
import { MagneticCursor, VelocityCursor, AmbientGlow } from '@/components/effects';
import { ThemeToggle } from '@/components/atoms';
import { useTheme } from '@/hooks';
import { MarkdownRenderer } from '@/pages/Docs/components/MarkdownRenderer';
import { getBlogPost, formatDate, getReadingTime } from '../Blog/utils';
import type { BlogPost } from '../Blog/types';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { theme, isTransitioning, toggleTheme } = useTheme();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      navigate('/blog');
      return;
    }

    getBlogPost(slug)
      .then((result) => {
        if (result) {
          setPost(result);
          setLoading(false);
        } else {
          setError('文章不存在');
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load blog post:', err);
        setError('加载失败');
        setLoading(false);
      });
  }, [slug, navigate]);

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
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

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p style={{ color: '#ef4444' }} className="mb-4">{error || '文章不存在'}</p>
          <button 
            onClick={() => navigate('/blog')} 
            className="px-4 py-2 rounded-lg text-white"
            style={{ background: 'var(--accent-primary)' }}
          >
            返回博客列表
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
                onClick={() => navigate('/blog')}
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
                <span className="font-medium">返回列表</span>
              </motion.button>

              <ThemeToggle theme={theme} onToggle={toggleTheme} isTransitioning={isTransitioning} />
            </div>
          </div>
        </motion.header>

        <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-24 lg:pt-28 pb-12">
          <motion.article
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative overflow-hidden rounded-2xl mb-8"
              style={{
                background: 'var(--bg-card)',
                border: '3px solid var(--border-subtle)',
                boxShadow: '0 20px 40px var(--accent-glow)',
              }}
            >
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 0%, var(--accent-primary)20, transparent 60%)`,
                }}
              />
              
              <div className="relative z-10 p-8">
                <h1 
                  className="font-pixel text-3xl sm:text-4xl lg:text-5xl font-black mb-4"
                  style={{ 
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {post.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(post.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {getReadingTime(post.content || '')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {post.author}
                  </span>
                </div>
                
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-sm px-3 py-1 rounded-full"
                        style={{
                          background: 'var(--bg-secondary)',
                          color: 'var(--accent-primary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative rounded-2xl p-8"
              style={{
                background: 'var(--bg-card)',
                border: '2px solid var(--border-subtle)',
              }}
            >
              {post.content && (
                <MarkdownRenderer content={post.content} />
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex items-center justify-between"
            >
              <button
                onClick={() => navigate('/blog')}
                className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                <ArrowLeft className="w-5 h-5" />
                返回列表
              </button>
              
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200"
                style={{
                  background: 'var(--accent-primary)',
                  color: 'white',
                  boxShadow: '0 4px 20px var(--accent-glow)',
                }}
              >
                <Share2 className="w-5 h-5" />
                分享文章
              </button>
            </motion.div>
          </motion.article>
        </main>
      </div>
    </>
  );
}
