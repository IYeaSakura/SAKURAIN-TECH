'use client';

/**
 * HomePage —— Apple 设计语言的沉浸式个人门户。
 *
 * 设计理念：
 * - 大胆留白、超大负间距排版
 * - 玻璃质感（glassmorphism）与柔和环境光
 * - 全局 Dynamic Island 提供音乐控制与命令面板
 * - 终端极客元素以功能组件形式融入（系统监视器、命令条、状态码）
 * - 所有内部导航使用 Next.js router.push
 *
 * @author SAKURAIN
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { Footer } from '@/components/sections/Footer';
import { useTheme } from '@/hooks';
import type { SiteData } from '@/types';
import type { Note } from '@/lib/content/notes';

import { AppleHeroSection } from '@/components/home/AppleHeroSection';
import { AppleBentoSection } from '@/components/home/AppleBentoSection';
import { AppleJourneySection } from '@/components/home/AppleJourneySection';
import { SystemMonitor } from '@/components/home/SystemMonitor';

interface HomePageProps {
  /** 近期说说数据（由服务端组件在构建期注入） */
  notes: Note[];
}

// 主应用组件
function App({ notes }: HomePageProps) {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  useTheme();

  useEffect(() => {
    fetch('/data/site-data.json')
      .then((res) => res.json())
      .then((data: SiteData) => {
        setSiteData(data);
        setDataLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load site data:', error);
        setDataLoaded(true);
      });
  }, []);

  if (!dataLoaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="text-center font-mono">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: 'var(--accent-primary)',
              borderTopColor: 'transparent',
            }}
          />
          <p style={{ color: 'var(--text-muted)' }}>{'>'} loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <main>
        <AppleHeroSection />
        <AppleBentoSection notes={notes} />
        <AppleJourneySection techEvolution={siteData?.home?.techEvolution} />

        {/* Terminal functional section */}
        <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <span className="apple-mono-label">TERMINAL</span>
              <h2 className="apple-headline mt-3" style={{ color: 'var(--text-primary)' }}>
                工程化控制台
              </h2>
              <p className="apple-subhead mt-3 max-w-xl mx-auto">
                将极客终端改造为可交互的功能面板，实时展示构建与服务状态。
              </p>
            </motion.div>
            <SystemMonitor />
          </div>
        </section>
      </main>

      {/* 使用子页相同的Footer */}
      {siteData && <Footer data={siteData.footer} />}
    </div>
  );
}

export default function HomePage({ notes }: HomePageProps) {
  return <App notes={notes} />;
}
