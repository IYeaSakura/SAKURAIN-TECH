import { memo, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useInView } from 'framer-motion';
import { Check, X, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { SectionTitle } from '@/components/atoms';
import { Terminal, AmbientGlow, FloatingBubbles, TwinklingStars } from '@/components/effects';
import type { SiteData } from '@/types';

interface ComparisonProps {
  data: SiteData['comparison'];
}

// Advanced CTA Card Component with 3D tilt and animations
const CTACard = memo(function CTACard() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { margin: '-100px' });
  const [isHovered, setIsHovered] = useState(false);

  // Mouse tracking for 3D tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 25;
    const y = (e.clientY - rect.top - rect.height / 2) / 25;
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

  // Text animation variants
  const titleWords = ['准备好', '体验', '不同的', '开发服务了吗？'];
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const wordVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      rotateX: -30,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, rotateX: -15 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="mt-12"
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="relative p-8 mc-panel text-center overflow-hidden"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          background: 'var(--bg-card)',
          minHeight: '280px',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        whileHover={{
          boxShadow: '0 25px 50px -12px rgba(14, 99, 156, 0.25), inset -4px -4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 4px 4px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)',
        }}
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, var(--accent-primary) 0%, transparent 70%)',
            opacity: 0.05,
          }}
          animate={{
            scale: isHovered ? [1, 1.2, 1] : 1,
            opacity: isHovered ? [0.05, 0.1, 0.05] : 0.05,
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: 'var(--accent-primary)',
                left: `${20 + i * 30}%`,
                top: `${30 + i * 20}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        {/* Realistic Terminal - Left Side */}
        <div className="absolute top-4 left-4 w-[28rem] hidden xl:block" style={{ zIndex: 20 }}>
          <Terminal />
        </div>

        {/* Sparkle icons - Top Right */}
        <motion.div
          className="absolute top-4 right-4"
          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-6 h-6" style={{ color: 'var(--mc-gold)' }} />
        </motion.div>

        {/* Main Title with word-by-word animation - Adjusted for terminal */}
        <div className="overflow-hidden mb-4 lg:mt-0 mt-8" style={{ perspective: '1000px' }}>
          <motion.h3 
            className="font-primary flex flex-wrap items-center justify-center gap-x-2 xl:ml-[30rem]"
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              transformStyle: 'preserve-3d',
            }}
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            {titleWords.map((word, index) => (
              <motion.span
                key={index}
                className="inline-block"
                variants={wordVariants}
                style={{
                  color: index === 1 || index === 2 ? 'var(--accent-primary)' : 'var(--text-primary)',
                  textShadow: index === 1 || index === 2 ? '2px 2px 0 color-mix(in srgb, var(--accent-primary) 40%, black)' : 'none',
                }}
                whileHover={{
                  scale: 1.1,
                  color: 'var(--accent-secondary)',
                  transition: { duration: 0.2 },
                }}
              >
                {word}
              </motion.span>
            ))}
          </motion.h3>
        </div>

        {/* Subtitle with fade-in */}
        <motion.p 
          className="mb-8 font-primary max-w-2xl mx-auto xl:ml-auto xl:mr-auto xl:pl-[30rem]"
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 400,
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          选择 SAKURAIN，获得更专业、更可靠、更高效的技术解决方案
        </motion.p>

        {/* CTA Button with advanced effects */}
        <motion.div
          className="xl:pl-[30rem]"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <motion.button
            onClick={() => {
              const element = document.querySelector('#contact');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative mc-btn mc-btn-gold font-primary inline-flex items-center gap-3 overflow-hidden"
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              letterSpacing: '0.05em',
              transform: 'translateZ(40px)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              }}
            />
            
            {/* Button content */}
            <motion.span
              className="relative z-10 flex items-center gap-2"
              animate={isHovered ? { x: [0, -3, 3, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Zap className="w-5 h-5" />
              立即咨询
            </motion.span>
            
            <motion.span
              className="relative z-10"
              animate={isHovered ? { x: 5, opacity: 1 } : { x: 0, opacity: 0.8 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.span>

            {/* Pulse ring effect */}
            <motion.div
              className="absolute inset-0 rounded-lg pointer-events-none"
              style={{
                border: '2px solid var(--mc-gold)',
              }}
              animate={{
                scale: [1, 1.1, 1.1],
                opacity: [0.5, 0, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          </motion.button>
        </motion.div>

        {/* Bottom decorative line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)',
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ delay: 1, duration: 0.8 }}
        />
      </motion.div>
    </motion.div>
  );
});

export const Comparison = memo(function Comparison({ data }: ComparisonProps) {
  return (
    <section id="comparison" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Ambient glow effects */}
      <AmbientGlow position="top-right" color="var(--accent-primary)" size={400} opacity={0.12} />
      <AmbientGlow position="bottom-left" color="var(--accent-secondary)" size={300} opacity={0.1} />
      <AmbientGlow position="center" color="var(--accent-tertiary)" size={500} opacity={0.06} />
      
      {/* 浮动气泡 */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <FloatingBubbles count={8} colors={['var(--accent-primary)', 'var(--accent-secondary)']} />
      </div>
      
      {/* 闪烁星星 */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        <TwinklingStars count={28} color="var(--accent-secondary)" secondaryColor="var(--accent-primary)" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title={data.title}
          subtitle={data.subtitle}
        />

        {/* Comparison Table - 使用 Grid 布局 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="overflow-x-auto"
        >
          <div className="min-w-[600px]">
            {/* 表头 */}
            <div className="grid grid-cols-[140px_1fr_1.5fr]">
              <div 
                className="py-4 px-4 font-primary text-left"
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  borderBottom: '2px solid var(--border-subtle)',
                }}
              >
                对比维度
              </div>
              <div 
                className="py-4 px-4 font-primary text-left"
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  borderBottom: '2px solid var(--border-subtle)',
                }}
              >
                传统外包
              </div>
              <div 
                className="py-4 px-4 font-primary text-left"
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 800,
                  color: 'var(--accent-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  borderBottom: '2px solid var(--accent-primary)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  SAKURAIN
                </div>
              </div>
            </div>

            {/* 表体 */}
            {data.items.map((item, index) => (
              <motion.div
                key={item.dimension}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ margin: '-50px' }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group relative grid grid-cols-[140px_1fr_1.5fr]"
                whileHover={{ 
                  backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 50%, transparent)',
                }}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                {/* Row hover glow */}
                <motion.div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(90deg, transparent, var(--accent-glow), transparent)',
                  }}
                />
                <div className="py-5 px-4">
                  <span 
                    className="font-primary"
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {item.dimension}
                  </span>
                </div>
                <div className="py-5 px-4">
                  <div className="flex items-start gap-2">
                    <X className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--error)' }} />
                    <span 
                      className="font-primary"
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 400,
                        color: 'var(--text-muted)',
                        lineHeight: 1.6,
                      }}
                    >
                      {item.traditional}
                    </span>
                  </div>
                </div>
                <div className="py-5 px-4">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-secondary)' }} />
                    <div>
                      <span 
                        className="font-primary block"
                        style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          lineHeight: 1.6,
                        }}
                      >
                        {item.sakurain}
                      </span>
                      <span 
                        className="font-primary block mt-1"
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 500,
                          color: 'var(--accent-primary)',
                          fontStyle: 'italic',
                        }}
                      >
                        {item.highlight}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA - Advanced Animation Version */}
        <CTACard />
      </div>
    </section>
  );
});
