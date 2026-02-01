import { useState, memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Brain, BarChart3, Globe, GraduationCap, Gamepad2, Shield,
  X, Clock, Code2, ArrowRight, Pickaxe, Sword, Axe, Sparkles
} from 'lucide-react';
import { 
  GridBackground, 
  AmbientGlow,
  SparkEffect,
  FloatingBubbles,
  TwinklingStars,
} from '@/components/effects';
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
  const [isInView, setIsInView] = useState(false);
  
  // 使用 IntersectionObserver 替代 framer-motion 的 useInView 以减少依赖
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // 只触发一次
        }
      },
      { rootMargin: '-50px', threshold: 0.1 }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !isInView) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 20;
    const y = (e.clientY - rect.top - rect.height / 2) / 20;
    mouseX.set(x);
    mouseY.set(y);
  }, [isInView, mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }, [mouseX]);

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
      className={`h-full ${isLarge ? 'md:col-span-2 lg:col-span-1' : ''}`}
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="group relative h-[420px] p-6 mc-panel cursor-pointer flex flex-col"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          borderColor: isHovered ? color : undefined,
          boxShadow: isHovered 
            ? `0 25px 50px -12px ${color}40, 0 0 30px ${color}20, inset -4px -4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 4px 4px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)`
            : undefined,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ y: -8, scale: 1.02 }}
        onClick={() => service.details && onSelect(service)}
        transition={{ duration: 0.3 }}
      >
        {/* Glow background */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${color}20, transparent 60%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${color}15 45%, ${color}30 50%, ${color}15 55%, transparent 60%)`,
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
          className="mb-2 font-primary line-clamp-1"
          style={{ 
            fontSize: 'var(--text-xl)',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            transform: 'translateZ(20px)',
            height: '1.3em',
          }}
        >
          {service.title}
        </motion.h3>
        <motion.p 
          className="mb-2 font-primary line-clamp-1"
          style={{ 
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            letterSpacing: '0.01em',
            transform: 'translateZ(15px)',
            height: '1.5em',
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
          className="flex flex-wrap gap-2 mb-4 overflow-hidden"
          style={{ maxHeight: '90px' }}
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
          className="flex items-center justify-between pt-4 mt-auto"
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

// Enhanced Service Modal with full detail sections
const ServiceModal = memo(({
  service,
  onClose,
}: {
  service: SiteData['services'][0];
  onClose: () => void;
}) => {
  const Icon = useMemo(() => getIcon(service.icon), [service.icon]);
  const color = useMemo(() => getColor(service.color), [service.color]);
  const details = service.details;

  // 禁止背景滚动当模态框打开时
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 mc-modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto mc-modal p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderRadius: '12px',
        }}
      >
        {/* Close button - 改进移动端位置 */}
        <motion.button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-lg transition-colors z-10"
          style={{ 
            color: 'var(--text-muted)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
          whileHover={{ 
            scale: 1.1, 
            backgroundColor: color,
            color: '#fff',
          }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </motion.button>

        {/* Header */}
        <motion.div 
          className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6 pr-10 sm:pr-12"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `${color}20`,
              border: `2px solid ${color}`,
              boxShadow: `0 0 20px ${color}40`,
            }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Icon className="w-5 h-5 sm:w-7 sm:h-7" style={{ color }} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <h3 
              className="font-primary text-lg sm:text-2xl font-black mb-1 truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {service.title}
            </h3>
            <p 
              className="font-primary text-xs sm:text-sm mb-2 truncate"
              style={{ color: 'var(--text-secondary)' }}
            >
              {service.subtitle}
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {service.features.slice(0, 3).map((feature) => (
                <span
                  key={feature}
                  className="px-1.5 sm:px-2 py-0.5 rounded-md font-primary text-xs"
                  style={{
                    background: `${color}15`,
                    color: color,
                    border: `1px solid ${color}30`,
                  }}
                >
                  {feature.split(' ')[0]}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="font-primary text-xs" style={{ color: 'var(--text-muted)' }}>价格</div>
            <div className="font-primary text-xl font-black" style={{ color }}>
              {service.price}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-4 sm:space-y-6">
          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-3 sm:p-4 rounded-lg sm:rounded-xl"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <p className="font-primary text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {service.description}
            </p>
          </motion.div>

          {/* Detail Sections */}
          {details?.sections.map((section, sectionIdx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + sectionIdx * 0.1 }}
              className="rounded-lg sm:rounded-xl overflow-hidden"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {/* Section Header */}
              <div 
                className="px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between"
                style={{
                  background: `linear-gradient(135deg, ${color}15, transparent)`,
                  borderBottom: `1px solid ${color}20`,
                }}
              >
                <h4 className="font-primary text-xs sm:text-sm font-bold" style={{ color }}>
                  {section.title}
                </h4>
                {section.total && (
                  <span className="font-primary text-xs sm:text-sm font-black" style={{ color }}>
                    {section.total}
                  </span>
                )}
              </div>

              {/* Items List */}
              <div className="p-2 sm:p-4">
                <div className="space-y-2 sm:space-y-3">
                  {section.items.map((item, itemIdx) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + sectionIdx * 0.1 + itemIdx * 0.05 }}
                      className="flex items-center justify-between gap-2 sm:gap-4 p-2 sm:p-3 rounded-md sm:rounded-lg"
                      style={{ background: 'var(--bg-secondary)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-primary text-xs sm:text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                          {item.name}
                        </div>
                        <div className="font-primary text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {item.desc}
                        </div>
                      </div>
                      <div className="font-primary text-xs sm:text-sm font-bold flex-shrink-0" style={{ color }}>
                        {item.price}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Performance Note */}
                {section.performance && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-3 sm:mt-4 p-2 sm:p-3 rounded-md sm:rounded-lg flex items-start gap-2"
                    style={{
                      background: `${color}10`,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" style={{ color }} />
                    <span className="font-primary text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {section.performance}
                    </span>
                  </motion.div>
                )}


              </div>
            </motion.div>
          ))}

          {/* Tech Stack */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h4 className="font-primary text-xs font-bold uppercase tracking-wider mb-2 sm:mb-3" style={{ color: 'var(--text-muted)' }}>
              技术栈
            </h4>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {service.tech.map((tech, idx) => (
                <motion.span
                  key={tech}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg font-primary text-xs sm:text-sm font-medium"
                  style={{
                    background: `${color}15`,
                    color: color,
                    border: `1px solid ${color}30`,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45 + idx * 0.03 }}
                  whileHover={{ scale: 1.05, background: `${color}25` }}
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Delivery & Price - 移动端适配 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center gap-4 sm:gap-6">
              <div>
                <div className="font-primary text-xs" style={{ color: 'var(--text-muted)' }}>交付周期</div>
                <div className="font-primary text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {service.delivery}
                </div>
              </div>
              {/* 移动端显示价格 */}
              <div className="sm:hidden">
                <div className="font-primary text-xs" style={{ color: 'var(--text-muted)' }}>价格</div>
                <div className="font-primary text-lg font-black" style={{ color }}>
                  {service.price}
                </div>
              </div>
            </div>
            <motion.a
              href="#contact"
              onClick={onClose}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-primary font-bold text-sm text-center"
              style={{
                background: color,
                color: '#fff',
                boxShadow: `0 4px 20px ${color}40`,
              }}
              whileHover={{ scale: 1.05, boxShadow: `0 6px 30px ${color}60` }}
              whileTap={{ scale: 0.95 }}
            >
              立即咨询
            </motion.a>
          </motion.div>
        </div>
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
      
      {/* Ambient glow effects */}
      <AmbientGlow position="top-right" color="var(--accent-primary)" size={400} opacity={0.15} />
      <AmbientGlow position="bottom-left" color="var(--accent-secondary)" size={300} opacity={0.12} />
      <AmbientGlow position="center" color="var(--accent-tertiary)" size={500} opacity={0.08} />
      
      {/* 浮动气泡背景 */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <FloatingBubbles count={10} colors={['var(--accent-primary)', 'var(--accent-secondary)']} />
      </div>
      
      {/* 闪烁星星 */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        <TwinklingStars count={30} color="var(--accent-secondary)" secondaryColor="var(--accent-tertiary)" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="服务项目"
          subtitle="专业的技术解决方案，助力您的项目成功"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((service, index) => (
            <SparkEffect key={service.id} sparkCount={3} color={getColor(service.color)}>
              <ServiceCard
                service={service}
                index={index}
                onSelect={handleSelect}
              />
            </SparkEffect>
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
