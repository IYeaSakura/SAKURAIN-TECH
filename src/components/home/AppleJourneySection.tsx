'use client';

/**
 * AppleJourneySection —— Apple 风格技术演进时间线。
 *
 * 以简洁的时间轴卡片展示技术成长历程，
 * 保留来自 site-data.json 的 periods / milestones / categories 数据。
 */

import { motion } from 'framer-motion';
import { useAnimationEnabled } from '@/hooks';
import type { TechEvolutionData } from '@/types';

interface AppleJourneySectionProps {
  techEvolution?: TechEvolutionData;
}

export function AppleJourneySection({ techEvolution }: AppleJourneySectionProps) {
  const animationEnabled = useAnimationEnabled();
  const milestones = techEvolution?.milestones || [
    { period: '2016下', label: 'Web入门', color: '#ec4899' },
    { period: '2019下', label: '算法竞赛', color: '#f59e0b' },
    { period: '2022上', label: 'AI转型', color: '#8b5cf6' },
    { period: '2024下', label: '博弈算法', color: '#3b82f6' },
  ];

  const categories = techEvolution?.categories || [];

  return (
    <section className="relative apple-section px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 24 } : undefined}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="apple-mono-label">JOURNEY</span>
          <h2 className="apple-headline mt-3" style={{ color: 'var(--text-primary)' }}>
            {techEvolution?.title || '技术演进'}
          </h2>
          <p className="apple-subhead mt-3 max-w-2xl mx-auto">
            {techEvolution?.description || '从初一开始的编程之旅，技术栈随时间不断演化。'}
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-border/60 sm:-translate-x-1/2" />

          {milestones.map((item, index) => {
            const isLeft = index % 2 === 0;
            return (
              <motion.div
                key={item.period}
                initial={animationEnabled ? { opacity: 0, y: 24 } : undefined}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex items-center mb-8 sm:mb-12 ${
                  isLeft ? 'sm:justify-start' : 'sm:justify-end'
                }`}
              >
                {/* Dot */}
                <div
                  className="absolute left-4 sm:left-1/2 w-4 h-4 rounded-full border-2 border-background z-10 sm:-translate-x-1/2"
                  style={{ background: item.color }}
                />

                {/* Card */}
                <div
                  className={`ml-12 sm:ml-0 w-[calc(100%-3rem)] sm:w-[45%] apple-glass rounded-2xl p-5 ${
                    isLeft ? 'sm:mr-auto sm:pr-8' : 'sm:ml-auto sm:pl-8'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold"
                      style={{ background: `${item.color}20`, color: item.color }}
                    >
                      {item.period}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {item.label}
                  </h3>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <motion.div
            initial={animationEnabled ? { opacity: 0, y: 24 } : undefined}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 flex flex-wrap justify-center gap-3"
          >
            {categories.map((category) => (
              <div
                key={category.key}
                className="flex items-center gap-2 px-4 py-2 rounded-full apple-glass"
              >
                <div className="w-2 h-2 rounded-full" style={{ background: category.color }} />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {category.label}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
