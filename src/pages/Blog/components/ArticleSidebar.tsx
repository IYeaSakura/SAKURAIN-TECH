import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, FileText, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Bookmark } from 'lucide-react';
import { useAnimationEnabled } from '@/hooks';

interface ArticleSidebarProps {
  wordCount?: number;
  readingTime?: string;
  date?: string;
  onBack?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  relatedPosts?: Array<{
    title: string;
    slug: string;
    description: string;
  }>;
  onNavigate?: (slug: string) => void;
}

export function ArticleSidebar({
  wordCount,
  readingTime,
  date,
  onBack,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  relatedPosts = [],
  onNavigate,
}: ArticleSidebarProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const animationEnabled = useAnimationEnabled();

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleBookmark = useCallback(() => {
    setIsBookmarked(!isBookmarked);
  }, [isBookmarked]);

  return (
    <motion.aside
      initial={animationEnabled ? { opacity: 0, x: -20 } : undefined}
      animate={animationEnabled ? { opacity: 1, x: 0 } : undefined}
      transition={animationEnabled ? { duration: 0.5, delay: 0.3 } : undefined}
      className="fixed left-4 top-28 z-40 hidden xl:flex flex-col gap-3"
      style={{
        width: '220px',
        maxHeight: 'calc(100vh - 120px)',
      }}
    >
      <ArticleStatsCard
        wordCount={wordCount}
        readingTime={readingTime}
        date={date}
        onBookmark={handleBookmark}
        isBookmarked={isBookmarked}
      />

      <ReadingProgressCard progress={scrollProgress} />

      {onBack && (
        <QuickNavigationCard
          onBack={onBack}
          onPrevious={onPrevious}
          onNext={onNext}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
        />
      )}

      {relatedPosts.length > 0 && onNavigate && (
        <RelatedPostsCard
          posts={relatedPosts}
          onNavigate={onNavigate}
        />
      )}
    </motion.aside>
  );
}

function ArticleStatsCard({
  wordCount,
  readingTime,
  date,
  onBookmark,
  isBookmarked,
}: {
  wordCount?: number;
  readingTime?: string;
  date?: string;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}) {
  const animationEnabled = useAnimationEnabled();

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, scale: 0.95 } : undefined}
      animate={animationEnabled ? { opacity: 1, scale: 1 } : undefined}
      transition={animationEnabled ? { duration: 0.5, delay: 0.4 } : undefined}
      className="rounded-xl p-3"
      style={{
        background: 'var(--bg-card)',
        border: '1.5px solid var(--border-subtle)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
          <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
          <span className="text-xs font-medium">文章信息</span>
        </div>
        {onBookmark && (
          <motion.button
            onClick={onBookmark}
            whileHover={animationEnabled ? { scale: 1.1 } : undefined}
            whileTap={animationEnabled ? { scale: 0.95 } : undefined}
            className="p-1.5 rounded-md transition-all duration-200"
            style={{
              background: isBookmarked ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              color: isBookmarked ? 'white' : 'var(--text-muted)',
            }}
            title={isBookmarked ? '已收藏' : '收藏文章'}
          >
            <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} />
          </motion.button>
        )}
      </div>

      <div className="space-y-2">
        {wordCount && (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <FileText className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>字数</div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                {wordCount.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {readingTime && (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <Clock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>阅读时间</div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                {readingTime}
              </div>
            </div>
          </div>
        )}

        {date && (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <Calendar className="w-4 h-4" style={{ color: 'var(--accent-tertiary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>发布日期</div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                {date}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ReadingProgressCard({ progress }: { progress: number }) {
  const animationEnabled = useAnimationEnabled();

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, scale: 0.95 } : undefined}
      animate={animationEnabled ? { opacity: 1, scale: 1 } : undefined}
      transition={animationEnabled ? { duration: 0.5, delay: 0.5 } : undefined}
      className="rounded-xl p-3"
      style={{
        background: 'var(--bg-card)',
        border: '1.5px solid var(--border-subtle)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex items-center gap-1.5 mb-2" style={{ color: 'var(--text-primary)' }}>
        <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
        <span className="text-xs font-medium">阅读进度</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            已读 {Math.round(progress)}%
          </span>
          <motion.span
            animate={animationEnabled ? { scale: [1, 1.05, 1] } : undefined}
            transition={animationEnabled ? { duration: 2, repeat: Infinity } : undefined}
            className="font-semibold"
            style={{ color: 'var(--accent-primary)', fontSize: '0.75rem' }}
          >
            {progress >= 100 ? '✓ 已读完' : '继续阅读'}
          </motion.span>
        </div>

        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
              width: `${progress}%`,
            }}
            animate={animationEnabled ? { width: `${progress}%` } : undefined}
            transition={animationEnabled ? { duration: 0.3 } : undefined}
          />
        </div>
      </div>
    </motion.div>
  );
}

function QuickNavigationCard({
  onBack,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: {
  onBack?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}) {
  const animationEnabled = useAnimationEnabled();

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, scale: 0.95 } : undefined}
      animate={animationEnabled ? { opacity: 1, scale: 1 } : undefined}
      transition={animationEnabled ? { duration: 0.5, delay: 0.6 } : undefined}
      className="rounded-xl p-3"
      style={{
        background: 'var(--bg-card)',
        border: '1.5px solid var(--border-subtle)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex items-center gap-1.5 mb-3" style={{ color: 'var(--text-primary)' }}>
        <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
        <span className="text-xs font-medium">快速导航</span>
      </div>

      <div className="space-y-1.5">
        {onBack && (
          <motion.button
            onClick={onBack}
            whileHover={animationEnabled ? { x: 5 } : undefined}
            whileTap={animationEnabled ? { scale: 0.98 } : undefined}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-all duration-200"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            <span className="text-xs font-medium">返回列表</span>
          </motion.button>
        )}

        {onPrevious && hasPrevious && (
          <motion.button
            onClick={onPrevious}
            whileHover={animationEnabled ? { x: 5 } : undefined}
            whileTap={animationEnabled ? { scale: 0.98 } : undefined}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-all duration-200"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <ChevronLeft className="w-3.5 h-3.5" style={{ color: 'var(--accent-secondary)' }} />
            <span className="text-xs font-medium">上一篇</span>
          </motion.button>
        )}

        {onNext && hasNext && (
          <motion.button
            onClick={onNext}
            whileHover={animationEnabled ? { x: 5 } : undefined}
            whileTap={animationEnabled ? { scale: 0.98 } : undefined}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-all duration-200"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--accent-tertiary)' }} />
            <span className="text-xs font-medium">下一篇</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

function RelatedPostsCard({
  posts,
  onNavigate,
}: {
  posts: Array<{
    title: string;
    slug: string;
    description: string;
  }>;
  onNavigate: (slug: string) => void;
}) {
  const animationEnabled = useAnimationEnabled();

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, scale: 0.95 } : undefined}
      animate={animationEnabled ? { opacity: 1, scale: 1 } : undefined}
      transition={animationEnabled ? { duration: 0.5, delay: 0.7 } : undefined}
      className="rounded-xl p-3"
      style={{
        background: 'var(--bg-card)',
        border: '1.5px solid var(--border-subtle)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex items-center gap-1.5 mb-3" style={{ color: 'var(--text-primary)' }}>
        <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
        <span className="text-xs font-medium">相关文章</span>
      </div>

      <div className="space-y-2">
        {posts.slice(0, 3).map((post) => (
          <motion.button
            key={post.slug}
            onClick={() => onNavigate(post.slug)}
            whileHover={animationEnabled ? { x: 5 } : undefined}
            whileTap={animationEnabled ? { scale: 0.98 } : undefined}
            className="w-full text-left p-2 rounded-md transition-all duration-200 group"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="font-medium text-xs mb-0.5 line-clamp-2 group-hover:underline" style={{ color: 'var(--text-primary)' }}>
              {post.title}
            </div>
            <div className="text-xs line-clamp-1" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
              {post.description}
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
