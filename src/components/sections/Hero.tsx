import { memo, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Terminal, Cpu, Code2, Sparkles, ChevronDown } from 'lucide-react';
import {
  AmbientGlow,
  TwinklingStars,
} from '@/components/effects';
import { GradientText } from '@/components/effects/TextEffects';


import { usePrefersReducedMotion, useThrottledScroll, useIsMobile } from '@/lib/performance';
import { usePerformance } from '@/contexts/PerformanceContext';

import type { SiteData } from '@/types';

const clipPathRounded = (r: number) => `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

interface HeroProps {
  data: SiteData['hero'];
}

const CodeDecoration = memo(({ className }: { className?: string }) => {
  return (
    <div
      className={`absolute font-mono text-xs sm:text-sm opacity-20 pointer-events-none animate-float-slow ${className}`}
    >
      <div className="text-[var(--accent-primary)]">{'<System.init>'}</div>
      <div className="text-[var(--accent-secondary)] ml-2">performance: optimized</div>
      <div className="text-[var(--accent-tertiary)] ml-2">status: ready</div>
      <div className="text-[var(--text-muted)]">{'</System.init>'}</div>
    </div>
  );
});

CodeDecoration.displayName = 'CodeDecoration';

const FloatingIcon = memo(({
  icon: Icon,
  className,
  color = 'var(--accent-primary)'
}: {
  icon: typeof Terminal;
  className?: string;
  color?: string;
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();

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

const StatCard = memo(({
  stat,
  index,
}: {
  stat: { value: string; label: string };
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const color = 'var(--accent-primary)';

  if (prefersReducedMotion || isMobile) {
    return (
      <div
        className="relative p-5 sm:p-6 text-center overflow-hidden"
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
      <div
        className="relative p-5 sm:p-6 text-center overflow-hidden transition-all duration-300"
        style={{
          background: 'var(--bg-card)',
          border: '2px solid',
          borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)',
          clipPath: clipPathRounded(6),
          boxShadow: isHovered ? '0 0 30px var(--accent-glow)' : 'none',
          transform: isHovered ? 'translateY(-2px)' : 'none',
        }}
      >
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${color}20, transparent 60%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${color}15 45%, ${color}30 50%, ${color}15 55%, transparent 60%)`,
            transform: 'translateX(-100%)',
          }}
          animate={isHovered ? { x: '200%' } : { x: '-100%' }}
          transition={{ duration: 0.6 }}
        />

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
        background: isHovered ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--accent-primary)',
        border: `2px solid ${isHovered ? 'transparent' : 'var(--accent-primary)'}`,
        clipPath: clipPathRounded(6),
        boxShadow: isHovered ? '0 0 30px var(--accent-glow)' : 'none',
        transform: isHovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div
        className="absolute inset-0 transition-transform duration-600"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
          transition: 'transform 0.6s ease',
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
        clipPath: clipPathRounded(6),
        boxShadow: isHovered ? '0 0 30px var(--accent-glow)' : 'none',
        transform: isHovered ? 'translateY(-2px)' : 'none',
      }}
    >
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

const GlowBadge = memo(({ text }: { text: string }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  if (prefersReducedMotion || isMobile) {
    return (
      <div className="inline-flex items-center gap-2 mb-6 sm:mb-8 relative">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{
            background: 'var(--bg-card)',
            border: '2px solid var(--accent-primary)',
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--accent-primary)' }}
          />
          <span
            className="font-primary text-sm font-bold uppercase tracking-wider"
            style={{ color: 'var(--accent-primary)' }}
          >
            {text}
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="inline-flex items-center gap-2 mb-6 sm:mb-8 relative"
    >
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

const GlowTitle = memo(({ children }: { children: React.ReactNode }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  if (prefersReducedMotion || isMobile) {
    return (
      <div className="overflow-hidden mb-6 sm:mb-8">
        <h1
          className="font-primary"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {children}
        </h1>
      </div>
    );
  }

  return (
    <div className="overflow-hidden mb-6 sm:mb-8 relative">
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

const GlowScrollIndicator = memo(({ onClick }: { onClick: () => void }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  if (prefersReducedMotion || isMobile) {
    return (
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer"
        onClick={onClick}
      >
        <span
          className="font-primary text-xs uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          向下滚动
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer group"
      onClick={onClick}
    >
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
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const { scrollY } = useThrottledScroll(16);
  const { effectiveQuality, enableBackgroundAnimations } = usePerformance();

  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setAnimationPhase(4);
      return;
    }

    const phase1Timer = setTimeout(() => setAnimationPhase(1), 0);
    const phase2Timer = setTimeout(() => setAnimationPhase(2), 200);
    const phase3Timer = setTimeout(() => setAnimationPhase(3), 400);
    const phase4Timer = setTimeout(() => setAnimationPhase(4), 600);

    return () => {
      clearTimeout(phase1Timer);
      clearTimeout(phase2Timer);
      clearTimeout(phase3Timer);
      clearTimeout(phase4Timer);
    };
  }, [prefersReducedMotion]);

  const scrollProgress = Math.min(scrollY / 300, 1);
  const opacity = prefersReducedMotion ? 1 : 1 - scrollProgress;
  const scale = prefersReducedMotion ? 1 : 1 - scrollProgress * 0.1;

  const scrollToSection = useCallback((href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  }, [prefersReducedMotion]);

  const primaryCta = data.cta.find(c => c.primary);
  const secondaryCta = data.cta.find(c => !c.primary);

  const showAmbientGlow = !isMobile && effectiveQuality !== 'low';
  const starCount = effectiveQuality === 'low' ? 10 : effectiveQuality === 'medium' ? 15 : 20;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 -z-20 pointer-events-none"
        style={{
          backgroundImage: effectiveQuality === 'low' 
            ? 'none'
            : `linear-gradient(var(--accent-primary) 1px, transparent 1px),
               linear-gradient(90deg, var(--accent-primary) 1px, transparent 1px)`,
          backgroundSize: effectiveQuality === 'low' ? '0' : '60px 60px',
          opacity: effectiveQuality === 'low' ? 0 : 0.05,
        }}
      />

      {showAmbientGlow && (
        <>
          <AmbientGlow 
            position="top-left" 
            color="var(--accent-primary)" 
            size={effectiveQuality === 'medium' ? 400 : 500} 
            opacity={effectiveQuality === 'medium' ? 0.12 : 0.15} 
          />
          <AmbientGlow 
            position="bottom-right" 
            color="var(--accent-secondary)" 
            size={effectiveQuality === 'medium' ? 320 : 400} 
            opacity={effectiveQuality === 'medium' ? 0.08 : 0.1} 
          />

          {enableBackgroundAnimations && (
            <div className="absolute inset-0">
              <TwinklingStars 
                count={starCount} 
                color="var(--accent-secondary)" 
                secondaryColor="var(--mc-gold)"
                shootingStars={effectiveQuality === 'high'}
              />
            </div>
          )}
        </>
      )}

      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, var(--bg-primary) 70%)`,
        }}
      />

      {animationPhase >= 3 && (
        <>
          <CodeDecoration className="top-20 left-4 sm:left-10 hidden sm:block" />
          <CodeDecoration className="bottom-32 right-4 sm:right-10 hidden sm:block" />
        </>
      )}

      {animationPhase >= 3 && (
        <>
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
        </>
      )}

      <div
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32"
        style={{
          opacity,
          transform: `scale(${scale})`,
          willChange: prefersReducedMotion ? undefined : 'transform, opacity',
        }}
      >
        <div className="flex items-center justify-between gap-8">
          <div className="flex-1 text-center xl:text-left">
            {animationPhase >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2 mb-6 sm:mb-8 relative"
              >
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
                    {data.badge}
                  </span>
                </div>
              </motion.div>
            )}

            {animationPhase >= 1 && (
              <div className="overflow-hidden mb-6 sm:mb-8 relative">
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
                  {data.title.split('竞争优势')[0]}
                  <span className="relative">
                    <GradientText animate={!prefersReducedMotion}>竞争优势</GradientText>
                  </span>
                </motion.h1>
              </div>
            )}

            {animationPhase >= 1 && (
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
            )}

            {animationPhase >= 1 && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.4,
                }}
                className="max-w-xl mx-auto xl:mx-0 mb-8 sm:mb-12 font-primary"
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 400,
                  color: 'var(--text-muted)',
                  lineHeight: 1.7,
                }}
              >
                {data.description}
              </motion.p>
            )}

            {animationPhase >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.5,
                }}
                className="flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-4 mb-12"
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
            )}

            {animationPhase >= 2 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto xl:mx-0 relative">
                {!isMobile && (
                  <div
                    className="absolute inset-0 -z-10 rounded-3xl animate-pulse-slow"
                    style={{
                      background: 'radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 70%)',
                      filter: 'blur(40px)',
                    }}
                  />
                )}
                {data.stats.map((stat, index) => (
                  <StatCard key={stat.label} stat={stat} index={index} />
                ))}
              </div>
            )}
          </div>


        </div>
      </div>

      {animationPhase >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer group"
          onClick={() => scrollToSection('#services')}
        >
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
      )}

      {animationPhase >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="fixed bottom-4 left-0 right-0 flex justify-center z-50"
        >
          <motion.div
            className="relative px"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <div
              className="absolute -inset-[2px] rounded-lg pointer-events-none"
              style={{
                background: 'linear-gradient(45deg, var(--accent-primary), var(--accent-secondary), var(--accent-tertiary), var(--accent-primary))',
                backgroundSize: '300% 300%',
                animation: 'gradient-shift 3s ease infinite',
                filter: 'blur(4px)',
                opacity: 0.3,
              }}
            />
            <p
              className="text-xs font-medium relative z-10"
              style={{
                color: 'var(--text-muted)',
                letterSpacing: '0.02em',
              }}
            >
              本页面仅作效果演示，不提供商业服务
            </p>
          </motion.div>
        </motion.div>
      )}

      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, var(--bg-primary), transparent)',
        }}
      />
    </section>
  );
});