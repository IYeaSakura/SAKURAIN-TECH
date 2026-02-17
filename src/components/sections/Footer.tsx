"use client"

import { memo } from 'react';
import { Heart, FileText, MessageCircle } from 'lucide-react';
import { FloatingBubbles, TwinklingStars } from '@/components/effects';
import type { SiteData } from '@/types';

interface FooterProps {
  data: SiteData['footer'];
}

export const Footer = memo(function Footer({ data }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="relative overflow-hidden"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {/* 顶部分割线 */}
      <div className="flex justify-center pt-8 pb-10">
        <div 
          className="w-3/4 max-w-4xl h-px"
          style={{ 
            background: 'linear-gradient(90deg, transparent, var(--accent-primary), var(--accent-secondary), transparent)',
            opacity: 0.6,
          }} 
        />
      </div>

      {/* 浮动气泡 - 从底部上升 */}
      <div className="absolute inset-0 pointer-events-none opacity-15">
        <FloatingBubbles count={8} colors={['var(--accent-primary)', 'var(--accent-secondary)']} />
      </div>

      {/* 闪烁星星 */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        <TwinklingStars count={20} color="var(--accent-primary)" secondaryColor="var(--accent-secondary)" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
        {/* 三层布局：左侧 LOGO，中间导航链接，右侧版权备案 */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          {/* 左侧：Logo & Slogan */}
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
                className="font-pixel"
                style={{
                  fontSize: 'var(--text-xl)',
                  color: 'var(--text-primary)',
                  textShadow: '2px 2px 0 color-mix(in srgb, var(--bg-secondary) 50%, black)',
                  letterSpacing: '0.05em',
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
                {data.slogan}
              </span>
            </div>
          </div>

          {/* 中间：导航链接 */}
          <div className="flex items-center gap-6">
            <a
              href="/docs"
              className="flex items-center gap-2 text-sm transition-colors hover:text-[var(--accent-primary)]"
              style={{ color: 'var(--text-muted)' }}
            >
              <FileText className="w-4 h-4" />
              <span>文档</span>
            </a>
            <a
              href="/notes"
              className="flex items-center gap-2 text-sm transition-colors hover:text-[var(--accent-primary)]"
              style={{ color: 'var(--text-muted)' }}
            >
              <MessageCircle className="w-4 h-4" />
              <span>日志</span>
            </a>
          </div>

          {/* 右侧：版权和备案 */}
          <div className="flex flex-col items-end gap-1">
            {/* 版权信息 */}
            <p
              className="flex items-center gap-2 font-primary"
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

            {/* 备案信息 */}
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
                皖ICP备2025073165号-1
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
                  alt="公安备案图标"
                  className="w-3 h-3"
                />
                皖公网安备34130202000598号
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});
