'use client';

/**
 * 404 Not Found Page (Next.js App Router 迁移版)
 *
 * 迁移自旧 Vite 项目 src/pages/NotFound/index.tsx：
 * - react-router useNavigate → next/navigation useRouter
 * - 全局布局层（Navigation / MagneticCursor / VelocityCursor /
 *   TwinklingStars / FlowingGradient / LightBeam / 主题切换）已由
 *   next-app 根布局 ClientEffects 统一挂载，此处不再重复渲染，
 *   仅保留 404 主体内容（像素大字号 / 浮动幽灵 / 操作按钮 / 推荐链接 / 页脚）。
 *
 * @author SAKURAIN
 */

import { useState, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Home, Ghost, Search, ArrowRight, Sparkles, Heart, RefreshCw } from 'lucide-react';

// Floating Ghost Component
const FloatingGhost = memo(function FloatingGhost() {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{
        y: [20, -20, 20],
        opacity: 1
      }}
      transition={{
        y: {
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        },
        opacity: {
          duration: 0.5,
          delay: 0.2
        }
      }}
      className="relative"
    >
      <motion.div
        animate={{ rotate: [-5, 5, -5] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <Ghost
          className="w-32 h-32 sm:w-48 sm:h-48"
          style={{ color: 'var(--accent-primary)' }}
        />
      </motion.div>

      {/* Glow effect */}
      <div
        className="absolute inset-0 -m-8 rounded-full blur-3xl opacity-30"
        style={{ background: 'var(--accent-primary)' }}
      />
    </motion.div>
  );
});

// Action Button Component
const ActionButton = memo(function ActionButton({
  icon: Icon,
  label,
  onClick,
  delay
}: {
  icon: typeof Home;
  label: string;
  onClick: () => void;
  delay: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const color = 'var(--accent-primary)';

  return (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay,
        type: 'spring',
        stiffness: 100,
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex items-center gap-3 px-8 py-4 rounded-xl font-bold transition-all duration-300"
      style={{
        background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 80%, var(--accent-secondary)))`,
        color: 'white',
        boxShadow: isHovered
          ? `0 8px 30px var(--accent-glow), 0 0 60px ${color}40, inset 0 0 20px rgba(255,255,255,0.2)`
          : '0 4px 20px var(--accent-glow)',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          transform: 'translateX(-100%)',
        }}
        animate={isHovered ? { x: '200%' } : { x: '-100%' }}
        transition={{ duration: 0.6 }}
      />
      <Icon className="w-5 h-5" />
      <span>{label}</span>
      <motion.span
        className="animate-bounce-x"
        animate={{ x: isHovered ? 5 : 0 }}
      >
        <ArrowRight className="w-5 h-5" />
      </motion.span>
    </motion.button>
  );
});

// Suggestion List Component
const SuggestionList = memo(function SuggestionList() {
  const router = useRouter();
  const suggestions = [
    { icon: Home, label: '返回首页', path: '/' },
    { icon: Search, label: '搜索文档', path: '/docs' },
    { icon: Heart, label: '友情链接', path: '/friends' },
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="mt-12"
    >
      <p
        className="text-center mb-6"
        style={{ color: 'var(--text-muted)' }}
      >
        你可能在寻找：
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={suggestion.path}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.9 + index * 0.1,
              type: 'spring',
            }}
            onClick={() => handleNavigate(suggestion.path)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300"
            style={{
              background: 'var(--bg-card)',
              border: '2px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            whileHover={{
              scale: 1.05,
              borderColor: 'var(--accent-primary)',
              boxShadow: '0 4px 20px var(--accent-glow)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            <suggestion.icon
              className="w-4 h-4"
              style={{ color: 'var(--accent-primary)' } as React.CSSProperties}
            />
            {suggestion.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
});

// Main 404 Page Component
export default function NotFoundPage() {
  const router = useRouter();

  const handleGoHome = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div
      className="relative min-h-screen flex flex-col"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center pt-20 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* 404 Number */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              type: 'spring',
              stiffness: 100,
            }}
            className="mb-8"
          >
            <motion.h1
              className="font-pixel text-8xl sm:text-9xl md:text-[12rem] font-bold"
              style={{
                color: 'var(--accent-primary)',
                textShadow: '0 0 40px var(--accent-primary)40, 0 0 80px var(--accent-primary)20',
              }}
              animate={{
                textShadow: [
                  '0 0 40px var(--accent-primary)40, 0 0 80px var(--accent-primary)20',
                  '0 0 60px var(--accent-primary)60, 0 0 100px var(--accent-primary)30',
                  '0 0 40px var(--accent-primary)40, 0 0 80px var(--accent-primary)20',
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              404
            </motion.h1>
          </motion.div>

          {/* Ghost Animation */}
          <div className="mb-8">
            <FloatingGhost />
          </div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="font-pixel text-2xl sm:text-3xl mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              页面未找到
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              哎呀！这个页面好像被外星人劫持了...
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-base mt-2"
              style={{ color: 'var(--text-muted)' }}
            >
              或者它可能根本就不存在
            </motion.p>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <ActionButton
              icon={Home}
              label="返回首页"
              onClick={handleGoHome}
              delay={0.7}
            />
            <ActionButton
              icon={RefreshCw}
              label="刷新页面"
              onClick={handleRefresh}
              delay={0.8}
            />
          </div>

          {/* Sparkles decoration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex justify-center gap-2 mb-8"
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut'
                }}
              >
                <Sparkles
                  className="w-5 h-5"
                  style={{ color: 'var(--accent-primary)' }}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Suggestion List */}
          <SuggestionList />
        </div>
      </main>

      {/* Footer */}
      <footer
        className="relative py-8 z-10"
        style={{
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} SAKURAIN 技术工作室 · 用代码构建未来
          </p>
        </div>
      </footer>
    </div>
  );
}
