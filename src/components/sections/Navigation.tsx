import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Heart, MessageCircle, Sun, Moon, Home, FileText, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import type { SiteData } from '@/types';
import { preloadDocs, preloadFriends, preloadBlog } from '@/main';
import { deploymentConfig } from '@/config/deployment-config';
import type { LucideIcon } from 'lucide-react';

type Theme = 'light' | 'dark';

interface NavigationProps {
  data: SiteData['navigation'];
  theme: Theme;
  onThemeToggle: (event: React.MouseEvent<HTMLElement>) => void;
  isThemeTransitioning?: boolean;
}

// 移动端 Dock 导航项配置
const dockItems = [
  { label: '首页', href: '/', icon: Home },
  { label: '文档', href: '/docs', icon: BookOpen },
  { label: '博客', href: '/blog', icon: FileText },
  { label: '笔记', href: '/notes', icon: MessageCircle },
  { label: '友链', href: '/friends', icon: Heart },
  { label: '关于', href: '/about', icon: User },
];

export function Navigation({ data, theme, onThemeToggle, isThemeTransitioning }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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

  const getIcon = (iconName?: string): LucideIcon | null => {
    switch (iconName) {
      case 'Home': return Home;
      case 'BookOpen': return BookOpen;
      case 'MessageCircle': return MessageCircle;
      case 'Heart': return Heart;
      case 'FileText': return FileText;
      case 'User': return User;
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
    } else {
      handleNavClick(href);
    }
  };

  // 计算相邻项目的缩放效果（macOS Dock 风格）
  const getItemScale = (index: number) => {
    if (hoveredIndex === null) return 1;
    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) return 1.3;
    if (distance === 1) return 1.15;
    if (distance === 2) return 1.05;
    return 1;
  };

  return (
    <>
      {/* 桌面端顶部导航 */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 overflow-hidden',
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
              {data.links.map((link) => {
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

      {/* 移动端底部 Dock 导航栏 - macOS 风格 */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Dock 容器 - 悬浮胶囊设计 */}
        <div
          className="flex items-center gap-1 px-3 py-3 rounded-3xl"
          style={{
            background: 'rgba(var(--bg-card-rgb, 15, 23, 42), 0.75)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          {dockItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const scale = getItemScale(index);
            
            return (
              <motion.button
                key={item.href}
                onClick={() => handleDockClick(item.href)}
                onMouseEnter={() => setHoveredIndex(index)}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: scale,
                }}
                transition={{ 
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  delay: index * 0.05 
                }}
                className="relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-colors duration-200"
                style={{
                  background: active 
                    ? 'rgba(var(--accent-primary-rgb, 59, 130, 246), 0.2)' 
                    : 'transparent',
                }}
              >
                {/* 图标 */}
                <Icon 
                  className="w-5 h-5 sm:w-6 sm:h-6 transition-all duration-200"
                  style={{
                    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    filter: active ? 'drop-shadow(0 0 8px var(--accent-primary))' : 'none',
                  }}
                />
                
                {/* 激活指示器 - 发光圆点 */}
                {active && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute -bottom-1 w-1 h-1 rounded-full"
                    style={{
                      background: 'var(--accent-primary)',
                      boxShadow: '0 0 6px var(--accent-primary), 0 0 12px var(--accent-primary)',
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Tooltip - 悬浮时显示标签 */}
                <AnimatePresence>
                  {hoveredIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg whitespace-nowrap pointer-events-none"
                      style={{
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <span 
                        className="text-[11px] font-medium"
                        style={{ 
                          color: active ? 'var(--accent-primary)' : '#e2e8f0',
                          fontFamily: 'var(--font-primary)',
                        }}
                      >
                        {item.label}
                      </span>
                      {/* Tooltip 箭头 */}
                      <div 
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                        style={{
                          background: 'rgba(0, 0, 0, 0.8)',
                          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* 移动端底部安全区域填充 */}
      <div className="md:hidden h-24" />
    </>
  );
}
