import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, BookOpen, Heart, MessageCircle, Sun, Moon, Home, FileText, User } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMobileMenuOpen && e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const handleNavClick = (href: string) => {
    if (deploymentConfig.useWindowLocation) {
      window.location.href = href;
    } else {
      navigate(href);
    }
    setIsMobileMenuOpen(false);
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

            {/* 移动端顶部按钮（主题切换） */}
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
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 sm:p-2.5 transition-all rounded-lg sm:rounded-xl flex-shrink-0 hover:scale-110 active:scale-95"
                style={{ 
                  color: 'var(--text-secondary)',
                  background: isMobileMenuOpen ? 'var(--bg-secondary)' : 'transparent',
                }}
                aria-label={isMobileMenuOpen ? '关闭菜单' : '打开菜单'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={20} className="sm:w-[22px] sm:h-[22px]" /> : <Menu size={20} className="sm:w-[22px] sm:h-[22px]" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* 移动端底部 Dock 导航栏 */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      >
        {/* 顶部渐变过渡 */}
        <div 
          className="h-8 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, var(--bg-card), transparent)',
          }}
        />
        
        {/* Dock 容器 */}
        <div
          className="px-3 pb-4 pt-1"
          style={{
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div className="flex items-center justify-around">
            {dockItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <motion.button
                  key={item.href}
                  onClick={() => handleDockClick(item.href)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative flex flex-col items-center gap-1 py-2 px-2 rounded-xl transition-all duration-300"
                  style={{
                    background: active ? 'var(--accent-primary)' : 'transparent',
                  }}
                >
                  {/* 图标容器 */}
                  <motion.div
                    animate={{
                      scale: active ? 1.1 : 1,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="relative"
                  >
                    <Icon 
                      className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-300"
                      style={{
                        color: active ? 'white' : 'var(--text-secondary)',
                      }}
                    />
                    
                    {/* 未激活时的微光效果 */}
                    {!active && (
                      <motion.div
                        className="absolute inset-0 rounded-full blur-md"
                        style={{
                          background: 'var(--accent-primary)',
                          opacity: 0,
                        }}
                        whileHover={{ opacity: 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.div>
                  
                  {/* 标签文字 */}
                  <span
                    className="text-[10px] sm:text-xs font-medium transition-colors duration-300"
                    style={{
                      color: active ? 'white' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-primary)',
                    }}
                  >
                    {item.label}
                  </span>
                  
                  {/* 活跃指示器（小圆点） */}
                  {active && (
                    <motion.div
                      layoutId="dock-indicator"
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                      style={{
                        background: 'var(--accent-primary)',
                        boxShadow: '0 0 8px var(--accent-primary)',
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
        
        {/* iOS 安全区域填充 */}
        <div 
          className="h-safe-area-inset-bottom"
          style={{ background: 'var(--bg-card)' }}
        />
      </motion.div>

      {/* 移动端全屏菜单（保留作为额外选项） */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isMobileMenuOpen ? { opacity: 1 } : { opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 z-[60] lg:hidden overflow-hidden"
            style={{ 
              top: '3.5rem',
              bottom: '5.5rem', // 为底部 Dock 留出空间
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0"
              onClick={() => setIsMobileMenuOpen(false)}
              role="button"
              tabIndex={0}
              aria-label="关闭菜单"
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute top-2 left-3 right-3 sm:left-4 sm:right-4 mc-panel p-4 sm:p-5 overflow-y-auto z-10"
              style={{
                borderRadius: '12px',
                maxHeight: 'calc(100vh - 8rem)',
              }}
            >
              <div className="flex flex-col gap-2">
                {data.links.map((link, index) => {
                  const Icon = getIcon(link.icon);
                  const handleClick = () => {
                    if (link.href === '/docs') {
                      handleDocsClick();
                      setIsMobileMenuOpen(false);
                    } else if (link.href === '/blog') {
                      handleBlogClick();
                      setIsMobileMenuOpen(false);
                    } else if (link.href === '/notes') {
                      handleNotesClick();
                      setIsMobileMenuOpen(false);
                    } else if (link.href === '/friends') {
                      handleFriendsClick();
                      setIsMobileMenuOpen(false);
                    } else {
                      handleNavClick(link.href);
                    }
                  };
                  return (
                    <motion.button
                      key={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={handleClick}
                      className="mc-nav-link flex items-center gap-2 text-left py-3 sm:py-3.5 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-all w-full hover:scale-[1.02] active:scale-[0.98]"
                      style={{ 
                        fontFamily: 'var(--font-primary)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 600,
                      }}
                    >
                      {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                      {link.label}
                    </motion.button>
                  );
                })}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  onClick={() => {
                    handleNavClick(data.cta.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className="mc-btn mc-btn-gold mt-3 w-full"
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    padding: '12px 24px',
                  }}
                >
                  {data.cta.label}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
