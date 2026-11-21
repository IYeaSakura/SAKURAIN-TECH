'use client';

/**
 * Earth Online 独立页面。
 *
 * 仅展示 Cesium 3D 地球（含卫星弹幕）；原先的中国区域地图与左侧演示切换列表已移除。
 * 页面结构：主题网格背景 + 顶部标题栏 + 全宽地球场景 + 反馈评论 + 页脚。
 *
 * @author SAKURAIN
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { GlobeShowcase } from './GlobeShowcase';
import { Footer } from '@/components/sections/Footer';
import { RouteLoader } from '@/components/RouteLoader';
import { useConfig, useTranslation } from '@/hooks';
import { CommentSection } from '@/components/blog/components/CommentSection';
import type { SiteData } from '@/types';

export default function EarthOnlinePage() {
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const { data: siteData } = useConfig<SiteData>('/data/site-data.json');

  useEffect(() => {
    // Simulate loading completion
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <RouteLoader />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Subtle grid background using theme border color */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(var(--border-subtle) 1px, transparent 1px),
                             linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            opacity: 0.15,
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top navigation placeholder - global layout provides the actual nav */}
        <div className="h-16" />

        {/* Heading */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full px-6 lg:px-8 pt-2 pb-5"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1
                className="text-3xl sm:text-4xl font-bold uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-pixel)', color: 'var(--text-primary)' }}
              >
                {t.earth.earthOnlineTitle}
              </h1>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--accent-primary)',
                  boxShadow: '3px 3px 0 var(--accent-primary)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}
                >
                  {t.earth.interactiveDemo}
                </span>
              </div>
            </div>

            <p className="text-sm leading-relaxed max-w-3xl" style={{ color: 'var(--text-muted)' }}>
              {t.earth.earthOnlineDescription}
            </p>
          </div>
        </motion.header>

        {/* Globe showcase — capped to the same content width as the heading */}
        <main className="flex-1 px-4 lg:px-8">
          <div className="max-w-7xl mx-auto w-full aspect-video min-h-[340px] sm:min-h-[420px]">
            <GlobeShowcase />
          </div>
        </main>

        {/* Feedback comment section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full px-6 lg:px-8 py-8 mt-4 border-t-2"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="max-w-4xl mx-auto">
            <CommentSection postId="earth-online-feedback" />
          </div>
        </motion.section>

        {/* Footer */}
        {siteData?.footer && (
          <div className="relative z-10">
            <Footer data={siteData.footer} />
          </div>
        )}
      </div>
    </div>
  );
}
