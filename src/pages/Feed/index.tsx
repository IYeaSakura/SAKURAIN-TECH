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
  Copy
} from 'lucide-react';
import { Footer } from '@/components/sections/Footer';
import { AmbientGlow, LightBeam } from '@/components/effects';
import { useMobile, useAnimationEnabled } from '@/hooks';

import type { SiteData } from '@/types';

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

// CSS clip-path helpers
const clipPathRounded = (r: number) => `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

const POSTS_PER_PAGE = 9;
const FETCH_TIMEOUT = 8000;

// Format date helper
const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
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

// 统计卡片组件
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
  const [isHovered, setIsHovered] = useState(false);
  const animationEnabled = useAnimationEnabled();

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
      animate={animationEnabled ? { opacity: 1, y: 0 } : undefined}
      transition={animationEnabled ? { delay: 0.4 + delay * 0.1, duration: 0.5 } : undefined}
      whileHover={animationEnabled ? { scale: 1.05, y: -4 } : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`relative p-6 text-center cursor-default group ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        background: active ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
        border: `2px solid ${active ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)'}`,
        clipPath: clipPathRounded(6),
      }}
    >
      {animationEnabled && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, var(--accent-glow), transparent 70%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0.5 : 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
      <Icon className="w-6 h-6 mx-auto mb-3" style={{ color }} />
      <div className="font-sans font-bold text-3xl mb-1 break-all px-1" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </motion.div>
  );
}

// 统计面板组件
function StatsPanel({ 
  items, 
  onClose 
}: { 
  items: FeedItem[]; 
  onClose: () => void;
}) {
  const stats = useMemo(() => {
    // 按来源统计
    const sourceStats: Record<string, number> = {};
    items.forEach(item => {
      sourceStats[item.source] = (sourceStats[item.source] || 0) + 1;
    });
    
    // 按日期统计（最近7天）
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
    
    // 排序来源
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
          background: 'rgba(255, 255, 255, 0.02)',
          border: '2px solid rgba(255, 255, 255, 0.08)',
          clipPath: clipPathRounded(12),
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            统计详情
          </h3>
          <button 
            onClick={onClose}
            className="p-2 transition-colors hover:bg-white/5"
            style={{ clipPath: clipPathRounded(4) }}
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* 来源统计 */}
          <div>
            <h4 className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
              文章来源分布
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {stats.sourceStats.map(([source, count], index) => (
                <div 
                  key={source}
                  className="flex items-center justify-between p-3"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {index + 1}. {source}
                  </span>
                  <span 
                    className="px-2 py-1 text-xs font-medium"
                    style={{
                      background: 'var(--accent-primary)20',
                      color: 'var(--accent-primary)',
                      clipPath: clipPathRounded(2),
                    }}
                  >
                    {count} 篇
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* 日期统计 */}
          <div>
            <h4 className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
              最近7天更新
            </h4>
            <div className="space-y-2">
              {Object.entries(stats.dateStats).map(([date, count]) => (
                <div key={date} className="flex items-center gap-3">
                  <span className="text-sm w-24" style={{ color: 'var(--text-muted)' }}>
                    {date.slice(5)}
                  </span>
                  <div className="flex-1 h-6 bg-white/5 overflow-hidden" style={{ clipPath: clipPathRounded(2) }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max((count / Math.max(...Object.values(stats.dateStats))) * 100, 5)}%` }}
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

// 订阅弹窗组件
function SubscribeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const animationEnabled = useAnimationEnabled();
  const [copied, setCopied] = useState<string | null>(null);

  const feedOptions = [
    {
      name: 'RSS 2.0',
      url: 'https://sakurain.net/feed/',
      description: '标准 RSS 格式',
      color: '#f97316',
    },
    {
      name: 'Atom',
      url: 'https://sakurain.net/feed/atom/',
      description: 'Atom 订阅格式',
      color: '#3b82f6',
    },
    {
      name: 'JSON Feed',
      url: 'https://sakurain.net/feed/json/',
      description: 'JSON 格式订阅',
      color: '#22c55e',
    },
  ];

  const handleCopy = async (url: string, name: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(name);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
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
          border: '2px solid var(--border-color)',
          clipPath: clipPathRounded(12),
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-12 h-12"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                clipPath: clipPathRounded(4),
              }}
            >
              <Rss className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                订阅本站
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                多种格式支持
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 transition-colors hover:bg-white/5"
            style={{ clipPath: clipPathRounded(4) }}
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Feed Options */}
        <div className="space-y-3 mb-6">
          {feedOptions.map((option) => (
            <div
              key={option.name}
              className="p-4 transition-colors hover:bg-white/5"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                clipPath: clipPathRounded(6),
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 text-xs font-medium"
                    style={{
                      background: `${option.color}20`,
                      color: option.color,
                      clipPath: clipPathRounded(2),
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
                  className="flex-1 px-3 py-2 text-sm font-mono truncate"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: 'var(--accent-primary)',
                    clipPath: clipPathRounded(3),
                  }}
                >
                  {option.url}
                </code>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCopy(option.url, option.name)}
                  className="px-3 py-2 text-sm font-medium transition-all whitespace-nowrap"
                  style={{
                    background: copied === option.name ? 'rgba(34, 197, 94, 0.2)' : 'var(--accent-primary)',
                    color: copied === option.name ? '#22c55e' : 'white',
                    clipPath: clipPathRounded(3),
                  }}
                >
                  {copied === option.name ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      已复制
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy className="w-4 h-4" />
                      复制
                    </span>
                  )}
                </motion.button>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div
          className="p-4 text-sm"
          style={{
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            clipPath: clipPathRounded(6),
            color: 'var(--text-muted)',
          }}
        >
          <p className="mb-1">
            <strong style={{ color: 'var(--text-primary)' }}>关于 Feed</strong>
          </p>
          <p>
            本站部署于腾讯云 EdgeOne，Feed 功能通过构建时脚本自动生成。
            订阅后可及时获取最新文章更新。
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Parse feed content - auto-detect format
const parseFeed = async (content: string, source: Friend): Promise<FeedItem[]> => {
  const items: FeedItem[] = [];
  
  // Try JSON format first
  try {
    const jsonData = JSON.parse(content);
    
    if (jsonData.items && Array.isArray(jsonData.items)) {
      jsonData.items.forEach((item: any) => {
        items.push({
          title: item.title || '无标题',
          link: item.url || item.external_url || source.url,
          description: (item.content_text || item.content || item.summary || '').replace(/<[^>]+>/g, '').slice(0, 200),
          pubDate: item.date_published || item.date_modified || '',
          author: item.author?.name || item.author || source.name,
          source: source.name,
          sourceUrl: source.url,
          sourceIcon: source.icon,
        });
      });
      return items;
    }
    
    if (jsonData.entries && Array.isArray(jsonData.entries)) {
      jsonData.entries.forEach((item: any) => {
        items.push({
          title: item.title || '无标题',
          link: item.link || item.url || source.url,
          description: (item.description || item.content || item.summary || '').replace(/<[^>]+>/g, '').slice(0, 200),
          pubDate: item.published || item.updated || item.date || '',
          author: item.author?.name || item.author || source.name,
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
      const title = item.querySelector('title')?.textContent || '无标题';
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
      const title = entry.querySelector('title')?.textContent || '无标题';
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

// Feed Card Component - 使用博客卡片相同的像素风格
const FeedCard = memo(function FeedCard({
  item,
  index,
}: {
  item: FeedItem;
  index: number;
}) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative block cursor-pointer h-full"
      style={{ perspective: '1000px' }}
    >
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
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
            <div className="flex flex-col flex-1 relative z-10">
              {/* Source Header with Icon */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                <motion.div
                  animate={{
                    scale: isHovered ? 1.1 : 1,
                    rotate: isHovered ? 5 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: `2px solid ${isHovered ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)'}`,
                    clipPath: clipPathRounded(4),
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
                  {/* Icon glow */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at center, var(--accent-glow), transparent 70%)' }}
                    animate={{ opacity: isHovered ? 0.5 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block" style={{ color: 'var(--text-primary)' }}>
                    {item.source}
                  </span>
                </div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <ExternalLink className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                </motion.div>
              </div>

              {/* Title */}
              <div className="flex items-start gap-2 mb-3">
                <div className="relative group/title flex-1 min-w-0">
                  <motion.h3
                    animate={{ scale: isHovered ? 1.02 : 1 }}
                    transition={{ duration: 0.2 }}
                    className="font-bold text-lg line-clamp-2"
                    style={{
                      color: 'var(--text-primary)',
                      textShadow: isHovered ? '0 0 10px var(--accent-glow)' : 'none',
                    }}
                  >
                    {item.title}
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
                      {item.title}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p
                className="text-sm line-clamp-3 mb-4 flex-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {item.description || '暂无摘要'}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {item.pubDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.pubDate).split(' ')[0]}
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
          </div>
        </div>
      </a>
    </motion.div>
  );
});

// Pagination Component
const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const animationEnabled = useAnimationEnabled();

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

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <motion.button
        whileHover={animationEnabled ? { scale: 1.05 } : undefined}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 transition-all disabled:opacity-30"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          clipPath: clipPathRounded(4),
          color: 'var(--text-primary)',
        }}
      >
        <ChevronLeft className="w-5 h-5" />
      </motion.button>

      {getPageNumbers().map((page, index) => (
        <motion.button
          key={index}
          whileHover={animationEnabled ? { scale: 1.05 } : undefined}
          whileTap={{ scale: 0.95 }}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
          className="min-w-[40px] h-[40px] px-3 transition-all disabled:cursor-default"
          style={{
            background: page === currentPage 
              ? 'var(--accent-primary)' 
              : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            clipPath: clipPathRounded(4),
            color: page === currentPage ? 'white' : 'var(--text-primary)',
          }}
        >
          {page}
        </motion.button>
      ))}

      <motion.button
        whileHover={animationEnabled ? { scale: 1.05 } : undefined}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 transition-all disabled:opacity-30"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          clipPath: clipPathRounded(4),
          color: 'var(--text-primary)',
        }}
      >
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
});

// 加载进度组件
function LoadingProgress({ loaded, total }: { loaded: number; total: number }) {
  const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;
  
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-64 h-2 mb-4 overflow-hidden" style={{ clipPath: clipPathRounded(2) }}>
        <motion.div
          className="h-full"
          style={{ background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))' }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        正在加载友链动态... {loaded}/{total}
      </p>
    </div>
  );
}

// 刷新冷却时间（毫秒）
const REFRESH_COOLDOWN_MS = 60 * 1000; // 60秒

// Main Feed Page Component
export default function FeedPage() {
  const [, setFriends] = useState<Friend[]>([]);
  const [allItems, setAllItems] = useState<FeedItem[]>([]);
  const [displayItems, setDisplayItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });
  const [footerData, setFooterData] = useState<SiteData['footer'] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshCooldown, _setRefreshCooldown] = useState(0);
  const isMobile = useMobile();
  const animationEnabled = useAnimationEnabled();
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRefreshTimeRef = useRef<number>(Date.now() - REFRESH_COOLDOWN_MS); // 初始设置为已过期
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
  ): Promise<FeedItem[]> => {
    try {
      const feedUrl = getFeedUrl(friend);
      const proxyUrl = `/api/feed/proxy?url=${encodeURIComponent(feedUrl)}${forceRefresh ? '&force=1' : ''}`;
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), FETCH_TIMEOUT);
      });
      
      const fetchPromise = fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, application/json, */*',
        },
        signal,
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const content = await response.text();
      return parseFeed(content, friend);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        console.warn(`Feed fetch aborted for ${friend.name}`);
      } else {
        console.warn(`Failed to fetch feed for ${friend.name}:`, err);
      }
      return [];
    }
  }, [getFeedUrl]);

  const loadData = useCallback(async (forceRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      setLoading(true);
      setLoadingProgress({ loaded: 0, total: 0 });
      
      const [friendsRes, siteRes] = await Promise.all([
        fetch(`/data/friends.json?v=${Date.now()}`, { cache: 'no-store', signal }),
        fetch(`/data/site-data.json?v=${Date.now()}`, { cache: 'no-store', signal }),
      ]);
      
      if (!friendsRes.ok) throw new Error('Failed to load friends data');
      
      const friendsData = await friendsRes.json();
      const siteData = await siteRes.json();
      
      const eligibleFriends = friendsData.friends?.filter(
        (f: Friend) => f.feed && f.feed.trim() !== ''
      ) || [];
      
      setFriends(eligibleFriends);
      setFooterData(siteData.footer);
      setLoadingProgress({ loaded: 0, total: eligibleFriends.length });
      
      const allFeeds: FeedItem[] = [];
      
      for (let i = 0; i < eligibleFriends.length; i++) {
        if (signal.aborted) break;
        
        const friend = eligibleFriends[i];
        const items = await fetchFriendFeed(friend, forceRefresh, signal);
        allFeeds.push(...items);
        
        setLoadingProgress({ loaded: i + 1, total: eligibleFriends.length });
        
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
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Failed to load feed data:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFriendFeed]);

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
      console.log(`请等待 ${remaining} 秒后再次刷新`);
      return;
    }
    
    lastRefreshTimeRef.current = now;
    setRefreshing(true);
    setShowStats(false);
    _setRefreshCooldown(60);
    
    // 启动冷却倒计时
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
  }, [loadData]);

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

  const totalPages = useMemo(() => 
    Math.ceil(allItems.length / POSTS_PER_PAGE),
    [allItems.length]
  );

  const stats = useMemo(() => {
    const totalSources = new Set(allItems.map(item => item.source)).size;
    const latestDate = allItems.length > 0 
      ? new Date(Math.max(...allItems.map(i => i.pubDate ? new Date(i.pubDate).getTime() : 0)))
      : null;
    return {
      totalSources,
      totalArticles: allItems.length,
      latestUpdate: latestDate,
    };
  }, [allItems]);

  if (loading && allItems.length === 0) {
    return (
      <div className="relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {!isMobile && (
          <div className="fixed inset-0 pointer-events-none">
            <AmbientGlow color="var(--accent-primary)" opacity={0.15} position="top-right" />
            <AmbientGlow color="var(--accent-secondary)" opacity={0.1} position="bottom-left" />
          </div>
        )}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-32 lg:pt-36">
          <LoadingProgress loaded={loadingProgress.loaded} total={loadingProgress.total} />
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {!isMobile && (
        <div className="fixed inset-0 pointer-events-none">
          <AmbientGlow color="var(--accent-primary)" opacity={0.15} position="top-right" />
          <AmbientGlow color="var(--accent-secondary)" opacity={0.1} position="bottom-left" />
          <AmbientGlow color="var(--accent-primary)" opacity={0.08} position="center" size={600} />

          {/* Grid Background */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255, 0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255, 0.1) 1px, transparent 1px)`,
              backgroundSize: '80px 80px'
            }}
          />
        </div>
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-32 lg:pt-36 pb-12">
        {/* 顶部工具栏 */}
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: -20 } : undefined}
          animate={animationEnabled ? { opacity: 1, y: 0 } : undefined}
          transition={animationEnabled ? { duration: 0.5 } : undefined}
          className="fixed top-16 lg:top-20 left-0 right-0 z-40 px-4 sm:px-6 lg:px-8 py-3"
          style={{
            background: 'linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-primary) 80%, transparent 100%)'
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex-1" />

            <div className="flex items-center gap-2">
              {/* 统计按钮 */}
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex items-center gap-2 px-3 py-2 transition-all duration-200"
                style={{
                  background: showStats ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: showStats ? 'white' : 'var(--text-primary)',
                  clipPath: clipPathRounded(4),
                }}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:block">统计</span>
              </button>

              {/* 刷新按钮 */}
              <motion.button
                whileHover={animationEnabled && refreshCooldown === 0 ? { scale: 1.05 } : undefined}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshing || refreshCooldown > 0}
                className="flex items-center gap-2 px-3 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative"
                style={{
                  background: refreshCooldown > 0 ? 'rgba(255, 255, 255, 0.05)' : 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  clipPath: clipPathRounded(4),
                  color: refreshCooldown > 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                }}
                title={refreshCooldown > 0 ? `${refreshCooldown}秒后可刷新` : '强制刷新（60秒冷却）'}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium hidden sm:block">
                  {refreshCooldown > 0 ? `${refreshCooldown}s` : '刷新'}
                </span>
              </motion.button>

              {/* 订阅按钮 */}
              <motion.button
                whileHover={animationEnabled ? { scale: 1.05 } : undefined}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSubscribe(true)}
                className="flex items-center gap-2 px-3 py-2 transition-all"
                style={{
                  background: 'var(--accent-primary)',
                  border: '1px solid var(--accent-primary)',
                  clipPath: clipPathRounded(4),
                  color: 'white',
                }}
              >
                <Rss className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:block">订阅</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Hero Section */}
        <section className="relative pt-8 pb-12 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-20 right-20 w-64 h-64 opacity-20"
              style={{ background: 'radial-gradient(circle, var(--accent-glow), transparent 70%)' }}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* 左侧：标题和描述 */}
            <motion.div
              initial={animationEnabled ? { opacity: 0, x: -50 } : undefined}
              animate={animationEnabled ? { opacity: 1, x: 0 } : undefined}
              transition={animationEnabled ? { duration: 0.8, type: 'spring', stiffness: 100 } : undefined}
            >
              <motion.div
                initial={animationEnabled ? { opacity: 0, scale: 0.9 } : undefined}
                animate={animationEnabled ? { opacity: 1, scale: 1 } : undefined}
                transition={animationEnabled ? { delay: 0.2, duration: 0.5 } : undefined}
                className="inline-flex items-center gap-2 px-4 py-2 mb-6"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  clipPath: clipPathRounded(4),
                }}
              >
                <Rss className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>朋友圈</span>
              </motion.div>

              <h1
                className="font-sans font-bold text-4xl md:text-5xl lg:text-6xl mb-6"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                友链动态
              </h1>

              <motion.p
                initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
                animate={animationEnabled ? { opacity: 1, y: 0 } : undefined}
                transition={animationEnabled ? { delay: 0.3, duration: 0.5 } : undefined}
                className="text-lg md:text-xl leading-relaxed max-w-xl"
                style={{ color: 'var(--text-muted)' }}
              >
                聚合友链网站的最新文章，实时同步更新，一站式阅读体验
              </motion.p>
            </motion.div>

            {/* 右侧：统计卡片 */}
            <motion.div
              initial={animationEnabled ? { opacity: 0, x: 50 } : undefined}
              animate={animationEnabled ? { opacity: 1, x: 0 } : undefined}
              transition={animationEnabled ? { duration: 0.8, delay: 0.2, type: 'spring', stiffness: 100 } : undefined}
              className="grid grid-cols-3 gap-4"
            >
              <StatCard
                icon={Users}
                value={stats.totalSources}
                label="订阅源"
                color="var(--accent-primary)"
                delay={0}
              />
              <StatCard
                icon={Newspaper}
                value={stats.totalArticles}
                label="文章总数"
                color="var(--accent-secondary)"
                delay={1}
              />
              <StatCard
                icon={Clock}
                value={stats.latestUpdate ? formatDate(stats.latestUpdate.toISOString()).split(' ')[0] : '-'}
                label="最近更新"
                color="#22c55e"
                delay={2}
              />
            </motion.div>
          </div>
        </section>

        {/* 统计面板 */}
        <AnimatePresence>
          {showStats && (
            <StatsPanel items={allItems} onClose={() => setShowStats(false)} />
          )}
        </AnimatePresence>

        {/* 加载进度条（刷新时显示） */}
        {loading && allItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
              <span>正在刷新...</span>
              <span>{loadingProgress.loaded}/{loadingProgress.total}</span>
            </div>
            <div className="w-full h-1 overflow-hidden" style={{ clipPath: clipPathRounded(1) }}>
              <motion.div
                className="h-full"
                style={{ background: 'var(--accent-primary)' }}
                initial={{ width: 0 }}
                animate={{ width: `${(loadingProgress.loaded / loadingProgress.total) * 100}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* 内容区域 */}
        {allItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div
              className="inline-flex items-center justify-center w-20 h-20 mb-6"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                clipPath: clipPathRounded(8),
              }}
            >
              <Rss className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              暂无内容
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              暂无符合条件的友链或暂无可读取的 Feed 内容
            </p>
            <button
              onClick={() => setShowSubscribe(true)}
              className="px-4 py-2 text-sm transition-all"
              style={{
                background: 'var(--accent-primary)',
                color: 'white',
                clipPath: clipPathRounded(4),
              }}
            >
              订阅本站
            </button>
          </motion.div>
        ) : (
          <>
            {/* Feed Grid */}
            <section className="mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayItems.map((item, index) => (
                  <FeedCard key={`${item.link}-${index}`} item={item} index={index} />
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

      {/* Light Beam */}
      {!isMobile && <LightBeam position="bottom" color="var(--accent-secondary)" intensity={0.2} />}

      {/* Subscribe Modal */}
      <AnimatePresence>
        {showSubscribe && (
          <SubscribeModal isOpen={showSubscribe} onClose={() => setShowSubscribe(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
