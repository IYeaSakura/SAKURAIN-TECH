import { memo } from 'react';
import { motion } from 'framer-motion';
import { Heart, ArrowUp } from 'lucide-react';
import type { SiteData } from '@/types';

interface FooterProps {
  data: SiteData['footer'];
}

export const Footer = memo(function Footer({ data }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer
      className="relative py-16"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{ background: 'var(--bg-primary)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Logo & Slogan */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                }}
              >
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {data.copyright.replace('© 2024 ', '')}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {data.slogan}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-6">
            {data.links.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-sm transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Back to Top */}
          <motion.button
            onClick={scrollToTop}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
            style={{
              background: 'color-mix(in srgb, var(--bg-card) 50%, transparent)',
              color: 'var(--text-muted)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'color-mix(in srgb, var(--bg-tertiary) 50%, transparent)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'color-mix(in srgb, var(--bg-card) 50%, transparent)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <span className="text-sm">回到顶部</span>
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Bottom Bar */}
        <div
          className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {data.copyright}
          </p>
          <p
            className="flex items-center gap-1 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by SAKURAIN
          </p>
        </div>
      </div>
    </footer>
  );
});
