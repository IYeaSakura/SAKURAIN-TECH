import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, BookOpen, Heart } from 'lucide-react';
import { useNavigate } from 'react-router';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/atoms';
import type { SiteData } from '@/types';

// Theme type definition
type Theme = 'light' | 'dark';

interface NavigationProps {
  data: SiteData['navigation'];
  theme: Theme;
  onThemeToggle: (event: React.MouseEvent<HTMLElement>) => void;
  isThemeTransitioning?: boolean;
}

export function Navigation({ data, theme, onThemeToggle, isThemeTransitioning }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 禁止背景滚动当移动端菜单打开时
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

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };



  return (
    <>
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
            {/* Logo - 添加 max-w 防止溢出 */}
            <motion.button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
              whileHover={{ scale: 1.02 }}
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

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {data.links.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className="mc-nav-link"
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                  }}
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => navigate('/docs')}
                className="mc-nav-link flex items-center gap-1"
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                }}
              >
                <BookOpen className="w-4 h-4" />
                文档
              </button>
              <button
                onClick={() => navigate('/friends')}
                className="mc-nav-link flex items-center gap-1"
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                }}
              >
                <Heart className="w-4 h-4" />
                友链
              </button>
            </div>

            {/* CTA Button & Theme Toggle */}
            <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
              <ThemeToggle
                theme={theme}
                onToggle={onThemeToggle}
                isTransitioning={isThemeTransitioning}
              />
              <button
                onClick={() => scrollToSection(data.cta.href)}
                className="mc-btn mc-btn-gold text-sm"
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                {data.cta.label}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-1 sm:gap-2 lg:hidden flex-shrink-0">
              <ThemeToggle
                theme={theme}
                onToggle={onThemeToggle}
                isTransitioning={isThemeTransitioning}
              />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 transition-colors rounded-lg flex-shrink-0"
                style={{ 
                  color: 'var(--text-secondary)',
                  background: isMobileMenuOpen ? 'var(--bg-secondary)' : 'transparent',
                }}
                aria-label={isMobileMenuOpen ? '关闭菜单' : '打开菜单'}
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 z-40 lg:hidden overflow-hidden"
            style={{ 
              top: '3.5rem',
              bottom: 0,
            }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute top-2 left-3 right-3 mc-panel p-4 sm:p-5 overflow-y-auto"
              style={{
                borderRadius: '12px',
                maxHeight: 'calc(100vh - 5rem)',
              }}
            >
              <div className="flex flex-col gap-2">
                {data.links.map((link, index) => (
                  <motion.button
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => scrollToSection(link.href)}
                    className="mc-nav-link text-left py-3 px-3 rounded-lg transition-colors w-full"
                    style={{ 
                      fontFamily: 'var(--font-primary)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 600,
                    }}
                  >
                    {link.label}
                  </motion.button>
                ))}
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: data.links.length * 0.05 }}
                  onClick={() => {
                    navigate('/docs');
                    setIsMobileMenuOpen(false);
                  }}
                  className="mc-nav-link flex items-center gap-2 text-left py-3 px-3 rounded-lg transition-colors w-full"
                  style={{ 
                    fontFamily: 'var(--font-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 600,
                  }}
                >
                  <BookOpen className="w-4 h-4" />
                  文档
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (data.links.length + 1) * 0.05 }}
                  onClick={() => {
                    navigate('/friends');
                    setIsMobileMenuOpen(false);
                  }}
                  className="mc-nav-link flex items-center gap-2 text-left py-3 px-3 rounded-lg transition-colors w-full"
                  style={{ 
                    fontFamily: 'var(--font-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 600,
                  }}
                >
                  <Heart className="w-4 h-4" />
                  友链
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  onClick={() => scrollToSection(data.cta.href)}
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
