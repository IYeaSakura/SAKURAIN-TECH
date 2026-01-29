import { memo, useMemo, useState, useCallback, useEffect } from 'react';
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

// Minecraft Terminal Component
const MinecraftTerminal = memo(({ data }: { data: SiteData['contact'] }) => {
  const [currentLine, setCurrentLine] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  const terminalLines = [
    `contact@sakurain.net $ email start`,
    `contact@sakurain.net $ vim contact.json`,
    `contact@sakurain.net $ send contact.json`,
    `contact@sakurain.net $ success`,
    `contact@sakurain.net $ email end`,
    `contact@sakurain.net $ █`,
  ];

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);

    const lineInterval = setInterval(() => {
      setCurrentLine(prev => {
        if (prev < terminalLines.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);

    return () => {
      clearInterval(cursorInterval);
      clearInterval(lineInterval);
    };
  }, [terminalLines.length]);

  return (
    <div className="mc-panel overflow-hidden">
      {/* Terminal Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b-2"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f56' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#27ca40' }} />
        <span className="ml-4 text-sm font-minecraft" style={{ color: 'var(--text-muted)' }}>
          SAKURAIN-TERMINAL
        </span>
      </div>

      {/* Terminal Content */}
      <div className="p-6 space-y-6">
        {/* Email */}
        <div className="flex items-start gap-4">
          <div className="mc-icon-box" style={{ width: '48px', height: '48px' }}>
            <Mail className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <h4 className="font-bold mb-1 font-minecraft" style={{ color: 'var(--text-primary)' }}>
              电子邮箱
            </h4>
            <a
              href={`mailto:${data.email}`}
              className="mc-glow-emerald font-minecraft"
              style={{ color: 'var(--accent-primary)' }}
            >
              {data.email}
            </a>
          </div>
        </div>

        {/* Response Time */}
        <div className="flex items-start gap-4">
          <div className="mc-icon-box" style={{ width: '48px', height: '48px' }}>
            <Clock className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <h4 className="font-bold mb-1 font-minecraft" style={{ color: 'var(--text-primary)' }}>
              响应时间
            </h4>
            <p className="font-minecraft" style={{ color: 'var(--text-secondary)' }}>{data.responseTime}</p>
          </div>
        </div>

        {/* Note */}
        <div
          className="p-4 mc-panel"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <ChevronRight className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            <span className="font-bold font-minecraft" style={{ color: 'var(--text-primary)' }}>
              备注
            </span>
          </div>
          <p className="text-sm font-minecraft" style={{ color: 'var(--text-secondary)' }}>
            {data.note}
          </p>
        </div>

        {/* Social Links */}
        <div>
          <h4 className="font-bold mb-3 font-minecraft" style={{ color: 'var(--text-primary)' }}>
            关注我们
          </h4>
          <div className="flex flex-wrap gap-3">
            {data.social.map((platform) => (
              <SocialLink key={platform.platform} platform={platform} />
            ))}
          </div>
        </div>

        {/* Terminal Simulation */}
        <div
          className="p-4 mc-panel"
          style={{ 
            background: 'color-mix(in srgb, var(--bg-secondary) 80%, black)',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.4',
          }}
        >
          <div className="font-minecraft" style={{ color: '#00ff00' }}>
            {terminalLines.slice(0, currentLine + 1).map((line, index) => (
              <div key={index}>
                {line.replace('█', cursorVisible && index === currentLine ? '█' : '')}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

MinecraftTerminal.displayName = 'MinecraftTerminal';

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
      className="flex items-center gap-2 px-4 py-2 mc-panel transition-all"
      style={{
        color: 'var(--text-secondary)',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className="w-5 h-5" />
      <span className="font-minecraft">{platform.platform}</span>
    </motion.a>
  );
});

SocialLink.displayName = 'SocialLink';

// Project type mapping
const projectTypeMap: Record<string, string> = {
  'game-theory': '博弈程序开发',
  'data-analysis': '数据分析系统',
  'web-dev': '网站开发',
  'graduation': '毕业设计',
  'other': '其他',
};

export const Contact = memo(function Contact({ data }: ContactProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    project_type: '',
    description: '',
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const projectType = projectTypeMap[formData.project_type] || '未选择';
    const date = new Date().toLocaleDateString('zh-CN');

    // Format email body with proper structure
    const emailBody = `SAKURAIN 项目咨询

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
咨询信息
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

客户姓名：${formData.name || '未填写'}
联系邮箱：${formData.email || '未填写'}
项目类型：${projectType}
提交日期：${date}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
项目描述
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${formData.description || '未填写'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

此邮件由 SAKURAIN 官网自动生成的咨询模板`;

    const subject = encodeURIComponent(`【项目咨询】${formData.name || '新客户'} - ${projectType}`);
    const body = encodeURIComponent(emailBody);

    window.location.href = `mailto:${data.email}?subject=${subject}&body=${body}`;
  }, [formData, data.email]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

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
          {/* Left Column - Minecraft Terminal */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ margin: '-50px' }}
            transition={{ duration: 0.5 }}
          >
            <MinecraftTerminal data={data} />
          </motion.div>

          {/* Right Column - Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ margin: '-50px' }}
            transition={{ duration: 0.5 }}
          >
            <form onSubmit={handleSubmit} className="mc-panel p-6">
              <h3 className="text-2xl font-bold mb-6 font-minecraft" style={{ color: 'var(--text-primary)' }}>
                项目咨询
              </h3>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block mb-2 font-bold font-minecraft" style={{ color: 'var(--text-primary)' }}>
                    您的姓名
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full mc-input"
                    placeholder="请输入您的姓名"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block mb-2 font-bold font-minecraft" style={{ color: 'var(--text-primary)' }}>
                    联系邮箱
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full mc-input"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                {/* Project Type */}
                <div>
                  <label className="block mb-2 font-bold font-minecraft" style={{ color: 'var(--text-primary)' }}>
                    项目类型
                  </label>
                  <select
                    name="project_type"
                    value={formData.project_type}
                    onChange={handleChange}
                    className="w-full mc-input"
                    required
                  >
                    <option value="">请选择项目类型</option>
                    <option value="game-theory">博弈程序开发</option>
                    <option value="data-analysis">数据分析系统</option>
                    <option value="web-dev">网站开发</option>
                    <option value="graduation">毕业设计</option>
                    <option value="other">其他</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block mb-2 font-bold font-minecraft" style={{ color: 'var(--text-primary)' }}>
                    项目描述
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full mc-input"
                    rows={4}
                    placeholder="请简要描述您的项目需求..."
                    required
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full mc-btn mc-btn-gold flex items-center justify-center gap-2 font-minecraft"
                >
                  <Send className="w-5 h-5" />
                  发送咨询
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
});
