import { motion } from 'framer-motion';
import { Mail, Clock, Github, Send, ChevronRight, type LucideIcon } from 'lucide-react';
import { ParticleBackground } from '@/components/effects';
import { SectionTitle } from '@/components/atoms';
import type { SiteData } from '@/types';

interface ContactProps {
  data: SiteData['contact'];
}

const iconMap: Record<string, LucideIcon> = {
  Github,
  Send,
};

const getIcon = (iconName: string): LucideIcon => iconMap[iconName] || Github;

export function Contact({ data }: ContactProps) {
  return (
    <section id="contact" className="relative py-24 lg:py-32 overflow-hidden">
      <ParticleBackground />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-transparent to-[#0a0a0f] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title={data.title}
          subtitle={data.subtitle}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Terminal Style Card */}
            <div className="rounded-2xl overflow-hidden bg-[#12121a] border border-white/10">
              {/* Terminal Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-4 text-xs text-slate-500 font-mono">contact@sakurain.tech</span>
              </div>

              {/* Terminal Content */}
              <div className="p-6 font-mono text-sm">
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-400">$</span>
                    <span className="text-slate-300">echo &quot;欢迎联系 SAKURAIN&quot;</span>
                  </div>
                  <div className="text-slate-400 pl-4">
                    欢迎联系 SAKURAIN
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-indigo-400">$</span>
                    <span className="text-slate-300">cat contact_info.json</span>
                  </div>
                  <div className="pl-4 text-slate-400">
                    <pre className="text-xs">
{`{
  "email": "${data.email}",
  "response_time": "${data.responseTime}",
  "team_size": "8人",
  "location": "高校技术团队"
}`}
                    </pre>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-indigo-400">$</span>
                    <span className="text-slate-300">./send_inquiry.sh</span>
                  </div>
                  <div className="pl-4">
                    <span className="text-emerald-400">准备就绪，等待您的消息...</span>
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="inline-block w-2 h-4 bg-indigo-400 ml-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-[#151520] border border-white/5">
                <Mail className="w-5 h-5 text-indigo-400 mb-2" />
                <div className="text-sm text-slate-400">邮箱</div>
                <div className="text-sm text-white font-mono truncate">{data.email}</div>
              </div>
              <div className="p-4 rounded-xl bg-[#151520] border border-white/5">
                <Clock className="w-5 h-5 text-indigo-400 mb-2" />
                <div className="text-sm text-slate-400">响应时间</div>
                <div className="text-sm text-white">{data.responseTime}</div>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6">
              <div className="text-sm text-slate-400 mb-3">关注我们</div>
              <div className="flex gap-3">
                {data.social.map((platform: typeof data.social[0], idx: number) => {
                  const Icon = getIcon(platform.icon);
                  return (
                    <motion.a
                      key={`${platform.platform}-${idx}` as string}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon />
                      <span className="text-sm">{platform.platform}</span>
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-6 lg:p-8 rounded-2xl bg-[#151520] border border-white/5">
              <h3 className="text-xl font-bold text-white mb-6">发送咨询</h3>
              
              <form 
                action={`mailto:${data.email}`}
                method="post"
                encType="text/plain"
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm text-slate-400 mb-2">您的姓名</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="请输入您的姓名"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">联系邮箱</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">项目类型</label>
                  <select
                    name="project_type"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#12121a]">请选择项目类型</option>
                    <option value="game-theory" className="bg-[#12121a]">博弈程序开发</option>
                    <option value="data-analysis" className="bg-[#12121a]">数据分析系统</option>
                    <option value="web-dev" className="bg-[#12121a]">网站开发</option>
                    <option value="graduation" className="bg-[#12121a]">毕业设计</option>
                    <option value="other" className="bg-[#12121a]">其他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">项目描述</label>
                  <textarea
                    name="description"
                    rows={4}
                    placeholder="请简要描述您的项目需求..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                  />
                </div>

                <motion.button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  发送邮件咨询
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </form>

              <p className="mt-4 text-xs text-slate-500 text-center">
                {data.note}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
