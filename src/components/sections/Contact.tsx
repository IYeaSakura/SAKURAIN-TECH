import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Clock, Send, Github, MessageCircle, Terminal, ChevronRight } from 'lucide-react';
import { SectionTitle } from '@/components/atoms';
import {
  AmbientGlow,
  GlowingBorder,
  FloatingBubbles,
  TwinklingStars,
} from '@/components/effects';
import type { SiteData } from '@/types';

interface ContactProps {
  data: SiteData['contact'];
}

const iconMap: Record<string, typeof Github> = {
  Github,
  Send,
  MessageCircle,
};

const getIcon = (iconName: string) => iconMap[iconName] || MessageCircle;

// 项目类型映射
const projectTypeMap: Record<string, string> = {
  'game-theory': '博弈程序开发',
  'data-analysis': '数据分析系统',
  'web-dev': '网站开发',
  'graduation': '毕业设计',
  'mc-plugin': 'Minecraft插件',
  'other': '其他项目',
};

export const Contact = memo(function Contact({ data }: ContactProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    project: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 构造邮件内容
    const projectType = projectTypeMap[formData.project] || formData.project;
    const subject = `业务咨询 - ${projectType}`;
    const body = `您好，我是 ${formData.name}。

我的邮箱是：${formData.email}

项目类型：${projectType}

项目详情：
${formData.message}

---
此邮件由 SAKURAIN 网站联系表单自动生成`;

    // 构造 mailto 链接
    const mailtoLink = `mailto:Yae_SakuRain@outlook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // 打开邮箱客户端
    window.location.href = mailtoLink;

    setIsSubmitting(false);
    setSubmitted(true);

    // 3秒后重置表单状态
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', project: '', message: '' });
    }, 3000);
  };

  return (
    <section id="contact" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Ambient glow effects */}
      <AmbientGlow position="center" color="var(--accent-primary)" size={500} opacity={0.15} />
      <AmbientGlow position="top-left" color="var(--accent-secondary)" size={300} opacity={0.12} />
      <AmbientGlow position="bottom-right" color="var(--accent-tertiary)" size={400} opacity={0.1} />

      {/* 浮动气泡 */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <FloatingBubbles count={8} colors={['var(--accent-primary)', 'var(--accent-secondary)']} />
      </div>

      {/* 闪烁星星 */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        <TwinklingStars count={30} color="var(--accent-secondary)" secondaryColor="var(--accent-tertiary)" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title={data.title}
          subtitle={data.subtitle}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ margin: '-50px' }}
            transition={{ duration: 0.5 }}
          >
            {/* Email Card */}
            <div className="p-6 mc-panel mb-6">
              <div className="flex items-start gap-4">
                <div className="mc-icon-box flex-shrink-0">
                  <Mail className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div>
                  <h4
                    className="mb-1 font-primary"
                    style={{
                      fontSize: 'var(--text-lg)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    电子邮箱
                  </h4>
                  <a
                    href={`mailto:${data.email}`}
                    className="font-mono mc-glow-emerald"
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 600,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {data.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Response Time Card */}
            <div className="p-6 mc-panel mb-6">
              <div className="flex items-start gap-4">
                <div className="mc-icon-box flex-shrink-0">
                  <Clock className="w-6 h-6" style={{ color: 'var(--accent-secondary)' }} />
                </div>
                <div>
                  <h4
                    className="mb-1 font-primary"
                    style={{
                      fontSize: 'var(--text-lg)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    响应时间
                  </h4>
                  <p
                    className="font-primary"
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {data.responseTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="p-6 mc-panel mb-6">
              <div className="flex items-start gap-4">
                <div className="mc-icon-box flex-shrink-0">
                  <Terminal className="w-6 h-6" style={{ color: 'var(--mc-gold)' }} />
                </div>
                <div>
                  <h4
                    className="mb-1 font-primary"
                    style={{
                      fontSize: 'var(--text-lg)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    快速联系
                  </h4>
                  <p
                    className="font-primary"
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 400,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                    }}
                  >
                    {data.note}
                  </p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap gap-4">
              {data.social.map((platform) => {
                const Icon = getIcon(platform.icon);
                return (
                  <motion.a
                    key={platform.platform}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mc-panel p-4 flex items-center gap-3 font-primary"
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                    whileHover={{
                      scale: 1.05,
                      borderColor: 'var(--accent-primary)',
                      color: 'var(--accent-primary)',
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-5 h-5" />
                    {platform.platform}
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <GlowingBorder color="var(--accent-primary)" intensity={0.8}>
              <div className="mc-panel p-6 sm:p-8">
            <h3
              className="mb-6 font-primary"
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              发送消息
            </h3>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div
                  className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                  style={{
                    background: 'var(--accent-secondary)',
                    border: '3px solid',
                    borderColor: 'color-mix(in srgb, var(--accent-secondary) 120%, white) color-mix(in srgb, var(--accent-secondary) 80%, black) color-mix(in srgb, var(--accent-secondary) 80%, black) color-mix(in srgb, var(--accent-secondary) 120%, white)',
                  }}
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </div>
                <h4
                  className="font-primary mb-2"
                  style={{
                    fontSize: 'var(--text-xl)',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                  }}
                >
                  消息已发送！
                </h4>
                <p
                  className="font-primary"
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 400,
                    color: 'var(--text-secondary)',
                  }}
                >
                  我们会尽快回复您
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    className="block mb-2 font-primary"
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    您的姓名
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mc-input w-full font-primary"
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 500,
                    }}
                    placeholder="请输入您的姓名"
                  />
                </div>

                <div>
                  <label
                    className="block mb-2 font-primary"
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    电子邮箱
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mc-input w-full font-primary"
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 500,
                    }}
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label
                    className="block mb-2 font-primary"
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    项目类型
                  </label>
                  <select
                    required
                    value={formData.project}
                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    className="mc-input w-full font-primary"
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 500,
                    }}
                  >
                    <option value="">请选择项目类型</option>
                    <option value="game-theory">博弈程序开发</option>
                    <option value="data-analysis">数据分析系统</option>
                    <option value="web-dev">网站开发</option>
                    <option value="graduation">毕业设计</option>
                    <option value="mc-plugin">Minecraft插件</option>
                    <option value="other">其他项目</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block mb-2 font-primary"
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    项目详情
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="mc-input w-full font-primary resize-none"
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 500,
                      lineHeight: 1.6,
                    }}
                    placeholder="请描述您的项目需求..."
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mc-btn mc-btn-gold flex items-center justify-center gap-2 font-primary"
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      发送中...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      发送消息
                    </>
                  )}
                </motion.button>
              </form>
            )}
              </div>
            </GlowingBorder>
          </motion.div>
        </div>
      </div>
    </section>
  );
});
