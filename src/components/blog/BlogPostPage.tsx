'use client';

/**
 * BlogPostPage —— brutalist article reader.
 *
 * A clean, content-first layout with thick borders, pixel shadows and
 * monospace accents. Keeps the reading experience focused while maintaining
 * the site-wide visual language.
 */

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Clock, Tag, Share2, ArrowLeft, Scale } from 'lucide-react';
import { useTheme, useTranslation } from '@/hooks';
import { ImagePreviewProvider, useImagePreview } from '@/contexts/ImagePreviewContext';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { ArticleSidebar } from './components/ArticleSidebar';
import { FloatingToolbar } from './components/FloatingToolbar';
import { CommentSection } from './components/CommentSection';
import { formatDateDetail, getReadingTime, getWordCount } from './utils';
import type { BlogPost } from './types';

interface BlogPostPageProps {
  /** 当前文章（含正文，服务端内容管线注入） */
  post: BlogPost;
  /** 全部文章元信息（上一篇/下一篇、相关文章用，不含正文） */
  allPosts: BlogPost[];
}

export default function BlogPostPage({ post, allPosts }: BlogPostPageProps) {
  return (
    <ImagePreviewProvider>
      <BlogPostContent post={post} allPosts={allPosts} />
    </ImagePreviewProvider>
  );
}

function BlogPostContent({ post, allPosts }: BlogPostPageProps) {
  const navigate = useRouter().push;
  useTheme();
  useImagePreview();
  const { t, tReplace } = useTranslation();

  const slug = post.slug;

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
      alert(t.blog.linkCopied);
    }
  };

  const handleNavigate = (targetSlug: string) => {
    navigate(`/blog/${targetSlug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const previousPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  const relatedPosts = allPosts
    .filter((p) => p.slug !== slug && p.tags.some((tag) => post.tags.includes(tag)))
    .slice(0, 3)
    .map((p) => ({
      title: p.title,
      slug: p.slug,
      description: p.description,
    }));

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {post.content && (
        <ArticleSidebar
          wordCount={getWordCount(post.content)}
          readingTime={tReplace(t.blog.readingTime, { time: getReadingTime(post.content) })}
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

      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Header card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="border-2 p-6 md:p-8 mb-6"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-subtle)',
              boxShadow: '6px 6px 0 var(--border-subtle)',
            }}
          >
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-5 transition-opacity hover:opacity-70"
              style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              {t.blog.backToList}
            </button>

            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-tight mb-5"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
            >
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDateDetail(post.date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {tReplace(t.blog.readingTime, { time: getReadingTime(post.content || '') })}
              </span>
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                {post.author}
              </span>
            </div>

            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-1 border-2 font-mono uppercase"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="border-2 p-6 md:p-8"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {post.content && <MarkdownRenderer content={post.content} />}
          </motion.div>

          {/* Mobile actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-6 flex items-center justify-between md:hidden"
          >
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase border-2"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              {t.blog.backToList}
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase border-2"
              style={{
                background: 'var(--accent-primary)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--bg-primary)',
              }}
            >
              <Share2 className="w-4 h-4" />
              {t.blog.share}
            </button>
          </motion.div>

          {/* License */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 border-2 p-5 flex items-center gap-4"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div
              className="w-12 h-12 border-2 flex items-center justify-center flex-shrink-0"
              style={{
                background: 'var(--accent-primary)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <Scale className="w-6 h-6" style={{ color: 'var(--bg-primary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {t.blog.licensePrefix}
                </span>
                <a
                  href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold underline"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  CC BY-NC-SA 4.0
                </a>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {t.blog.licenseSuffix}
                </span>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {t.blog.licenseDescription}
              </div>
            </div>
          </motion.div>

          {/* Comments */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}>
            <CommentSection postId={slug} />
          </motion.div>
        </motion.article>
      </main>
    </div>
  );
}
