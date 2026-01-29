import { motion } from 'framer-motion';
import { X, Check, Sparkles } from 'lucide-react';
import { GridBackground } from '@/components/effects';
import { SectionTitle } from '@/components/atoms';
import type { SiteData } from '@/types';

interface ComparisonProps {
  data: SiteData['comparison'];
}

export function Comparison({ data }: ComparisonProps) {
  return (
    <section className="relative py-24 lg:py-32">
      <GridBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title={data.title}
          subtitle={data.subtitle}
        />

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="overflow-x-auto"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">对比维度</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">传统外包公司</th>
                <th className="text-left py-4 px-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium text-indigo-400">SAKURAIN</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <motion.tr
                  key={item.dimension}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Dimension */}
                  <td className="py-5 px-4">
                    <span className="font-medium text-white">{item.dimension}</span>
                  </td>

                  {/* Traditional */}
                  <td className="py-5 px-4">
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-slate-400">{item.traditional}</p>
                      </div>
                    </div>
                  </td>

                  {/* SAKURAIN */}
                  <td className="py-5 px-4">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white font-medium">{item.sakurain}</p>
                        <p className="text-sm text-indigo-400 mt-1">{item.highlight}</p>
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { value: '60天', label: '严格交付周期', desc: '毕业时间窗口强制短周期' },
            { value: '100%', label: '源码交付', desc: '客户拥有完全技术主权' },
            { value: '¥150-500', label: '人天成本', desc: '无运营摊销，学生身份非盈利导向' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="p-6 rounded-2xl bg-[#151520] border border-white/5 text-center"
            >
              <div className="text-2xl font-bold text-indigo-400 mb-2">{stat.value}</div>
              <div className="text-white font-medium mb-1">{stat.label}</div>
              <div className="text-sm text-slate-500">{stat.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
