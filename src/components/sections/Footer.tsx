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
      className="relative py-16 mc-texture-dirt"
      style={{ borderTop: '4px solid var(--border-subtle)' }}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Logo & Slogan */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
              <img
                src="/image/logo.webp"
                alt="SAKURAIN"
                className="w-10 h-10 object-contain"
              />
              <span
                className="font-minecraft text-2xl font-bold"
                style={{
                  color: 'var(--text-primary)',
                  textShadow: '2px 2px 0 color-mix(in srgb, var(--bg-secondary) 50%, black)',
                }}
              >
                {data.copyright.replace('© 2024 ', '').replace('. All rights reserved.', '')}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)' }}>
              {data.slogan}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-6">
            {data.links.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="mc-nav-link"
                style={{ padding: '4px 8px' }}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Back to Top */}
          <motion.button
            onClick={scrollToTop}
            className="mc-btn mc-btn-secondary flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>回到顶部</span>
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Copyright */}
        <div
          className="mt-12 pt-8 text-center"
          style={{ borderTop: '2px solid var(--border-subtle)' }}
        >
          <p className="flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
            {data.copyright}
            <Heart className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </p>
        </div>
      </div>
    </footer>
  );
});
