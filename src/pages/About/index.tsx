"use client"

import { motion } from 'framer-motion';
import { 
  Github, 
  Mail, 
  Heart, 
  Code2, 
  Zap, 
  Shield,
  Globe,
  ArrowRight,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { GitHubHeatmap } from '@/components/GitHubHeatmap';

export default function AboutPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const skills = [
    { name: 'React', level: 95, color: '#61dafb' },
    { name: 'TypeScript', level: 90, color: '#3178c6' },
    { name: 'Vue', level: 85, color: '#42b883' },
    { name: 'Node.js', level: 88, color: '#339933' },
    { name: 'Python', level: 82, color: '#3776ab' },
    { name: 'Go', level: 78, color: '#00add8' },
  ];

  const features = [
    {
      icon: Zap,
      title: '极速响应',
      description: '采用最新的前端技术栈，确保页面加载速度和交互响应达到极致',
      color: '#fbbf24',
    },
    {
      icon: Shield,
      title: '安全可靠',
      description: '内置多层安全防护机制，保护用户数据和隐私安全',
      color: '#34d399',
    },
    {
      icon: Layers,
      title: '模块化设计',
      description: '采用组件化架构，代码结构清晰，易于维护和扩展',
      color: '#60a5fa',
    },
    {
      icon: Sparkles,
      title: '炫酷特效',
      description: '集成多种3D特效和动画，提供沉浸式的视觉体验',
      color: '#f472b6',
    },
  ];

  const socialLinks = [
    {
      icon: Github,
      label: 'GitHub',
      href: 'https://github.com',
      color: '#ffffff',
    },
    {
      icon: Mail,
      label: 'Email',
      href: 'mailto:contact@sakurain.net',
      color: '#fbbf24',
    },
    {
      icon: Globe,
      label: 'Website',
      href: 'https://sakurain.net',
      color: '#34d399',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, var(--accent-primary)/10, transparent 40%)`,
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-16"
          >
            <motion.div
              className="relative inline-block"
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div
                className="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  boxShadow: '0 0 60px var(--accent-glow)',
                }}
              >
                <Code2 className="w-16 h-16 text-white" />
              </div>
            </motion.div>

            <h1
              className="text-5xl font-bold mb-4 bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-tertiary)] bg-clip-text text-transparent"
            >
              SAKURAIN
            </h1>
            <p className="text-xl mb-2" style={{ color: 'var(--text-secondary)' }}>
              全栈开发者 & 开源爱好者
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              热爱技术，追求卓越，用代码创造价值
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="rounded-2xl p-8 mb-12 backdrop-blur-xl"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Heart className="w-6 h-6" style={{ color: '#f472b6' }} />
              关于本项目
            </h2>
            <p className="mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              SAKURAIN 是一个现代化的个人技术博客项目，采用最新的前端技术栈构建。
              项目致力于提供优雅的用户界面、流畅的交互体验和丰富的功能特性。
            </p>
            <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              本项目集成了3D地球可视化、弹幕卫星系统、文档管理、博客系统等多个功能模块，
              展示了现代Web开发的最佳实践和创新设计理念。
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="rounded-2xl p-6 backdrop-blur-xl group hover:scale-105 transition-transform duration-300"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.2)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
                  style={{
                    background: `${feature.color}20`,
                    color: feature.color,
                  }}
                >
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mb-12"
          >
            <GitHubHeatmap username="IYeaSakura" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="rounded-2xl p-8 mb-12 backdrop-blur-xl"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Cpu className="w-6 h-6" style={{ color: '#60a5fa' }} />
              技术栈
            </h2>
            <div className="space-y-4">
              {skills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                >
                  <div className="flex items-center gap-4 mb-2">
                    <span className="w-24 font-medium">{skill.name}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.level}%` }}
                        transition={{ duration: 1, delay: 1 + index * 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: skill.color }}
                      />
                    </div>
                    <span className="w-12 text-right text-sm" style={{ color: 'var(--text-muted)' }}>
                      {skill.level}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="text-center"
          >
            <h3 className="text-xl font-bold mb-6">联系方式</h3>
            <div className="flex justify-center gap-4">
              {socialLinks.map((link, index) => (
                <motion.a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 1.0 + index * 0.1 }}
                  className="w-14 h-14 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-300"
                  style={{
                    background: `${link.color}20`,
                    border: `1px solid ${link.color}40`,
                    color: link.color,
                  }}
                >
                  <link.icon className="w-6 h-6" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="text-center mt-12"
          >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Made with <Heart className="inline w-4 h-4 mx-1" style={{ color: '#f472b6' }} /> by SAKURAIN
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              © 2026 SAKURAIN. All rights reserved.
            </p>
          </motion.div>
        </motion.div>
      </div>

      <motion.button
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        onClick={() => window.history.back()}
        className="fixed right-8 bottom-8 z-50 flex items-center gap-2 px-6 py-3 rounded-xl backdrop-blur-xl hover:scale-105 transition-transform duration-300"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.3)',
        }}
      >
        <ArrowRight className="w-5 h-5 rotate-180" />
        返回
      </motion.button>
    </div>
  );
}
