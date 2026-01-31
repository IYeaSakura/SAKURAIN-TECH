import { memo } from 'react';
import { motion } from 'framer-motion';
import { Heart, ArrowUp } from 'lucide-react';
import { FloatingBubbles, TwinklingStars } from '@/components/effects';
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

  // Extract year and team name from copyright
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="relative py-16 mc-texture-dirt overflow-hidden"
      style={{ borderTop: '4px solid var(--border-subtle)' }}
    >
      {/* 浮动气泡 - 从底部上升 */}
      <div className="absolute inset-0 pointer-events-none opacity-15">
        <FloatingBubbles count={8} colors={['var(--accent-primary)', 'var(--accent-secondary)']} />
      </div>
      
      {/* 闪烁星星 */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        <TwinklingStars count={15} color="var(--accent-primary)" />
      </div>
      
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
                className="font-pixel"
                style={{
                  fontSize: 'var(--text-3xl)',
                  color: 'var(--text-primary)',
                  textShadow: '2px 2px 0 color-mix(in srgb, var(--bg-secondary) 50%, black)',
                  letterSpacing: '0.05em',
                }}
              >
                SAKURAIN
              </span>
            </div>
            <p 
              className="font-primary"
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 500,
                color: 'var(--text-muted)',
                letterSpacing: '0.02em',
              }}
            >
              {data.slogan}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-6">
            {data.links.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="font-primary"
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.05em',
                  padding: '4px 8px',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Back to Top */}
          <motion.button
            onClick={scrollToTop}
            className="mc-btn mc-btn-secondary flex items-center gap-2 font-primary"
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
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
          <p 
            className="flex items-center justify-center gap-2 font-primary"
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: 'var(--text-muted)',
            }}
          >
            © {currentYear} SAKURAIN 技术工作室
            <Heart className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            用代码构建未来
          </p>
        </div>
      </div>
    </footer>
  );
});
