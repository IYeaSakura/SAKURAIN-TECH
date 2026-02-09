import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { BlogPost } from '../types';
import { formatDate, getReadingTime } from '../utils';
import { deploymentConfig } from '@/config/deployment-config';

interface BlogCardProps {
  post: BlogPost;
  index: number;
}

export const BlogCard = memo(function BlogCard({ post, index }: BlogCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const color = 'var(--accent-primary)';

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
      className="group relative block cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="absolute -inset-[2px] rounded-xl transition-opacity duration-500"
        style={{
          background: isHovered
            ? `linear-gradient(45deg, ${color}, var(--accent-secondary), var(--accent-tertiary), ${color})`
            : 'transparent',
          backgroundSize: '300% 300%',
          animation: isHovered ? 'gradient-shift 3s ease infinite' : 'none',
          opacity: isHovered ? 1 : 0,
          filter: 'blur(4px)',
          zIndex: -1,
        }}
      />
      <div
        className="relative p-6 rounded-xl overflow-hidden transition-all duration-300"
        style={{
          background: 'var(--bg-card)',
          border: '3px solid',
          borderColor: isHovered ? color : 'var(--border-subtle)',
          transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'none',
          boxShadow: isHovered
            ? `0 20px 40px var(--accent-glow), 0 0 30px ${color}20, inset -4px -4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 4px 4px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)`
            : 'inset -4px -4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 4px 4px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)',
        }}
      >
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${color}20, transparent 60%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${color}15 45%, ${color}30 50%, ${color}15 55%, transparent 60%)`,
            transform: 'translateX(-100%)',
          }}
          animate={isHovered ? { x: '200%' } : { x: '-100%' }}
          transition={{ duration: 0.6 }}
        />

        <div className="flex items-start gap-4 relative z-10">
          <motion.div
            animate={{
              scale: isHovered ? 1.1 : 1,
              rotate: isHovered ? 5 : 0,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              boxShadow: `0 0 20px ${color}20`,
            }}
          >
            <img
              src={post.cover}
              alt={post.title}
              className="w-10 h-10 object-contain"
            />
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <motion.h3
                animate={{
                  scale: isHovered ? 1.05 : 1,
                }}
                transition={{ duration: 0.2 }}
                className="font-bold text-lg truncate"
                style={{
                  color: 'var(--text-primary)',
                  textShadow: isHovered ? '0 0 20px var(--accent-glow)' : 'none',
                }}
              >
                {post.title}
              </motion.h3>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowRight
                  className="w-4 h-4"
                  style={{ color: 'var(--accent-primary)' }}
                />
              </motion.div>
            </div>
            <p
              className="text-sm line-clamp-2 mb-3"
              style={{ color: 'var(--text-secondary)' }}
            >
              {post.description}
            </p>
            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(post.date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getReadingTime(post.content || '')}
              </span>
            </div>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {post.tags.slice(0, 3).map((tag) => (
                  <motion.span
                    key={tag}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background: 'var(--bg-secondary)',
                      color: 'var(--accent-primary)',
                      border: '1px solid var(--border-subtle)',
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
    </motion.div>
  );
});
