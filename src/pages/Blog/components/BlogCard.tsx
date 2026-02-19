import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { BlogPost } from '../types';
import { formatDateCard, getReadingTime } from '../utils';
import { deploymentConfig } from '@/config/deployment-config';

interface BlogCardProps {
  post: BlogPost;
  index: number;
  featured?: boolean;
  featuredLarge?: boolean;
}

// CSS clip-path helpers - 像素风格
const clipPathRounded = (r: number) => `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

export const BlogCard = memo(function BlogCard({ post, index, featured = false, featuredLarge = false }: BlogCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    if (deploymentConfig.useWindowLocation) {
      window.location.href = `/blog/${post.slug}`;
    } else {
      navigate(`/blog/${post.slug}`);
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay: index * 0.05,
        type: 'spring',
        stiffness: 100,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative block cursor-pointer h-full"
      style={{ perspective: '1000px' }}
    >
      {/* 像素风格外框 */}
      <div
        className="relative h-full transition-all duration-300"
        style={{
          background: isHovered ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
          border: `2px solid ${isHovered ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)'}`,
          clipPath: clipPathRounded(8),
          transform: isHovered ? 'translateY(-4px)' : 'none',
        }}
      >
        <div className="relative p-6 h-full flex flex-col">
          {/* 四角光效动画 */}
          <div className="absolute top-0 left-0 w-4 h-4 pointer-events-none">
            <motion.div
              className="absolute top-0 left-0 w-full h-[2px]"
              style={{ background: 'linear-gradient(to right, transparent, var(--accent-primary), transparent)' }}
              animate={isHovered ? { opacity: 1, x: [-16, 16] } : { opacity: 0, x: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
            {isHovered && (
              <motion.div
                className="absolute top-0 left-0 w-[2px] h-full"
                style={{ background: 'linear-gradient(to bottom, var(--accent-primary), transparent)' }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </div>
          <div className="absolute top-0 right-0 w-4 h-4 pointer-events-none">
            <motion.div
              className="absolute top-0 right-0 w-full h-[2px]"
              style={{ background: 'linear-gradient(to right, transparent, var(--accent-secondary), transparent)' }}
              animate={isHovered ? { opacity: 1, x: [16, -16] } : { opacity: 0, x: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
            {isHovered && (
              <motion.div
                className="absolute top-0 right-0 w-[2px] h-full"
                style={{ background: 'linear-gradient(to bottom, var(--accent-secondary), transparent)' }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </div>
          <div className="absolute bottom-0 left-0 w-4 h-4 pointer-events-none">
            <motion.div
              className="absolute bottom-0 left-0 w-full h-[2px]"
              style={{ background: 'linear-gradient(to right, transparent, var(--accent-secondary), transparent)' }}
              animate={isHovered ? { opacity: 1, x: [-16, 16] } : { opacity: 0, x: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
            {isHovered && (
              <motion.div
                className="absolute bottom-0 left-0 w-[2px] h-full"
                style={{ background: 'linear-gradient(to top, var(--accent-secondary), transparent)' }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none">
            <motion.div
              className="absolute bottom-0 right-0 w-full h-[2px]"
              style={{ background: 'linear-gradient(to right, transparent, var(--accent-primary), transparent)' }}
              animate={isHovered ? { opacity: 1, x: [16, -16] } : { opacity: 0, x: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
            {isHovered && (
              <motion.div
                className="absolute bottom-0 right-0 w-[2px] h-full"
                style={{ background: 'linear-gradient(to top, var(--accent-primary), transparent)' }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </div>

          {/* Hover glow background */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 50% 0%, var(--accent-glow), transparent 60%)' }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Scanline effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)',
              opacity: isHovered ? 0.5 : 0,
            }}
          />

          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 55%, transparent 60%)',
            }}
            animate={isHovered ? { x: '200%' } : { x: '-100%' }}
            transition={{ duration: 0.8 }}
          />

          {/* Content */}
          <div className={`flex relative z-10 flex-1 ${featuredLarge ? 'flex-col md:flex-row gap-6' : 'flex-col gap-4'}`}>
            {/* Icon/Image */}
            <motion.div
              animate={{
                scale: isHovered ? 1.1 : 1,
                rotate: isHovered ? 5 : 0,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`flex-shrink-0 flex items-center justify-center overflow-hidden relative ${
                featuredLarge ? 'w-full md:w-24 h-32 md:h-24' : 'w-full h-32'
              }`}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: `2px solid ${isHovered ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)'}`,
                clipPath: clipPathRounded(4),
              }}
            >
              <img
                src={post.cover}
                alt={post.title}
                className={`object-contain ${featuredLarge ? 'w-16 h-16 md:w-12 md:h-12' : 'w-16 h-16'}`}
              />
              {/* Icon glow */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at center, var(--accent-glow), transparent 70%)' }}
                animate={{ opacity: isHovered ? 0.5 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>

            <div className="flex-1 min-w-0 flex flex-col">
              {/* Title row */}
              <div className="flex items-start gap-2 mb-3">
                <div className="relative group/title flex-1 min-w-0">
                  <motion.h3
                    animate={{ scale: isHovered ? 1.02 : 1 }}
                    transition={{ duration: 0.2 }}
                    className={`font-bold truncate ${featuredLarge ? 'text-xl md:text-2xl' : featured ? 'text-lg' : 'text-lg'}`}
                    style={{
                      color: 'var(--text-primary)',
                      textShadow: isHovered ? '0 0 10px var(--accent-glow)' : 'none',
                    }}
                  >
                    {post.title}
                  </motion.h3>

                  {/* 悬浮提示 */}
                  <div
                    className="absolute left-0 -top-1 -translate-y-full opacity-0 group-hover/title:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      padding: '4px 12px',
                      clipPath: clipPathRounded(4),
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {post.title}
                    </span>
                  </div>
                </div>

                {/* Featured badge */}
                {post.featured && (
                  <div
                    className="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      color: '#60a5fa',
                      clipPath: clipPathRounded(2),
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    精选
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <ArrowRight className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                </motion.div>
              </div>

              <p
                className={`text-sm line-clamp-2 mb-4 flex-1 ${featured ? 'line-clamp-3 md:line-clamp-4' : ''}`}
                style={{ color: 'var(--text-muted)' }}
              >
                {post.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDateCard(post.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readingTime || getReadingTime(post.content || '')}
                  </span>
                </div>

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, featuredLarge ? 3 : 2).map((tag) => (
                      <motion.span
                        key={tag}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                        className="text-xs px-2 py-1"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--accent-primary)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          clipPath: clipPathRounded(2),
                        }}
                      >
                        {tag}
                      </motion.span>
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
