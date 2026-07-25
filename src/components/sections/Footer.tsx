"use client"

import { memo } from 'react';
import { Heart, FileText, MessageCircle, Zap } from 'lucide-react';
import { FloatingBubbles, TwinklingStars } from '@/components/effects';
import { useNavigation, useTranslation } from '@/hooks';
import type { SiteData } from '@/types';

interface FooterProps {
  data: SiteData['footer'];
}

export const Footer = memo(function Footer({ data }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const { navigateTo } = useNavigation();
  const { t } = useTranslation();

  return (
    <footer
      className="relative overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {/* Top divider */}
      <div className="flex justify-center pt-8 pb-10">
        <div
          className="w-3/4 max-w-4xl h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--accent-primary), var(--accent-secondary), transparent)',
            opacity: 0.6,
          }}
        />
      </div>

      {/* Floating bubbles rising from the bottom */}
      <div className="absolute inset-0 pointer-events-none opacity-15">
        <FloatingBubbles count={8} colors={['var(--accent-primary)', 'var(--accent-secondary)']} />
      </div>

      {/* Twinkling stars */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        <TwinklingStars count={20} color="var(--accent-primary)" secondaryColor="var(--accent-secondary)" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
        {/* Three-column layout: logo on the left, nav links in the middle, copyright/filing on the right */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          {/* Left: Logo & Slogan */}
          <div className="flex items-center gap-3">
            <img
              src="/image/logo.webp"
              alt="SAKURAIN"
              className="w-8 h-8 object-contain"
              loading="lazy"
              decoding="async"
            />
            <div className="flex flex-col">
              <span
                className="font-semibold"
                style={{
                  fontSize: 'var(--text-xl)',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  fontFamily: 'var(--apple-font-stack)',
                }}
              >
                SAKURAIN
              </span>
              <span
                className="font-primary text-xs"
                style={{
                  color: 'var(--text-muted)',
                  letterSpacing: '0.02em',
                }}
              >
                {data.slogan || t.footer.builtWith}
              </span>
            </div>
          </div>

          {/* Middle: Navigation links */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigateTo('/docs')}
              className="flex items-center gap-2 text-sm transition-colors hover:text-[var(--accent-primary)] cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              <FileText className="w-4 h-4" />
              <span>{t.footer.docs}</span>
            </button>
            <button
              onClick={() => navigateTo('/shuoshuo')}
              className="flex items-center gap-2 text-sm transition-colors hover:text-[var(--accent-primary)] cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t.footer.shuoshuo}</span>
            </button>
            <button
              onClick={() => {
                navigateTo('/algo-viz');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 text-sm transition-colors hover:text-[var(--accent-primary)] cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              <Zap className="w-4 h-4" />
              <span>{t.footer.algoViz}</span>
            </button>
          </div>

          {/* Right: Copyright and filing info */}
          <div className="flex flex-col items-end gap-1">
            {/* Copyright */}
            <p
              className="flex items-center gap-2 font-primary"
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--text-muted)',
              }}
            >
              © {currentYear} SAKURAIN
              <Heart className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              {t.footer.builtWith}
            </p>

            {/* Filing info */}
            <div
              className="flex items-center gap-3 font-primary"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
              }}
            >
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ transition: 'color 0.2s ease' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                {t.footer.icp}
              </a>
              <span>|</span>
              <a
                href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=34130202000598"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline flex items-center gap-1"
                style={{ transition: 'color 0.2s ease' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <img
                  src="/image/ghs.png"
                  alt={t.footer.beian}
                  className="w-3 h-3"
                />
                {t.footer.beian}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});
