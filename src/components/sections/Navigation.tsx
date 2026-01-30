import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/atoms';
import type { SiteData } from '@/types';

// Theme type definition
// Define the theme type for component props
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled ? 'mc-navbar' : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <motion.a
              href="#"
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <img
                src="/image/logo.webp"
                alt="SAKURAIN"
                className="w-10 h-10 object-contain"
              />
              <span
                className="font-pixel text-2xl sm:text-3xl"
                style={{
                  color: 'var(--text-primary)',
                  textShadow: '2px 2px 0 color-mix(in srgb, var(--bg-secondary) 50%, black)',
                  letterSpacing: '0.05em',
                }}
              >
                {data.logo}
              </span>
            </motion.a>

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
            </div>

            {/* CTA Button & Theme Toggle */}
            <div className="hidden lg:flex items-center gap-4">
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
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle
                theme={theme}
                onToggle={onThemeToggle}
                isTransitioning={isThemeTransitioning}
              />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-20 left-4 right-4 mc-panel p-6"
            >
              <div className="flex flex-col gap-4">
                {data.links.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection(link.href)}
                    className="mc-nav-link text-left py-3 border-b"
                    style={{ 
                      borderColor: 'var(--border-subtle)',
                      fontFamily: 'var(--font-primary)',
                      fontSize: 'var(--text-lg)',
                      fontWeight: 600,
                    }}
                  >
                    {link.label}
                  </button>
                ))}
                <button
                  onClick={() => scrollToSection(data.cta.href)}
                  className="mc-btn mc-btn-gold mt-4"
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                >
                  {data.cta.label}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
