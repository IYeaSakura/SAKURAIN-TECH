'use client';

/**
 * BlogListItem —— brutalist list entry for the blog index.
 *
 * Sharp rectangles, thick borders and a pixel offset shadow replace the
 * previous glass/glow effects so the card matches the site-wide theme.
 */

import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { BlogPost } from '../types';
import { formatDateCard, getReadingTime } from '../utils';
import { useAnimationEnabled, useTranslation } from '@/hooks';

interface BlogListItemProps {
  /** 文章数据 */
  post: BlogPost;
  /** 列表序号，用于动画错峰 */
  index: number;
  /** 是否属于精选区域 */
  featured?: boolean;
}

export const BlogListItem = memo(function BlogListItem({ post, index }: BlogListItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useRouter().push;
  const animationEnabled = useAnimationEnabled();
  const { t, tReplace } = useTranslation();

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(`/blog/${post.slug}`);
  };

  return (
    <motion.div
      onClick={handleClick}
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: animationEnabled ? index * 0.05 : 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer"
    >
      <div
        className="relative transition-all duration-200"
        style={{
          background: isHovered ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
          border: '2px solid var(--border-subtle)',
          boxShadow: isHovered ? '4px 4px 0 var(--accent-primary)' : '4px 4px 0 var(--border-subtle)',
          transform: isHovered ? 'translate(-2px, -2px)' : 'none',
        }}
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <div
              className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center border-2 transition-colors"
              style={{
                background: 'var(--bg-primary)',
                borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)',
              }}
            >
              <img
                src={post.cover}
                alt={post.title}
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h3
                  className="font-bold text-base sm:text-lg truncate flex-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {post.title}
                </h3>

                {post.featured && (
                  <div
                    className="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider border-2"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--accent-primary)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    {t.blog.featuredLabel}
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 8 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 hidden sm:block"
                >
                  <ArrowRight className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                </motion.div>
              </div>

              <p
                className="text-sm line-clamp-2 mb-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                {post.description}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDateCard(post.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {tReplace(t.blog.readingTime, {
                      time: post.readingTime ? parseInt(post.readingTime, 10) || 0 : getReadingTime(post.content || ''),
                    })}
                  </span>
                </div>

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag) => (
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
