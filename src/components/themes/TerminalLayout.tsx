/**
 * TerminalLayout — IDE-style shell for the "terminal" style preset.
 *
 * Replaces the default top navigation with a VSCode-like workspace:
 * title bar, file explorer sidebar, editor tab, scrollable main area,
 * and a status bar. Keeps the page children (the actual content) intact.
 */

'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  BookOpen,
  Briefcase,
  Heart,
  Rss,
  Globe,
  User,
  FileText,
  MessageCircle,
  Zap,
  Gamepad2,
  Terminal,
  Sun,
  Moon,
  Music,
  Menu,
  X,
  ChevronRight,
  Folder,
  GitBranch,
  Radio,
  Layout,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { deploymentConfig } from '@/config/deployment-config';
import type { SiteData } from '@/types';
import type { StylePresetId } from '@/config/style-presets';

interface TerminalLayoutProps {
  children: React.ReactNode;
  siteData: SiteData | null;
  theme: 'light' | 'dark';
  onThemeToggle: (event?: React.MouseEvent<HTMLElement>) => void;
  preset: StylePresetId;
  onPresetChange: (id: StylePresetId) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  BookOpen,
  FileText,
  Heart,
  Rss,
  Globe,
  User,
  Briefcase,
  Gamepad2,
  Terminal,
  MessageCircle,
  Zap,
};

/**
 * Map well-known routes to file names shown in the tab bar and explorer.
 */
function routeToFileName(pathname: string): string {
  const map: Record<string, string> = {
    '/': 'home.md',
    '/blog': 'blog/index.md',
    '/projects': 'projects.tsx',
    '/friends': 'friends.json',
    '/friends-circle': 'friends-circle.tsx',
    '/earth-online': 'earth-online.tsx',
    '/about': 'about.md',
    '/docs': 'docs/README.md',
    '/shuoshuo': 'shuoshuo.md',
    '/notes': 'shuoshuo.md',
    '/studio': 'studio.tsx',
    '/algo-viz': 'algo-viz.tsx',
  };

  if (map[pathname]) return map[pathname];
  if (pathname.startsWith('/blog/')) return `blog/${pathname.slice(6)}.md`;
  if (pathname.startsWith('/docs/')) return `docs/${pathname.slice(6)}.md`;
  if (pathname.startsWith('/shuoshuo/')) return `shuoshuo/${pathname.slice(10)}.md`;
  if (pathname.startsWith('/notes/')) return `shuoshuo/${pathname.slice(7)}.md`;
  return `${pathname.replace(/^\//, '') || 'unknown'}.md`;
}

function routeToLabel(pathname: string): string {
  const map: Record<string, string> = {
    '/': '首页',
    '/blog': '博客',
    '/projects': '项目',
    '/friends': '友链',
    '/friends-circle': '朋友圈',
    '/earth-online': '地球Online',
    '/about': '关于',
    '/docs': '技术文档',
    '/shuoshuo': '说说',
    '/notes': '说说',
    '/studio': '工作室',
    '/algo-viz': '算法可视化',
  };
  return map[pathname] || pathname;
}

const WindowControls = memo(function WindowControls() {
  return (
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
      <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
      <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
    </div>
  );
});

interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

interface SidebarProps {
  items: NavItem[];
  currentPath: string;
  onNavigate: (href: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function TerminalSidebar({
  items,
  currentPath,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const allItems = useMemo<NavItem[]>(() => {
    const extras: NavItem[] = [
      { label: '技术文档', href: '/docs', icon: 'FileText' },
      { label: '说说', href: '/shuoshuo', icon: 'MessageCircle' },
      { label: '算法可视化', href: '/algo-viz', icon: 'Zap' },
    ];
    const base = items.length ? items : [];
    const seen = new Set(base.map((i) => i.href));
    return [...base, ...extras.filter((e) => !seen.has(e.href))];
  }, [items]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        <div className="px-4 py-3 text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
          <Folder className="w-4 h-4" />
          Explorer
        </div>
        <nav className="flex-1 overflow-auto py-2">
          {allItems.map((item) => {
            const Icon = item.icon ? ICON_MAP[item.icon] : FileText;
            const active = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
            const fileName = routeToFileName(item.href);
            return (
              <button
                key={item.href}
                onClick={() => onNavigate(item.href)}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-2 text-sm font-mono text-left transition-colors',
                  active
                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                )}
              >
                {Icon ? <Icon className="w-4 h-4 shrink-0" /> : <FileText className="w-4 h-4 shrink-0" />}
                <span className="truncate">{fileName}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onCloseMobile}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Explorer
              </span>
              <button onClick={onCloseMobile} className="p-1 hover:text-[var(--accent-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-auto py-2">
              {allItems.map((item) => {
                const Icon = item.icon ? ICON_MAP[item.icon] : FileText;
                const active = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      onNavigate(item.href);
                      onCloseMobile();
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-4 py-3 text-sm font-mono text-left transition-colors',
                      active
                        ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                    )}
                  >
                    {Icon ? <Icon className="w-4 h-4 shrink-0" /> : <FileText className="w-4 h-4 shrink-0" />}
                    <span className="truncate">{routeToFileName(item.href)}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}

interface StatusBarProps {
  currentPath: string;
  theme: 'light' | 'dark';
  onThemeToggle: (event?: React.MouseEvent<HTMLElement>) => void;
  preset: StylePresetId;
  onPresetChange: (id: StylePresetId) => void;
}

function TerminalStatusBar({
  currentPath,
  theme,
  onThemeToggle,
  preset,
  onPresetChange,
}: StatusBarProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const nextPreset: StylePresetId = preset === 'default' ? 'terminal' : 'default';

  return (
    <footer className="h-8 flex items-center justify-between px-3 text-xs font-mono border-t border-[var(--border-subtle)] bg-[var(--accent-primary)]/5 text-[var(--text-secondary)]">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5" />
          main
        </span>
        <span className="hidden sm:inline-flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5" />
          {routeToFileName(currentPath)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onPresetChange(nextPreset)}
          className="flex items-center gap-1.5 hover:text-[var(--accent-primary)] transition-colors"
          title="Switch style preset"
        >
          {preset === 'default' ? <Layout className="w-3.5 h-3.5" /> : <Terminal className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{preset === 'default' ? 'Default' : 'Terminal'}</span>
        </button>

        <button
          onClick={onThemeToggle}
          className="flex items-center gap-1.5 hover:text-[var(--accent-primary)] transition-colors"
          title="Toggle color theme"
        >
          {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>

        <span className="hidden sm:inline-flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5" />
          Player
        </span>

        <span className="text-[var(--text-muted)]">{time}</span>
      </div>
    </footer>
  );
}

export function TerminalLayout({
  children,
  siteData,
  theme,
  onThemeToggle,
  preset,
  onPresetChange,
}: TerminalLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (href: string) => {
    if (deploymentConfig.useWindowLocation) {
      window.location.href = href;
    } else {
      router.push(href);
    }
  };

  const navItems = siteData?.navigation?.links ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono terminal-scanlines terminal-screen-glow">
      {/* Title bar */}
      <header className="h-10 flex items-center justify-between px-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] select-none">
        <div className="flex items-center gap-3">
          <WindowControls />
          <button
            className="md:hidden p-1 hover:text-[var(--accent-primary)]"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="text-sm font-mono text-[var(--text-secondary)] hidden sm:inline">
            sakurain — {routeToLabel(pathname)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
          <span className="hidden sm:inline">UTF-8</span>
          <span className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            zsh
          </span>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        <TerminalSidebar
          items={navItems}
          currentPath={pathname}
          onNavigate={handleNavigate}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-[var(--bg-primary)]">
          {/* Editor tab */}
          <div className="h-9 flex items-center border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 px-3 h-full bg-[var(--bg-primary)] border-r border-[var(--border-subtle)] text-sm font-mono text-[var(--text-primary)]">
              <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>{routeToFileName(pathname)}</span>
              <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
            </div>
          </div>

          {/* Page content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>

      <TerminalStatusBar
        currentPath={pathname}
        theme={theme}
        onThemeToggle={onThemeToggle}
        preset={preset}
        onPresetChange={onPresetChange}
      />
    </div>
  );
}
