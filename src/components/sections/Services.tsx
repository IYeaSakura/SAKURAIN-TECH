import { useState, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Brain, BarChart3, Globe, GraduationCap, Gamepad2, Shield,
  X, Clock, Code2, ArrowRight
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
};

const getIcon = (iconName: string): LucideIcon => iconMap[iconName] || Code2;

const colorMap: Record<string, string> = {
  purple: 'from-purple-500 to-violet-500',
  blue: 'from-blue-500 to-cyan-500',
  green: 'from-emerald-500 to-teal-500',
  orange: 'from-orange-500 to-amber-500',
  cyan: 'from-cyan-500 to-sky-500',
  red: 'from-red-500 to-rose-500',
};

const getColorClass = (color: string): string => colorMap[color] || colorMap.purple;

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
  const isLarge = service.size === 'large';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={isLarge ? 'md:col-span-2 lg:col-span-1' : ''}
    >
      <motion.div
        className="group relative h-full p-6 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
        }}
        whileHover={{
          y: -4,
          borderColor: 'color-mix(in srgb, var(--accent-primary) 30%, transparent)',
        }}
        onClick={() => service.details && onSelect(service)}
      >
        {/* Gradient overlay on hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${getColorClass(service.color)} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
        />

        {/* Popular badge */}
        {service.popular && (
          <div
            className="absolute top-4 right-4 px-3 py-1 text-xs font-medium text-white rounded-full"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            }}
          >
            热门
          </div>
        )}

        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getColorClass(service.color)} flex items-center justify-center mb-4`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {service.title}
        </h3>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          {service.subtitle}
        </p>
        <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
          {service.description}
        </p>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          {service.features.slice(0, 3).map((feature) => (
            <span
              key={feature}
              className="px-2 py-1 text-xs rounded"
              style={{
                background: 'color-mix(in srgb, var(--bg-tertiary) 50%, transparent)',
                color: 'var(--text-muted)',
              }}
            >
              {feature}
            </span>
          ))}
          {service.features.length > 3 && (
            <span
              className="px-2 py-1 text-xs rounded"
              style={{
                background: 'color-mix(in srgb, var(--bg-tertiary) 50%, transparent)',
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
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div>
            <span
              className="text-lg font-bold"
              style={{ color: 'var(--accent-primary)' }}
            >
              {service.price}
            </span>
          </div>
          <div
            className="flex items-center gap-1 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            <Clock className="w-4 h-4" />
            {service.delivery}
          </div>
        </div>

        {/* View Details hint */}
        {service.details && (
          <div
            className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--accent-primary)' }}
          >
            <ArrowRight className="w-5 h-5" />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});

ServiceCard.displayName = 'ServiceCard';

// Memoized modal component
const ServiceModal = memo(({
  service,
  onClose,
}: {
  service: SiteData['services'][0];
  onClose: () => void;
}) => {
  const Icon = useMemo(() => getIcon(service.icon), [service.icon]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'color-mix(in srgb, var(--bg-primary) 80%, transparent)' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-6 backdrop-blur"
          style={{
            background: 'color-mix(in srgb, var(--bg-secondary) 95%, transparent)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getColorClass(service.color)} flex items-center justify-center`}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {service.title}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {service.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'color-mix(in srgb, var(--bg-tertiary) 50%, transparent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {service.details?.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-8">
              <h4 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                {section.title}
              </h4>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>模块</th>
                      <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>功能描述</th>
                      <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>价格</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item, itemIndex) => (
                      <tr
                        key={itemIndex}
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        className="hover:bg-opacity-50"
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background = 'color-mix(in srgb, var(--bg-tertiary) 20%, transparent)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                        }}
                      >
                        <td className="py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</td>
                        <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{item.desc}</td>
                        <td className="py-3 px-4 text-right font-medium" style={{ color: 'var(--accent-primary)' }}>{item.price}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'color-mix(in srgb, var(--bg-tertiary) 30%, transparent)' }}>
                      <td colSpan={2} className="py-3 px-4 text-right" style={{ color: 'var(--text-muted)' }}>套餐总价</td>
                      <td className="py-3 px-4 text-right text-xl font-bold" style={{ color: 'var(--accent-primary)' }}>{section.total}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Performance Metrics */}
              {section.performance && (
                <div
                  className="mt-4 p-4 rounded-xl"
                  style={{
                    background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)',
                  }}
                >
                  <p className="text-sm" style={{ color: 'var(--accent-primary)' }}>
                    <span className="font-medium">性能指标：</span>
                    {section.performance}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Tech Stack */}
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>技术栈</h4>
            <div className="flex flex-wrap gap-2">
              {service.tech.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1.5 text-sm rounded-lg"
                  style={{
                    background: 'color-mix(in srgb, var(--bg-tertiary) 50%, transparent)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 flex gap-4">
            <motion.a
              href="#contact"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-center rounded-xl font-medium text-white"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              咨询此服务
            </motion.a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

ServiceModal.displayName = 'ServiceModal';

export const Services = memo(function Services({ data }: ServicesProps) {
  const [selectedService, setSelectedService] = useState<typeof data[0] | null>(null);

  const handleSelectService = useCallback((service: typeof data[0]) => {
    setSelectedService(service);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedService(null);
  }, []);

  return (
    <section id="services" className="relative py-24 lg:py-32">
      <GridBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="核心服务"
          subtitle="从博弈算法到数据分析，提供全栈技术解决方案"
        />

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((service, idx) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={idx}
              onSelect={handleSelectService}
            />
          ))}
        </div>
      </div>

      {/* Service Detail Modal */}
      <AnimatePresence>
        {selectedService && (
          <ServiceModal
            service={selectedService}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </section>
  );
});
