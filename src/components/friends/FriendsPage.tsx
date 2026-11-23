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
  Monitor,
  Code,
  Palette,
  Wrench,
  Heart,
  FileText,
  Send,
  Bug,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  AlertTriangle,
  Shuffle,
  Rss,
  ArrowUpRight,
  BookOpen,
  Plus,
  Pencil,
} from 'lucide-react';
import { Footer } from '@/components/sections/Footer';
import FriendApplyForm from './FriendApplyForm';
import { useAnimationEnabled, useScrollLock, useTranslation } from '@/hooks';
import { RouteLoader } from '@/components/RouteLoader';
import type { SiteData } from '@/types';
import type { Locale } from '@/i18n/types';

// Types
type LocalizedText = string | { zh: string; en: string };

function getLocalizedText(value: LocalizedText | undefined, locale: Locale): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] ?? value.en ?? value.zh ?? '';
}

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
  /** 最近一次在线的时间；站点当前离线时用于计算离线时长 */
  offlineSince?: string | null;
}

interface Friend {
  id?: string;
  name: string;
  url: string;
  icon: string;
  /** sakurain-api 缓存的图标副本，原图标失效时回退到这里 */
  iconCached?: string;
  description: LocalizedText;
  category: string;
  feed?: string;
  status?: 'online' | 'offline' | 'maintenance';
  unidirectional?: boolean;
  checkInfo?: CheckInfo;
}

interface FriendCategory {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  icon: string;
}

interface ApplyInfo {
  title: LocalizedText;
  description: LocalizedText;
  requirements: LocalizedText[];
  contact: string;
}

interface FriendsData {
  title: LocalizedText;
  subtitle?: LocalizedText;
  description: LocalizedText;
  friends: Friend[];
  categories: FriendCategory[];
  applyInfo: ApplyInfo;
  lastUpdated?: string;
  intervalHours?: number;
}

/** sakurain-api /api/friends/status 的单条结果 */
interface ApiStatusItem {
  url: string;
  urlKey: string;
  status?: 'online' | 'offline' | 'maintenance' | 'unknown';
  statusCode?: number | null;
  responseTime?: number | null;
  error?: string | null;
  attempts?: number | null;
  usedHttpFallback?: boolean;
  hasProtection?: boolean;
  isMaintenance?: boolean;
  maintenanceReason?: string | null;
  checkedAt?: string | null;
  offlineSince?: string | null;
}

interface ApiStatusPayload {
  generatedAt?: string;
  intervalHours?: number;
  items?: ApiStatusItem[];
  lastRun?: { finished_at?: string | null } | null;
}

interface FriendsConfig {
  builtinCheck?: { enabled?: boolean };
  api?: {
    enabled?: boolean;
    baseUrl?: string;
    statusPath?: string;
    listPath?: string;
    timeoutMs?: number;
  };
}

interface StatusMeta {
  updatedAt?: string;
  intervalHours: number;
}

const DEFAULT_STATUS_API = 'https://api.sakurain.net';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Monitor,
  Code,
  Palette,
  Wrench,
  Globe,
  BookOpen,
};

/** 取主机名用于卡片副标题，非法 URL 时回退到原串 */
function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
}

/**
 * 友链图标：优先用站点自己的图标，加载失败时回退到 sakurain-api 的缓存副本，
 * 两者都不可用才显示地球占位。
 */
function FriendIcon({
  friend,
  className,
  iconClassName,
}: {
  friend: Pick<Friend, 'name' | 'icon' | 'iconCached'>;
  className: string;
  iconClassName: string;
}) {
  const sources = useMemo(
    () => [friend.icon, friend.iconCached].filter((src): src is string => Boolean(src)),
    [friend.icon, friend.iconCached]
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [friend.icon, friend.iconCached]);

  if (index >= sources.length) {
    return <Globe className={className} style={{ color: 'var(--accent-primary)' }} />;
  }

  return (
    <img
      src={sources[index]}
      alt={friend.name}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={iconClassName}
      onError={() => setIndex((current) => current + 1)}
    />
  );
}

/** 与 sakurain-api 的 url_key 规则一致：host[:port] + 去尾斜杠的 path */
function normalizeUrlKey(url: string): string {
  try {
    const parsed = new URL(url);
    let key = parsed.hostname.toLowerCase();
    if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
      key += `:${parsed.port}`;
    }
    const pathname = parsed.pathname.replace(/\/$/, '');
    if (pathname) key += pathname;
    return key;
  } catch {
    return url.toLowerCase().replace(/\/$/, '');
  }
}

/**
 * 从 sakurain-api 拉取检测状态。
 * 失败或未启用时返回 null，页面继续用 friends.json 里的静态 status。
 */
async function loadFriendStatuses(
  config: FriendsConfig | null
): Promise<{ items: ApiStatusItem[]; meta: StatusMeta } | null> {
  const api = config?.api;
  if (api?.enabled === false) return null;

  const baseUrl = (api?.baseUrl || DEFAULT_STATUS_API).replace(/\/$/, '');
  const path = api?.statusPath || '/api/friends/status';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), api?.timeoutMs ?? 6000);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as ApiStatusPayload;
    if (!Array.isArray(payload.items) || payload.items.length === 0) return null;
    return {
      items: payload.items,
      meta: {
        updatedAt: payload.lastRun?.finished_at ?? payload.generatedAt,
        intervalHours: payload.intervalHours ?? 3,
      },
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 从 sakurain-api 拉取完整友链文档（标题、分类、友链、检测状态）。
 * 友链清单以后台 api.sakurain.net/admin 为源，拉取失败时回退本地 friends.json。
 */
async function loadFriendsDocument(config: FriendsConfig | null): Promise<FriendsData | null> {
  const api = config?.api;
  if (api?.enabled === false) return null;

  const baseUrl = (api?.baseUrl || DEFAULT_STATUS_API).replace(/\/$/, '');
  const path = api?.listPath || '/api/friends/list';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), api?.timeoutMs ?? 6000);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as FriendsData;
    if (!Array.isArray(payload.friends) || !Array.isArray(payload.categories)) return null;
    // 后台还没导入数据时继续用本地静态清单，避免页面空白。
    if (payload.friends.length === 0) return null;
    return payload;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 把 /api/friends/status 的结果合并进本地静态清单（回退路径） */
function applyStatuses(friends: Friend[], items: ApiStatusItem[]): Friend[] {
  const byKey = new Map<string, ApiStatusItem>();
  for (const item of items) {
    byKey.set(item.urlKey || normalizeUrlKey(item.url), item);
  }

  return friends.map((friend) => {
    const item = byKey.get(normalizeUrlKey(friend.url));
    if (!item || !item.status || item.status === 'unknown') return friend;
    return {
      ...friend,
      status: item.status as Friend['status'],
      checkInfo: {
        lastChecked: item.checkedAt ?? '',
        statusCode: item.statusCode ?? null,
        error: item.error ?? null,
        attempts: item.attempts ?? 0,
        usedHttpFallback: Boolean(item.usedHttpFallback),
        responseTime: item.responseTime ?? null,
        isAntiBot: false,
        hasProtection: Boolean(item.hasProtection),
        isMaintenance: Boolean(item.isMaintenance),
        maintenanceReason: item.maintenanceReason ?? null,
        isJsChallenge: false,
        jsChallengeIndicator: null,
        offlineSince: item.offlineSince ?? null,
      },
    };
  });
}

interface FeedPreviewItem {
  title: string;
  link: string;
  date: string;
}

/**
 * 极简 feed 解析：只取标题/链接/时间，足够在友链预览里展示最近文章。
 * 同时兼容 RSS / Atom / JSON Feed。
 */
function parseFeedPreview(content: string): FeedPreviewItem[] {
  const items: FeedPreviewItem[] = [];
  const clean = (value: string) => value.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim();

  try {
    const json = JSON.parse(content);
    const raw = Array.isArray(json.items) ? json.items : Array.isArray(json.entries) ? json.entries : null;
    if (raw) {
      for (const item of raw) {
        items.push({
          title: clean(String(item.title || '')),
          link: String(item.url || item.link || item.external_url || ''),
          date: String(item.date_published || item.published || item.updated || item.date || ''),
        });
      }
      return items;
    }
  } catch {
    // 非 JSON，继续按 XML 解析
  }

  if (typeof DOMParser === 'undefined') return items;

  const doc = new DOMParser().parseFromString(content, 'text/xml');
  if (doc.querySelector('rss')) {
    doc.querySelectorAll('item').forEach((item) => {
      const link = item.querySelector('link')?.textContent || '';
      items.push({
        title: clean(item.querySelector('title')?.textContent || ''),
        link: link.trim(),
        date: item.querySelector('pubDate')?.textContent || '',
      });
    });
    return items;
  }

  if (doc.querySelector('feed')) {
    doc.querySelectorAll('entry').forEach((entry) => {
      const link =
        entry.querySelector('link[rel="alternate"]')?.getAttribute('href') ||
        entry.querySelector('link')?.getAttribute('href') ||
        '';
      items.push({
        title: clean(entry.querySelector('title')?.textContent || ''),
        link,
        date: entry.querySelector('published')?.textContent || entry.querySelector('updated')?.textContent || '',
      });
    });
  }

  return items;
}

// 弹窗可能被反复打开；订阅内容在短时间内不会变化，缓存 5 分钟避免重复请求。
const FEED_PREVIEW_TTL = 5 * 60 * 1000;
const feedPreviewCache = new Map<string, { items: FeedPreviewItem[]; timestamp: number }>();

/** 将 feed 时间格式化为 YYYY.MM.DD，无法解析时返回空串 */
function formatFeedDate(value: string, locale: Locale): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

const statusColor: Record<string, string> = {
  online: '#22c55e',
  maintenance: '#eab308',
  offline: '#ef4444',
};



// Debug Panel Component
function DebugPanel({
  friends,
  onClose,
}: {
  friends: Friend[];
  onClose: () => void;
}) {
  const { t, locale } = useTranslation();
  const onlineCount = friends.filter((f) => f.status === 'online').length;
  const offlineCount = friends.filter((f) => f.status === 'offline').length;
  const maintenanceCount = friends.filter((f) => f.status === 'maintenance').length;
  const unknownCount = friends.filter((f) => !f.status).length;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
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
              {t.friends.debugPanelTitle}
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
                      {friend.status === 'online'
                      ? t.friends.online
                      : friend.status === 'maintenance'
                        ? t.friends.maintenance
                        : t.friends.offline}
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
                      {t.friends.httpFallback}
                    </span>
                  )}
                  {friend.checkInfo?.isMaintenance && (
                    <span
                      className="text-[10px] px-2 py-0.5 border-2 font-mono"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: '#eab308' }}
                    >
                      {t.friends.maintenanceStatus}
                    </span>
                  )}
                  {friend.checkInfo?.isJsChallenge && (
                    <span
                      className="text-[10px] px-2 py-0.5 border-2 font-mono"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: '#f97316' }}
                      title={friend.checkInfo.jsChallengeIndicator || undefined}
                    >
                      {t.friends.jsChallenge}{friend.checkInfo.jsChallengeIndicator ? ` (${friend.checkInfo.jsChallengeIndicator})` : ''}
                    </span>
                  )}
                  {friend.checkInfo?.isAntiBot && (
                    <span
                      className="text-[10px] px-2 py-0.5 border-2 font-mono"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: '#f97316' }}
                    >
                      {t.friends.antiBot}
                    </span>
                  )}
                  {friend.checkInfo?.hasProtection && (
                    <span
                      className="text-[10px] px-2 py-0.5 border-2 font-mono"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: '#06b6d4' }}
                    >
                      {t.friends.cdnProtection}
                    </span>
                  )}
                </div>
                <div className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
                  {friend.url}
                </div>
                {friend.checkInfo && (
                  <div className="text-xs mt-1 flex items-center gap-3 font-mono" style={{ color: 'var(--text-muted)' }}>
                    <span>{t.friends.checkTime}: {formatDate(friend.checkInfo.lastChecked)}</span>
                    <span>{t.friends.attempts}: {friend.checkInfo.attempts}</span>
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
                    <span className="font-bold">{t.friends.failReason}: </span>
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
  const animationEnabled = useAnimationEnabled();
  const { t, locale } = useTranslation();
  const description = getLocalizedText(friend.description, locale);
  const hasFeed = Boolean(friend.feed);

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: animationEnabled ? index * 0.04 : 0 }}
      className="h-full"
    >
      <button
        type="button"
        onClick={() => onClick(friend)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        aria-label={`${friend.name} — ${t.friends.open}`}
        className="group relative block w-full h-full text-left overflow-hidden transition-all duration-200 focus:outline-none"
        style={{
          background: isHovered ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
          border: '2px solid var(--border-subtle)',
          boxShadow: isHovered ? '5px 5px 0 var(--accent-primary)' : '4px 4px 0 var(--border-subtle)',
          transform: isHovered ? 'translate(-2px, -2px)' : 'none',
        }}
      >
        {/* Hover accent rail */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px] transition-opacity duration-200"
          style={{ background: 'var(--accent-primary)', opacity: isHovered ? 1 : 0 }}
        />

        {/* Index label */}
        <span
          aria-hidden
          className="absolute right-0 top-0 px-2 py-1 text-[10px] font-mono tabular-nums leading-none border-b-2 border-l-2"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)',
            color: isHovered ? 'var(--accent-primary)' : 'var(--text-muted)',
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="flex h-full flex-col p-4 sm:p-5 pr-12">
          <div className="flex items-start gap-3 sm:gap-4">
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 transition-colors sm:h-14 sm:w-14"
              style={{
                background: 'var(--bg-primary)',
                borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)',
              }}
            >
              <FriendIcon
                friend={friend}
                className="h-7 w-7 sm:h-8 sm:w-8"
                iconClassName="h-8 w-8 object-contain sm:h-9 sm:w-9"
              />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <h3
                className="truncate text-base font-bold sm:text-lg"
                style={{ color: 'var(--text-primary)' }}
                title={friend.name}
              >
                {friend.name}
              </h3>
              <p
                className="mt-1 truncate font-mono text-[11px] leading-none"
                style={{ color: 'var(--text-muted)' }}
                title={friend.url}
              >
                {getHostname(friend.url)}
              </p>
            </div>
          </div>

          <p
            className="mt-3 line-clamp-2 flex-1 text-xs leading-5 sm:text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            {description}
          </p>

          <div
            className="mt-3 flex items-center justify-between gap-2 border-t-2 pt-3"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {friend.status && (
                <span
                  className="flex flex-shrink-0 items-center gap-1 border-2 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase"
                  style={{
                    background: 'var(--bg-primary)',
                    borderColor: `${statusColor[friend.status]}60`,
                    color: statusColor[friend.status],
                  }}
                >
                  <span className="h-1 w-1" style={{ background: statusColor[friend.status] }} />
                  {friend.status === 'online'
                    ? t.friends.online
                    : friend.status === 'maintenance'
                      ? t.friends.maintenance
                      : t.friends.offline}
                </span>
              )}

              {hasFeed && (
                <span
                  className="flex flex-shrink-0 items-center gap-1 border-2 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase"
                  style={{
                    background: isHovered ? 'color-mix(in srgb, var(--accent-primary) 12%, var(--bg-primary))' : 'var(--bg-primary)',
                    borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    color: isHovered ? 'var(--accent-primary)' : 'var(--text-muted)',
                  }}
                  title={t.friends.subscribe}
                >
                  <Rss className="h-2.5 w-2.5" />
                  Feed
                </span>
              )}

              {friend.unidirectional && (
                <span
                  className="flex flex-shrink-0 border-2 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase"
                  style={{
                    background: 'var(--bg-primary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {t.friends.oneWay}
                </span>
              )}
            </div>

            <span
              className="inline-flex flex-shrink-0 items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider"
              style={{ color: isHovered ? 'var(--accent-primary)' : 'var(--text-muted)' }}
            >
              {t.friends.open}
              <ArrowUpRight className="h-3 w-3 transition-transform" style={{ transform: isHovered ? 'translate(1px, -1px)' : 'none' }} />
            </span>
          </div>
        </div>
      </button>
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
  const { t, locale } = useTranslation();
  const IconComponent = iconMap[category.icon] || Globe;
  const categoryName = getLocalizedText(category.name, locale);
  const categoryDescription = getLocalizedText(category.description, locale);
  const feedCount = friends.filter((friend) => friend.feed).length;

  return (
    <motion.section
      initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="mb-16"
    >
      <div
        className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b-2 pb-4"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center border-2"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
          >
            <IconComponent className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <h2
              className="text-xl font-bold uppercase sm:text-2xl"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
            >
              {categoryName}
            </h2>
            <p className="mt-0.5 font-mono text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
              {categoryDescription}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 border-2 px-2.5 py-1 font-mono text-[10px] font-bold uppercase"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <Users className="h-3 w-3" style={{ color: 'var(--accent-primary)' }} />
            {friends.length} {t.friends.friendSites}
          </span>
          {feedCount > 0 && (
            <span
              className="inline-flex items-center gap-1.5 border-2 px-2.5 py-1 font-mono text-[10px] font-bold uppercase"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              <Rss className="h-3 w-3" style={{ color: 'var(--accent-secondary)' }} />
              {feedCount} Feed
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {friends.map((friend, friendIndex) => (
          <FriendCard
            key={friend.id || friend.url}
            friend={friend}
            index={friendIndex}
            onClick={onClick}
          />
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
  statusMeta,
  onApplyClick,
  onRandomClick,
  onDebugClick,
  showDebug,
}: {
  title: string;
  description: string;
  stats: { friends: number; categories: number; online: number };
  lastUpdated?: string;
  statusMeta?: StatusMeta | null;
  onApplyClick: () => void;
  onRandomClick: () => void;
  onDebugClick: () => void;
  showDebug: boolean;
}) {
  const animationEnabled = useAnimationEnabled();
  const { t, locale } = useTranslation();

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
                {t.friends.title}
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
                {t.friends.apply}
              </button>

              <button
                onClick={onRandomClick}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold uppercase tracking-wider border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                  boxShadow: '4px 4px 0 var(--border-subtle)',
                }}
              >
                <Shuffle className="w-4 h-4" />
                {t.friends.randomVisit}
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
                {t.friends.debug}
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
                {t.friends.lastUpdated}:{' '}
                {new Date(lastUpdated).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}

            {statusMeta && (
              <div
                className="mt-2 inline-flex flex-wrap items-center gap-2 px-3 py-1.5 border-2 text-xs font-mono"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                <Wifi className="w-3 h-3" style={{ color: 'var(--accent-secondary)' }} />
                {t.friends.statusSource}: api.sakurain.net
                <span aria-hidden>·</span>
                {t.friends.apiInterval.replace('{hours}', String(statusMeta.intervalHours))}
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
              { icon: Users, value: stats.friends, label: t.friends.friendSites },
              { icon: FolderOpen, value: stats.categories, label: t.friends.categories },
              { icon: Wifi, value: stats.online, label: t.friends.onlineSites },
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

/** 底部独立一栏：把当前离线的站点集中列出，并标出离线时长。 */
const OfflineSection = memo(function OfflineSection({ friends }: { friends: Friend[] }) {
  const { locale, t, tReplace } = useTranslation();

  const offline = useMemo(() => {
    const stamp = (friend: Friend) => {
      const value = friend.checkInfo?.offlineSince;
      const parsed = value ? new Date(value).getTime() : Number.NaN;
      return Number.isFinite(parsed) ? parsed : 0;
    };
    // 离线越久排越前面；没有时间戳的排最后。
    return friends
      .filter((friend) => friend.status === 'offline')
      .sort((a, b) => {
        const sa = stamp(a);
        const sb = stamp(b);
        if (sa === sb) return 0;
        if (sa === 0) return 1;
        if (sb === 0) return -1;
        return sa - sb;
      });
  }, [friends]);

  if (offline.length === 0) return null;

  const formatStamp = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const durationLabel = (value?: string | null) => {
    const parsed = value ? new Date(value).getTime() : Number.NaN;
    if (!Number.isFinite(parsed)) return '—';
    const hours = Math.max(0, Math.floor((Date.now() - parsed) / 3_600_000));
    const days = Math.floor(hours / 24);
    const unit = days > 0 ? `${days} ${t.friends.dayUnit}` : hours > 0 ? `${hours} ${t.friends.hourUnit}` : t.friends.justNow;
    return tReplace(t.friends.offlineFor, { duration: unit });
  };

  return (
    <section className="mb-14 border-2" style={{ borderColor: 'var(--border-subtle)' }}>
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b-2 px-4 py-3 sm:px-5"
        style={{ background: 'color-mix(in srgb, var(--danger) 12%, var(--bg-primary))', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center border-2"
            style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
          >
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div>
            <h2
              className="text-base font-bold uppercase sm:text-lg"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
            >
              {t.friends.offlineSection}
            </h2>
            <p className="mt-0.5 text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
              {t.friends.offlineSectionHint}
            </p>
          </div>
        </div>
        <span
          className="border-2 px-2 py-1 font-mono text-xs font-bold"
          style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
        >
          {offline.length}
        </span>
      </div>

      <div>
        {offline.map((friend) => {
          const since = friend.checkInfo?.offlineSince;
          return (
            <div
              key={friend.id || friend.url}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b-2 px-4 py-3 last:border-b-0 sm:px-5"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <span
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center border-2 font-mono text-xs font-bold"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
              >
                {(friend.name || '?').slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <a
                  href={friend.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm font-bold hover:underline"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {friend.name}
                </a>
                <p className="truncate font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {getHostname(friend.url)}
                  {friend.checkInfo?.error ? ` · ${friend.checkInfo.error}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs font-bold" style={{ color: 'var(--danger)' }}>
                  {durationLabel(since)}
                </p>
                <p className="mt-0.5 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {t.friends.offlineLastOnline} {formatStamp(since)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});

// Apply Modal Component —— 左侧选申请形式，右侧直接是表单
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
  const { t, tReplace, locale } = useTranslation();
  const [pane, setPane] = useState<'create' | 'update' | 'mail'>('create');
  const [copied, setCopied] = useState(false);
  const [siteInfoCopied, setSiteInfoCopied] = useState(false);

  const siteInfo = useMemo(
    () => ({
      name: 'SAKURAIN TEAM',
      url: 'https://sakurain.net',
      icon: 'https://sakurain.net/favicon',
      rss: 'https://sakurain.net/feed',
      description: t.footer.builtWith,
    }),
    [t.footer.builtWith]
  );

  const emailTemplate = useMemo(
    () => tReplace(t.friends.applyEmailBody, siteInfo),
    [tReplace, t.friends.applyEmailBody, siteInfo]
  );

  useEffect(() => {
    if (isOpen) {
      setPane('create');
      setCopied(false);
      setSiteInfoCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // 弹窗打开时锁住页面滚动，滚轮只作用在弹窗内部
  useScrollLock(isOpen);

  if (!isOpen) return null;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contact);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  const handleCopySiteInfo = async () => {
    try {
      const siteInfoText = tReplace(t.friends.siteInfo.template, siteInfo);
      await navigator.clipboard.writeText(siteInfoText);
      setSiteInfoCopied(true);
      setTimeout(() => setSiteInfoCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy site info:', err);
    }
  };

  const handleOpenMailto = () => {
    const subject = t.friends.applyEmailSubject;
    const mailtoLink = `mailto:${contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailTemplate)}`;
    window.location.href = mailtoLink;
  };

  const zh = locale === 'zh';
  const panes = [
    { id: 'create' as const, label: zh ? '新增站点' : 'Add a site', hint: zh ? '还没在友链里' : 'Not listed yet', icon: Plus },
    { id: 'update' as const, label: zh ? '修改站点' : 'Update a site', hint: zh ? '已在友链里' : 'Already listed', icon: Pencil },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t.friends.apply}
    >
      <motion.div
        initial={animationEnabled ? { opacity: 0 } : undefined}
        animate={animationEnabled ? { opacity: 1 } : undefined}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.62)' }}
        onClick={onClose}
      />

      <motion.div
        initial={animationEnabled ? { opacity: 0, y: 24, scale: 0.98 } : undefined}
        animate={animationEnabled ? { opacity: 1, y: 0, scale: 1 } : undefined}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col border-2"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)',
          boxShadow: '8px 8px 0 var(--accent-primary)',
        }}
      >
        {/* Header */}
        <div
          className="flex flex-shrink-0 items-center justify-between gap-3 border-b-2 px-4 py-3 sm:px-5"
          style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center border-2"
              style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
            >
              <Mail className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3
                className="truncate text-base font-bold uppercase leading-tight"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
              >
                {t.friends.apply}
              </h3>
              <p className="truncate font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {t.friends.applySubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.friends.close}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center border-2 transition-colors hover:bg-[var(--bg-tertiary)]"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] md:grid-cols-[196px_minmax(0,1fr)] md:grid-rows-1">
          {/* Left: 申请形式 */}
          <aside
            className="flex gap-2 overflow-x-auto border-b-2 p-3 md:flex-col md:overflow-visible md:border-b-0 md:border-r-2"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-primary)' }}
          >
            {panes.map((item) => {
              const active = pane === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPane(item.id)}
                  className="flex min-w-[132px] flex-1 items-center gap-2.5 border-2 px-3 py-2.5 text-left transition-colors md:flex-none md:w-full"
                  style={{
                    background: active ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    color: active ? 'var(--bg-primary)' : 'var(--text-primary)',
                  }}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-tight">{item.label}</span>
                    <span
                      className="block font-mono text-[10px] uppercase leading-tight"
                      style={{ color: active ? 'var(--bg-primary)' : 'var(--text-muted)', opacity: active ? 0.75 : 1 }}
                    >
                      {item.hint}
                    </span>
                  </span>
                </button>
              );
            })}

            <span
              className="hidden border-t-2 md:my-1 md:block"
              style={{ borderColor: 'var(--border-subtle)' }}
            />

            <button
              type="button"
              onClick={() => setPane('mail')}
              className="flex min-w-[132px] flex-1 items-center gap-2.5 border-2 px-3 py-2.5 text-left transition-colors md:flex-none md:w-full"
              style={{
                background: pane === 'mail' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                borderColor: pane === 'mail' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                color: pane === 'mail' ? 'var(--bg-primary)' : 'var(--text-primary)',
              }}
            >
              <Send className="h-4 w-4 flex-shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-tight">{t.friends.emailApply}</span>
                <span className="block font-mono text-[10px] uppercase leading-tight" style={{ opacity: 0.75 }}>
                  mailto
                </span>
              </span>
            </button>
          </aside>

          {/* Right: 内容 */}
          <div
            key={pane}
            className="min-h-0 overflow-y-auto p-4 sm:p-6"
            data-scroll-lock-passthrough
            style={{ overscrollBehavior: 'contain' }}
          >
            {pane === 'mail' ? (
              <div className="space-y-4">
                <div
                  className="border-2 p-4"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-primary)' }}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-mono text-[11px] font-bold uppercase" style={{ color: 'var(--accent-primary)' }}>
                      {t.friends.ourInfo}
                    </p>
                    <button
                      onClick={handleCopySiteInfo}
                      className="border-2 px-2 py-1 text-[11px] font-bold uppercase transition-colors hover:opacity-80"
                      style={{
                        background: siteInfoCopied ? 'var(--success)' : 'var(--accent-primary)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--bg-primary)',
                      }}
                    >
                      {siteInfoCopied ? t.friends.copied : t.friends.copy}
                    </button>
                  </div>
                  <div className="space-y-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                    <p>
                      <span style={{ color: 'var(--text-muted)' }}>{t.friends.siteInfo.name}: </span>
                      {siteInfo.name}
                    </p>
                    <p>
                      <span style={{ color: 'var(--text-muted)' }}>{t.friends.siteInfo.url}: </span>
                      {siteInfo.url}
                    </p>
                    <p>
                      <span style={{ color: 'var(--text-muted)' }}>{t.friends.siteInfo.icon}: </span>
                      {siteInfo.icon}
                    </p>
                    <p>
                      <span style={{ color: 'var(--text-muted)' }}>{t.friends.siteInfo.rss}: </span>
                      {siteInfo.rss}
                    </p>
                  </div>
                </div>

                <div
                  className="border-2 p-4"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-primary)' }}
                >
                  <p className="mb-2 font-mono text-[11px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                    {t.friends.recipientEmail}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <code
                      className="flex-1 border-2 px-3 py-2 text-sm font-mono"
                      style={{
                        minWidth: '180px',
                        background: 'var(--bg-secondary)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      {contact}
                    </code>
                    <button
                      onClick={handleCopyEmail}
                      className="border-2 px-3 py-2 text-sm font-bold uppercase transition-colors hover:opacity-80"
                      style={{
                        background: copied ? 'var(--success)' : 'var(--accent-primary)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--bg-primary)',
                      }}
                    >
                      {copied ? t.friends.copied : t.friends.copy}
                    </button>
                    <button
                      onClick={handleOpenMailto}
                      className="inline-flex items-center gap-2 border-2 px-3 py-2 text-sm font-bold uppercase transition-colors hover:bg-[var(--bg-tertiary)]"
                      style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
                    >
                      <Send className="h-4 w-4" />
                      {t.friends.emailApply}
                    </button>
                  </div>
                </div>

                <div
                  className="border-2 p-4"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-primary)' }}
                >
                  <p className="font-mono text-[11px] font-bold uppercase" style={{ color: 'var(--text-primary)' }}>
                    {t.friends.importantNotice}
                  </p>
                  <p className="mt-1 text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
                    {t.friends.applyNotice}
                  </p>
                </div>
              </div>
            ) : (
              <FriendApplyForm mode={pane} embedded onSuccess={() => undefined} />
            )}
          </div>
        </div>
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
  const { t, locale } = useTranslation();
  const applyTitle = getLocalizedText(applyInfo.title, locale);
  const applyDescription = getLocalizedText(applyInfo.description, locale);
  const applyRequirements = applyInfo.requirements.map((req) => getLocalizedText(req, locale));

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
                {applyTitle}
              </h2>
            </div>
            <p className="mb-5 text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
              {applyDescription}
            </p>
            <ul className="space-y-2">
              {applyRequirements.map((req, index) => (
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
            {t.friends.apply}
          </button>
        </div>
      </div>
    </motion.section>
  );
});

// Friend Preview Modal — 左侧站点信息，右侧最近订阅文章
const FriendDetailModal = memo(function FriendDetailModal({
  friend,
  onClose,
}: {
  friend: Friend;
  onClose: () => void;
}) {
  const animationEnabled = useAnimationEnabled();
  const { t, locale } = useTranslation();
  const [feedState, setFeedState] = useState<{
    status: 'idle' | 'loading' | 'ready' | 'error';
    items: FeedPreviewItem[];
  }>({ status: friend.feed ? 'loading' : 'idle', items: [] });

  const description = getLocalizedText(friend.description, locale);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // 弹窗打开时锁住页面滚动，滚轮只能滚弹窗内部
  useScrollLock(true);

  useEffect(() => {
    if (!friend.feed) {
      setFeedState({ status: 'idle', items: [] });
      return;
    }

    const feedUrl = friend.feed;
    const cached = feedPreviewCache.get(feedUrl);
    if (cached && Date.now() - cached.timestamp < FEED_PREVIEW_TTL) {
      setFeedState({ status: 'ready', items: cached.items });
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setFeedState({ status: 'loading', items: [] });

    const timeout = setTimeout(() => controller.abort(), 12000);

    fetch(`/api/feed/get?url=${encodeURIComponent(feedUrl)}`, {
      signal: controller.signal,
      headers: {
        Accept:
          'application/rss+xml, application/atom+xml, application/xml, text/xml, application/json, */*',
      },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((content) => {
        if (cancelled) return;
        const items = parseFeedPreview(content).slice(0, 5);
        feedPreviewCache.set(feedUrl, { items, timestamp: Date.now() });
        setFeedState({ status: 'ready', items });
      })
      .catch((error: Error) => {
        if (cancelled || error.name === 'AbortError') return;
        setFeedState({ status: 'error', items: [] });
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [friend.feed]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="friend-preview-title"
    >
      <motion.div
        initial={animationEnabled ? { opacity: 0 } : undefined}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.62)' }}
        onClick={onClose}
      />

      <motion.div
        initial={animationEnabled ? { opacity: 0, y: 24, scale: 0.98 } : undefined}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className="relative flex max-h-[88vh] w-full max-w-4xl flex-col border-2"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)',
          boxShadow: '8px 8px 0 var(--accent-primary)',
        }}
      >
        {/* Header */}
        <div
          className="flex flex-shrink-0 items-center justify-between gap-3 border-b-2 px-4 py-2.5 sm:px-5"
          style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-2 w-2 flex-shrink-0" style={{ background: 'var(--accent-primary)' }} />
            <span
              className="truncate font-mono text-[11px] uppercase tracking-[0.18em]"
              style={{ color: 'var(--text-muted)' }}
            >
              {getHostname(friend.url)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.friends.close}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center border-2 transition-colors hover:bg-[var(--bg-tertiary)]"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
          data-scroll-lock-passthrough
          style={{ overscrollBehavior: 'contain' }}
        >
          {/* Left: site info */}
          <div
            className="border-b-2 p-5 sm:p-6 md:border-b-0 md:border-r-2"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-16 w-16 flex-shrink-0 items-center justify-center border-2"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border-subtle)',
                  boxShadow: '3px 3px 0 var(--border-subtle)',
                }}
              >
                <FriendIcon
                  friend={friend}
                  className="h-8 w-8"
                  iconClassName="h-10 w-10 object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  id="friend-preview-title"
                  className="text-xl font-bold uppercase leading-tight sm:text-2xl"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
                >
                  {friend.name}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {friend.status && (
                    <span
                      className="flex items-center gap-1 border-2 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase"
                      style={{
                        background: 'var(--bg-primary)',
                        borderColor: `${statusColor[friend.status]}60`,
                        color: statusColor[friend.status],
                      }}
                    >
                      <span className="h-1 w-1" style={{ background: statusColor[friend.status] }} />
                      {friend.status === 'online'
                        ? t.friends.online
                        : friend.status === 'maintenance'
                          ? t.friends.maintenance
                          : t.friends.offline}
                    </span>
                  )}
                  {friend.feed && (
                    <span
                      className="flex items-center gap-1 border-2 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase"
                      style={{
                        background: 'var(--bg-primary)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--accent-secondary)',
                      }}
                    >
                      <Rss className="h-2.5 w-2.5" />
                      Feed
                    </span>
                  )}
                  {friend.unidirectional && (
                    <span
                      className="border-2 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase"
                      style={{
                        background: 'var(--bg-primary)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {t.friends.oneWay}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p
              className="mt-4 text-sm leading-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              {description}
            </p>

            <dl
              className="mt-5 divide-y-2 border-2"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-primary)' }}
            >
              <div className="flex items-baseline gap-3 px-3 py-2">
                <dt
                  className="w-16 flex-shrink-0 font-mono text-[10px] uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {t.friends.siteInfo.url}
                </dt>
                <dd className="min-w-0 flex-1 truncate font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
                  <a
                    href={friend.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    {getHostname(friend.url)}
                  </a>
                </dd>
              </div>
              {friend.feed && (
                <div className="flex items-baseline gap-3 px-3 py-2">
                  <dt
                    className="w-16 flex-shrink-0 font-mono text-[10px] uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {t.friends.siteInfo.rss}
                  </dt>
                  <dd className="min-w-0 flex-1 truncate font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {friend.feed.replace(/^https?:\/\//, '')}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-5 flex flex-col gap-2">
              <a
                href={friend.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border-2 px-4 py-2.5 text-sm font-bold uppercase tracking-wider transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{
                  background: 'var(--accent-primary)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--bg-primary)',
                  boxShadow: '4px 4px 0 var(--border-subtle)',
                }}
              >
                <ExternalLink className="h-4 w-4" />
                {t.friends.visitNow}
              </a>
              {friend.feed && (
                <a
                  href={friend.feed}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border-2 px-4 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors hover:bg-[var(--bg-tertiary)]"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Rss className="h-4 w-4" />
                  {t.friends.subscribe}
                </a>
              )}
            </div>

            <p
              className="mt-4 flex items-start gap-1.5 font-mono text-[10px] leading-4"
              style={{ color: 'var(--text-muted)' }}
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
              {t.friends.externalWarning}
            </p>
          </div>

          {/* Right: recent feed posts */}
          <div className="flex min-h-0 flex-col p-5 sm:p-6" style={{ background: 'var(--bg-primary)' }}>
            <div
              className="mb-3 flex items-center justify-between gap-3 border-b-2 pb-2.5"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <h4
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
              >
                <Rss className="h-4 w-4" style={{ color: 'var(--accent-secondary)' }} />
                {t.friends.recentPosts}
              </h4>
              {feedState.status === 'ready' && feedState.items.length > 0 && (
                <span className="font-mono text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
                  {feedState.items.length} / 5
                </span>
              )}
            </div>

            {feedState.status === 'loading' && (
              <div className="space-y-3 py-1" aria-hidden>
                {[0, 1, 2, 3, 4].map((row) => (
                  <div key={row} className="flex items-start gap-3">
                    <span
                      className="mt-1 h-3 w-4 animate-pulse"
                      style={{ background: 'var(--bg-tertiary)' }}
                    />
                    <div className="flex-1 space-y-2">
                      <div
                        className="h-3 w-full animate-pulse"
                        style={{ background: 'var(--bg-tertiary)', animationDelay: `${row * 80}ms` }}
                      />
                      <div
                        className="h-2 w-16 animate-pulse"
                        style={{ background: 'var(--bg-tertiary)', animationDelay: `${row * 80}ms` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="pt-2 font-mono text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
                  {t.friends.feedLoading}
                </p>
              </div>
            )}

            {feedState.status === 'idle' && (
              <div
                className="flex flex-1 flex-col items-center justify-center gap-3 border-2 border-dashed px-4 py-10 text-center"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <Rss className="h-6 w-6" style={{ color: 'var(--text-muted)' }} />
                <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  {t.friends.noFeed}
                </p>
              </div>
            )}

            {feedState.status === 'error' && (
              <div
                className="flex flex-1 flex-col items-center justify-center gap-3 border-2 border-dashed px-4 py-10 text-center"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <AlertCircle className="h-6 w-6" style={{ color: 'var(--accent-secondary)' }} />
                <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  {t.friends.feedError}
                </p>
                <a
                  href={friend.feed}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 border-2 px-3 py-1.5 font-mono text-[10px] font-bold uppercase transition-colors hover:bg-[var(--bg-secondary)]"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                >
                  {t.friends.subscribe}
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            )}

            {feedState.status === 'ready' && feedState.items.length === 0 && (
              <div
                className="flex flex-1 flex-col items-center justify-center gap-3 border-2 border-dashed px-4 py-10 text-center"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <FileText className="h-6 w-6" style={{ color: 'var(--text-muted)' }} />
                <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  {t.friends.feedEmpty}
                </p>
              </div>
            )}

            {feedState.status === 'ready' && feedState.items.length > 0 && (
              <ul className="min-h-0 flex-1">
                {feedState.items.map((item, itemIndex) => (
                  <li key={`${item.link}-${itemIndex}`}>
                    <a
                      href={item.link || friend.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 border-b-2 px-2 py-3 transition-colors last:border-b-0 hover:bg-[var(--bg-secondary)]"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <span
                        className="mt-1 flex-shrink-0 font-mono text-[10px] tabular-nums"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {String(itemIndex + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="line-clamp-2 text-sm font-medium leading-6"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {item.title || t.feed.untitled}
                        </span>
                        {formatFeedDate(item.date, locale) && (
                          <span
                            className="mt-1 block font-mono text-[10px] tabular-nums"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {formatFeedDate(item.date, locale)}
                          </span>
                        )}
                      </span>
                      <ArrowUpRight
                        className="mt-1 h-4 w-4 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ color: 'var(--accent-primary)' }}
                      />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [mailtoModalOpen, setMailtoModalOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [statusMeta, setStatusMeta] = useState<StatusMeta | null>(null);
  const { t, locale } = useTranslation();

  const handleFriendClick = useCallback((friend: Friend) => {
    setSelectedFriend(friend);
  }, []);

  const handleRandomVisit = useCallback(() => {
    if (!data) return;
    const online = data.friends.filter((f) => f.status === 'online');
    const pool = online.length > 0 ? online : data.friends;
    if (pool.length === 0) return;
    const randomFriend = pool[Math.floor(Math.random() * pool.length)];
    setSelectedFriend(randomFriend);
  }, [data]);

  const handleCloseFriend = useCallback(() => {
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
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      }),
      fetch('/data/site-data.json').then((res) => res.json()),
      fetch('/config/friends.json')
        .then((res) => (res.ok ? (res.json() as Promise<FriendsConfig>) : null))
        .catch(() => null),
    ])
      .then(async ([staticData, siteData, config]: [FriendsData, SiteData, FriendsConfig | null]) => {
        setFooterData(siteData.footer);

        // 友链清单以后台 api.sakurain.net/admin 为源，拉不到再用构建时的静态副本。
        const remote = await loadFriendsDocument(config);
        const friendsData = remote ?? staticData;
        setData(friendsData);
        setLoading(false);

        if (remote) {
          // 接口已经把检测状态合并进清单，不需要再单独请求一次。
          setStatusMeta({
            updatedAt: remote.lastUpdated,
            intervalHours: remote.intervalHours ?? 3,
          });
          return;
        }

        // 回退路径：静态清单 + 每 3 小时一轮的状态接口。
        void loadFriendStatuses(config).then((result) => {
          if (!result) return;
          setStatusMeta(result.meta);
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  friends: applyStatuses(prev.friends, result.items),
                  lastUpdated: result.meta.updatedAt ?? prev.lastUpdated,
                }
              : prev
          );
        });
      })
      .catch(() => {
        setError(t.friends.loadFailed);
        setLoading(false);
      });
  }, [t.friends.loadFailed]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const friendsByCategory = useMemo(() => {
    if (!data) return [];
    return data.categories
      .map((category) => ({
        category,
        // 离线的站点收进底部独立一栏，不再混在分类里
        friends: data.friends.filter(
          (friend) => friend.category === category.id && friend.status !== 'offline'
        ),
      }))
      .filter((item) => item.friends.length > 0);
  }, [data]);

  const stats = useMemo(() => {
    if (!data) return { friends: 0, categories: 0, online: 0 };
    const activeCategories = new Set(data.friends.map((f) => f.category));
    return {
      friends: data.friends.length,
      categories: data.categories.filter((c) => activeCategories.has(c.id)).length,
      online: data.friends.filter((f) => f.status === 'online').length,
    };
  }, [data]);

  if (loading) {
    return <RouteLoader />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="text-center p-8 border-2"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-subtle)',
            boxShadow: '4px 4px 0 var(--border-subtle)',
          }}
        >
          <p className="mb-4 font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
            {error || t.friends.loadFailed}
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
            {t.common.retry}
          </button>
        </div>
      </div>
    );
  }

  const localizedTitle = getLocalizedText(data.title, locale);
  const localizedDescription = getLocalizedText(data.description, locale);
  const localizedApplyInfo: ApplyInfo = {
    ...data.applyInfo,
    title: getLocalizedText(data.applyInfo.title, locale),
    description: getLocalizedText(data.applyInfo.description, locale),
    requirements: data.applyInfo.requirements.map((req) => getLocalizedText(req, locale)),
  };

  return (
    <div className="relative min-h-screen">
      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <HeroSection
          title={localizedTitle}
          description={localizedDescription}
          stats={stats}
          lastUpdated={data.lastUpdated}
          statusMeta={statusMeta}
          onApplyClick={handleApplyClick}
          onRandomClick={handleRandomVisit}
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

          {/* 底部独立一栏：当前离线的站点与离线时长 */}
          <OfflineSection friends={data.friends} />

          {/* Apply Section */}
          <ApplySection applyInfo={localizedApplyInfo} onApplyClick={handleApplyClick} />
        </div>
      </main>

      {/* Footer */}
      {footerData && <Footer data={footerData} />}

      <AnimatePresence>
        {selectedFriend && <FriendDetailModal friend={selectedFriend} onClose={handleCloseFriend} />}
      </AnimatePresence>

      {data && <ApplyModal isOpen={mailtoModalOpen} onClose={handleCloseMailtoModal} contact={data.applyInfo.contact} />}
    </div>
  );
}
