import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Calendar, Clock, Tag, Share2, ArrowLeft } from 'lucide-react';
import { AmbientGlow } from '@/components/effects';
import { useTheme, useMobile } from '@/hooks';
import { ImagePreviewProvider, useImagePreview } from '@/contexts/ImagePreviewContext';
import { MarkdownRenderer } from '@/pages/Docs/components/MarkdownRenderer';
import { ArticleSidebar } from './components/ArticleSidebar';
import { FloatingToolbar } from './components/FloatingToolbar';
import { getBlogPost, formatDateDetail, getReadingTime, getWordCount } from '../Blog/utils';
import type { BlogPost } from '../Blog/types';

export default function BlogPost() {
  return (
    <ImagePreviewProvider>
      <BlogPostContent />
    </ImagePreviewProvider>
  );
}

function BlogPostContent() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  useTheme();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMobile();
  useImagePreview();

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

  useEffect(() => {
    fetch(`/blog/index.json?v=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then((data) => {
        const posts = data.posts || [];
        setAllPosts(posts);
      })
      .catch(err => {
        console.error('Failed to load blog index:', err);
      });
  }, []);

  const handleBack = () => {
    navigate('/blog');
  };

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

  const handleNavigate = (slug: string) => {
    navigate(`/blog/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentIndex = allPosts.findIndex(p => p.slug === slug);
  const previousPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  const relatedPosts = allPosts
    .filter(p => p.slug !== slug && p.tags.some(tag => post?.tags.includes(tag)))
    .slice(0, 3)
    .map(p => ({
      title: p.title,
      slug: p.slug,
      description: p.description,
    }));

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
          {!isMobile && (
            <>
              <AmbientGlow position="top-left" color="var(--accent-primary)" size={500} opacity={0.12} />
              <AmbientGlow position="bottom-right" color="var(--accent-secondary)" size={400} opacity={0.08} />
            </>
          )}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 0%, var(--bg-primary) 70%)',
            }}
          />
        </div>

        {!isMobile && post.content && (
          <ArticleSidebar
            wordCount={post.content ? getWordCount(post.content) : undefined}
            readingTime={post.content ? getReadingTime(post.content) : undefined}
            date={post.date}
            onBack={handleBack}
            onPrevious={previousPost ? () => handleNavigate(previousPost.slug) : undefined}
            onNext={nextPost ? () => handleNavigate(nextPost.slug) : undefined}
            hasPrevious={!!previousPost}
            hasNext={!!nextPost}
            relatedPosts={relatedPosts}
            onNavigate={handleNavigate}
          />
        )}

        <FloatingToolbar onExit={handleBack} content={post.content} title={post.title} />

        <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pb-12">
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
              
              <div className="relative z-10 p-6 md:p-8">
                <h1 
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4"
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
                    {formatDateDetail(post.date)}
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
                  <div className="flex flex-wrap gap-2 mb-2">
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
              className="relative rounded-2xl p-6 md:p-8"
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
              className="mt-8 flex items-center justify-between md:hidden"
            >
              <button
                onClick={handleBack}
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 rounded-xl p-5 flex items-center gap-4"
              style={{
                background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'var(--accent-primary)',
                  boxShadow: '0 2px 10px var(--accent-glow)',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    本作品采用
                  </span>
                  <a
                    href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-sm transition-all duration-200 hover:underline"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    CC BY-NC-SA 4.0
                  </a>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    许可协议
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', lineHeight: '1.4' }}>
                  署名-非商业性使用-相同方式共享
                </div>
              </div>
            </motion.div>
          </motion.article>
        </main>
      </div>
    </>
  );
}
