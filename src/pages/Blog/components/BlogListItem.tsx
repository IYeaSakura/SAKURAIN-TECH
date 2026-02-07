import { useState, memo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, Star } from 'lucide-react';
import type { BlogPost } from '../types';
import { formatDate, getReadingTime } from '../utils';

interface BlogListItemProps {
  post: BlogPost;
  index: number;
}

export const BlogListItem = memo(function BlogListItem({ post, index }: BlogListItemProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onClick={() => navigate(`/blog/${post.slug}`)}
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative block cursor-pointer"
    >
      <div
        className="relative p-6 rounded-xl overflow-hidden transition-all duration-300"
        style={{
          background: 'var(--bg-card)',
          border: '2px solid',
          borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)',
          transform: isHovered ? 'translateX(8px)' : 'none',
          boxShadow: isHovered
            ? `0 8px 24px var(--accent-glow), 0 0 20px var(--accent-primary)20`
            : 'inset -2px -2px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 2px 2px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)',
        }}
      >
        {post.featured && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold z-20"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary), color-mix(in srgb, var( --accent-primary) 80%, var(--accent-secondary)))',
              color: 'white',
              boxShadow: '0 2px 10px var(--accent-primary)40',
            }}
          >
            <Star className="w-3 h-3" />
            精选
          </motion.div>
        )}

        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(circle at 0% 50%, var(--accent-primary)15, transparent 60%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <div className="flex items-start gap-4 relative z-10">
          <div
            className="flex-shrink-0 w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <img
              src={post.cover}
              alt={post.title}
              className="w-12 h-12 object-contain"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
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
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowRight
                  className="w-5 h-5"
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
                <Calendar className="w-4 h-4" />
                {formatDate(post.date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
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
