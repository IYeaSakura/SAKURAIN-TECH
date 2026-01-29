import { memo } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Sparkles } from 'lucide-react';
import { GridBackground } from '@/components/effects';
import { SectionTitle } from '@/components/atoms';
import type { SiteData } from '@/types';

interface ComparisonProps {
  data: SiteData['comparison'];
}

const stats = [
  { value: '60天', label: '严格交付周期', desc: '毕业时间窗口强制短周期' },
  { value: '100%', label: '源码交付', desc: '客户拥有完全技术主权' },
  { value: '¥150-500', label: '人天成本', desc: '无运营摊销，学生身份非盈利导向' },
];

export const Comparison = memo(function Comparison({ data }: ComparisonProps) {
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
          viewport={{ margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="overflow-x-auto"
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th
                  className="text-left py-4 px-4 text-sm font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  对比维度
                </th>
                <th
                  className="text-left py-4 px-4 text-sm font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  传统外包公司
                </th>
                <th className="text-left py-4 px-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      SAKURAIN
                    </span>
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
                  viewport={{ margin: '-50px' }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="transition-colors"
                  style={{
                    borderBottom: '1px solid color-mix(in srgb, var(--border-subtle) 50%, transparent)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'color-mix(in srgb, var(--bg-tertiary) 30%, transparent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Dimension */}
                  <td className="py-5 px-4">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {item.dimension}
                    </span>
                  </td>

                  {/* Traditional */}
                  <td className="py-5 px-4">
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--error)' }} />
                      <div>
                        <p style={{ color: 'var(--text-secondary)' }}>{item.traditional}</p>
                      </div>
                    </div>
                  </td>

                  {/* SAKURAIN */}
                  <td className="py-5 px-4">
                    <div className="flex items-start gap-3">
                      <Check
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        style={{ color: 'var(--success)' }}
                      />
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {item.sakurain}
                        </p>
                        <p className="text-sm mt-1" style={{ color: 'var(--accent-primary)' }}>
                          {item.highlight}
                        </p>
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
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="p-6 rounded-2xl text-center border"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div
                className="text-2xl font-bold mb-2"
                style={{ color: 'var(--accent-primary)' }}
              >
                {stat.value}
              </div>
              <div
                className="font-medium mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {stat.label}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {stat.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});
