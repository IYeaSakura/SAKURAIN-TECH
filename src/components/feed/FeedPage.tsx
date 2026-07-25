'use client';

import { memo, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rss,
  ExternalLink,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Globe,
  BarChart3,
  Users,
  Newspaper,
  Clock,
  X,
  Check,
  Copy,
  Bug,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Shuffle,
} from 'lucide-react';
import { Footer } from '@/components/sections/Footer';
import { useAnimationEnabled, useIsDesktopClient, useTranslation } from '@/hooks';

import type { SiteData } from '@/types';
import type { Dictionary } from '@/i18n/types';

// Types
interface Friend {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string;
  category: string;
  featured: boolean;
  status?: 'online' | 'offline';
  unidirectional?: boolean;
  feed?: string;
}

interface FeedItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  author?: string;
  source: string;
  sourceUrl: string;
  sourceIcon: string;
}

interface BatchFeedRequest {
  url: string;
  name: string;
}

interface BatchFeedResult {
  cached: BatchFeedItem[];
  missing: BatchFeedRequest[];
  expired: BatchFeedRequest[];
  failed: { url: string; name: string; error: string; timestamp?: number; attempts?: number }[];
}

interface BatchFeedItem {
  url: string;
  name: string;
  content: string;
  contentType: string;
  timestamp: number;
  fromCache: boolean;
  isExpired: boolean;
}

interface FeedSourceStatus {
  name: string;
  url: string;
  status: 'pending' | 'success' | 'error' | 'timeout';
  itemCount: number;
  error?: string;
}

// Neo-brutalist design tokens shared across the feed page
const BRUTALIST_BORDER = '2px solid var(--border-subtle)';
const BRUTALIST_ACCENT_BORDER = '2px solid var(--accent-primary)';
const BRUTALIST_SHADOW = '4px 4px 0 var(--border-subtle)';
const BRUTALIST_ACCENT_SHADOW = '4px 4px 0 var(--accent-primary)';

const POSTS_PER_PAGE = 9;
// Increase timeout to 15s so newly added sites have more time to respond
const FETCH_TIMEOUT = 15000;
const FEED_CACHE_KEY = 'sakurain_feed_cache';
// Feed cache TTL: 30 minutes
const FEED_CACHE_TTL = 30 * 60 * 1000;

interface FeedCache {
  items: FeedItem[];
  timestamp: number;
  sourceStatus: FeedSourceStatus[];
}

const getFeedCache = (): FeedCache | null => {
  try {
    const cached = localStorage.getItem(FEED_CACHE_KEY);
    if (!cached) return null;
    const data = JSON.parse(cached) as FeedCache;
    if (Date.now() - data.timestamp > FEED_CACHE_TTL) {
      localStorage.removeItem(FEED_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const setFeedCache = (items: FeedItem[], sourceStatus: FeedSourceStatus[]): void => {
  try {
    const cache: FeedCache = {
      items,
      timestamp: Date.now(),
      sourceStatus,
    };
    localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage might be full or disabled
  }
};

const clearFeedCache = (): void => {
  try {
    localStorage.removeItem(FEED_CACHE_KEY);
  } catch {
    // ignore
  }
};

// Format a date string to the current locale
const formatDate = (dateStr: string, locale: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

// Return a relative time string (e.g. 5 minutes ago, 2 hours ago)
const getRelativeTime = (
  dateStr: string,
  tReplace: (template: string, values: Record<string, string | number>) => string,
  relativeTime: Dictionary['feed']['relativeTime']
): string => {
  try {
    const now = new Date();
    const date = new Date(dateStr);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return tReplace(relativeTime.seconds, { count: diffInSeconds });
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return tReplace(relativeTime.minutes, { count: diffInMinutes });
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return tReplace(relativeTime.hours, { count: diffInHours });
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return tReplace(relativeTime.days, { count: diffInDays });
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return tReplace(relativeTime.months, { count: diffInMonths });
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return tReplace(relativeTime.years, { count: diffInYears });
  } catch {
    return dateStr;
  }
};

// Stat card with a sharp border, offset shadow and mono label
function StatCard({
  icon: Icon,
  value,
  label,
  color,
  delay = 0,
  onClick,
  active = false,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  value: number | string;
  label: string;
  color: string;
  delay?: number;
  onClick?: () => void;
  active?: boolean;
}) {
  const animationEnabled = useAnimationEnabled();

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
      animate={animationEnabled ? { opacity: 1, y: 0 } : undefined}
      transition={animationEnabled ? { delay: 0.4 + delay * 0.1, duration: 0.5 } : undefined}
      onClick={onClick}
      className={[
        'relative p-6 text-center transition-all duration-200',
        onClick ? 'cursor-pointer' : 'cursor-default',
        'border-2',
        'shadow-[4px_4px_0_var(--border-subtle)]',
        'hover:translate-x-[-2px] hover:translate-y-[-2px]',
        ...(active ? [] : ['hover:shadow-[4px_4px_0_var(--accent-primary)]']),
      ].join(' ')}
      style={{
        background: active ? 'var(--bg-secondary)' : 'var(--bg-card)',
        borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
        boxShadow: active ? BRUTALIST_ACCENT_SHADOW : undefined,
      }}
    >
      <Icon className="w-6 h-6 mx-auto mb-3" style={{ color }} />
      <div className="font-sans font-bold text-3xl mb-1 break-all px-1" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="font-mono uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
    </motion.div>
  );
}

// Stats panel showing source distribution and last 7 days activity
function StatsPanel({
  items,
  onClose
}: {
  items: FeedItem[];
  onClose: () => void;
}) {
  const { t, tReplace } = useTranslation();
  const stats = useMemo(() => {
    // Count articles per source
    const sourceStats: Record<string, number> = {};
    items.forEach(item => {
      sourceStats[item.source] = (sourceStats[item.source] || 0) + 1;
    });

    // Count articles per day for the last 7 days
    const dateStats: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dateStats[d.toISOString().split('T')[0]] = 0;
    }

    items.forEach(item => {
      if (item.pubDate) {
        const date = new Date(item.pubDate).toISOString().split('T')[0];
        if (dateStats.hasOwnProperty(date)) {
          dateStats[date]++;
        }
      }
    });

    // Sort sources by article count
    const sortedSources = Object.entries(sourceStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return { sourceStats: sortedSources, dateStats };
  }, [items]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-8 overflow-hidden"
    >
      <div
        className="p-6"
        style={{
          background: 'var(--bg-card)',
          border: BRUTALIST_BORDER,
          boxShadow: BRUTALIST_SHADOW,
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {t.feed.statsDetails}
          </h3>
          <button
            onClick={onClose}
            className="p-2 border-2 border-transparent transition-all hover:border-[var(--accent-primary)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Source distribution */}
          <div>
            <h4 className="font-mono uppercase tracking-wider text-[10px] mb-4" style={{ color: 'var(--text-muted)' }}>
              {t.feed.sourceDistribution}
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {stats.sourceStats.map(([source, count], index) => (
                <div
                  key={source}
                  className="flex items-center justify-between p-3 border-2 bg-[var(--bg-secondary)]"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {index + 1}. {source}
                  </span>
                  <span
                    className="px-2 py-0.5 border-2 font-mono uppercase tracking-wider text-[10px]"
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderColor: 'var(--accent-primary)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    {tReplace(t.feed.articleCount, { count })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily activity */}
          <div>
            <h4 className="font-mono uppercase tracking-wider text-[10px] mb-4" style={{ color: 'var(--text-muted)' }}>
              {t.feed.last7DaysUpdates}
            </h4>
            <div className="space-y-2">
              {Object.entries(stats.dateStats).map(([date, count]) => (
                <div key={date} className="flex items-center gap-3">
                  <span className="text-sm w-24" style={{ color: 'var(--text-muted)' }}>
                    {date.slice(5)}
                  </span>
                  <div
                    className="flex-1 h-6 border-2 overflow-hidden"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: count > 0 ? `${Math.max((count / Math.max(...Object.values(stats.dateStats))) * 100, 1)}%` : '0%' }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="h-full"
                      style={{ background: 'var(--accent-primary)' }}
                    />
                  </div>
                  <span className="text-sm w-8 text-right" style={{ color: 'var(--text-primary)' }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Subscribe modal with sharp borders and mono labels
function SubscribeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const animationEnabled = useAnimationEnabled();
  const { t } = useTranslation();
  const [copied, setCopied] = useState<string | null>(null);

  const feedOptions = [
    {
      name: 'RSS 2.0',
      url: 'https://sakurain.net/feed/',
      description: t.feed.formatDescriptions.rss,
      color: '#f97316',
    },
    {
      name: 'Atom',
      url: 'https://sakurain.net/feed/atom/',
      description: t.feed.formatDescriptions.atom,
      color: '#3b82f6',
    },
    {
      name: 'JSON Feed',
      url: 'https://sakurain.net/feed/json/',
      description: t.feed.formatDescriptions.json,
      color: '#22c55e',
    },
  ];

  const handleCopy = async (url: string, name: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(name);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        initial={animationEnabled ? { opacity: 0, scale: 0.9, y: 20 } : undefined}
        animate={animationEnabled ? { opacity: 1, scale: 1, y: 0 } : undefined}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-lg p-6"
        style={{
          background: 'var(--bg-secondary)',
          border: BRUTALIST_BORDER,
          boxShadow: BRUTALIST_SHADOW,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-12 h-12"
              style={{
                background: 'var(--bg-secondary)',
                border: BRUTALIST_BORDER,
                boxShadow: BRUTALIST_SHADOW,
              }}
            >
              <Rss className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {t.feed.subscribeTitle}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {t.feed.subscribeSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 border-2 border-transparent transition-all hover:border-[var(--accent-primary)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feed options */}
        <div className="space-y-3 mb-6">
          {feedOptions.map((option) => (
            <div
              key={option.name}
              className="p-4 border-2 bg-[var(--bg-secondary)] transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_var(--accent-primary)] hover:border-[var(--accent-primary)]"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 border-2 font-mono uppercase tracking-wider text-[10px]"
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderColor: option.color,
                      color: option.color,
                    }}
                  >
                    {option.name}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {option.description}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 px-3 py-2 text-sm font-mono truncate border-2"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--accent-primary)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {option.url}
                </code>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCopy(option.url, option.name)}
                  className="px-3 py-2 text-sm font-medium whitespace-nowrap border-2 transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_var(--border-subtle)]"
                  style={{
                    background: copied === option.name ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                    borderColor: copied === option.name ? '#22c55e' : 'var(--accent-primary)',
                    color: copied === option.name ? '#22c55e' : 'white',
                  }}
                >
                  {copied === option.name ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      {t.common.copied}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy className="w-4 h-4" />
                      {t.common.copy}
                    </span>
                  )}
                </motion.button>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div
          className="p-4 text-sm border-2"
          style={{
            background: 'var(--bg-tertiary)',
            borderColor: 'var(--accent-primary)',
            color: 'var(--text-muted)',
          }}
        >
          <p className="mb-1">
            <strong style={{ color: 'var(--text-primary)' }}>{t.feed.aboutFeed}</strong>
          </p>
          <p>
            {t.feed.aboutFeedDescription}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Debug panel showing source fetch status with sharp bordered badges
function DebugPanel({
  sources,
  onClose
}: {
  sources: FeedSourceStatus[];
  onClose: () => void;
}) {
  const { t, tReplace } = useTranslation();
  const successCount = sources.filter(s => s.status === 'success').length;
  const errorCount = sources.filter(s => s.status === 'error').length;
  const timeoutCount = sources.filter(s => s.status === 'timeout').length;
  const pendingCount = sources.filter(s => s.status === 'pending').length;

  const getStatusIcon = (status: FeedSourceStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'timeout':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'pending':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }
  };

  const getStatusText = (status: FeedSourceStatus['status']) => {
    switch (status) {
      case 'success':
        return t.feed.statusSuccess;
      case 'error':
        return t.feed.statusFail;
      case 'timeout':
        return t.feed.statusTimeout;
      case 'pending':
        return t.feed.statusLoading;
    }
  };

  const getStatusColors = (status: FeedSourceStatus['status']) => {
    switch (status) {
      case 'success':
        return { borderColor: '#22c55e', color: '#22c55e' };
      case 'error':
        return { borderColor: '#ef4444', color: '#ef4444' };
      case 'timeout':
        return { borderColor: '#eab308', color: '#eab308' };
      case 'pending':
        return { borderColor: '#3b82f6', color: '#3b82f6' };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-8 overflow-hidden"
    >
      <div
        className="p-6"
        style={{
          background: 'var(--bg-card)',
          border: BRUTALIST_BORDER,
          boxShadow: BRUTALIST_SHADOW,
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bug className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {t.feed.debugPanel}
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 px-2 py-0.5 border-2" style={{ borderColor: '#22c55e', color: '#22c55e' }}><CheckCircle2 className="w-4 h-4" /> {successCount}</span>
              {errorCount > 0 && <span className="flex items-center gap-1 px-2 py-0.5 border-2" style={{ borderColor: '#ef4444', color: '#ef4444' }}><AlertCircle className="w-4 h-4" /> {errorCount}</span>}
              {timeoutCount > 0 && <span className="flex items-center gap-1 px-2 py-0.5 border-2" style={{ borderColor: '#eab308', color: '#eab308' }}><Clock className="w-4 h-4" /> {timeoutCount}</span>}
              {pendingCount > 0 && <span className="flex items-center gap-1 px-2 py-0.5 border-2" style={{ borderColor: '#3b82f6', color: '#3b82f6' }}><Loader2 className="w-4 h-4 animate-spin" /> {pendingCount}</span>}
            </div>
            <button
              onClick={onClose}
              className="p-2 border-2 border-transparent transition-all hover:border-[var(--accent-primary)]"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {sources.map((source) => {
            const statusColors = getStatusColors(source.status);
            return (
              <div
                key={source.name}
                className="flex items-center gap-3 p-3 border-2 bg-[var(--bg-secondary)]"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(source.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {source.name}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 border-2 font-mono uppercase tracking-wider"
                      style={{
                        background: 'var(--bg-tertiary)',
                        borderColor: statusColors.borderColor,
                        color: statusColors.color,
                      }}
                    >
                      {getStatusText(source.status)}
                    </span>
                    {source.itemCount > 0 && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {tReplace(t.feed.itemCount, { count: source.itemCount })}
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
                    {source.url}
                  </div>
                  {source.error && (
                    <div
                      className="text-xs mt-2 p-2 break-all border-l-4 bg-[var(--bg-tertiary)]"
                      style={{
                        color: '#f87171',
                        borderColor: '#ef4444',
                      }}
                    >
                      <span className="font-medium">{t.feed.failReason}: </span>
                      {source.error}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// Loose type for entries coming from RSS/Atom/JSON feeds
interface RawJsonFeedItem {
  title?: string;
  url?: string;
  link?: string;
  external_url?: string;
  content_text?: string;
  content?: string;
  description?: string;
  summary?: string;
  date_published?: string;
  date_modified?: string;
  published?: string;
  updated?: string;
  date?: string;
  author?: string | { name?: string };
}

// Parse feed content and auto-detect the format
const parseFeed = async (content: string, source: Friend, untitled: string): Promise<FeedItem[]> => {
  const items: FeedItem[] = [];

  // Try JSON format first
  try {
    const jsonData = JSON.parse(content);

    if (jsonData.items && Array.isArray(jsonData.items)) {
      (jsonData.items as RawJsonFeedItem[]).forEach((item) => {
        const authorName = typeof item.author === 'string' ? item.author : item.author?.name;
        items.push({
          title: item.title || untitled,
          link: item.url || item.external_url || source.url,
          description: (item.content_text || item.content || item.summary || '').replace(/<[^>]+>/g, '').slice(0, 200),
          pubDate: item.date_published || item.date_modified || '',
          author: authorName || source.name,
          source: source.name,
          sourceUrl: source.url,
          sourceIcon: source.icon,
        });
      });
      return items;
    }

    if (jsonData.entries && Array.isArray(jsonData.entries)) {
      (jsonData.entries as RawJsonFeedItem[]).forEach((item) => {
        const authorName = typeof item.author === 'string' ? item.author : item.author?.name;
        items.push({
          title: item.title || untitled,
          link: item.link || item.url || source.url,
          description: (item.description || item.content || item.summary || '').replace(/<[^>]+>/g, '').slice(0, 200),
          pubDate: item.published || item.updated || item.date || '',
          author: authorName || source.name,
          source: source.name,
          sourceUrl: source.url,
          sourceIcon: source.icon,
        });
      });
      return items;
    }
  } catch {
    // Not JSON, continue to XML parsing
  }

  // Parse as XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, 'text/xml');

  const isRSS = xmlDoc.querySelector('rss') !== null;
  const isAtom = xmlDoc.querySelector('feed') !== null;

  if (isRSS) {
    const itemElements = xmlDoc.querySelectorAll('item');
    itemElements.forEach((item) => {
      const title = item.querySelector('title')?.textContent || untitled;
      const link = item.querySelector('link')?.textContent || source.url;
      const description = item.querySelector('description')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const author = item.querySelector('author')?.textContent ||
                    item.querySelector('creator')?.textContent || source.name;

      items.push({
        title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
        link,
        description: description.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').slice(0, 200),
        pubDate,
        author,
        source: source.name,
        sourceUrl: source.url,
        sourceIcon: source.icon,
      });
    });
  } else if (isAtom) {
    const entryElements = xmlDoc.querySelectorAll('entry');
    entryElements.forEach((entry) => {
      const title = entry.querySelector('title')?.textContent || untitled;
      const link = entry.querySelector('link')?.getAttribute('href') || source.url;
      const content = entry.querySelector('content')?.textContent ||
                     entry.querySelector('summary')?.textContent || '';
      const updated = entry.querySelector('updated')?.textContent ||
                     entry.querySelector('published')?.textContent || '';
      const author = entry.querySelector('author > name')?.textContent || source.name;

      items.push({
        title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
        link,
        description: content.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').slice(0, 200),
        pubDate: updated,
        author,
        source: source.name,
        sourceUrl: source.url,
        sourceIcon: source.icon,
      });
    });
  }

  return items;
};

// Brutalist feed card with a clean border, offset shadow and hover nudge
const FeedCard = memo(function FeedCard({
  item,
  index,
  locale,
}: {
  item: FeedItem;
  index: number;
  locale: string;
}) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay: index * 0.05,
        type: 'spring',
        stiffness: 100,
      }}
      className="group relative block cursor-pointer h-full"
    >
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        <div
          className="relative h-full p-6 flex flex-col border-2 shadow-[4px_4px_0_var(--border-subtle)] transition-all duration-200 group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[4px_4px_0_var(--accent-primary)] group-hover:border-[var(--accent-primary)]"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* Source header with icon */}
          <div
            className="flex items-center gap-3 mb-4 pb-4 border-b-2"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center overflow-hidden border-2"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {!imageError ? (
                <img
                  src={item.sourceIcon}
                  alt={item.source}
                  className="w-6 h-6 object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Globe className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium truncate block" style={{ color: 'var(--text-primary)' }}>
                {item.source}
              </span>
            </div>

            <ExternalLink
              className="w-5 h-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--accent-primary)' }}
            />
          </div>

          {/* Title */}
          <h3
            className="font-bold text-lg line-clamp-2 mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            {item.title}
          </h3>

          {/* Description */}
          <p
            className="text-sm line-clamp-3 mb-4 flex-1"
            style={{ color: 'var(--text-muted)' }}
          >
            {item.description || t.feed.noSummary}
          </p>

          {/* Footer */}
          <div
            className="flex items-center justify-between pt-4 border-t-2"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              {item.pubDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(item.pubDate, locale).split(' ')[0]}
                </span>
              )}
              {item.author && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {item.author}
                </span>
              )}
            </div>
          </div>
        </div>
      </a>
    </motion.div>
  );
});

// Sharp pagination controls with offset shadows
const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }

    return pages;
  };

  const baseButtonClasses = [
    'border-2 shadow-[4px_4px_0_var(--border-subtle)]',
    'transition-all duration-200',
    'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_var(--accent-primary)] hover:border-[var(--accent-primary)]',
    'disabled:opacity-30 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_var(--border-subtle)] disabled:hover:border-[var(--border-subtle)]',
  ].join(' ');

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 ${baseButtonClasses}`}
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        <ChevronLeft className="w-5 h-5" />
      </motion.button>

      {getPageNumbers().map((page, index) => {
        const isActive = page === currentPage;
        return (
          <motion.button
            key={index}
            whileTap={{ scale: 0.95 }}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={[
              'min-w-[40px] h-[40px] px-3 border-2 transition-all duration-200 disabled:cursor-default',
              isActive
                ? 'shadow-[4px_4px_0_var(--accent-primary)]'
                : 'shadow-[4px_4px_0_var(--border-subtle)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_var(--accent-primary)] hover:border-[var(--accent-primary)]',
            ].join(' ')}
            style={{
              background: isActive ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-subtle)',
              color: isActive ? 'white' : 'var(--text-primary)',
            }}
          >
            {page}
          </motion.button>
        );
      })}

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 ${baseButtonClasses}`}
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
});

// Loading progress with a sharp bordered bar
function LoadingProgress({ loaded, total }: { loaded: number; total: number }) {
  const { t, tReplace } = useTranslation();
  const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div
        className="w-64 h-4 mb-4 overflow-hidden"
        style={{ border: BRUTALIST_BORDER }}
      >
        <motion.div
          className="h-full"
          style={{ background: 'var(--accent-primary)' }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {tReplace(t.feed.loadingFriends, { loaded, total })}
      </p>
    </div>
  );
}

// Refresh cooldown in milliseconds
const REFRESH_COOLDOWN_MS = 90 * 1000; // 90 seconds

// Main feed page component
export default function FeedPage() {
  const { t, tReplace, locale } = useTranslation();
  const [, setFriends] = useState<Friend[]>([]);
  const [allItems, setAllItems] = useState<FeedItem[]>([]);
  const [displayItems, setDisplayItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });
  const [footerData, setFooterData] = useState<SiteData['footer'] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [sourceStatus, setSourceStatus] = useState<FeedSourceStatus[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshCooldown, _setRefreshCooldown] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const isDesktopClient = useIsDesktopClient();
  const animationEnabled = useAnimationEnabled();
  const abortControllerRef = useRef<AbortController | null>(null);
  // Initialize as already expired so the first refresh is allowed immediately
  const lastRefreshTimeRef = useRef<number>(Date.now() - REFRESH_COOLDOWN_MS);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getFeedUrl = useCallback((friend: Friend): string => {
    if (friend.feed) return friend.feed;
    const baseUrl = friend.url.replace(/\/$/, '');
    return `${baseUrl}/feed`;
  }, []);

  const fetchFriendFeed = useCallback(async (
    friend: Friend,
    forceRefresh = false,
    signal?: AbortSignal
  ): Promise<{ items: FeedItem[], timestamp: number, status: FeedSourceStatus }> => {
    const feedUrl = getFeedUrl(friend);
    try {
      // Choose the endpoint based on the forceRefresh flag
      const apiUrl = forceRefresh
        ? `/api/feed/refresh?url=${encodeURIComponent(feedUrl)}`
        : `/api/feed/get?url=${encodeURIComponent(feedUrl)}`;

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), FETCH_TIMEOUT);
      });

      const fetchPromise = fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, application/json, */*',
        },
        signal,
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      const content = await response.text();
      const timestampHeader = response.headers.get('X-Feed-Timestamp');
      const timestamp = timestampHeader ? parseInt(timestampHeader, 10) : Date.now();

      // Check if source is marked as failed
      const isMarkedFailed = response.headers.get('X-Feed-Failed') === 'true';
      const failedReason = response.headers.get('X-Feed-Failed-Reason');
      const failedAttempts = response.headers.get('X-Feed-Failed-Attempts');

      // Handle HTTP error responses
      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;

        // If marked as failed, show more specific info
        if (isMarkedFailed) {
          errorMsg = t.feed.errors.sourceMarkedInaccessible;
          if (failedReason) {
            errorMsg += ` (${failedReason})`;
          }
          if (failedAttempts) {
            errorMsg += tReplace(t.feed.errors.attempts, { count: failedAttempts });
          }
        } else {
          try {
            const errorData = JSON.parse(content);
            if (errorData.error) {
              errorMsg = errorData.error;
              if (errorData.message) {
                errorMsg += `: ${errorData.message}`;
              }
              if (errorData.hint) {
                errorMsg += tReplace(t.feed.errors.hint, { hint: errorData.hint });
              }
            }
          } catch {
            // Response is not JSON, use raw content snippet
            if (content && content.length < 200) {
              errorMsg += ` - ${content}`;
            }
          }
        }
        throw new Error(errorMsg);
      }

      // Detect JavaScript challenge/anti-bot protection
      if (content.includes('__test=') ||
          (content.includes('<script') && content.includes('slowAES.decrypt') && content.includes('location.href'))) {
        throw new Error(t.feed.errors.jsChallenge);
      }

      // Detect generic HTML error pages
      if (content.includes('<html') && !content.includes('<rss') && !content.includes('<feed') && !content.includes('<?xml')) {
        const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : t.common.unknown;
        throw new Error(tReplace(t.feed.errors.returnedHTML, { title: title.slice(0, 50) }));
      }

      const items = await parseFeed(content, friend, t.feed.untitled);

      // If parsing succeeded but no items found, check if content looks valid
      if (items.length === 0 && content.trim()) {
        // Content exists but no items parsed - might be malformed feed
        const hasXmlDecl = content.includes('<?xml');
        const hasRssTag = content.includes('<rss');
        const hasFeedTag = content.includes('<feed');
        const hasJsonItems = content.includes('"items"') || content.includes('"entries"');

        if (!hasXmlDecl && !hasRssTag && !hasFeedTag && !hasJsonItems) {
          throw new Error(t.feed.errors.invalidRSS);
        }
      }

      return {
        items,
        timestamp,
        status: {
          name: friend.name,
          url: feedUrl,
          status: items.length > 0 ? 'success' : 'error',
          itemCount: items.length,
          error: items.length === 0 ? t.feed.errors.noArticles : undefined,
        }
      };
    } catch (err) {
      const errorMsg = (err as Error).message || String(err);
      const isTimeout = errorMsg.includes('Timeout');
      const isAbort = (err as Error).name === 'AbortError';

      if (process.env.NODE_ENV === 'development') {
        if (isAbort) {
          console.warn(`[Feed] Fetch aborted for ${friend.name} (${feedUrl})`);
        } else {
          console.warn(`[Feed] Failed to fetch feed for ${friend.name} (${feedUrl}):`, err);
        }
      }

      return {
        items: [],
        timestamp: Date.now(),
        status: {
          name: friend.name,
          url: feedUrl,
          status: isTimeout ? 'timeout' : isAbort ? 'error' : 'error',
          itemCount: 0,
          error: errorMsg,
        }
      };
    }
  }, [getFeedUrl, t, tReplace]);

  const fetchBatchFeeds = useCallback(async (
    feeds: { url: string; name: string }[],
    signal?: AbortSignal
  ): Promise<BatchFeedResult> => {
    try {
      const response = await fetch(`/api/feed/batch-get?feeds=${encodeURIComponent(JSON.stringify(feeds))}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal,
      });

      if (!response.ok) {
        throw new Error(`Batch fetch failed: HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw err;
      }
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Feed] Batch fetch error (已回退到逐个获取):', err);
      }
      // If batch fetch fails, return empty result so every feed falls back to individual fetch
      return { cached: [], missing: feeds, expired: [], failed: [] };
    }
  }, []);

  const loadData = useCallback(async (forceRefresh = false, isBackgroundRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    // Try to load from cache first (only on initial load, not force refresh)
    if (!forceRefresh && !isBackgroundRefresh) {
      const cached = getFeedCache();
      if (cached) {
        setAllItems(cached.items);
        setDisplayItems(cached.items.slice(0, POSTS_PER_PAGE));
        setSourceStatus(cached.sourceStatus);
        setLastRefreshTime(new Date(cached.timestamp));
        setLoading(false);
        // Continue to fetch fresh data in background
        setTimeout(() => loadData(false, true), 0);
        return;
      }
    }

    try {
      if (!isBackgroundRefresh) {
        setLoading(true);
        setLoadingProgress({ loaded: 0, total: 0 });
        setSourceStatus([]);
      }

      const [friendsRes, siteRes] = await Promise.all([
        fetch('/data/friends.json', { signal }),
        fetch('/data/site-data.json', { signal }),
      ]);

      if (!friendsRes.ok) throw new Error('Failed to load friends data');

      const friendsData = await friendsRes.json();
      const siteData = await siteRes.json();

      const eligibleFriends = friendsData.friends?.filter(
        (f: Friend) => f.feed && f.feed.trim() !== ''
      ) || [];

      // Initialize source status
      if (!isBackgroundRefresh) {
        setSourceStatus(eligibleFriends.map((f: Friend) => ({
          name: f.name,
          url: f.feed || '',
          status: 'pending' as const,
          itemCount: 0,
        })));
      }

      setFriends(eligibleFriends);
      setFooterData(siteData.footer);

      const allFeeds: FeedItem[] = [];
      const statusList: FeedSourceStatus[] = [];
      let latestTimestamp = 0;

      // Try batch fetch first unless this is a forced or background refresh
      let feedsToFetchIndividually: Friend[] = [];

      if (!forceRefresh && !isBackgroundRefresh) {
        try {
          const feedRequests = eligibleFriends.map((f: Friend) => ({
            url: getFeedUrl(f),
            name: f.name,
          }));

          const batchResult = await fetchBatchFeeds(feedRequests, signal);

          // Process cached content (expired entries are also returned in cached)
          for (const batchItem of batchResult.cached) {
            if (signal.aborted) break;

            const friend = eligibleFriends.find((f: Friend) => f.name === batchItem.name);
            if (!friend) continue;

            try {
              const items = await parseFeed(batchItem.content, friend, t.feed.untitled);
              allFeeds.push(...items);

              const status: FeedSourceStatus = {
                name: friend.name,
                url: batchItem.url,
                status: items.length > 0 ? 'success' : 'error',
                itemCount: items.length,
                error: items.length === 0 ? t.feed.errors.noArticles : undefined,
              };
              statusList.push(status);

              if (batchItem.timestamp > latestTimestamp) {
                latestTimestamp = batchItem.timestamp;
              }
            } catch (parseErr) {
              if (process.env.NODE_ENV === 'development') {
                console.warn(`[Feed] Failed to parse cached feed for ${friend.name}:`, parseErr);
              }
              // Parsing failed, fall back to individual fetch
              feedsToFetchIndividually.push(friend);
            }
          }

          // Process failed feeds
          for (const failed of batchResult.failed || []) {
            const friend = eligibleFriends.find((f: Friend) => f.name === failed.name);
            if (!friend) continue;

            statusList.push({
              name: friend.name,
              url: failed.url,
              status: 'error',
              itemCount: 0,
              error: failed.error,
            });
          }

          // Collect feeds that need individual fetching
          const missingNames = new Set(batchResult.missing.map(m => m.name));
          const expiredNames = new Set((batchResult.expired || []).map(e => e.name));

          feedsToFetchIndividually = eligibleFriends.filter((f: Friend) =>
            missingNames.has(f.name) || expiredNames.has(f.name)
          );

          // Update status for cached feeds
          setSourceStatus([...statusList, ...feedsToFetchIndividually.map((f: Friend) => ({
            name: f.name,
            url: f.feed || '',
            status: 'pending' as const,
            itemCount: 0,
          }))]);

        } catch (batchErr) {
          // Silently fall back to individual fetch when the batch endpoint is unavailable
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Feed] Batch fetch failed, falling back to individual fetch:', batchErr);
          }
          feedsToFetchIndividually = eligibleFriends;
        }
      } else {
        // Force refresh or background refresh: fetch every feed individually
        feedsToFetchIndividually = eligibleFriends;
      }

      // Set total progress count
      const totalFeedsToFetch = feedsToFetchIndividually.length;
      let fetchedCount = 0;
      setLoadingProgress({ loaded: fetchedCount, total: totalFeedsToFetch });

      // Fetch remaining feeds one by one
      for (let i = 0; i < feedsToFetchIndividually.length; i++) {
        if (signal.aborted) break;

        const friend = feedsToFetchIndividually[i];
        const { items, timestamp, status } = await fetchFriendFeed(friend, forceRefresh, signal);
        allFeeds.push(...items);
        statusList.push(status);

        // Update status in real time
        setSourceStatus([...statusList, ...feedsToFetchIndividually.slice(i + 1).map((f: Friend) => ({
          name: f.name,
          url: f.feed || '',
          status: 'pending' as const,
          itemCount: 0,
        }))]);

        // Update latest timestamp
        if (timestamp > latestTimestamp) {
          latestTimestamp = timestamp;
        }

        fetchedCount++;
        setLoadingProgress({ loaded: fetchedCount, total: totalFeedsToFetch });

        if (i < 3 || allFeeds.length <= POSTS_PER_PAGE) {
          const sorted = [...allFeeds].sort((a, b) => {
            const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
            const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
            return dateB - dateA;
          });
          setAllItems(sorted);
          setDisplayItems(sorted.slice(0, POSTS_PER_PAGE));
        }
      }

      if (!signal.aborted) {
        const sorted = allFeeds.sort((a, b) => {
          const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
          const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
          return dateB - dateA;
        });
        setAllItems(sorted);
        setCurrentPage(1);
        updateDisplayItems(sorted, 1);

        // Save to cache
        setFeedCache(sorted, statusList);

        // Update last refresh time using the latest KV timestamp
        if (latestTimestamp > 0) {
          setLastRefreshTime(new Date(latestTimestamp));
        } else {
          setLastRefreshTime(new Date());
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        // Data loading failed: the empty/error UI handles the user facing state
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Feed] Failed to load feed data:', err);
        }
      }
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  }, [fetchFriendFeed, fetchBatchFeeds, getFeedUrl, t]);

  const updateDisplayItems = useCallback((items: FeedItem[], page: number) => {
    const start = (page - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;
    setDisplayItems(items.slice(start, end));
  }, []);

  useEffect(() => {
    loadData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData]);

  // Refresh feeds with cooldown
  const handleRefresh = useCallback(async () => {
    const now = Date.now();
    const elapsed = now - lastRefreshTimeRef.current;

    if (elapsed < REFRESH_COOLDOWN_MS) {
      const remaining = Math.ceil((REFRESH_COOLDOWN_MS - elapsed) / 1000);
      console.log(tReplace(t.feed.waitToRefresh, { seconds: remaining }));
      return;
    }

    lastRefreshTimeRef.current = now;
    setRefreshing(true);
    setShowStats(false);
    _setRefreshCooldown(60);

    // Clear cache before force refresh
    clearFeedCache();

    // Start cooldown countdown
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }
    cooldownTimerRef.current = setInterval(() => {
      _setRefreshCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    await loadData(true);
    setRefreshing(false);
  }, [loadData, t, tReplace]);

  // Cleanup cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    updateDisplayItems(allItems, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [allItems, updateDisplayItems]);

  // Open a random article in a new tab
  const handleRandomRead = useCallback(() => {
    if (allItems.length === 0) return;
    const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
    window.open(randomItem.link, '_blank', 'noopener,noreferrer');
  }, [allItems]);

  const totalPages = useMemo(() =>
    Math.ceil(allItems.length / POSTS_PER_PAGE),
    [allItems.length]
  );

  const stats = useMemo(() => {
    const totalSources = new Set(allItems.map(item => item.source)).size;
    return {
      totalSources,
      totalArticles: allItems.length,
      latestUpdate: lastRefreshTime,
    };
  }, [allItems, lastRefreshTime]);

  if (loading && allItems.length === 0) {
    return (
      <div className="relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {isDesktopClient && (
          <div
            className="fixed inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(var(--border-subtle) 1px, transparent 1px),
                               linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)`,
              backgroundSize: '80px 80px'
            }}
          />
        )}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-32 lg:pt-36">
          <LoadingProgress loaded={loadingProgress.loaded} total={loadingProgress.total} />
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {isDesktopClient && (
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(var(--border-subtle) 1px, transparent 1px),
                             linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-32 lg:pt-36 pb-12">
        {/* Top toolbar */}
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: -20 } : undefined}
          animate={animationEnabled ? { opacity: 1, y: 0 } : undefined}
          transition={animationEnabled ? { duration: 0.5 } : undefined}
          className="fixed top-16 lg:top-20 left-0 right-0 z-40 px-4 sm:px-6 lg:px-8 py-3 border-b-2"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex-1" />

            <div className="flex items-center gap-2">
              {/* Debug button */}
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={[
                  'flex items-center gap-2 px-3 py-2 border-2 font-mono uppercase tracking-wider text-[10px] transition-all duration-200',
                  'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_var(--accent-primary)]',
                  showDebug
                    ? 'shadow-[4px_4px_0_var(--accent-primary)]'
                    : 'shadow-[4px_4px_0_var(--border-subtle)]',
                ].join(' ')}
                style={{
                  background: showDebug ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  borderColor: showDebug ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  color: showDebug ? 'white' : 'var(--text-primary)',
                }}
                title={t.feed.debugPanel}
              >
                <Bug className="w-4 h-4" />
                <span className="hidden sm:block">{t.feed.debug}</span>
              </button>

              {/* Stats button */}
              <button
                onClick={() => setShowStats(!showStats)}
                className={[
                  'flex items-center gap-2 px-3 py-2 border-2 font-mono uppercase tracking-wider text-[10px] transition-all duration-200',
                  'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_var(--accent-primary)]',
                  showStats
                    ? 'shadow-[4px_4px_0_var(--accent-primary)]'
                    : 'shadow-[4px_4px_0_var(--border-subtle)]',
                ].join(' ')}
                style={{
                  background: showStats ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  borderColor: showStats ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  color: showStats ? 'white' : 'var(--text-primary)',
                }}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:block">{t.feed.stats}</span>
              </button>

              {/* Refresh button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshing || refreshCooldown > 0}
                className={[
                  'flex items-center gap-2 px-3 py-2 border-2 font-mono uppercase tracking-wider text-[10px] transition-all duration-200',
                  'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_var(--accent-primary)]',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_var(--border-subtle)]',
                  refreshCooldown > 0 ? 'shadow-[4px_4px_0_var(--border-subtle)]' : 'shadow-[4px_4px_0_var(--border-subtle)]',
                ].join(' ')}
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)',
                  color: refreshCooldown > 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                }}
                title={refreshCooldown > 0 ? tReplace(t.feed.cooldown, { seconds: refreshCooldown }) : t.feed.forceRefresh}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:block">
                  {refreshCooldown > 0 ? `${refreshCooldown}s` : t.feed.refresh}
                </span>
              </motion.button>

              {/* Random read button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleRandomRead}
                disabled={allItems.length === 0}
                className={[
                  'flex items-center gap-2 px-3 py-2 border-2 font-mono uppercase tracking-wider text-[10px] transition-all duration-200',
                  'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_var(--border-subtle)]',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_var(--border-subtle)]',
                ].join(' ')}
                style={{
                  background: 'var(--accent-secondary)',
                  borderColor: 'var(--accent-secondary)',
                  color: 'white',
                }}
                title={t.feed.randomReadTooltip}
              >
                <Shuffle className="w-4 h-4" />
                <span className="hidden sm:block">{t.feed.randomRead}</span>
              </motion.button>

              {/* Subscribe button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSubscribe(true)}
                className={[
                  'flex items-center gap-2 px-3 py-2 border-2 font-mono uppercase tracking-wider text-[10px] transition-all duration-200',
                  'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_var(--border-subtle)]',
                ].join(' ')}
                style={{
                  background: 'var(--accent-primary)',
                  borderColor: 'var(--accent-primary)',
                  color: 'white',
                }}
              >
                <Rss className="w-4 h-4" />
                <span className="hidden sm:block">{t.feed.subscribe}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Hero section */}
        <section className="relative pt-8 pb-12 overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: title and description */}
            <motion.div
              initial={animationEnabled ? { opacity: 0, x: -50 } : undefined}
              animate={animationEnabled ? { opacity: 1, x: 0 } : undefined}
              transition={animationEnabled ? { duration: 0.8, type: 'spring', stiffness: 100 } : undefined}
            >
              <motion.div
                initial={animationEnabled ? { opacity: 0, scale: 0.9 } : undefined}
                animate={animationEnabled ? { opacity: 1, scale: 1 } : undefined}
                transition={animationEnabled ? { delay: 0.2, duration: 0.5 } : undefined}
                className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 font-mono uppercase tracking-wider text-[10px]"
                style={{
                  background: 'var(--bg-secondary)',
                  border: BRUTALIST_ACCENT_BORDER,
                  color: 'var(--accent-primary)',
                }}
              >
                <Rss className="w-4 h-4" />
                <span>{t.feed.circleTitle}</span>
              </motion.div>

              <h1
                className="font-mono font-bold text-4xl md:text-5xl lg:text-6xl mb-6 uppercase tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {t.feed.circleTitle}
              </h1>

              <motion.p
                initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
                animate={animationEnabled ? { opacity: 1, y: 0 } : undefined}
                transition={animationEnabled ? { delay: 0.3, duration: 0.5 } : undefined}
                className="text-lg md:text-xl leading-relaxed max-w-xl"
                style={{ color: 'var(--text-muted)' }}
              >
                {t.feed.heroDescription}
              </motion.p>
            </motion.div>

            {/* Right: stat cards */}
            <motion.div
              initial={animationEnabled ? { opacity: 0, x: 50 } : undefined}
              animate={animationEnabled ? { opacity: 1, x: 0 } : undefined}
              transition={animationEnabled ? { duration: 0.8, delay: 0.2, type: 'spring', stiffness: 100 } : undefined}
              className="grid grid-cols-3 gap-4"
            >
              <StatCard
                icon={Users}
                value={stats.totalSources}
                label={t.feed.totalSources}
                color="var(--accent-primary)"
                delay={0}
              />
              <StatCard
                icon={Newspaper}
                value={stats.totalArticles}
                label={t.feed.totalArticles}
                color="var(--accent-secondary)"
                delay={1}
              />
              <StatCard
                icon={Clock}
                value={stats.latestUpdate ? getRelativeTime(stats.latestUpdate.toISOString(), tReplace, t.feed.relativeTime) : '-'}
                label={t.feed.latestUpdate}
                color="#22c55e"
                delay={2}
              />
            </motion.div>
          </div>
        </section>

        {/* Stats panel */}
        <AnimatePresence>
          {showStats && (
            <StatsPanel items={allItems} onClose={() => setShowStats(false)} />
          )}
        </AnimatePresence>

        {/* Debug panel */}
        <AnimatePresence>
          {showDebug && (
            <DebugPanel sources={sourceStatus} onClose={() => setShowDebug(false)} />
          )}
        </AnimatePresence>

        {/* Loading bar shown during refresh */}
        {loading && allItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
              <span>{t.feed.refreshing}</span>
              <span>{loadingProgress.loaded}/{loadingProgress.total}</span>
            </div>
            <div
              className="w-full h-2 overflow-hidden border-2"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <motion.div
                className="h-full"
                style={{ background: 'var(--accent-primary)' }}
                initial={{ width: 0 }}
                animate={{ width: `${(loadingProgress.loaded / loadingProgress.total) * 100}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* Content area */}
        {allItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div
              className="inline-flex items-center justify-center w-20 h-20 mb-6"
              style={{
                background: 'var(--bg-secondary)',
                border: BRUTALIST_BORDER,
                boxShadow: BRUTALIST_SHADOW,
              }}
            >
              <Rss className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {t.feed.emptyTitle}
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              {t.feed.emptyDescription}
            </p>
            <button
              onClick={() => setShowSubscribe(true)}
              className="px-4 py-2 text-sm font-mono uppercase tracking-wider border-2 transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_var(--border-subtle)]"
              style={{
                background: 'var(--accent-primary)',
                borderColor: 'var(--accent-primary)',
                color: 'white',
              }}
            >
              {t.feed.subscribeTitle}
            </button>
          </motion.div>
        ) : (
          <>
            {/* Feed grid */}
            <section className="mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayItems.map((item, index) => (
                  <FeedCard key={`${item.link}-${index}`} item={item} index={index} locale={locale} />
                ))}
              </div>
            </section>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </main>

      {/* Footer */}
      {footerData && <Footer data={footerData} />}

      {/* Subscribe modal */}
      <AnimatePresence>
        {showSubscribe && (
          <SubscribeModal isOpen={showSubscribe} onClose={() => setShowSubscribe(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
