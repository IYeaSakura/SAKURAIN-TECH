'use client';

/**
 * AppleBentoSection —— 主页功能聚合 Bento 网格。
 *
 * 将系统状态、模块导航、音乐播放器、近期说说聚合在一个
 * 不对称的 Apple 风格 Bento 布局中。
 */

import { motion } from 'framer-motion';
import { SystemHeader } from './SystemHeader';
import { ModuleNav } from './ModuleNav';
import { MusicWidget } from './MusicWidget';
import { RecentShuoshuo } from './RecentShuoshuo';
import type { Note } from '@/lib/content/notes';
import { useAnimationEnabled } from '@/hooks';

interface AppleBentoSectionProps {
  notes: Note[];
}

export function AppleBentoSection({ notes }: AppleBentoSectionProps) {
  const animationEnabled = useAnimationEnabled();

  return (
    <section className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="apple-mono-label">DASHBOARD</span>
          <h2 className="apple-headline mt-3" style={{ color: 'var(--text-primary)' }}>
            功能聚合
          </h2>
          <p className="apple-subhead mt-3 max-w-xl mx-auto">
            快速导航、音乐控制与近期动态的统一入口
          </p>
        </motion.div>

        {/* System header spans full width */}
        <div className="mb-4">
          <SystemHeader />
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* ModuleNav: 8 cols */}
          <div className="lg:col-span-8">
            <ModuleNav />
          </div>

          {/* Music + Shuoshuo stacked: 4 cols */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <MusicWidget />
            <RecentShuoshuo notes={notes} maxItems={4} />
          </div>
        </div>
      </div>
    </section>
  );
}
