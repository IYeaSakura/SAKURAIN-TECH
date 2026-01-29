import { useState } from 'react';
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

export function Services({ data }: ServicesProps) {
  const [selectedService, setSelectedService] = useState<typeof data[0] | null>(null);

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
          {data.map((service: typeof data[0], idx: number) => {
            const Icon = getIcon(service.icon);
            const isLarge = service.size === 'large';
            
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={isLarge ? 'md:col-span-2 lg:col-span-1' : ''}
              >
                <motion.div
                  className="group relative h-full p-6 rounded-2xl bg-[#151520] border border-white/5 overflow-hidden cursor-pointer"
                  whileHover={{ y: -4, borderColor: 'rgba(99, 102, 241, 0.3)' }}
                  onClick={() => service.details && setSelectedService(service)}
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getColorClass(service.color)} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  {/* Popular badge */}
                  {service.popular && (
                    <div className="absolute top-4 right-4 px-3 py-1 text-xs font-medium bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-full">
                      热门
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getColorClass(service.color)} flex items-center justify-center mb-4`}>
                    <Icon key={`icon-${service.id}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
                  <p className="text-sm text-slate-400 mb-3">{service.subtitle}</p>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{service.description}</p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {service.features.slice(0, 3).map((feature) => (
                      <span
                        key={feature}
                        className="px-2 py-1 text-xs bg-white/5 text-slate-400 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                    {service.features.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-white/5 text-slate-400 rounded">
                        +{service.features.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Price & Delivery */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                      <span className="text-lg font-bold text-indigo-400">{service.price}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Clock className="w-4 h-4" />
                      {service.delivery}
                    </div>
                  </div>

                  {/* View Details hint */}
                  {service.details && (
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-5 h-5 text-indigo-400" />
                    </div>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Service Detail Modal */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedService(null)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-auto bg-[#12121a] rounded-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-[#12121a]/95 backdrop-blur border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getColorClass(selectedService.color)} flex items-center justify-center`}>
                    {(() => {
                      const Icon = getIcon(selectedService.icon);
                      return <Icon key={`modal-icon-${selectedService.id}`} />;
                    })()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedService.title}</h3>
                    <p className="text-sm text-slate-400">{selectedService.subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedService(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {selectedService.details?.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-8">
                    <h4 className="text-lg font-semibold text-white mb-4">{section.title}</h4>
                    
                    {/* Items Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">模块</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">功能描述</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">价格</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.items.map((item, itemIndex) => (
                            <tr key={itemIndex} className="border-b border-white/5 hover:bg-white/[0.02]">
                              <td className="py-3 px-4 text-white font-medium">{item.name}</td>
                              <td className="py-3 px-4 text-slate-400 text-sm">{item.desc}</td>
                              <td className="py-3 px-4 text-right text-indigo-400 font-medium">{item.price}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-white/[0.03]">
                            <td colSpan={2} className="py-3 px-4 text-right text-slate-400">套餐总价</td>
                            <td className="py-3 px-4 text-right text-xl font-bold text-indigo-400">{section.total}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Performance Metrics */}
                    {section.performance && (
                      <div className="mt-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <p className="text-sm text-indigo-300">
                          <span className="font-medium">性能指标：</span>
                          {section.performance}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Tech Stack */}
                <div className="mt-6 pt-6 border-t border-white/5">
                  <h4 className="text-sm font-medium text-slate-400 mb-3">技术栈</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedService.tech.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 text-sm bg-white/5 text-slate-300 rounded-lg border border-white/5"
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
                    onClick={() => setSelectedService(null)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-center rounded-xl font-medium"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    咨询此服务
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
