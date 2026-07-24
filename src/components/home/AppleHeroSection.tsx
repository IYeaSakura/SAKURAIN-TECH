'use client';

/**
 * AppleHeroSection —— 苹果风格沉浸式首屏。
 *
 * 特点：
 * - 超大负间距标题，类似 Apple 产品页
 * - 渐变文字与柔和环境光
 * - 终端命令条作为功能性 CTA，可直接跳转
 * - 悬浮状态卡片展示核心指标
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Terminal, Activity, Zap, Layers } from 'lucide-react';
import { useAnimationEnabled, useNavigation } from '@/hooks';

const METRICS = [
  { label: 'Projects', value: '50+', icon: Layers },
  { label: 'Uptime', value: '99.9%', icon: Activity },
  { label: 'Stack', value: 'Full', icon: Zap },
];

export function AppleHeroSection() {
  const animationEnabled = useAnimationEnabled();
  const { navigateTo } = useNavigation();
  const [typed, setTyped] = useState('');
  const command = 'explore sakurain.tech';

  useEffect(() => {
    if (!animationEnabled) {
      setTyped(command);
      return;
    }
    let i = 0;
    const timer = setInterval(() => {
      setTyped(command.slice(0, i + 1));
      i += 1;
      if (i >= command.length) clearInterval(timer);
    }, 80);
    return () => clearInterval(timer);
  }, [animationEnabled]);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden apple-ambient-glow">
      {/* 背景柔光网格 */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(circle at center, black 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 text-center pt-24 sm:pt-32">
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 24 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full apple-glass mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-secondary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-secondary" />
          </span>
          <span className="apple-mono-label text-[10px]">SYSTEM ONLINE · V2.0</span>
        </motion.div>

        <motion.h1
          initial={animationEnabled ? { opacity: 0, y: 30 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="apple-hero-title mb-6"
          style={{ color: 'var(--text-primary)' }}
        >
          将代码
          <br />
          <span className="apple-gradient-text">转化为竞争优势</span>
        </motion.h1>

        <motion.p
          initial={animationEnabled ? { opacity: 0, y: 24 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="apple-subhead max-w-2xl mx-auto mb-10"
        >
          SAKURAIN 个人技术门户。博弈算法、量化系统、数据分析与 Web 工程，
          用工程思维构建每一个数字产品。
        </motion.p>

        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 24 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <button onClick={() => navigateTo('/projects')} className="apple-button group">
            <span>探索项目</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button onClick={() => navigateTo('/blog')} className="apple-button-secondary">
            阅读博客
          </button>
        </motion.div>

        {/* 终端命令条 —— 功能性组件 */}
        <motion.div
          initial={animationEnabled ? { opacity: 0, scale: 0.96 } : undefined}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl mx-auto"
        >
          <div
            className="apple-glass rounded-2xl px-5 py-4 text-left cursor-pointer transition-transform hover:scale-[1.01]"
            onClick={() => navigateTo('/projects')}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-black/5 dark:bg-white/10">
                <Terminal className="w-5 h-5 text-accent-primary" />
              </div>
              <div className="flex-1 font-mono text-sm sm:text-base">
                <span className="text-accent-secondary mr-2">{'>'}</span>
                <span className="text-primary">{typed}</span>
                <span className="apple-caret" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* 核心指标卡片 */}
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 30 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-12"
        >
          {METRICS.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="apple-glass rounded-2xl p-4 text-center"
              >
                <Icon className="w-5 h-5 mx-auto mb-2 text-accent-primary" />
                <div className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {metric.value}
                </div>
                <div className="text-[10px] apple-mono-label mt-1">{metric.label}</div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
