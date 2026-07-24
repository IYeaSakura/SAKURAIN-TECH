'use client';

/**
 * FriendsPage —— brutalist friends directory.
 *
 * Replaces the previous glass/clip-path/glow aesthetic with thick borders,
 * pixel offset shadows and monospace/pixel typography to match the site-wide
 * new-brutalism design system.
 */

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  ExternalLink,
  Users,
  FolderOpen,
  Wifi,
  Mail,
  Sparkles,
  Star,
  Monitor,
  Code,
  Palette,
  Wrench,
  Heart,
  User,
  FileText,
  Send,
  Bug,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  AlertTriangle,
  Shuffle,
} from 'lucide-react';
import { Footer } from '@/components/sections/Footer';
import { useAnimationEnabled } from '@/hooks';
import { RouteLoader } from '@/components/RouteLoader';
import type { SiteData } from '@/types';

// Types
interface CheckInfo {
  lastChecked: string;
  statusCode: number | null;
  error: string | null;
  attempts: number;
  usedHttpFallback: boolean;
  responseTime: number | null;
  isAntiBot: boolean;
  hasProtection: boolean;
  isMaintenance?: boolean;
  maintenanceReason?: string | null;
  isJsChallenge?: boolean;
  jsChallengeIndicator?: string | null;
}

interface Friend {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string;
  category: string;
  featured: boolean;
  status?: 'online' | 'offline' | 'maintenance';
  unidirectional?: boolean;
  checkInfo?: CheckInfo;
}

interface FriendCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface ApplyInfo {
  title: string;
  description: string;
  requirements: string[];
  contact: string;
}

interface FriendsData {
  title: string;
  description: string;
  friends: Friend[];
  categories: FriendCategory[];
  applyInfo: ApplyInfo;
  lastUpdated?: string;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Monitor,
  Code,
  Palette,
  Wrench,
  Globe,
  User,
};

const statusColor: Record<string, string> = {
  online: '#22c55e',
  maintenance: '#eab308',
  offline: '#ef4444',
};

const statusLabel: Record<string, string> = {
  online: '在线',
  maintenance: '维护',
  offline: '离线',
};

// Debug Panel Component
function DebugPanel({
  friends,
  onClose,
}: {
  friends: Friend[];
  onClose: () => void;
}) {
  const onlineCount = friends.filter((f) => f.status === 'online').length;
  const offlineCount = friends.filter((f) => f.status === 'offline').length;
  const maintenanceCount = friends.filter((f) => f.status === 'maintenance').length;
  const unknownCount = friends.filter((f) => !f.status).length;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('zh-CN', {
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

  const formatResponseTime = (ms: number | null) => {
    if (ms === null) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-10 overflow-hidden"
    >
      <div
        className="p-5 border-2"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)',
          boxShadow: '4px 4px 0 var(--border-subtle)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            <h3 className="text-base font-bold uppercase" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              友链连通性调试
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="flex items-center gap-1" style={{ color: '#22c55e' }}>
                <CheckCircle2 className="w-4 h-4" /> {onlineCount}
              </span>
              {maintenanceCount > 0 && (
                <span className="flex items-center gap-1" style={{ color: '#eab308' }}>
                  <AlertTriangle className="w-4 h-4" /> {maintenanceCount}
                </span>
              )}
              {offlineCount > 0 && (
                <span className="flex items-center gap-1" style={{ color: '#ef4444' }}>
                  <AlertCircle className="w-4 h-4" /> {offlineCount}
                </span>
              )}
              {unknownCount > 0 && (
                <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <Clock className="w-4 h-4" /> {unknownCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 border-2 transition-colors hover:bg-[var(--accent-primary)] hover:text-[var(--bg-primary)]"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-start gap-3 p-3 border-2"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex-shrink-0 mt-0.5">
                {friend.status === 'online' ? (
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />
                ) : friend.status === 'maintenance' ? (
                  <AlertTriangle className="w-4 h-4" style={{ color: '#eab308' }} />
                ) : friend.status === 'offline' ? (
                  <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                ) : (
                  <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {friend.name}
                  </span>
                  {friend.status && (
                    <span
                      className="text-[10px] px-2 py-0.5 border-2 font-mono uppercase"
                      style={{
                        background: 'var(--bg-secondary)',
                        borderColor: `${statusColor[friend.status]}60`,
                        color: statusColor[friend.status],
                      }}
                    >
                      {statusLabel[friend.status]}
                    </span>
                  )}
                  {friend.checkInfo?.statusCode && (
                    <span
                      className="text-[10px] px-2 py-0.5 border-2 font-mono"
                      style={{
                        background: 'var(--bg-secondary)',
                        borderColor: 'var(--border-subtle)',
                        color: friend.checkInfo.statusCode >= 500 ? '#ef4444' : friend.checkInfo.statusCode >= 400 ? '#eab308' : '#3b82f6',
                      }}
                    >
                      HTTP {friend.checkInfo.statusCode}
                    </span>
                  )}
                  {friend.checkInfo && friend.checkInfo.responseTime !== null && (
                    <span
                      className="text-[10px] px-2 py-0.5 border-2 font-mono"
                      style={{
                        background: 'var(--bg-secondary)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--accent-secondary)',
                      }}
                    >
                      {formatResponseTime(friend.checkInfo.responseTime)}
                    </span>
                  )}
                  {friend.checkInfo?.usedHttpFallback && (
                    <span
                      className="text-[10px] px-2 py-0.5 border-2 font-mono"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: '#eab308' }}
                    >
                      HTTP降级
                    </span>
                  )}
                  {friend.checkInfo?.isMaintenance && (
                    <span
                      className="text-[10px] px-2 py-0.5 border-2 font-mono"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: '#eab308' }}
                    >
                      维护状态
                    </span>
                  )}
                  {friend.checkInfo?.isJsChallenge && (
                    <span
                      className="text-[10px] px-2 py-0.5 border-2 font-mono"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: '#f97316' }}
                      title={friend.checkInfo.jsChallengeIndicator || undefined}
                    >
                      JS验证{friend.checkInfo.jsChallengeIndicator ? ` (${friend.checkInfo.jsChallengeIndicator})` : ''}
                    </span>
                  )}
                  {friend.checkInfo?.isAntiBot && (
                    <span
                      className="text-[10px] px-2 py-0.5 border-2 font-mono"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: '#f97316' }}
                    >
                      反爬检测
                    </span>
                  )}
                  {friend.checkInfo?.hasProtection && (
                    <span
                      className="text-[10px] px-2 py-0.5 border-2 font-mono"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: '#06b6d4' }}
                    >
                      CDN防护
                    </span>
                  )}
                </div>
                <div className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
                  {friend.url}
                </div>
                {friend.checkInfo && (
                  <div className="text-xs mt-1 flex items-center gap-3 font-mono" style={{ color: 'var(--text-muted)' }}>
                    <span>检测时间: {formatDate(friend.checkInfo.lastChecked)}</span>
                    <span>重试次数: {friend.checkInfo.attempts}</span>
                  </div>
                )}
                {friend.checkInfo?.error && (
                  <div
                    className="text-xs mt-2 p-2 border-2 border-l-4 break-all"
                    style={{
                      background: 'var(--bg-secondary)',
                      borderColor: '#ef444440',
                      borderLeftColor: '#ef4444',
                      color: '#f87171',
                    }}
                  >
                    <span className="font-bold">失败原因: </span>
                    {friend.checkInfo.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Friend Card Component
const FriendCard = memo(function FriendCard({
  friend,
  index,
  onClick,
}: {
  friend: Friend;
  index: number;
  onClick: (friend: Friend) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const animationEnabled = useAnimationEnabled();

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: animationEnabled ? index * 0.05 : 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(friend)}
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
          <div className="flex items-start gap-3 sm:gap-4 flex-1">
            {/* Icon */}
            <div
              className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center border-2 transition-colors"
              style={{
                background: 'var(--bg-primary)',
                borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)',
              }}
            >
              {!imageError ? (
                <img
                  src={friend.icon}
                  alt={friend.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Globe className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: 'var(--accent-primary)' }} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1.5 flex-wrap">
                <h3
                  className="font-bold text-base sm:text-lg truncate flex-1"
                  style={{ color: 'var(--text-primary)' }}
                  title={friend.name}
                >
                  {friend.name}
                </h3>

                {friend.status && (
                  <span
                    className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase border-2 font-mono"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: `${statusColor[friend.status]}60`,
                      color: statusColor[friend.status],
                    }}
                  >
                    <span
                      className="w-1 h-1"
                      style={{
                        background: statusColor[friend.status],
                        boxShadow: friend.status === 'online' ? `0 0 4px ${statusColor[friend.status]}` : 'none',
                      }}
                    />
                    {statusLabel[friend.status]}
                  </span>
                )}

                {friend.unidirectional && (
                  <span
                    className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase border-2 font-mono"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    单向
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm line-clamp-2 mb-3" style={{ color: 'var(--text-secondary)' }}>
                {friend.description}
              </p>

              {friend.featured && (
                <div
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider border-2 font-mono"
                  style={{
                    background: 'var(--bg-primary)',
                    borderColor: 'var(--accent-primary)',
                    color: 'var(--accent-primary)',
                  }}
                >
                  <Star className="w-3 h-3" />
                  友链
                </div>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 8 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 hidden sm:block self-center"
            >
              <ExternalLink className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// Category Section Component
const CategorySection = memo(function CategorySection({
  category,
  friends,
  index,
  onClick,
}: {
  category: FriendCategory;
  friends: Friend[];
  index: number;
  onClick: (friend: Friend) => void;
}) {
  const animationEnabled = useAnimationEnabled();
  const IconComponent = iconMap[category.icon] || Globe;

  return (
    <motion.section
      initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="mb-16"
    >
      <div className="flex items-center gap-4 mb-6">
        <div
          className="flex items-center justify-center w-12 h-12 border-2"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
        >
          <IconComponent className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <div>
          <h2
            className="text-xl sm:text-2xl font-bold uppercase"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
          >
            {category.name}
          </h2>
          <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
            {category.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        {friends.map((friend, friendIndex) => (
          <FriendCard key={friend.id} friend={friend} index={friendIndex} onClick={onClick} />
        ))}
      </div>
    </motion.section>
  );
});

// Hero Section Component
const HeroSection = memo(function HeroSection({
  title,
  description,
  stats,
  lastUpdated,
  onApplyClick,
  onDebugClick,
  showDebug,
}: {
  title: string;
  description: string;
  stats: { friends: number; categories: number; online: number };
  lastUpdated?: string;
  onApplyClick: () => void;
  onDebugClick: () => void;
  showDebug: boolean;
}) {
  const animationEnabled = useAnimationEnabled();

  return (
    <section className="pt-28 lg:pt-36 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-end">
          {/* Left: Title and description */}
          <motion.div
            initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 border-2 mb-4"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <Heart className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
              >
                Friends
              </span>
            </div>

            <h1
              className="text-3xl sm:text-5xl font-bold uppercase tracking-tight mb-4"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
            >
              {title}
            </h1>
            <p className="text-base sm:text-lg max-w-xl mb-6" style={{ color: 'var(--text-secondary)' }}>
              {description}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onApplyClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wider border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{
                  background: 'var(--accent-primary)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--bg-primary)',
                  boxShadow: '4px 4px 0 var(--border-subtle)',
                }}
              >
                <Mail className="w-4 h-4" />
                申请友链
              </button>

              <button
                onClick={onDebugClick}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold uppercase tracking-wider border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{
                  background: showDebug ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)',
                  color: showDebug ? 'var(--bg-primary)' : 'var(--text-primary)',
                  boxShadow: '4px 4px 0 var(--border-subtle)',
                }}
              >
                <Bug className="w-4 h-4" />
                调试
              </button>
            </div>

            {lastUpdated && (
              <div
                className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 border-2 text-xs font-mono"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                <Clock className="w-3 h-3" />
                最后更新:{' '}
                {new Date(lastUpdated).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
          </motion.div>

          {/* Right: Stats */}
          <motion.div
            initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-3 gap-3 sm:gap-4"
          >
            {[
              { icon: Users, value: stats.friends, label: '友链站点' },
              { icon: FolderOpen, value: stats.categories, label: '分类目录' },
              { icon: Wifi, value: stats.online, label: '在线站点' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                className="p-3 sm:p-5 text-center border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)',
                  boxShadow: '3px 3px 0 var(--border-subtle)',
                }}
              >
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 sm:mb-3" style={{ color: 'var(--accent-primary)' }} />
                <div
                  className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-1"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
                >
                  {stat.value}
                </div>
                <div className="text-[10px] sm:text-xs font-mono uppercase" style={{ color: 'var(--text-muted)' }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
});

// Apply Modal Component
const ApplyModal = memo(function ApplyModal({
  isOpen,
  onClose,
  contact,
}: {
  isOpen: boolean;
  onClose: () => void;
  contact: string;
}) {
  const animationEnabled = useAnimationEnabled();
  const [copied, setCopied] = useState(false);
  const [siteInfoCopied, setSiteInfoCopied] = useState(false);

  const siteInfo = {
    name: 'SAKURAIN TEAM',
    url: 'https://sakurain.net',
    icon: 'https://sakurain.net/favicon',
    rss: 'https://sakurain.net/feed',
    description: '用代码构建未来',
  };

  const emailTemplate = `此邮件用于申请添加友链。\n\n网站名称：${siteInfo.name}\n网站链接：${siteInfo.url}\n网站图标：${siteInfo.icon}\nRSS订阅（可选）：${siteInfo.rss}\n网站描述：${siteInfo.description}\n\n已添加到友链列表中，并替换为自己的站点信息。\n发送本邮件即代表承诺网站内容健康、合法、无恶意代码。`;

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setSiteInfoCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contact);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleCopySiteInfo = async () => {
    try {
      const siteInfoText = `网站名称：${siteInfo.name}\n网站链接：${siteInfo.url}\n网站图标：${siteInfo.icon}\nRSS订阅：${siteInfo.rss}\n网站描述：${siteInfo.description}`;
      await navigator.clipboard.writeText(siteInfoText);
      setSiteInfoCopied(true);
      setTimeout(() => setSiteInfoCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleOpenMailto = () => {
    const subject = '申请友链 - SAKURAIN';
    const mailtoLink = `mailto:${contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailTemplate)}`;
    window.location.href = mailtoLink;
  };

  const handleOpenForm = () => {
    window.open('https://f.wps.cn/g/oEZK9Vpu/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={animationEnabled ? { opacity: 0 } : undefined}
        animate={animationEnabled ? { opacity: 1 } : undefined}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      />
      <motion.div
        initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
        animate={animationEnabled ? { opacity: 1, y: 0 } : undefined}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto border-2"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)',
          boxShadow: '6px 6px 0 var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="flex items-center justify-center w-12 h-12 border-2"
            style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
          >
            <Mail className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              申请友链
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              请先添加本站友链，再提交申请
            </p>
          </div>
        </div>

        {/* Important Notice */}
        <div
          className="mb-4 p-4 border-2"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-start gap-2">
            <span style={{ color: 'var(--accent-secondary)' }}>⚠️</span>
            <div>
              <p className="text-xs font-bold uppercase font-mono" style={{ color: 'var(--text-primary)' }}>
                重要提示
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                请在发送申请邮件之前，先在自己的站点上添加本站友链信息
              </p>
            </div>
          </div>
        </div>

        {/* Site Info */}
        <div
          className="mb-4 p-4 border-2"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase font-mono" style={{ color: 'var(--accent-primary)' }}>
              本站友链信息
            </p>
            <button
              onClick={handleCopySiteInfo}
              className="px-2 py-1 text-xs font-bold uppercase border-2 transition-colors hover:opacity-80"
              style={{
                background: siteInfoCopied ? 'var(--success)' : 'var(--accent-primary)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--bg-primary)',
              }}
            >
              {siteInfoCopied ? '已复制' : '复制'}
            </button>
          </div>
          <div className="space-y-1.5 text-sm" style={{ color: 'var(--text-primary)' }}>
            <p>
              <span style={{ color: 'var(--text-muted)' }}>网站名称：</span>
              {siteInfo.name}
            </p>
            <p>
              <span style={{ color: 'var(--text-muted)' }}>网站链接：</span>
              {siteInfo.url}
            </p>
            <p>
              <span style={{ color: 'var(--text-muted)' }}>网站图标：</span>
              {siteInfo.icon}
            </p>
            <p>
              <span style={{ color: 'var(--text-muted)' }}>RSS订阅：</span>
              {siteInfo.rss}
            </p>
            <p>
              <span style={{ color: 'var(--text-muted)' }}>网站描述：</span>
              {siteInfo.description}
            </p>
          </div>
        </div>

        {/* Contact Email */}
        <div
          className="mb-4 p-4 border-2"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <p className="text-xs font-bold uppercase font-mono mb-2" style={{ color: 'var(--text-muted)' }}>
            收件邮箱
          </p>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 px-3 py-2 text-sm font-mono border-2"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-primary)',
              }}
            >
              {contact}
            </code>
            <button
              onClick={handleCopyEmail}
              className="px-3 py-2 text-sm font-bold uppercase border-2 transition-colors hover:opacity-80"
              style={{
                background: copied ? 'var(--success)' : 'var(--accent-primary)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--bg-primary)',
              }}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase font-mono" style={{ color: 'var(--text-muted)' }}>
            选择申请方式
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleOpenMailto}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold uppercase border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
              style={{
                background: 'var(--accent-primary)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--bg-primary)',
                boxShadow: '3px 3px 0 var(--border-subtle)',
              }}
            >
              <Send className="w-4 h-4" />
              邮箱申请
            </button>
            <button
              onClick={handleOpenForm}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold uppercase border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--accent-primary)',
                color: 'var(--accent-primary)',
                boxShadow: '3px 3px 0 var(--accent-primary)',
              }}
            >
              <FileText className="w-4 h-4" />
              表单申请
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 text-sm font-bold uppercase border-2 transition-colors hover:bg-[var(--bg-tertiary)]"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
        >
          关闭
        </button>
      </motion.div>
    </div>
  );
});

// Apply Section Component
const ApplySection = memo(function ApplySection({
  applyInfo,
  onApplyClick,
}: {
  applyInfo: ApplyInfo;
  onApplyClick: () => void;
}) {
  const animationEnabled = useAnimationEnabled();

  return (
    <motion.section
      initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-12 mb-8 border-2"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
        boxShadow: '4px 4px 0 var(--border-subtle)',
      }}
    >
      <div className="p-5 sm:p-8 md:p-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex items-center justify-center w-12 h-12 border-2"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
              >
                <Sparkles className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <h2
                className="text-xl sm:text-2xl font-bold uppercase"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
              >
                {applyInfo.title}
              </h2>
            </div>
            <p className="mb-5 text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
              {applyInfo.description}
            </p>
            <ul className="space-y-2">
              {applyInfo.requirements.map((req, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-sm font-mono"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span
                    className="w-2 h-2"
                    style={{ background: 'var(--accent-primary)' }}
                  />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={onApplyClick}
            className="relative flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold uppercase border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 w-full sm:w-auto"
            style={{
              background: 'var(--accent-primary)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--bg-primary)',
              boxShadow: '4px 4px 0 var(--border-subtle)',
            }}
          >
            <Mail className="w-5 h-5" />
            申请友链
          </button>
        </div>
      </div>
    </motion.section>
  );
});

// Redirect Modal Component
const RedirectModal = memo(function RedirectModal({
  isOpen,
  friend,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  friend: Friend | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const animationEnabled = useAnimationEnabled();
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setTimeLeft(3);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onConfirm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [isOpen, onConfirm]);

  if (!isOpen || !friend) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={animationEnabled ? { opacity: 0 } : undefined}
        animate={animationEnabled ? { opacity: 1 } : undefined}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onCancel}
      />
      <motion.div
        initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
        animate={animationEnabled ? { opacity: 1, y: 0 } : undefined}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md p-5 sm:p-6 border-2"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)',
          boxShadow: '6px 6px 0 var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex items-center justify-center w-12 h-12 border-2"
            style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
          >
            <Globe className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              即将离开本站
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              跳转到友链网站
            </p>
          </div>
        </div>

        <div
          className="mb-4 p-4 border-2"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {friend.name}
          </p>
          <p className="text-xs truncate font-mono" style={{ color: 'var(--text-muted)' }}>
            {friend.url}
          </p>
        </div>

        <div
          className="mb-4 p-3 border-2"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-start gap-2">
            <span style={{ color: 'var(--accent-secondary)' }}>⚠️</span>
            <div>
              <p className="text-xs font-bold uppercase font-mono" style={{ color: 'var(--text-primary)' }}>
                注意
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                即将访问外部网站，本站无法保证其安全性，请保持警惕
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2 font-mono">
            <span style={{ color: 'var(--text-muted)' }}>自动跳转</span>
            <span style={{ color: 'var(--text-primary)' }}>{timeLeft} 秒</span>
          </div>
          <div
            className="h-3 border-2 overflow-hidden"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <motion.div
              className="h-full"
              style={{ background: 'var(--accent-primary)', width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-bold uppercase border-2 transition-colors hover:bg-[var(--bg-tertiary)]"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            取消跳转
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-bold uppercase border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
            style={{
              background: 'var(--accent-primary)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--bg-primary)',
              boxShadow: '3px 3px 0 var(--border-subtle)',
            }}
          >
            立即访问
          </button>
        </div>
      </motion.div>
    </div>
  );
});

// Main Friends Page Component
export default function FriendsPage() {
  const [data, setData] = useState<FriendsData | null>(null);
  const [footerData, setFooterData] = useState<SiteData['footer'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [mailtoModalOpen, setMailtoModalOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const animationEnabled = useAnimationEnabled();

  const handleFriendClick = useCallback((friend: Friend) => {
    setSelectedFriend(friend);
    setRedirectModalOpen(true);
  }, []);

  const handleRandomVisit = useCallback(() => {
    if (!data) return;
    const featuredFriends = data.friends.filter((f) => f.featured && f.status === 'online');
    if (featuredFriends.length === 0) return;
    const randomFriend = featuredFriends[Math.floor(Math.random() * featuredFriends.length)];
    setSelectedFriend(randomFriend);
    setRedirectModalOpen(true);
  }, [data]);

  const handleConfirmRedirect = useCallback(() => {
    if (selectedFriend) {
      window.open(selectedFriend.url, '_blank', 'noopener,noreferrer');
    }
    setRedirectModalOpen(false);
    setSelectedFriend(null);
  }, [selectedFriend]);

  const handleCancelRedirect = useCallback(() => {
    setRedirectModalOpen(false);
    setSelectedFriend(null);
  }, []);

  const handleApplyClick = useCallback(() => {
    setMailtoModalOpen(true);
  }, []);

  const handleCloseMailtoModal = useCallback(() => {
    setMailtoModalOpen(false);
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch('/data/friends.json').then((res) => {
        if (!res.ok) throw new Error('Failed to load friends data');
        return res.json();
      }),
      fetch('/data/site-data.json').then((res) => res.json()),
    ])
      .then(([friendsData, siteData]: [FriendsData, SiteData]) => {
        setData(friendsData);
        setFooterData(siteData.footer);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const VISIBLE_CATEGORIES = ['personal'];
  const DEMO_CATEGORY_ID = 'demo';

  const friendsByCategory = useMemo(() => {
    if (!data) return [];
    return VISIBLE_CATEGORIES.map((catId) => {
      const category = data.categories.find((c) => c.id === catId);
      if (!category) return null;
      return {
        category,
        friends: data.friends.filter((friend) => friend.category === catId),
      };
    }).filter((item): item is { category: FriendCategory; friends: Friend[] } => item !== null && item.friends.length > 0);
  }, [data]);

  const demoFriends = useMemo(() => {
    if (!data) return [];
    return data.friends.filter((friend) => friend.category === DEMO_CATEGORY_ID);
  }, [data]);

  const demoCategory = useMemo(() => {
    if (!data) return null;
    return data.categories.find((c) => c.id === DEMO_CATEGORY_ID) || null;
  }, [data]);

  const stats = useMemo(() => {
    if (!data) return { friends: 0, categories: 0, online: 0 };
    const featuredFriends = data.friends.filter((f) => f.featured);
    return {
      friends: featuredFriends.length,
      categories: 3,
      online: featuredFriends.filter((f) => f.status === 'online').length,
    };
  }, [data]);

  if (loading) {
    return <RouteLoader />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div
          className="text-center p-8 border-2"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-subtle)',
            boxShadow: '4px 4px 0 var(--border-subtle)',
          }}
        >
          <p className="mb-4 font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
            {error || '无法加载友链数据'}
          </p>
          <button
            onClick={loadData}
            className="px-4 py-2 text-sm font-bold uppercase border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
            style={{
              background: 'var(--accent-primary)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--bg-primary)',
              boxShadow: '3px 3px 0 var(--border-subtle)',
            }}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <HeroSection
          title={data.title}
          description={data.description}
          stats={stats}
          lastUpdated={data.lastUpdated}
          onApplyClick={handleApplyClick}
          onDebugClick={() => setShowDebug(!showDebug)}
          showDebug={showDebug}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {/* Debug Panel */}
          <AnimatePresence>
            {showDebug && <DebugPanel friends={data.friends} onClose={() => setShowDebug(false)} />}
          </AnimatePresence>

          {/* Categories */}
          {friendsByCategory.map(
            ({ category, friends }, index) =>
              friends.length > 0 && (
                <CategorySection
                  key={category.id}
                  category={category}
                  friends={friends}
                  index={index + 1}
                  onClick={handleFriendClick}
                />
              )
          )}

          {/* Featured Friends */}
          {data.friends.some((f) => f.featured) && (
            <motion.section
              initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-16"
            >
              <div className="flex items-center gap-4 mb-6 flex-wrap">
                <div
                  className="flex items-center justify-center w-12 h-12 border-2"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
                >
                  <Star className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <h2
                  className="text-xl sm:text-2xl font-bold uppercase"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
                >
                  友链推荐
                </h2>
                <button
                  onClick={handleRandomVisit}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--accent-primary)',
                    color: 'var(--accent-primary)',
                    boxShadow: '3px 3px 0 var(--accent-primary)',
                  }}
                >
                  <Shuffle className="w-4 h-4" />
                  随机访问
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                {data.friends
                  .filter((f) => f.featured)
                  .map((friend, index) => (
                    <FriendCard key={friend.id} friend={friend} index={index} onClick={handleFriendClick} />
                  ))}
              </div>
            </motion.section>
          )}

          {/* Demo Sites */}
          {demoFriends.length > 0 && demoCategory && (
            <CategorySection category={demoCategory} friends={demoFriends} index={3} onClick={handleFriendClick} />
          )}

          {/* Apply Section */}
          <ApplySection applyInfo={data.applyInfo} onApplyClick={handleApplyClick} />
        </div>
      </main>

      {/* Footer */}
      {footerData && <Footer data={footerData} />}

      <RedirectModal
        isOpen={redirectModalOpen}
        friend={selectedFriend}
        onConfirm={handleConfirmRedirect}
        onCancel={handleCancelRedirect}
      />

      {data && <ApplyModal isOpen={mailtoModalOpen} onClose={handleCloseMailtoModal} contact={data.applyInfo.contact} />}
    </div>
  );
}
