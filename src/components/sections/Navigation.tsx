import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/atoms';
import type { SiteData } from '@/types';

interface NavigationProps {
  data: SiteData['navigation'];
  theme: 'light' | 'dark';
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
          isScrolled
            ? 'glass border-b'
            : 'bg-transparent'
        )}
        style={{
          borderColor: isScrolled ? 'var(--border-subtle)' : 'transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <motion.a
              href="#"
              className="flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                }}
              >
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span
                className="text-xl font-bold bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))',
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
                  className="text-sm transition-colors relative group"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {link.label}
                  <span
                    className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full"
                    style={{
                      background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                    }}
                  />
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
              <motion.button
                onClick={() => scrollToSection(data.cta.href)}
                className="px-5 py-2.5 text-sm font-medium rounded-xl transition-all"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  color: 'white',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {data.cta.label}
              </motion.button>
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
            <div
              className="absolute inset-0 backdrop-blur-xl"
              style={{ background: 'color-mix(in srgb, var(--bg-primary) 95%, transparent)' }}
            />
            <div className="relative pt-20 px-6">
              <div className="flex flex-col gap-4">
                {data.links.map((link, index) => (
                  <motion.button
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => scrollToSection(link.href)}
                    className="text-lg py-3 border-b text-left transition-colors"
                    style={{
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    {link.label}
                  </motion.button>
                ))}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => scrollToSection(data.cta.href)}
                  className="mt-4 px-6 py-3 rounded-xl font-medium"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    color: 'white',
                  }}
                >
                  {data.cta.label}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
