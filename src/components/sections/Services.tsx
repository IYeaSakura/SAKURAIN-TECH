import { useState, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Brain, BarChart3, Globe, GraduationCap, Gamepad2, Shield,
  X, Clock, Code2, ArrowRight, Pickaxe, Sword, Axe
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

// Minecraft-style color mapping
const colorMap: Record<string, string> = {
  purple: '#9B59B6', // Amethyst
  blue: '#3498DB',   // Diamond
  green: '#5D8C38',  // Emerald/Grass
  orange: '#E67E22', // Copper
  cyan: '#1ABC9C',   // Prismarine
  red: '#C0392B',    // Redstone
};

const getColor = (color: string): string => colorMap[color] || colorMap.green;

// Memoized service card component
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={isLarge ? 'md:col-span-2 lg:col-span-1' : ''}
    >
      <motion.div
        className="group relative h-full p-6 mc-panel cursor-pointer"
        whileHover={{ y: -4 }}
        onClick={() => service.details && onSelect(service)}
      >
        {/* Popular badge */}
        {service.popular && (
          <div className="absolute -top-3 right-4 mc-badge mc-badge-gold z-10">
            热门
          </div>
        )}

        {/* Icon Box */}
        <div
          className="mc-icon-box mb-4"
          style={{
            borderColor: color,
            boxShadow: `inset -3px -3px 0 ${color}40, inset 3px 3px 0 ${color}80`,
          }}
        >
          <Icon className="w-8 h-8" style={{ color }} />
        </div>

        {/* Content */}
        <h3 
          className="text-2xl font-bold mb-2" 
          style={{ 
            color: 'var(--text-primary)',
            fontWeight: 800,
            letterSpacing: '0.02em',
          }}
        >
          {service.title}
        </h3>
        <p 
          className="mb-2" 
          style={{ 
            color: 'var(--text-secondary)',
            fontWeight: 600,
          }}
        >
          {service.subtitle}
        </p>
        <p 
          className="mb-4 line-clamp-2" 
          style={{ 
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          {service.description}
        </p>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          {service.features.slice(0, 3).map((feature) => (
            <span
              key={feature}
              className="px-2 py-1 text-sm mc-badge"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-muted)',
              }}
            >
              {feature}
            </span>
          ))}
          {service.features.length > 3 && (
            <span
              className="px-2 py-1 text-sm mc-badge"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-muted)',
              }}
            >
              +{service.features.length - 3}
            </span>
          )}
        </div>

        {/* Price & Delivery */}
        <div
          className="flex items-center justify-between pt-4"
          style={{ borderTop: '2px solid var(--border-subtle)' }}
        >
          <div>
            <span
              className="text-xl font-bold"
              style={{ color: 'var(--accent-primary)' }}
            >
              {service.price}
            </span>
          </div>
          <div
            className="flex items-center gap-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <Clock className="w-4 h-4" />
            <span className="text-sm">{service.delivery}</span>
          </div>
        </div>

        {/* Arrow indicator */}
        {service.details && (
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});

ServiceCard.displayName = 'ServiceCard';

// Service Detail Modal
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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto mc-modal p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded transition-colors"
        >
          <X className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="mc-icon-box"
            style={{
              borderColor: color,
              boxShadow: `inset -3px -3px 0 ${color}40, inset 3px 3px 0 ${color}80`,
            }}
          >
            <Icon className="w-8 h-8" style={{ color }} />
          </div>
          <div>
            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {service.title}
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>{service.subtitle}</p>
          </div>
        </div>

        {/* Description */}
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          {service.description}
        </p>

        {/* Tech Stack */}
        <div className="mb-6">
          <h4 className="text-lg font-bold mb-3 mc-badge" style={{ display: 'inline-flex' }}>
            技术栈
          </h4>
          <div className="flex flex-wrap gap-2">
            {service.tech.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 mc-badge"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h4 className="text-lg font-bold mb-3 mc-badge" style={{ display: 'inline-flex' }}>
            服务特性
          </h4>
          <ul className="space-y-2">
            {service.features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span style={{ color: 'var(--accent-primary)' }}>▸</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Details Sections */}
        {service.details && service.details.sections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-6">
            <h4 className="text-lg font-bold mb-3 mc-badge" style={{ display: 'inline-flex' }}>
              {section.title}
            </h4>
            <div className="space-y-3">
              {section.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className="flex items-start gap-3 p-3 mc-panel"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <span
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center mc-badge"
                    style={{
                      background: 'var(--accent-primary)',
                      color: 'white',
                      padding: '0',
                      width: '24px',
                      height: '24px',
                    }}
                  >
                    {itemIdx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      {item.name}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {item.desc}
                    </div>
                    <div className="text-sm font-bold mt-1" style={{ color: 'var(--accent-primary)' }}>
                      {item.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {section.total && (
              <div className="mt-3 p-3 mc-panel" style={{ background: 'var(--accent-primary)', color: 'white' }}>
                <div className="flex justify-between items-center">
                  <span className="font-bold">总计</span>
                  <span className="font-bold">{section.total}</span>
                </div>
              </div>
            )}
            {section.performance && (
              <div className="mt-3 p-3 mc-badge" style={{ display: 'inline-flex', background: 'var(--bg-secondary)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{section.performance}</span>
              </div>
            )}
          </div>
        ))}

        {/* CTA */}
        <div className="mt-8 pt-6" style={{ borderTop: '2px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>价格</span>
              <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                {service.price}
              </div>
            </div>
            <a
              href="#contact"
              onClick={onClose}
              className="mc-btn mc-btn-gold"
            >
              立即咨询
            </a>
          </div>
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
