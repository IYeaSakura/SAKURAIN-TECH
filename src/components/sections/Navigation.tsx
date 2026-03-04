import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Heart, MessageCircle, Sun, Moon, Home, FileText, User, Rss, Globe, Briefcase, Wrench, Gamepad2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import type { SiteData } from '@/types';
import { preloadDocs, preloadFriends, preloadBlog, preloadEarthOnline } from '@/main';
import { deploymentConfig } from '@/config/deployment-config';
import type { LucideIcon } from 'lucide-react';

type Theme = 'light' | 'dark';

interface NavigationProps {
  data: SiteData['navigation'];
  theme: Theme;
  onThemeToggle: (event: React.MouseEvent<HTMLElement>) => void;
  isThemeTransitioning?: boolean;
  sticky?: boolean;
}

const dockItems = [
  { label: '首页', href: '/', icon: Home },
  { label: '博客', href: '/blog', icon: FileText },
  { label: '地球Online', href: '/earth-online', icon: Gamepad2 },
  { label: '朋友圈', href: '/friends-circle', icon: Rss },
  { label: '友链', href: '/friends', icon: Heart },
  { label: '关于', href: '/about', icon: User, isCustom: true },
];

export function Navigation({ data, theme, onThemeToggle, isThemeTransitioning, sticky = true }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    if (deploymentConfig.useWindowLocation) {
      window.location.href = href;
    } else {
      navigate(href);
    }
  };

  const handleDocsClick = () => {
    preloadDocs();
    if (deploymentConfig.useWindowLocation) {
      window.location.href = '/docs';
    } else {
      navigate('/docs');
    }
  };

  const handleFriendsClick = () => {
    preloadFriends();
    if (deploymentConfig.useWindowLocation) {
      window.location.href = '/friends';
    } else {
      navigate('/friends');
    }
  };

  const handleBlogClick = () => {
    preloadBlog();
    if (deploymentConfig.useWindowLocation) {
      window.location.href = '/blog';
    } else {
      navigate('/blog');
    }
  };

  const handleNotesClick = () => {
    if (deploymentConfig.useWindowLocation) {
      window.location.href = '/notes';
    } else {
      navigate('/notes');
    }
  };

  const handleEarthOnlineClick = () => {
    preloadEarthOnline();
    if (deploymentConfig.useWindowLocation) {
      window.location.href = '/earth-online';
    } else {
      navigate('/earth-online');
    }
  };

  const getIcon = (iconName?: string): LucideIcon | null => {
    switch (iconName) {
      case 'Home': return Home;
      case 'BookOpen': return BookOpen;
      case 'MessageCircle': return MessageCircle;
      case 'Heart': return Heart;
      case 'FileText': return FileText;
      case 'User': return User;
      case 'Rss': return Rss;
      case 'Globe': return Globe;
      case 'Briefcase': return Briefcase;
      case 'Wrench': return Wrench;
      default: return null;
    }
  };

  // 判断是否为当前激活路径
  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  // 处理 Dock 导航点击
  const handleDockClick = (href: string) => {
    if (href === '/docs') {
      handleDocsClick();
    } else if (href === '/blog') {
      handleBlogClick();
    } else if (href === '/notes') {
      handleNotesClick();
    } else if (href === '/friends') {
      handleFriendsClick();
    } else if (href === '/earth-online') {
      handleEarthOnlineClick();
    } else {
      handleNavClick(href);
    }
  };

  return (
    <>
      {/* 桌面端顶部导航 */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          sticky ? 'fixed top-0 left-0 right-0 z-50' : 'relative',
          'transition-all duration-300 overflow-hidden',
          isScrolled ? 'mc-navbar' : 'bg-transparent'
        )}
        style={{ pointerEvents: 'auto' }}
      >
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
            <motion.button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <img
                src="/image/logo.webp"
                alt="SAKURAIN"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
              <span
                className="font-pixel text-lg sm:text-2xl lg:text-3xl truncate max-w-[120px] sm:max-w-none"
                style={{
                  color: 'var(--text-primary)',
                  textShadow: '2px 2px 0 color-mix(in srgb, var(--bg-secondary) 50%, black)',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                {data.logo}
              </span>
            </motion.button>

            {/* 桌面端导航链接 */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              {data?.links?.map((link) => {
                const Icon = getIcon(link.icon);
                const handleClick = () => {
                  if (link.href === '/docs') handleDocsClick();
                  else if (link.href === '/blog') handleBlogClick();
                  else if (link.href === '/notes') handleNotesClick();
                  else if (link.href === '/friends') handleFriendsClick();
                  else handleNavClick(link.href);
                };
                return (
                  <button
                    key={link.href}
                    onClick={handleClick}
                    className="mc-nav-link flex items-center gap-1"
                    style={{
                      fontFamily: 'var(--font-primary)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {link.label}
                  </button>
                );
              })}
            </div>

            {/* 桌面端主题切换按钮 */}
            <div className="hidden md:flex items-center gap-4 flex-shrink-0">
              <button
                onClick={onThemeToggle}
                disabled={isThemeTransitioning}
                className="relative p-2.5 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)'
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={theme}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </motion.div>
                </AnimatePresence>
                <span
                  className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2"
                  style={{
                    background: theme === 'light' ? '#f59e0b' : '#6366f1',
                    borderColor: 'var(--bg-primary)'
                  }}
                />
              </button>
            </div>

            {/* 移动端顶部按钮（仅主题切换，移除菜单按钮） */}
            <div className="flex items-center gap-1 sm:gap-2 md:hidden flex-shrink-0">
              <button
                onClick={onThemeToggle}
                disabled={isThemeTransitioning}
                className="relative p-2 rounded-lg sm:p-2.5 sm:rounded-xl transition-all duration-300 hover:scale-110 active:scale-95"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)'
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={theme}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {theme === 'light' ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* 移动端底部 Dock 导航栏 - iOS 风格 */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      >
        {/* Dock 容器 - iOS 风格 */}
        <div
          className="flex items-center justify-center gap-1 px-2 py-1.5 pb-[env(safe-area-inset-bottom,8px)]"
          style={{
            background: theme === 'dark'
              ? 'rgba(30, 30, 30, 0.9)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: theme === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: theme === 'dark'
              ? '0 -4px 20px rgba(0, 0, 0, 0.4)'
              : '0 -4px 20px rgba(0, 0, 0, 0.15)',
          }}
        >
          {dockItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const isCustomIcon = (item as any).isCustom;

            return (
              <button
                key={item.href}
                onClick={() => handleDockClick(item.href)}
                className="relative flex flex-col items-center justify-center flex-1 max-w-[72px] py-2 px-1 rounded-2xl transition-all duration-150 active:scale-95"
                style={{
                  background: 'transparent',
                }}
              >
                {/* 图标容器 */}
                <div
                  className="relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-150"
                  style={{
                    background: 'transparent',
                  }}
                >
                  {isCustomIcon ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5 transition-all duration-150"
                    >
                      <path
                        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                        strokeWidth="2"
                        style={{
                          stroke: active
                            ? (theme === 'dark' ? 'var(--accent-primary)' : '#0E639C')
                            : 'var(--text-secondary)',
                        }}
                      />
                      <circle
                        cx="12"
                        cy="7"
                        r="4"
                        strokeWidth="2"
                        style={{
                          stroke: active
                            ? (theme === 'dark' ? 'var(--accent-primary)' : '#0E639C')
                            : 'var(--text-secondary)',
                        }}
                      />
                    </svg>
                  ) : (
                    <Icon
                      className="w-5 h-5 transition-all duration-150"
                      style={{
                        color: active
                          ? (theme === 'dark' ? 'var(--accent-primary)' : '#0E639C')
                          : 'var(--text-secondary)',
                        stroke: active
                          ? (theme === 'dark' ? 'var(--accent-primary)' : '#0E639C')
                          : 'var(--text-secondary)',
                      }}
                      strokeWidth={2}
                      fill="none"
                      fillOpacity={0}
                    />
                  )}
                </div>

                {/* 标签文字 */}
                <span
                  className="text-[10px] font-medium mt-1 transition-colors duration-150"
                  style={{
                    color: active
                      ? (theme === 'dark' ? 'var(--accent-primary)' : '#0E639C')
                      : 'var(--text-muted)',
                    fontFamily: 'var(--font-primary)',
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* 移动端底部安全区域填充 - 配合贴底Dock */}
      <div className="md:hidden h-[calc(64px+env(safe-area-inset-bottom,8px))]" />
    </>
  );
}
