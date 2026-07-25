'use client';

/**
 * BlogCard —— brutalist grid card for the blog index.
 *
 * Replaces glass/glow with thick borders, pixel shadows and sharp corners
 * to match the site-wide brutalist / pixel theme.
 */

import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { BlogPost } from '../types';
import { formatDateCard, getReadingTime } from '../utils';
import { useAnimationEnabled, useTranslation } from '@/hooks';

interface BlogCardProps {
  /** 文章数据 */
  post: BlogPost;
  /** 网格序号，用于动画错峰 */
  index: number;
  /** 是否属于精选区域 */
  featured?: boolean;
  /** 精选区是否使用大图布局 */
  featuredLarge?: boolean;
}

export const BlogCard = memo(function BlogCard({
  post,
  index,
  featured = false,
  featuredLarge = false,
}: BlogCardProps) {
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
      className="group cursor-pointer h-full"
    >
      <div
        className="relative h-full transition-all duration-200"
        style={{
          background: isHovered ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
          border: '2px solid var(--border-subtle)',
          boxShadow: isHovered ? '4px 4px 0 var(--accent-primary)' : '4px 4px 0 var(--border-subtle)',
          transform: isHovered ? 'translate(-2px, -2px)' : 'none',
        }}
      >
        <div className="p-4 sm:p-5 h-full flex flex-col">
          <div className={`flex flex-1 ${featuredLarge ? 'flex-col md:flex-row gap-4' : 'flex-col gap-4'}`}>
            <div
              className={`flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                featuredLarge ? 'w-full md:w-28 h-32 md:h-28' : 'w-full h-32'
              }`}
              style={{
                background: 'var(--bg-primary)',
                borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)',
              }}
            >
              <img
                src={post.cover}
                alt={post.title}
                className={`object-contain ${featuredLarge ? 'w-16 h-16 md:w-12 md:h-12' : 'w-16 h-16'}`}
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-start gap-2 mb-2">
                <h3
                  className={`font-bold truncate flex-1 ${
                    featuredLarge ? 'text-lg md:text-xl' : 'text-base'
                  }`}
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
                className={`text-sm line-clamp-2 mb-4 flex-1 ${featured ? 'line-clamp-3 md:line-clamp-4' : ''}`}
                style={{ color: 'var(--text-secondary)' }}
              >
                {post.description}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 mt-auto">
                <div className="flex items-center gap-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
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
                    {post.tags.slice(0, featuredLarge ? 3 : 2).map((tag) => (
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
