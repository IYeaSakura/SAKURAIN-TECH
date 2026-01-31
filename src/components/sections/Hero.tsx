import { memo, useState, useRef, useCallback, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Terminal, Cpu, Code2, Sparkles, ChevronDown } from 'lucide-react';
import { 
  AmbientGlow, 
  TwinklingStars,
} from '@/components/effects';
import type { SiteData } from '@/types';

interface HeroProps {
  data: SiteData['hero'];
}

// 使用 CSS 动画替代 JS 动画 - 性能更好
const CodeDecoration = memo(({ className }: { className?: string }) => {
  return (
    <div 
      className={`absolute font-mono text-xs sm:text-sm opacity-20 pointer-events-none ${className} animate-float-slow`}
    >
      <div className="text-[var(--accent-primary)]">{'<System.init>'}</div>
      <div className="text-[var(--accent-secondary)] ml-2">performance: optimized</div>
      <div className="text-[var(--accent-tertiary)] ml-2">status: ready</div>
      <div className="text-[var(--text-muted)]">{'</System.init>'}</div>
    </div>
  );
});

CodeDecoration.displayName = 'CodeDecoration';

// 简化浮动图标 - 纯 CSS 动画
const FloatingIcon = memo(({
  icon: Icon,
  className,
  color = 'var(--accent-primary)'
}: {
  icon: typeof Terminal;
  className?: string;
  color?: string;
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return (
      <div className={`absolute ${className} opacity-30`}>
        <Icon className="w-6 h-6 sm:w-8 sm:h-8" style={{ color }} />
      </div>
    );
  }
  
  return (
    <div className={`absolute ${className} opacity-30 animate-float`}>
      <Icon className="w-6 h-6 sm:w-8 sm:h-8" style={{ color }} />
    </div>
  );
});

FloatingIcon.displayName = 'FloatingIcon';

// 统计卡片 - 带光效（类似服务项目卡片）
const StatCard = memo(({
  stat,
  index,
}: {
  stat: { value: string; label: string };
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const color = 'var(--accent-primary)';

  if (prefersReducedMotion) {
    return (
      <div
        className="relative p-5 sm:p-6 text-center overflow-hidden transition-all duration-300"
        style={{
          background: 'var(--bg-card)',
          border: '3px solid var(--border-subtle)',
        }}
      >
        <div
          className="font-primary text-3xl sm:text-4xl font-extrabold mb-2"
          style={{ color: 'var(--accent-primary)' }}
        >
          {stat.value}
        </div>
        <div
          className="font-primary text-xs sm:text-sm font-bold uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          {stat.label}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.6 + index * 0.1,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative cursor-default group"
      style={{ perspective: '1000px' }}
    >
      {/* 发光边框效果 */}
      <div
        className="absolute -inset-[2px] rounded-lg transition-opacity duration-500"
        style={{
          background: isHovered 
            ? `linear-gradient(45deg, var(--accent-primary), var(--accent-secondary), var(--accent-tertiary), var(--accent-primary))`
            : 'transparent',
          backgroundSize: '300% 300%',
          animation: isHovered ? 'gradient-shift 3s ease infinite' : 'none',
          opacity: isHovered ? 1 : 0,
          filter: 'blur(4px)',
          zIndex: -1,
        }}
      />
      <div
        className="relative p-5 sm:p-6 text-center overflow-hidden transition-all duration-300"
        style={{
          background: 'var(--bg-card)',
          border: '3px solid',
          borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)',
          transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'none',
          boxShadow: isHovered 
            ? `0 20px 40px var(--accent-glow), 0 0 30px ${color}20, inset -4px -4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 4px 4px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)` 
            : 'inset -4px -4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 4px 4px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)',
        }}
      >
        {/* Glow background - 顶部径向渐变 */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${color}20, transparent 60%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Shine effect - 斜向光泽 */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${color}15 45%, ${color}30 50%, ${color}15 55%, transparent 60%)`,
            transform: 'translateX(-100%)',
          }}
          animate={isHovered ? { x: '200%' } : { x: '-100%' }}
          transition={{ duration: 0.6 }}
        />

        {/* 内容 */}
        <div
          className="font-primary text-3xl sm:text-4xl font-extrabold mb-2 transition-all duration-300 relative z-10"
          style={{ 
            color: 'var(--accent-primary)',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            textShadow: isHovered ? `0 0 20px ${color}, 0 0 40px ${color}40` : 'none',
          }}
        >
          {stat.value}
        </div>
        <div
          className="font-primary text-xs sm:text-sm font-bold uppercase tracking-wider relative z-10"
          style={{ color: 'var(--text-secondary)' }}
        >
          {stat.label}
        </div>
      </div>
    </motion.div>
  );
});

StatCard.displayName = 'StatCard';

// 渐变文字 - 平滑流动渐变色，无缝循环
const GradientText = memo(({ children }: { children: React.ReactNode }) => {
  return (
    <span className="gradient-text-wrapper">
      <span className="gradient-text">
        {children}
      </span>
    </span>
  );
});

GradientText.displayName = 'GradientText';

// 主按钮 - 带光效
const PrimaryButton = memo(({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex items-center gap-3 overflow-hidden font-primary rounded-xl transition-all duration-300"
      style={{
        padding: '18px 36px',
        fontSize: 'var(--text-base)',
        fontWeight: 700,
        letterSpacing: '0.05em',
        color: 'white',
        background: 'linear-gradient(135deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 80%, var(--accent-secondary)))',
        boxShadow: isHovered 
          ? '0 8px 30px var(--accent-glow), 0 0 60px var(--accent-primary)40, inset 0 0 20px rgba(255,255,255,0.2)' 
          : '0 4px 20px var(--accent-glow)',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* 光效背景 */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
          transition: 'transform 0.6s ease',
        }}
      />
      {/* 脉冲光环 */}
      <div 
        className="absolute inset-0 rounded-xl transition-opacity duration-300"
        style={{
          boxShadow: `inset 0 0 20px rgba(255,255,255,0.3), 0 0 30px var(--accent-primary)`,
          opacity: isHovered ? 0.6 : 0,
        }}
      />
      <span className="relative z-10 flex items-center gap-2">
        {children}
        <span className="animate-bounce-x">
          <ArrowRight className="w-5 h-5" />
        </span>
      </span>
    </button>
  );
});

PrimaryButton.displayName = 'PrimaryButton';

// 次要按钮 - 带光效
const SecondaryButton = memo(({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex items-center gap-3 overflow-hidden font-primary rounded-xl transition-all duration-300"
      style={{
        padding: '18px 36px',
        fontSize: 'var(--text-base)',
        fontWeight: 700,
        letterSpacing: '0.05em',
        color: isHovered ? 'var(--accent-primary)' : 'var(--text-primary)',
        background: 'transparent',
        border: '2px solid',
        borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)',
        boxShadow: isHovered 
          ? '0 0 30px var(--accent-glow), inset 0 0 20px var(--accent-primary)10' 
          : 'none',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* 悬停光晕 */}
      <div 
        className="absolute inset-0 rounded-xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at center, var(--accent-primary)20, transparent 70%)`,
          opacity: isHovered ? 1 : 0,
        }}
      />
      <span className="relative z-10">{children}</span>
    </button>
  );
});

SecondaryButton.displayName = 'SecondaryButton';

// 发光徽章
const GlowBadge = memo(({ text }: { text: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="inline-flex items-center gap-2 mb-6 sm:mb-8 relative"
    >
      {/* 外发光 */}
      <div 
        className="absolute -inset-2 rounded-xl animate-pulse-glow"
        style={{
          background: `linear-gradient(45deg, var(--accent-primary), var(--accent-secondary))`,
          filter: 'blur(15px)',
          opacity: 0.4,
          zIndex: -1,
        }}
      />
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 relative overflow-hidden group"
        style={{
          background: 'var(--bg-card)',
          border: '2px solid color-mix(in srgb, var(--accent-primary) 80%, transparent)',
          boxShadow: '0 0 20px var(--accent-glow), inset 0 0 10px var(--accent-primary)10',
        }}
      >
        {/* 内部光效 */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(90deg, transparent, var(--accent-primary)20, transparent)`,
          }}
        />
        <span 
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ 
            background: 'var(--accent-primary)',
            boxShadow: '0 0 10px var(--accent-primary), 0 0 20px var(--accent-primary)',
          }}
        />
        <span
          className="font-primary text-sm font-bold uppercase tracking-wider relative z-10"
          style={{ color: 'var(--accent-primary)' }}
        >
          {text}
        </span>
      </div>
    </motion.div>
  );
});

GlowBadge.displayName = 'GlowBadge';

// 发光标题
const GlowTitle = memo(({ children }: { children: React.ReactNode }) => {
  return (
    <div className="overflow-hidden mb-6 sm:mb-8 relative">
      {/* 多层光晕 */}
      <div
        className="absolute inset-0 pointer-events-none animate-pulse-slow"
        style={{
          background: 'radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, var(--accent-primary)20 0%, transparent 50%)',
          filter: 'blur(40px)',
          animation: 'pulse-glow 3s ease-in-out infinite',
        }}
      />
      <motion.h1
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{
          duration: 0.8,
          ease: [0.16, 1, 0.3, 1],
          delay: 0.1,
        }}
        className="font-primary relative"
        style={{
          fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          textShadow: `
            4px 4px 0 color-mix(in srgb, var(--bg-secondary) 50%, black),
            0 0 40px var(--accent-glow),
            0 0 80px var(--accent-glow),
            0 0 120px var(--accent-primary)40
          `,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        {children}
      </motion.h1>
    </div>
  );
});

GlowTitle.displayName = 'GlowTitle';

// 发光滚动指示器
const GlowScrollIndicator = memo(({ onClick }: { onClick: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer group"
      onClick={onClick}
    >
      {/* 发光底座 */}
      <div 
        className="absolute inset-0 -m-4 rounded-full transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle, var(--accent-primary)30, transparent 70%)`,
          filter: 'blur(10px)',
        }}
      />
      <div className="flex flex-col items-center gap-2 animate-bounce-slow relative">
        <span
          className="font-primary text-xs uppercase tracking-widest transition-colors duration-300"
          style={{ color: 'var(--text-muted)' }}
        >
          向下滚动
        </span>
        <ChevronDown 
          className="w-6 h-6 transition-all duration-300 group-hover:scale-125" 
          style={{ 
            color: 'var(--accent-primary)',
            filter: 'drop-shadow(0 0 10px var(--accent-primary))',
          }} 
        />
      </div>
    </motion.div>
  );
});

GlowScrollIndicator.displayName = 'GlowScrollIndicator';

export const Hero = memo(function Hero({ data }: HeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const [scrollProgress, setScrollProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  // 使用 RAF 节流的滚动监听
  useEffect(() => {
    if (prefersReducedMotion) return;

    let pendingScroll = 0;
    let isProcessing = false;

    const handleScroll = () => {
      pendingScroll = window.scrollY;
      
      if (!isProcessing) {
        isProcessing = true;
        rafRef.current = requestAnimationFrame(() => {
          const progress = Math.min(pendingScroll / 300, 1);
          setScrollProgress(progress);
          isProcessing = false;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [prefersReducedMotion]);

  const scrollToSection = useCallback((href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  }, [prefersReducedMotion]);

  const primaryCta = data.cta.find(c => c.primary);
  const secondaryCta = data.cta.find(c => !c.primary);

  // 计算滚动动画值
  const opacity = prefersReducedMotion ? 1 : 1 - scrollProgress;
  const scale = prefersReducedMotion ? 1 : 1 - scrollProgress * 0.1;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 静态网格背景 */}
      <div
        className="absolute inset-0 -z-20 pointer-events-none opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(var(--accent-primary) 1px, transparent 1px),
            linear-gradient(90deg, var(--accent-primary) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* 环境光效 */}
      <AmbientGlow position="top-left" color="var(--accent-primary)" size={500} opacity={0.15} />
      <AmbientGlow position="bottom-right" color="var(--accent-secondary)" size={400} opacity={0.1} />
      
      {/* 闪烁星星 */}
      <div className="absolute inset-0 hidden lg:block">
        <TwinklingStars count={25} color="var(--accent-secondary)" secondaryColor="var(--mc-gold)" />
      </div>

      {/* 径向渐变遮罩 */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, var(--bg-primary) 70%)`,
        }}
      />

      {/* 浮动代码装饰 */}
      <CodeDecoration className="top-20 left-4 sm:left-10 hidden sm:block" />
      <CodeDecoration className="bottom-32 right-4 sm:right-10 hidden sm:block" />

      {/* 浮动图标 */}
      <FloatingIcon
        icon={Terminal}
        className="top-1/4 left-[5%] hidden lg:block"
        color="var(--accent-primary)"
      />
      <FloatingIcon
        icon={Cpu}
        className="top-1/3 right-[8%] hidden lg:block"
        color="var(--accent-secondary)"
      />
      <FloatingIcon
        icon={Code2}
        className="bottom-1/4 left-[10%] hidden lg:block"
        color="var(--accent-tertiary)"
      />
      <FloatingIcon
        icon={Sparkles}
        className="bottom-1/3 right-[5%] hidden lg:block"
        color="var(--mc-gold)"
      />

      {/* 主内容 */}
      <div
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32"
        style={{
          opacity,
          transform: `scale(${scale})`,
          willChange: 'transform, opacity',
        }}
      >
        <div className="text-center">
          {/* 发光徽章 */}
          <GlowBadge text={data.badge} />

          {/* 发光标题 */}
          <GlowTitle>
            {data.title.split('竞争优势')[0]}
            <span className="relative">
              <GradientText>竞争优势</GradientText>
            </span>
          </GlowTitle>

          {/* 副标题 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.3,
            }}
            className="mb-4 font-primary"
            style={{
              fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
              fontWeight: 600,
              color: 'var(--accent-secondary)',
              letterSpacing: '0.01em',
            }}
          >
            {data.subtitle}
          </motion.p>

          {/* 描述 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.4,
            }}
            className="max-w-2xl mx-auto mb-8 sm:mb-12 font-primary"
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 400,
              color: 'var(--text-muted)',
              lineHeight: 1.7,
            }}
          >
            {data.description}
          </motion.p>

          {/* CTA 按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.5,
            }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 sm:mb-20"
          >
            {primaryCta && (
              <PrimaryButton onClick={() => scrollToSection(primaryCta.link)}>
                {primaryCta.text}
              </PrimaryButton>
            )}
            {secondaryCta && (
              <SecondaryButton onClick={() => scrollToSection(secondaryCta.link)}>
                {secondaryCta.text}
              </SecondaryButton>
            )}
          </motion.div>

          {/* 统计网格 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto relative">
            {/* 统计区域背景光晕 */}
            <div
              className="absolute inset-0 -z-10 rounded-3xl animate-pulse-slow"
              style={{
                background: 'radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
            {data.stats.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* 发光滚动指示器 */}
      <GlowScrollIndicator onClick={() => scrollToSection('#services')} />

      {/* 底部渐变 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, var(--bg-primary), transparent)',
        }}
      />

      {/* CSS 动画定义 */}
      <style>{`
        /* 渐变文字 - 无缝循环流动 */
        .gradient-text-wrapper {
          position: relative;
          display: inline-block;
        }
        
        .gradient-text {
          display: inline-block;
          background: linear-gradient(
            90deg,
            var(--accent-primary) 0%,
            var(--accent-secondary) 25%,
            var(--accent-tertiary) 50%,
            var(--accent-secondary) 75%,
            var(--accent-primary) 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-move 6s linear infinite;
        }
        
        @keyframes gradient-move {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50% { transform: translateY(-10px) translateX(5px); opacity: 0.15; }
        }
        
        @keyframes gradient-flow {
          0% { background-position: 0% center; }
          50% { background-position: 100% center; }
          100% { background-position: 200% center; }
        }
        
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }

        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        
        .animate-bounce-x {
          animation: bounce-x 1.5s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
});
