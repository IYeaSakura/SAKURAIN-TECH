import { memo, useMemo } from 'react';
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

// Memoized social link component
const SocialLink = memo(({
  platform,
}: {
  platform: SiteData['contact']['social'][0];
}) => {
  const Icon = useMemo(() => getIcon(platform.icon), [platform.icon]);

  return (
    <motion.a
      href={platform.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
      style={{
        background: 'color-mix(in srgb, var(--bg-card) 50%, transparent)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-subtle)',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'color-mix(in srgb, var(--bg-tertiary) 50%, transparent)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'color-mix(in srgb, var(--bg-card) 50%, transparent)';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm">{platform.platform}</span>
    </motion.a>
  );
});

SocialLink.displayName = 'SocialLink';

export const Contact = memo(function Contact({ data }: ContactProps) {
  return (
    <section id="contact" className="relative py-24 lg:py-32 overflow-hidden">
      <ParticleBackground />

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, var(--bg-primary), transparent, var(--bg-primary))',
        }}
      />

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
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
          >
            {/* Terminal Style Card */}
            <div
              className="rounded-2xl overflow-hidden border"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {/* Terminal Header */}
              <div
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{
                  background: 'color-mix(in srgb, var(--bg-tertiary) 50%, transparent)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#eab308' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
                <span
                  className="ml-4 text-xs font-mono"
                  style={{ color: 'var(--text-muted)' }}
                >
                  contact@sakurain.tech
                </span>
              </div>

              {/* Terminal Content */}
              <div className="p-6 font-mono text-sm">
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <span style={{ color: 'var(--accent-primary)' }}>$</span>
                    <span style={{ color: 'var(--text-secondary)' }}>echo &quot;欢迎联系 SAKURAIN&quot;</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', paddingLeft: '1rem' }}>
                    欢迎联系 SAKURAIN
                  </div>

                  <div className="flex items-start gap-2">
                    <span style={{ color: 'var(--accent-primary)' }}>$</span>
                    <span style={{ color: 'var(--text-secondary)' }}>cat contact_info.json</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', paddingLeft: '1rem' }}>
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
                    <span style={{ color: 'var(--accent-primary)' }}>$</span>
                    <span style={{ color: 'var(--text-secondary)' }}>./send_inquiry.sh</span>
                  </div>
                  <div className="pl-4">
                    <span style={{ color: '#22c55e' }}>准备就绪，等待您的消息...</span>
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="inline-block w-2 h-4 ml-1"
                      style={{ background: 'var(--accent-primary)' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div
                className="p-4 rounded-xl border"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <Mail className="w-5 h-5 mb-2" style={{ color: 'var(--accent-primary)' }} />
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>邮箱</div>
                <div
                  className="text-sm font-mono truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {data.email}
                </div>
              </div>
              <div
                className="p-4 rounded-xl border"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <Clock className="w-5 h-5 mb-2" style={{ color: 'var(--accent-primary)' }} />
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>响应时间</div>
                <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {data.responseTime}
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6">
              <div className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                关注我们
              </div>
              <div className="flex gap-3">
                {data.social.map((platform, idx) => (
                  <SocialLink
                    key={`${platform.platform}-${idx}`}
                    platform={platform}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="p-6 lg:p-8 rounded-2xl border"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                发送咨询
              </h3>

              <form
                action={`mailto:${data.email}`}
                method="post"
                encType="text/plain"
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                    您的姓名
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="请输入您的姓名"
                    className="w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none"
                    style={{
                      background: 'color-mix(in srgb, var(--bg-tertiary) 50%, transparent)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                    联系邮箱
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none"
                    style={{
                      background: 'color-mix(in srgb, var(--bg-tertiary) 50%, transparent)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                    项目类型
                  </label>
                  <select
                    name="project_type"
                    className="w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none appearance-none cursor-pointer"
                    style={{
                      background: 'color-mix(in srgb, var(--bg-tertiary) 50%, transparent)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="" style={{ background: 'var(--bg-secondary)' }}>请选择项目类型</option>
                    <option value="game-theory" style={{ background: 'var(--bg-secondary)' }}>博弈程序开发</option>
                    <option value="data-analysis" style={{ background: 'var(--bg-secondary)' }}>数据分析系统</option>
                    <option value="web-dev" style={{ background: 'var(--bg-secondary)' }}>网站开发</option>
                    <option value="graduation" style={{ background: 'var(--bg-secondary)' }}>毕业设计</option>
                    <option value="other" style={{ background: 'var(--bg-secondary)' }}>其他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                    项目描述
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    placeholder="请简要描述您的项目需求..."
                    className="w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none resize-none"
                    style={{
                      background: 'color-mix(in srgb, var(--bg-tertiary) 50%, transparent)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <motion.button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium text-white transition-all"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    boxShadow: '0 4px 20px color-mix(in srgb, var(--accent-primary) 25%, transparent)',
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  发送邮件咨询
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </form>

              <p className="mt-4 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                {data.note}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});
