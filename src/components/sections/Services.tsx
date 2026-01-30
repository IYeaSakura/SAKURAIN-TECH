import { useState, memo, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useInView } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Brain, BarChart3, Globe, GraduationCap, Gamepad2, Shield,
  X, Clock, Code2, ArrowRight, Pickaxe, Sword, Axe, Sparkles
} from 'lucide-react';
import { GridBackground } from '@/components/effects';
import { SectionTitle } from '@/components/atoms';
import type { SiteData } from '@/types';

interface ServicesProps {
  data: SiteData['services'];
}

const iconMap: Record<string, LucideIcon> = {
  Brain,
  BarChart3,
  Globe,
  GraduationCap,
  Gamepad2,
  Shield,
  Pickaxe,
  Sword,
  Axe,
};

const getIcon = (iconName: string): LucideIcon => iconMap[iconName] || Code2;

const colorMap: Record<string, string> = {
  purple: '#9B59B6',
  blue: '#3498DB',
  green: '#5D8C38',
  orange: '#E67E22',
  cyan: '#1ABC9C',
  red: '#C0392B',
};

const getColor = (color: string): string => colorMap[color] || colorMap.green;

// 3D Tilt Card Component
const ServiceCard = memo(({
  service,
  index,
  onSelect,
}: {
  service: SiteData['services'][0];
  index: number;
  onSelect: (service: SiteData['services'][0]) => void;
}) => {
  const Icon = useMemo(() => getIcon(service.icon), [service.icon]);
  const color = useMemo(() => getColor(service.color), [service.color]);
  const isLarge = service.size === 'large';
  
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  
  const [isHovered, setIsHovered] = useState(false);
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
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        type: 'spring',
        stiffness: 100,
      }}
      className={isLarge ? 'md:col-span-2 lg:col-span-1' : ''}
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="group relative h-full p-6 mc-panel cursor-pointer"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          borderColor: isHovered ? color : undefined,
          boxShadow: isHovered 
            ? `0 25px 50px -12px ${color}40, inset -4px -4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 4px 4px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)`
            : undefined,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ y: -8, scale: 1.02 }}
        onClick={() => service.details && onSelect(service)}
        transition={{ duration: 0.3 }}
      >
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${color}10 45%, ${color}20 50%, ${color}10 55%, transparent 60%)`,
            transform: 'translateX(-100%)',
          }}
          animate={isHovered ? { x: '200%' } : { x: '-100%' }}
          transition={{ duration: 0.6 }}
        />

        {/* Popular badge */}
        {service.popular && (
          <motion.div 
            className="absolute -top-3 right-4 z-10"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: index * 0.1 + 0.3 }}
            style={{
              padding: '4px 12px',
              background: 'var(--mc-gold)',
              border: '2px solid',
              borderColor: 'color-mix(in srgb, var(--mc-gold) 120%, white) color-mix(in srgb, var(--mc-gold) 80%, black) color-mix(in srgb, var(--mc-gold) 80%, black) color-mix(in srgb, var(--mc-gold) 120%, white)',
              fontFamily: 'var(--font-primary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              color: 'white',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 0 15px rgba(212, 160, 23, 0.4)',
            }}
          >
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              专长
            </motion.span>
          </motion.div>
        )}

        {/* Icon Box with rotation */}
        <motion.div
          className="mc-icon-box mb-4"
          style={{
            borderColor: color,
            boxShadow: `inset -3px -3px 0 ${color}40, inset 3px 3px 0 ${color}80`,
            transform: 'translateZ(30px)',
          }}
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.6 }}
        >
          <Icon className="w-8 h-8" style={{ color }} />
        </motion.div>

        {/* Content */}
        <motion.h3 
          className="mb-2 font-primary"
          style={{ 
            fontSize: 'var(--text-xl)',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            transform: 'translateZ(20px)',
          }}
        >
          {service.title}
        </motion.h3>
        <motion.p 
          className="mb-2 font-primary"
          style={{ 
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            letterSpacing: '0.01em',
            transform: 'translateZ(15px)',
          }}
        >
          {service.subtitle}
        </motion.p>
        <motion.p 
          className="mb-4 line-clamp-2 font-primary"
          style={{ 
            fontSize: 'var(--text-sm)',
            fontWeight: 400,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            transform: 'translateZ(10px)',
          }}
        >
          {service.description}
        </motion.p>

        {/* Features with stagger */}
        <motion.div 
          className="flex flex-wrap gap-2 mb-4"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={{
            visible: { transition: { staggerChildren: 0.05, delayChildren: index * 0.1 + 0.2 } },
          }}
        >
          {service.features.slice(0, 3).map((feature) => (
            <motion.span
              key={feature}
              className="px-2 py-1 font-primary"
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                background: 'var(--bg-secondary)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                letterSpacing: '0.02em',
              }}
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: { opacity: 1, scale: 1 },
              }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {feature}
            </motion.span>
          ))}
          {service.features.length > 3 && (
            <motion.span
              className="px-2 py-1 font-primary"
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                background: 'var(--bg-secondary)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
              }}
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: { opacity: 1, scale: 1 },
              }}
            >
              +{service.features.length - 3}
            </motion.span>
          )}
        </motion.div>

        {/* Price & Delivery */}
        <motion.div
          className="flex items-center justify-between pt-4"
          style={{ borderTop: '2px solid var(--border-subtle)' }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: index * 0.1 + 0.4 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <span
              className="font-primary"
              style={{ 
                fontSize: 'var(--text-lg)',
                fontWeight: 800,
                color: color,
                letterSpacing: '-0.01em',
              }}
            >
              {service.price}
            </span>
          </motion.div>
          <div
            className="flex items-center gap-1 font-primary"
            style={{ 
              color: 'var(--text-muted)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
            }}
          >
            <Clock className="w-4 h-4" />
            <span>{service.delivery}</span>
          </div>
        </motion.div>

        {/* Arrow indicator with animation */}
        {service.details && (
          <motion.div 
            className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity"
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <ArrowRight className="w-5 h-5" style={{ color }} />
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
});

ServiceCard.displayName = 'ServiceCard';

// Enhanced Service Modal
const ServiceModal = memo(({
  service,
  onClose,
}: {
  service: SiteData['services'][0];
  onClose: () => void;
}) => {
  const Icon = useMemo(() => getIcon(service.icon), [service.icon]);
  const color = useMemo(() => getColor(service.color), [service.color]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 mc-modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50, rotateX: -15 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50, rotateX: 15 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto mc-modal p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ perspective: 1000 }}
      >
        {/* Close button */}
        <motion.button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          whileHover={{ 
            scale: 1.1, 
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
          }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-6 h-6" />
        </motion.button>

        {/* Header */}
        <motion.div 
          className="flex items-center gap-4 mb-6"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            className="mc-icon-box"
            style={{
              borderColor: color,
              boxShadow: `inset -3px -3px 0 ${color}40, inset 3px 3px 0 ${color}80`,
            }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          >
            <Icon className="w-8 h-8" style={{ color }} />
          </motion.div>
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
              {service.title}
            </h3>
            <p 
              className="font-primary"
              style={{ 
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--text-secondary)',
              }}
            >
              {service.subtitle}
            </p>
          </div>
        </motion.div>

        {/* Content sections with stagger */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
          }}
        >
          {/* Description */}
          <motion.p 
            className="mb-6 font-primary"
            style={{ 
              fontSize: 'var(--text-base)',
              fontWeight: 400,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
            }}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            {service.description}
          </motion.p>

          {/* Tech Stack */}
          <motion.div className="mb-6" variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}>
            <h4 className="mb-3 font-primary" style={{ 
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              技术栈
            </h4>
            <div className="flex flex-wrap gap-2">
              {service.tech.map((tech, idx) => (
                <motion.span
                  key={tech}
                  className="px-3 py-1 font-primary"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '2px solid var(--border-subtle)',
                    letterSpacing: '0.02em',
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  whileHover={{ 
                    scale: 1.05, 
                    borderColor: color,
                    color: color,
                  }}
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Features */}
          <motion.div className="mb-6" variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}>
            <h4 className="mb-3 font-primary" style={{ 
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              服务特性
            </h4>
            <ul className="space-y-2">
              {service.features.map((feature, idx) => (
                <motion.li
                  key={feature}
                  className="flex items-center gap-2 font-primary"
                  style={{ 
                    fontSize: 'var(--text-base)',
                    fontWeight: 400,
                    color: 'var(--text-secondary)',
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.05 }}
                >
                  <motion.span 
                    style={{ color }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
                  >
                    ▸
                  </motion.span>
                  {feature}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* CTA */}
          <motion.div 
            className="mt-8 pt-6"
            style={{ borderTop: '2px solid var(--border-subtle)' }}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span 
                  className="font-primary"
                  style={{ 
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                  }}
                >
                  价格
                </span>
                <motion.div 
                  className="font-primary"
                  style={{ 
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 800,
                    color,
                    letterSpacing: '-0.01em',
                  }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {service.price}
                </motion.div>
              </div>
              <motion.a
                href="#contact"
                onClick={onClose}
                className="mc-btn mc-btn-gold font-primary"
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                立即咨询
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});

ServiceModal.displayName = 'ServiceModal';

export const Services = memo(function Services({ data }: ServicesProps) {
  const [selectedService, setSelectedService] = useState<SiteData['services'][0] | null>(null);

  const handleSelect = useCallback((service: SiteData['services'][0]) => {
    setSelectedService(service);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedService(null);
  }, []);

  return (
    <section id="services" className="relative py-24 lg:py-32 overflow-hidden">
      <GridBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="服务项目"
          subtitle="专业的技术解决方案，助力您的项目成功"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={index}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedService && (
          <ServiceModal
            service={selectedService}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </section>
  );
});
