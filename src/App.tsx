/**
 * 新主页 - 个人门户
 * 
 * 设计理念：
 * - 不对称布局，视觉张力
 * - ASCII艺术字效果
 * - 个人编程技术爱好堆叠面积图
 * - 使用子页相同Footer
 * 
 * @author SAKURAIN
 */
import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  ArrowDown,
  BookOpen,
  Heart,
  Rss,
  Globe,
  Briefcase,
  User,
  Code2,
  Terminal,
  Cpu,
  Rocket,
  Sparkles,
  MessageCircle,
  Satellite,
} from 'lucide-react';
import {
  ScrollProgress,
  SecurityProtection,
  TwinklingStars,
  AmbientGlow,
} from '@/components/effects';
import { GradientText } from '@/components/effects/TextEffects';
import { Navigation } from '@/components/sections/Navigation';
import { Footer } from '@/components/sections/Footer';
import { useTheme } from '@/hooks';
import { usePrefersReducedMotion } from '@/lib/performance';
import type { SiteData } from '@/types';

const clipPathRounded = (r: number) => 
  `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

// 3D ASCII艺术字组件 - 带动态渐变效果
const AsciiLogo3D = () => {
  const asciiLines = [
    "  ███████╗ █████╗ ██╗  ██╗██╗   ██╗██████╗  █████╗ ██╗███╗   ██╗  ",
    "  ██╔════╝██╔══██╗██║ ██╔╝██║   ██║██╔══██╗██╔══██╗██║████╗  ██║  ",
    "  ███████╗███████║█████╔╝ ██║   ██║██████╔╝███████║██║██╔██╗ ██║  ",
    "  ╚════██║██╔══██║██╔═██╗ ██║   ██║██╔══██╗██╔══██║██║██║╚██╗██║  ",
    "  ███████║██║  ██║██║  ██╗╚██████╔╝██║  ██║██║  ██║██║██║ ╚████║  ",
    "  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝  ",
  ];

  return (
    <div className="font-mono whitespace-pre select-none">
      {asciiLines.map((line, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
          className="text-[6px] sm:text-[8px] lg:text-[10px] leading-[1.1]"
          style={{
            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary), var(--accent-tertiary), var(--accent-primary))',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 30px var(--accent-glow)',
            filter: 'drop-shadow(0 0 10px var(--accent-primary))',
          }}
        >
          {line}
        </motion.div>
      ))}
    </div>
  );
};

// 小型ASCII装饰
const AsciiDecoration = ({ className = '' }: { className?: string }) => (
  <div className={`font-mono text-xs opacity-30 select-none ${className}`} style={{ color: 'var(--accent-secondary)' }}>
    {'<>'}{'_'.repeat(20)}{'<>'}
  </div>
);

// 视差容器组件
const ParallaxContainer = ({ children, speed = 0.5 }: { children: React.ReactNode; speed?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -100 * speed]);
  const prefersReducedMotion = usePrefersReducedMotion();
  
  if (prefersReducedMotion) {
    return <div ref={ref}>{children}</div>;
  }
  
  return (
    <motion.div ref={ref} style={{ y }}>
      {children}
    </motion.div>
  );
};

// 技术爱好堆叠面积图
const TechStackChart = () => {
  // 2016-2026年技术栈数据（百分比，总和100%）
  const data = [
    { year: 2016, web: 50, python: 30, cpp: 0, algorithm: 0, ai: 0, other: 20 },
    { year: 2017, web: 40, python: 35, cpp: 5, algorithm: 0, ai: 0, other: 20 },
    { year: 2018, web: 35, python: 30, cpp: 15, algorithm: 5, ai: 0, other: 15 },
    { year: 2019, web: 30, python: 25, cpp: 25, algorithm: 10, ai: 0, other: 10 },
    { year: 2020, web: 25, python: 25, cpp: 25, algorithm: 15, ai: 0, other: 10 },
    { year: 2021, web: 20, python: 20, cpp: 30, algorithm: 25, ai: 0, other: 5 },
    { year: 2022, web: 25, python: 20, cpp: 20, algorithm: 20, ai: 5, other: 10 },
    { year: 2023, web: 20, python: 25, cpp: 15, algorithm: 20, ai: 10, other: 10 },
    { year: 2024, web: 15, python: 25, cpp: 15, algorithm: 25, ai: 10, other: 10 },
    { year: 2025, web: 10, python: 25, cpp: 10, algorithm: 30, ai: 15, other: 10 },
    { year: 2026, web: 10, python: 20, cpp: 10, algorithm: 30, ai: 25, other: 5 },
  ];

  const categories = [
    { key: 'ai', label: 'AI/ML', color: '#a855f7' },
    { key: 'algorithm', label: '算法/博弈', color: '#3b82f6' },
    { key: 'python', label: 'Python/Data', color: '#10b981' },
    { key: 'cpp', label: 'C/C++', color: '#f59e0b' },
    { key: 'web', label: 'Web开发', color: '#ec4899' },
    { key: 'other', label: '其他', color: '#6b7280' },
  ];

  const chartHeight = 300;
  const chartWidth = 800;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // 生成堆叠面积路径
  const generateAreaPath = (dataIndex: number) => {
    const categoryKeys = categories.map(c => c.key);
    
    // 计算每个点的累积值
    const points = data.map((d, i) => {
      let cumulative = 0;
      for (let j = 0; j <= dataIndex; j++) {
        cumulative += d[categoryKeys[j] as keyof typeof d] as number;
      }
      const x = padding.left + (i / (data.length - 1)) * innerWidth;
      const y = padding.top + innerHeight - (cumulative / 100) * innerHeight;
      return { x, y };
    });

    // 生成下边界（前一个类别的累积）
    const bottomPoints = data.map((d, i) => {
      let cumulative = 0;
      for (let j = 0; j < dataIndex; j++) {
        cumulative += d[categoryKeys[j] as keyof typeof d] as number;
      }
      const x = padding.left + (i / (data.length - 1)) * innerWidth;
      const y = padding.top + innerHeight - (cumulative / 100) * innerHeight;
      return { x, y };
    }).reverse();

    // 构建路径
    let path = `M ${points[0].x} ${points[0].y}`;
    points.slice(1).forEach(p => {
      path += ` L ${p.x} ${p.y}`;
    });
    bottomPoints.forEach(p => {
      path += ` L ${p.x} ${p.y}`;
    });
    path += ' Z';

    return path;
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full">
          {/* 网格线 */}
          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={padding.top + innerHeight - (tick / 100) * innerHeight}
                x2={chartWidth - padding.right}
                y2={padding.top + innerHeight - (tick / 100) * innerHeight}
                stroke="var(--border-subtle)"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.5"
              />
              <text
                x={padding.left - 10}
                y={padding.top + innerHeight - (tick / 100) * innerHeight + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--text-muted)"
              >
                {tick}%
              </text>
            </g>
          ))}

          {/* 面积图 */}
          {categories.map((cat, index) => (
            <motion.path
              key={cat.key}
              d={generateAreaPath(index)}
              fill={cat.color}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.8 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="hover:opacity-100 transition-opacity"
            />
          ))}

          {/* X轴标签 */}
          {data.map((d, i) => (
            <text
              key={d.year}
              x={padding.left + (i / (data.length - 1)) * innerWidth}
              y={chartHeight - 10}
              textAnchor="middle"
              fontSize="10"
              fill="var(--text-muted)"
            >
              {d.year}
            </text>
          ))}

          {/* X轴线 */}
          <line
            x1={padding.left}
            y1={padding.top + innerHeight}
            x2={chartWidth - padding.right}
            y2={padding.top + innerHeight}
            stroke="var(--text-muted)"
            strokeWidth="1"
          />
        </svg>

        {/* 图例 */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {categories.map((cat) => (
            <div key={cat.key} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {cat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Hero 区域 - 新布局：左侧ASCII艺术，右侧LOGO，下方导航引导
const HeroSection = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const prefersReducedMotion = usePrefersReducedMotion();
  
  // 主要导航项
  const mainNavs = [
    { 
      title: '阅读博客', 
      desc: '技术文章与思考',
      href: '/blog', 
      icon: BookOpen,
      color: '#3b82f6',
      gradient: 'from-blue-500 to-cyan-400'
    },
    { 
      title: '关于我', 
      desc: '了解更多',
      href: '/about', 
      icon: User,
      color: '#10b981',
      gradient: 'from-emerald-500 to-teal-400'
    },
    { 
      title: '地球Online', 
      desc: '弹幕卫星留言',
      href: '/earth-online', 
      icon: Globe,
      highlight: true,
      color: '#8b5cf6',
      gradient: 'from-violet-500 to-purple-400'
    },
  ];
  
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* 背景视差层 */}
      {!prefersReducedMotion && (
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          style={{ y: y1, opacity }}
        >
          <div className="absolute top-20 right-[5%] w-[500px] h-[500px] rounded-full opacity-20"
            style={{ 
              background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
              filter: 'blur(60px)'
            }}
          />
        </motion.div>
      )}
      
      {/* 星星背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <TwinklingStars count={30} color="var(--accent-primary)" shootingStars={true} />
      </div>
      
      {/* 主内容区域 */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-20">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* 左侧：ASCII艺术 + 文字介绍 - 占7列 */}
            <motion.div 
              className="lg:col-span-7"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* 3D ASCII艺术字 */}
              <div className="mb-8">
                <AsciiLogo3D />
              </div>

              {/* 终端风格标签 */}
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  clipPath: clipPathRounded(4),
                }}
              >
                <Terminal className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-sm font-medium font-mono" style={{ color: 'var(--accent-primary)' }}>
                  ~/welcome
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6">
                <span className="block" style={{ color: 'var(--text-primary)' }}>
                  代码即艺术
                </span>
                <span className="block mt-2">
                  <GradientText animate={true}>创造即思考</GradientText>
                </span>
              </h1>
              
              <AsciiDecoration className="mb-6" />
              
              <p className="text-lg md:text-xl leading-relaxed mb-8 max-w-xl"
                style={{ color: 'var(--text-muted)' }}
              >
                从2016年初一开始编程之旅，历经Web开发、算法竞赛、AI研究到博弈算法。
                这里记录着我的技术演进与创作历程。
              </p>
            </motion.div>
            
            {/* 右侧：LOGO图标 - 占5列 */}
            <motion.div 
              className="lg:col-span-5 hidden lg:flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative">
                {/* 发光背景 */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                  }}
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                
                {/* LOGO图片 */}
                <motion.img
                  src="/image/logo.webp"
                  alt="SAKURAIN"
                  className="relative w-64 h-64 object-contain"
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    filter: 'drop-shadow(0 0 30px var(--accent-glow))',
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* 底部导航引导区域 */}
      <motion.div 
        className="relative z-10 pb-12"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* 标题 */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Rocket className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
                {'>'} 探索更多
              </span>
            </motion.div>
          </div>
          
          {/* 三个主要导航卡片 */}
          <div className="grid md:grid-cols-3 gap-6">
            {mainNavs.map((nav, index) => (
              <motion.a
                key={nav.title}
                href={nav.href}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.15, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`group relative p-6 rounded-2xl overflow-hidden transition-all duration-300 ${
                  nav.highlight ? 'md:scale-105 ring-2 ring-purple-500/50' : ''
                }`}
                style={{
                  background: 'var(--bg-card)',
                  border: `2px solid ${nav.highlight ? nav.color : 'var(--border-subtle)'}`,
                }}
              >
                {/* 高亮标签 */}
                {nav.highlight && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: `${nav.color}20`,
                      color: nav.color,
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>推荐</span>
                  </div>
                )}
                
                {/* 背景渐变 */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${nav.color}10, transparent)`,
                  }}
                />
                
                {/* 内容 */}
                <div className="relative z-10">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ background: `${nav.color}15` }}
                  >
                    <nav.icon className="w-6 h-6" style={{ color: nav.color }} />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {nav.title}
                  </h3>
                  
                  <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                    {nav.desc}
                  </p>
                  
                  {/* 特殊提示 - 地球Online的弹幕功能 */}
                  {nav.highlight && (
                    <div className="flex items-center gap-2 text-xs mb-3 px-3 py-2 rounded-lg"
                      style={{
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                      }}
                    >
                      <Satellite className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-purple-400">支持弹幕卫星留言</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm font-mono"
                    style={{ color: nav.color }}
                  >
                    <span>{'>'} 进入</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                  </div>
                </div>
                
                {/* 扫光效果 */}
                <div 
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${nav.color}20, transparent)`,
                  }}
                />
              </motion.a>
            ))}
          </div>
          
          {/* 次要导航 */}
          <motion.div 
            className="flex flex-wrap justify-center gap-4 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            {[
              { title: '朋友圈', href: '/friends-circle', icon: MessageCircle },
              { title: '友链', href: '/friends', icon: Heart },
              { title: '工作室', href: '/studio', icon: Briefcase },
            ].map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                <item.icon className="w-4 h-4" />
                {item.title}
              </a>
            ))}
          </motion.div>
        </div>
      </motion.div>
      
      {/* 滚动提示 */}
      <motion.div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.6 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 cursor-pointer font-mono text-xs"
          onClick={() => document.getElementById('journey')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span style={{ color: 'var(--text-muted)' }}>
            {'>'} scroll_down()
          </span>
          <ArrowDown className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
        </motion.div>
      </motion.div>
    </section>
  );
};

// 技术演进面积图区域
const JourneySection = () => {
  return (
    <section id="journey" className="relative py-32 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* 左侧标题 - 占4列 */}
          <ParallaxContainer speed={0.2}>
            <div className="lg:col-span-4 lg:sticky lg:top-32">
              <AsciiDecoration className="mb-4" />
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <GradientText animate={true}>技术演进</GradientText>
              </h2>
              
              <p className="text-lg mb-6" style={{ color: 'var(--text-muted)' }}>
                从初一开始的编程之旅，技术栈随时间不断演化。
                每个阶段都有不同的侧重点，但始终保持着对技术的热情。
              </p>
              
              <div className="font-mono text-sm space-y-2" style={{ color: 'var(--accent-secondary)' }}>
                <div>{'>'} 2016: Web入门</div>
                <div>{'>'} 2019: 算法竞赛</div>
                <div>{'>'} 2022: AI研究</div>
                <div>{'>'} 2024: 博弈算法</div>
              </div>
            </div>
          </ParallaxContainer>
          
          {/* 右侧图表 - 占8列 */}
          <motion.div 
            className="lg:col-span-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div 
              className="p-8 rounded-2xl"
              style={{
                background: 'var(--bg-card)',
                border: '2px solid var(--border-subtle)',
                clipPath: clipPathRounded(16),
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Cpu className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                <h3 className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                  tech_stack_evolution.py
                </h3>
              </div>
              
              <TechStackChart />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// 快速链接区域 - 简化为补充导航
const QuickLinksSection = () => {
  const links = [
    {
      title: '朋友圈',
      desc: '日常与灵感',
      icon: Rss,
      href: '/friends-circle',
      color: '#10b981',
    },
    {
      title: '友链',
      desc: '朋友们的网站',
      icon: Heart,
      href: '/friends',
      color: '#f59e0b',
    },
    {
      title: '工作室',
      desc: '服务与合作',
      icon: Briefcase,
      href: '/studio',
      color: '#ec4899',
    },
    {
      title: '文档',
      desc: '技术文档',
      icon: Code2,
      href: '/docs',
      color: '#06b6d4',
    },
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <AmbientGlow color="var(--accent-secondary)" opacity={0.08} position="bottom-left" size={500} />
      </div>
      
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <ParallaxContainer speed={0.3}>
          <div className="text-center mb-12">
            <AsciiDecoration className="mb-4 mx-auto" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <GradientText animate={true}>更多探索</GradientText>
            </h2>
            <p className="text-lg font-mono" style={{ color: 'var(--text-muted)' }}>
              {'>'} ls ./other
            </p>
          </div>
        </ParallaxContainer>
        
        {/* 网格 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {links.map((card, index) => (
            <motion.a 
              key={card.title}
              href={card.href}
              className="group block"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div 
                className="relative p-5 rounded-xl overflow-hidden transition-all duration-300 h-full"
                style={{
                  background: 'var(--bg-card)',
                  border: `2px solid var(--border-subtle)`,
                }}
              >
                {/* 背景渐变 */}
                <div 
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${card.color} 0%, transparent 100%)`,
                    opacity: 0.05,
                  }}
                />
                
                {/* 内容 */}
                <div className="relative z-10">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                    style={{ background: `${card.color}15` }}
                  >
                    <card.icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  
                  <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {card.title}
                  </h3>
                  
                  <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    {card.desc}
                  </p>
                </div>
                
                {/* 悬停边框 */}
                <div 
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    border: `2px solid ${card.color}`,
                  }}
                />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

// 主应用组件
function App() {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { theme, isTransitioning, toggleTheme } = useTheme();

  useEffect(() => {
    fetch(`/data/site-data.json?v=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then((data: SiteData) => {
        setSiteData(data);
        setDataLoaded(true);
      })
      .catch(error => {
        console.error('Failed to load site data:', error);
        setDataLoaded(true);
      });
  }, []);

  if (!dataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center font-mono">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--text-muted)' }}>{'>'} loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <SecurityProtection />
      <ScrollProgress />
      
      {siteData && (
        <Navigation
          data={siteData.navigation}
          theme={theme}
          onThemeToggle={toggleTheme}
          isThemeTransitioning={isTransitioning}
        />
      )}
      
      <main>
        <HeroSection />
        <JourneySection />
        <QuickLinksSection />
      </main>
      
      {/* 使用子页相同的Footer */}
      {siteData && <Footer data={siteData.footer} />}
    </div>
  );
}

export default App;
