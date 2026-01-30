import { memo, useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Zap } from 'lucide-react';
import { SectionTitle } from '@/components/atoms';
import type { SiteData } from '@/types';

interface PricingProps {
  data: SiteData['pricing'];
}

const PlanCard = memo(({
  plan,
  categoryColor,
  index,
}: {
  plan: SiteData['pricing']['categories'][0]['plans'][0];
  categoryColor: string;
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.9, rotateX: -15 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1, rotateX: 0 } : {}}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.15,
        type: 'spring',
        stiffness: 100,
      }}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ perspective: 1000 }}
    >
      {/* Popular badge */}
      <AnimatePresence>
        {plan.popular && (
          <motion.div 
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, delay: index * 0.15 + 0.3 }}
          >
            <motion.div 
              className="flex items-center gap-1 px-3 py-1 font-primary"
              style={{
                background: 'var(--mc-gold)',
                border: '2px solid',
                borderColor: 'color-mix(in srgb, var(--mc-gold) 120%, white) color-mix(in srgb, var(--mc-gold) 80%, black) color-mix(in srgb, var(--mc-gold) 80%, black) color-mix(in srgb, var(--mc-gold) 120%, white)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                boxShadow: '0 0 15px rgba(212, 160, 23, 0.4)',
              }}
              animate={{ 
                boxShadow: [
                  '0 0 15px rgba(212, 160, 23, 0.4)',
                  '0 0 25px rgba(212, 160, 23, 0.6)',
                  '0 0 15px rgba(212, 160, 23, 0.4)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Sparkles className="w-3 h-3" />
              </motion.span>
              推荐
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="h-full mc-panel p-6"
        animate={{
          y: isHovered ? -8 : 0,
          scale: isHovered ? 1.02 : 1,
          boxShadow: isHovered
            ? `inset -4px -4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 4px 4px 0 color-mix(in srgb, var(--bg-secondary) 150%, white), 0 25px 50px -12px ${categoryColor}40`
            : 'inset -4px -4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 4px 4px 0 color-mix(in srgb, var(--bg-secondary) 150%, white), 0 4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${categoryColor}10 45%, ${categoryColor}20 50%, ${categoryColor}10 55%, transparent 60%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? '200%' : '-100%' }}
          transition={{ duration: 0.6 }}
        />

        {/* Plan Name */}
        <motion.h3 
          className="mb-2 font-primary"
          style={{ 
            fontSize: 'var(--text-xl)',
            fontWeight: 800,
            color: plan.popular ? categoryColor : 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
          animate={{ color: isHovered ? categoryColor : (plan.popular ? categoryColor : 'var(--text-primary)') }}
        >
          {plan.name}
        </motion.h3>

        {/* Price */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: index * 0.15 + 0.2, type: 'spring' }}
        >
          <motion.span 
            className="font-primary mc-glow-emerald"
            style={{ 
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
            animate={isHovered ? { scale: 1.1 } : {}}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {plan.price}
          </motion.span>
        </motion.div>

        {/* Features */}
        <motion.ul 
          className="space-y-3 mb-6"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={{
            visible: { transition: { staggerChildren: 0.05, delayChildren: index * 0.15 + 0.3 } },
          }}
        >
          {plan.features.map((feature, idx) => (
            <motion.li 
              key={idx} 
              className="flex items-start gap-2 font-primary"
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 400,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0 },
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ delay: index * 0.15 + 0.3 + idx * 0.05, type: 'spring' }}
              >
                <Check 
                  className="w-5 h-5 flex-shrink-0 mt-0.5" 
                  style={{ color: categoryColor }}
                />
              </motion.div>
              <span>{feature}</span>
            </motion.li>
          ))}
        </motion.ul>

        {/* Technical Params */}
        <AnimatePresence>
          {plan.params && (
            <motion.div 
              className="p-3 mb-6"
              style={{ background: 'var(--bg-secondary)' }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(plan.params).map(([key, value], idx) => (
                  <motion.div 
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: index * 0.15 + 0.4 + idx * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div 
                      className="font-primary"
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {key}
                    </div>
                    <div 
                      className="font-primary"
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 700,
                        color: categoryColor,
                      }}
                    >
                      {value}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA Button */}
        <motion.button
          className="w-full mt-auto font-primary flex items-center justify-center gap-2"
          style={{
            padding: '12px 24px',
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: plan.popular ? 'white' : 'var(--text-primary)',
            background: plan.popular ? categoryColor : 'var(--bg-secondary)',
            border: '3px solid',
            borderColor: plan.popular
              ? `color-mix(in srgb, ${categoryColor} 120%, white) color-mix(in srgb, ${categoryColor} 80%, black) color-mix(in srgb, ${categoryColor} 80%, black) color-mix(in srgb, ${categoryColor} 120%, white)`
              : 'color-mix(in srgb, var(--bg-secondary) 60%, black) color-mix(in srgb, var(--bg-secondary) 150%, white) color-mix(in srgb, var(--bg-secondary) 150%, white) color-mix(in srgb, var(--bg-secondary) 60%, black)',
            boxShadow: plan.popular
              ? `inset -3px -3px 0 color-mix(in srgb, ${categoryColor} 60%, black), inset 3px 3px 0 color-mix(in srgb, ${categoryColor} 120%, white), 0 0 20px ${categoryColor}40`
              : 'inset -3px -3px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 3px 3px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)',
            cursor: 'pointer',
          }}
          whileHover={{ 
            scale: 1.05,
            boxShadow: plan.popular
              ? `inset -3px -3px 0 color-mix(in srgb, ${categoryColor} 60%, black), inset 3px 3px 0 color-mix(in srgb, ${categoryColor} 120%, white), 0 0 30px ${categoryColor}60`
              : `0 0 20px ${categoryColor}40`,
          }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const element = document.querySelector('#contact');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <motion.span
            animate={isHovered ? { x: [0, -3, 3, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Zap className="w-4 h-4" />
          </motion.span>
          选择方案
        </motion.button>
      </motion.div>
    </motion.div>
  );
});

PlanCard.displayName = 'PlanCard';

export const Pricing = memo(function Pricing({ data }: PricingProps) {
  const categoryColors: Record<string, string> = {
    '博弈系统': '#9B59B6',
    '数据分析': '#3498DB',
    '网站开发': '#5D8C38',
  };

  return (
    <section id="pricing" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title={data.title}
          subtitle={data.subtitle}
        />

        {/* Pricing Categories */}
        <div className="space-y-16">
          {data.categories.map((category, catIndex) => (
            <div key={category.id}>
              {/* Category Header */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5 }}
                className="mb-8 flex items-center gap-4"
              >
                <motion.div 
                  className="w-2 h-8"
                  style={{ background: categoryColors[category.name] || 'var(--accent-primary)' }}
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: catIndex * 0.1 }}
                />
                <div>
                  <h3 
                    className="font-primary"
                    style={{
                      fontSize: 'var(--text-2xl)',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {category.name}
                  </h3>
                  <p 
                    className="font-primary"
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 400,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {category.description}
                  </p>
                </div>
              </motion.div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {category.plans.map((plan, index) => (
                  <PlanCard
                    key={plan.name}
                    plan={plan}
                    categoryColor={categoryColors[category.name] || 'var(--accent-primary)'}
                    index={catIndex * 3 + index}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 text-center font-primary"
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 400,
            color: 'var(--text-muted)',
            fontStyle: 'italic',
          }}
        >
          * {data.disclaimer}
        </motion.p>
      </div>
    </section>
  );
});
