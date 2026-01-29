import { motion } from 'framer-motion';
import { Cpu, Server, Database, Layout, Brain, Cloud, type LucideIcon } from 'lucide-react';
import { SectionTitle } from '@/components/atoms';
import type { SiteData } from '@/types';

interface TechStackProps {
  data: SiteData['techStack'];
}

const iconMap: Record<string, LucideIcon> = {
  Cpu,
  Server,
  Database,
  Layout,
  Brain,
  Cloud,
};

const getIcon = (iconName: string): LucideIcon => iconMap[iconName] || Cpu;

export function TechStack({ data }: TechStackProps) {
  return (
    <section id="tech-stack" className="relative py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title={data.title}
          subtitle={data.subtitle}
        />

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.categories.map((category: typeof data.categories[0], categoryIndex: number) => {
            const Icon = getIcon(category.icon);
            
            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                className="group"
              >
                <div className="h-full p-6 rounded-2xl bg-[#151520] border border-white/5 hover:border-indigo-500/30 transition-all duration-300">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                      <Icon />
                    </div>
                    <h3 className="text-lg font-bold text-white">{category.name}</h3>
                  </div>

                  {/* Skills */}
                  <div className="space-y-4">
                    {category.skills.map((skill, skillIndex) => (
                      <div key={skill.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-slate-300">{skill.name}</span>
                          <span className="text-xs text-slate-500">{skill.level}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${skill.level}%` }}
                            viewport={{ once: true }}
                            transition={{ 
                              duration: 1, 
                              delay: categoryIndex * 0.1 + skillIndex * 0.1,
                              ease: 'easeOut'
                            }}
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Tech Tags Cloud */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16"
        >
          <div className="text-center mb-8">
            <h3 className="text-lg font-medium text-slate-400">我们的技术生态</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {Array.from(new Set(data.categories.flatMap(c => c.skills.map(s => s.name)))).map((tech, index) => (
              <motion.span
                key={tech}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="px-4 py-2 text-sm bg-white/5 text-slate-300 rounded-xl border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/10 transition-all cursor-default"
              >
                {tech}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
