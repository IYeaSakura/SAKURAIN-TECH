import { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ParticleBackground } from '@/components/effects';
import type { SiteData } from '@/types';

interface HeroProps {
  data: SiteData['hero'];
}

// Memoized floating orb component for better performance
const FloatingOrb = memo(({
  className,
  duration,
  delay = 0,
  style,
}: {
  className: string;
  duration: number;
  delay?: number;
  style?: React.CSSProperties;
}) => (
  <motion.div
    className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
    style={style}
    animate={{
      y: [0, -20, 0],
      scale: [1, 1.05, 1],
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    }}
  />
));

FloatingOrb.displayName = 'FloatingOrb';

// Memoized stat card component
const StatCard = memo(({ 
  stat, 
  index 
}: { 
  stat: { value: string; label: string }; 
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
    className="relative p-6 rounded-2xl transition-all duration-300"
    style={{
      background: 'color-mix(in srgb, var(--bg-card) 50%, transparent)',
      border: '1px solid var(--border-subtle)',
    }}
  >
    <div 
      className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent mb-2"
      style={{
        backgroundImage: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
      }}
    >
      {stat.value}
    </div>
    <div style={{ color: 'var(--text-muted)' }} className="text-sm">
      {stat.label}
    </div>
    {/* Corner accent */}
    <div 
      className="absolute top-0 right-0 w-8 h-8 rounded-tr-2xl"
      style={{ 
        borderTop: '1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)',
        borderRight: '1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)',
      }}
    />
    <div 
      className="absolute bottom-0 left-0 w-8 h-8 rounded-bl-2xl"
      style={{ 
        borderBottom: '1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)',
        borderLeft: '1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)',
      }}
    />
  </motion.div>
));

StatCard.displayName = 'StatCard';

export const Hero = memo(function Hero({ data }: HeroProps) {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Particle Background */}
      <ParticleBackground />

      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, color-mix(in srgb, var(--bg-primary) 50%, transparent), var(--bg-primary))',
        }}
      />

      {/* Floating Orbs - Optimized with CSS animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingOrb
          className="top-1/4 left-1/4 w-96 h-96"
          style={{
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-primary) 10%, transparent) 0%, transparent 70%)',
          }}
          duration={8}
        />
        <FloatingOrb
          className="bottom-1/4 right-1/4 w-80 h-80"
          style={{
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-secondary) 10%, transparent) 0%, transparent 70%)',
          }}
          duration={10}
          delay={1}
        />
        <FloatingOrb
          className="top-1/2 right-1/3 w-64 h-64"
          style={{
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-tertiary) 10%, transparent) 0%, transparent 70%)',
          }}
          duration={12}
          delay={2}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{
              background: 'color-mix(in srgb, var(--bg-card) 50%, transparent)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Sparkles 
              className="w-4 h-4" 
              style={{ color: 'var(--accent-primary)' }}
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {data.badge}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            <span 
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))',
              }}
            >
              {data.title.split('竞争优势')[0]}
            </span>
            <span 
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary), var(--accent-tertiary))',
              }}
            >
              竞争优势
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl mb-6"
            style={{ color: 'var(--text-secondary)' }}
          >
            {data.subtitle}
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base md:text-lg max-w-2xl mx-auto mb-10"
            style={{ color: 'var(--text-muted)' }}
          >
            {data.description}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            {data.cta.map((cta) => (
              <motion.button
                key={cta.text}
                onClick={() => scrollToSection(cta.link)}
                className={`
                  group px-8 py-4 rounded-xl font-medium flex items-center justify-center gap-2 
                  transition-all duration-300
                  ${cta.primary 
                    ? 'text-white hover:shadow-lg' 
                    : 'border hover:bg-opacity-10'
                  }
                `}
                style={{
                  background: cta.primary 
                    ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' 
                    : 'transparent',
                  borderColor: cta.primary ? 'transparent' : 'var(--border-subtle)',
                  color: cta.primary ? 'white' : 'var(--text-primary)',
                  boxShadow: cta.primary ? '0 4px 20px color-mix(in srgb, var(--accent-primary) 25%, transparent)' : 'none',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {cta.text}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </motion.button>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
          >
            {data.stats.map((stat, idx) => (
              <StatCard key={stat.label} stat={stat} index={idx} />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full flex justify-center pt-2"
          style={{ border: '2px solid var(--border-subtle)' }}
        >
          <motion.div 
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--accent-primary)' }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
});
