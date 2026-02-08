import { useState, memo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import type { BlogPost } from '../types';
import { formatDate, getReadingTime } from '../utils';

interface BlogCardProps {
  post: BlogPost;
  index: number;
}

export const BlogCard = memo(function BlogCard({ post, index }: BlogCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onClick={() => navigate(`/blog/${post.slug}`)}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative block"
      style={{ perspective: '1000px' }}
    >
      <div
        className="relative p-6 rounded-xl overflow-hidden transition-all duration-300"
        style={{
          background: 'var(--bg-card)',
          border: '3px solid',
          borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)',
          transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'none',
          boxShadow: isHovered
            ? `0 20px 40px var(--accent-glow), 0 0 30px var(--accent-primary)20`
            : 'inset -4px -4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 4px 4px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)',
        }}
      >
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(circle at 50% 0%, var(--accent-primary)20, transparent 60%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, var(--accent-primary)15 45%, var(--accent-primary)30 50%, var(--accent-primary)15 55%, transparent 60%)',
            transform: 'translateX(-100%)',
          }}
          animate={isHovered ? { x: '200%' } : { x: '-100%' }}
          transition={{ duration: 0.6 }}
        />

        <div className="flex items-start gap-4 relative z-10">
          <div
            className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <img
              src={post.cover}
              alt={post.title}
              className="w-10 h-10 object-contain"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3
                className="font-bold text-lg truncate transition-all duration-200"
                style={{
                  color: 'var(--text-primary)',
                  textShadow: isHovered ? '0 0 20px var(--accent-glow)' : 'none',
                }}
              >
                {post.title}
              </h3>
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
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded-full"
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
        </div>
      </div>
    </motion.div>
  );
});
