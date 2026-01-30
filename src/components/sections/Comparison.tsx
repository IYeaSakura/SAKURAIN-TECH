import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles } from 'lucide-react';
import { SectionTitle } from '@/components/atoms';
import type { SiteData } from '@/types';

interface ComparisonProps {
  data: SiteData['comparison'];
}

export const Comparison = memo(function Comparison({ data }: ComparisonProps) {
  return (
    <section id="comparison" className="relative py-24 lg:py-32 overflow-hidden">
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
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th 
                  className="text-left py-4 px-4 font-primary"
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
                </th>
                <th 
                  className="text-left py-4 px-4 font-primary"
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
                </th>
                <th 
                  className="text-left py-4 px-4 font-primary"
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
                    <Sparkles className="w-4 h-4" />
                    SAKURAIN
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
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group"
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <td className="py-5 px-4">
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
                  </td>
                  <td className="py-5 px-4">
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
                  </td>
                  <td className="py-5 px-4">
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
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 p-8 mc-panel text-center"
        >
          <h3 
            className="mb-4 font-primary"
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            准备好体验不同的开发服务了吗？
          </h3>
          <p 
            className="mb-6 font-primary max-w-2xl mx-auto"
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 400,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
            }}
          >
            选择 SAKURAIN，获得更专业、更可靠、更高效的技术解决方案
          </p>
          <motion.button
            onClick={() => {
              const element = document.querySelector('#contact');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mc-btn mc-btn-gold font-primary"
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            立即咨询
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
});
