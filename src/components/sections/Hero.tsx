import { memo, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { ArrowRight, Terminal, Cpu, Code2, Sparkles, ChevronDown } from 'lucide-react';
import { HeroParticles } from '@/components/effects/HeroParticles';
import type { SiteData } from '@/types';

interface HeroProps {
  data: SiteData['hero'];
}

// Floating code decoration component with enhanced animation
const CodeDecoration = memo(({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    className={`absolute font-mono text-xs sm:text-sm opacity-20 pointer-events-none ${className}`}
    initial={{ opacity: 0, y: 20, x: -20 }}
    animate={{
      opacity: [0.1, 0.2, 0.1],
      y: [0, -10, 0],
      x: [0, 5, 0],
    }}
    transition={{
      duration: 0.8,
      delay,
      opacity: { duration: 4, repeat: Infinity },
      y: { duration: 6, repeat: Infinity },
      x: { duration: 5, repeat: Infinity },
    }}
  >
    <div className="text-[var(--accent-primary)]">{'<System.init>'}</div>
    <div className="text-[var(--accent-secondary)] ml-2">performance: optimized</div>
    <div className="text-[var(--accent-tertiary)] ml-2">status: ready</div>
    <div className="text-[var(--text-muted)]">{'</System.init>'}</div>
  </motion.div>
));

CodeDecoration.displayName = 'CodeDecoration';

// Animated floating icon with rotation
const FloatingIcon = memo(({
  icon: Icon,
  className,
  delay = 0,
  color = 'var(--accent-primary)'
}: {
  icon: typeof Terminal;
  className?: string;
  delay?: number;
  color?: string;
}) => (
  <motion.div
    className={`absolute ${className}`}
    initial={{ opacity: 0, scale: 0, rotate: -180 }}
    animate={{ opacity: 0.3, scale: 1, rotate: 0 }}
    transition={{
      duration: 0.8,
      delay,
      type: 'spring',
      stiffness: 200,
    }}
  >
    <motion.div
      animate={{
        y: [0, -15, 0],
        rotate: [0, 10, -10, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Icon className="w-6 h-6 sm:w-8 sm:h-8" style={{ color }} />
    </motion.div>
  </motion.div>
));

FloatingIcon.displayName = 'FloatingIcon';

// Enhanced stat card component with 3D flip animation
const StatCard = memo(({
  stat,
  index,
}: {
  stat: { value: string; label: string };
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 20;
    const y = (e.clientY - rect.top - rect.height / 2) / 20;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const rotateX = useSpring(mouseY, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(mouseX, { stiffness: 300, damping: 30 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8, y: 30, rotateX: -30 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
      transition={{
        duration: 0.6,
        delay: 0.6 + index * 0.1,
        type: 'spring',
        stiffness: 200,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative group cursor-default"
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        className="relative p-5 sm:p-6 text-center overflow-hidden"
        style={{
          rotateX,
          rotateY,
          background: 'var(--bg-card)',
          border: '3px solid',
          borderColor: isHovered
            ? 'var(--accent-primary)'
            : 'color-mix(in srgb, var(--bg-secondary) 150%, white) color-mix(in srgb, var(--bg-secondary) 60%, black) color-mix(in srgb, var(--bg-secondary) 60%, black) color-mix(in srgb, var(--bg-secondary) 150%, white)',
          boxShadow: isHovered
            ? `inset -3px -3px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 3px 3px 0 color-mix(in srgb, var(--bg-secondary) 150%, white), 0 20px 40px var(--accent-glow)`
            : 'inset -3px -3px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 3px 3px 0 color-mix(in srgb, var(--bg-secondary) 150%, white), 0 4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black)',
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale: 1.05, y: -8 }}
        transition={{ duration: 0.3 }}
      >
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 55%, transparent 60%)',
            transform: 'translateX(-100%)',
          }}
          animate={isHovered ? { x: '200%' } : { x: '-100%' }}
          transition={{ duration: 0.6 }}
        />

        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0.1 : 0 }}
          style={{ background: 'var(--accent-primary)' }}
        />

        <motion.div
          className="relative z-10 font-primary"
          style={{
            fontSize: 'clamp(2rem, 5vw, 2.75rem)',
            fontWeight: 800,
            color: 'var(--accent-primary)',
            textShadow: isHovered
              ? '3px 3px 0 color-mix(in srgb, var(--accent-primary) 40%, black), 0 0 30px var(--accent-glow)'
              : '3px 3px 0 color-mix(in srgb, var(--accent-primary) 40%, black)',
            lineHeight: 1,
            marginBottom: '8px',
            transform: 'translateZ(30px)',
          }}
          animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {stat.value}
        </motion.div>
        <motion.div
          className="relative z-10 font-primary"
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            transform: 'translateZ(20px)',
          }}
        >
          {stat.label}
        </motion.div>
      </motion.div>
    </motion.div>
  );
});

StatCard.displayName = 'StatCard';

// Animated gradient text
const GradientText = memo(({ children }: { children: React.ReactNode }) => (
  <motion.span
    className="bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-tertiary)] bg-clip-text text-transparent"
    style={{
      backgroundSize: '200% auto',
    }}
    animate={{ backgroundPosition: ['0% center', '200% center'] }}
    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
  >
    {children}
  </motion.span>
));

GradientText.displayName = 'GradientText';

// Magnetic button component
const MagneticButton = memo(({
  children,
  onClick,
  primary = true,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (e.clientX - centerX) * 0.3;
    const y = (e.clientY - centerY) * 0.3;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative flex items-center gap-2 overflow-hidden font-primary"
      style={{
        padding: '16px 32px',
        fontSize: 'var(--text-base)',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: primary ? 'white' : 'var(--text-primary)',
        background: primary ? 'var(--accent-primary)' : 'transparent',
        border: '3px solid',
        borderColor: primary
          ? 'color-mix(in srgb, var(--accent-primary) 120%, white) color-mix(in srgb, var(--accent-primary) 80%, black) color-mix(in srgb, var(--accent-primary) 80%, black) color-mix(in srgb, var(--accent-primary) 120%, white)'
          : 'var(--border-subtle)',
        boxShadow: primary
          ? 'inset -3px -3px 0 color-mix(in srgb, var(--accent-primary) 60%, black), inset 3px 3px 0 color-mix(in srgb, var(--accent-primary) 120%, white), 0 0 20px var(--accent-glow)'
          : 'none',
        textShadow: primary ? '1px 1px 0 rgba(0, 0, 0, 0.3)' : 'none',
      }}
      animate={{ x: position.x, y: position.y }}
      whileHover={{
        scale: 1.05,
        boxShadow: primary
          ? 'inset -3px -3px 0 color-mix(in srgb, var(--accent-primary) 60%, black), inset 3px 3px 0 color-mix(in srgb, var(--accent-primary) 120%, white), 0 0 40px var(--accent-glow)'
          : '0 0 20px var(--accent-glow)',
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 15 }}
    >
      {primary && (
        <motion.div
          className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
});

MagneticButton.displayName = 'MagneticButton';

export const Hero = memo(function Hero({ data }: HeroProps) {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.9]);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const primaryCta = data.cta.find(c => c.primary);
  const secondaryCta = data.cta.find(c => !c.primary);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Particle Background - Lowest Layer */}
      <div className="absolute inset-0 -z-20">
        <HeroParticles />
      </div>

      {/* Grid Pattern Overlay */}
      <motion.div
        className="absolute inset-0 -z-10 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.03 }}
        transition={{ duration: 1, delay: 0.5 }}
        style={{
          backgroundImage: `
            linear-gradient(var(--accent-primary) 1px, transparent 1px),
            linear-gradient(90deg, var(--accent-primary) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial Gradient Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, var(--bg-primary) 70%)`,
        }}
      />

      {/* Floating Code Decorations */}
      <CodeDecoration className="top-20 left-4 sm:left-10 hidden sm:block" delay={0.8} />
      <CodeDecoration className="bottom-32 right-4 sm:right-10 hidden sm:block" delay={1} />

      {/* Floating Icons */}
      <FloatingIcon
        icon={Terminal}
        className="top-1/4 left-[5%] hidden lg:block"
        delay={0.5}
        color="var(--accent-primary)"
      />
      <FloatingIcon
        icon={Cpu}
        className="top-1/3 right-[8%] hidden lg:block"
        delay={0.7}
        color="var(--accent-secondary)"
      />
      <FloatingIcon
        icon={Code2}
        className="bottom-1/4 left-[10%] hidden lg:block"
        delay={0.9}
        color="var(--accent-tertiary)"
      />
      <FloatingIcon
        icon={Sparkles}
        className="bottom-1/3 right-[5%] hidden lg:block"
        delay={1.1}
        color="var(--mc-gold)"
      />

      {/* Main Content */}
      <motion.div
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32"
        style={{ opacity, scale }}
      >
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="inline-flex items-center gap-2 mb-6 sm:mb-8"
          >
            <motion.div
              className="flex items-center gap-2 px-4 py-2"
              style={{
                background: 'var(--bg-card)',
                border: '2px solid',
                borderColor: 'color-mix(in srgb, var(--accent-primary) 80%, transparent)',
                boxShadow: '0 0 15px var(--accent-glow)',
              }}
              whileHover={{ scale: 1.05, boxShadow: '0 0 25px var(--accent-glow)' }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ background: 'var(--accent-primary)' }}
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span
                className="font-primary"
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {data.badge}
              </span>
            </motion.div>
          </motion.div>

          {/* Main Title with character animation */}
          <div className="overflow-hidden mb-6 sm:mb-8">
            <motion.h1
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.1,
              }}
              className="font-primary"
              style={{
                fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                textShadow: '4px 4px 0 color-mix(in srgb, var(--bg-secondary) 50%, black)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {data.title.split('竞争优势')[0]}
              <GradientText>竞争优势</GradientText>
            </motion.h1>
          </div>

          {/* Subtitle */}
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

          {/* Description */}
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

          {/* CTA Buttons with magnetic effect */}
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
              <MagneticButton
                onClick={() => scrollToSection(primaryCta.link)}
                primary
              >
                <span>{primaryCta.text}</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
              </MagneticButton>
            )}
            {secondaryCta && (
              <MagneticButton
                onClick={() => scrollToSection(secondaryCta.link)}
                primary={false}
              >
                {secondaryCta.text}
              </MagneticButton>
            )}
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {data.stats.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} index={index} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2 cursor-pointer"
          onClick={() => scrollToSection('#services')}
        >
          <span
            className="font-primary text-xs uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}
          >
            向下滚动
          </span>
          <ChevronDown className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
        </motion.div>
      </motion.div>

      {/* Bottom Gradient Fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, var(--bg-primary), transparent)',
        }}
      />
    </section>
  );
});
