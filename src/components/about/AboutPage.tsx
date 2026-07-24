'use client';

/**
 * About page —— personal introduction in the site-wide brutalist style.
 *
 * Replaces the previous glass/glow aesthetic with thick borders, pixel offset
 * shadows, sharp corners and monospace/pixel typography.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  GraduationCap,
  Award,
  Code2,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Trophy,
  BookOpen,
  Briefcase,
  Star,
  Calendar,
  Layers,
  Globe,
} from 'lucide-react';
import { useAnimationEnabled, useNavigation } from '@/hooks';
import { Footer } from '@/components/sections/Footer';
import { GitHubHeatmap } from './GitHubHeatmap';
import { GithubIcon as Github } from './GithubIcon';
import type { SiteData } from '@/types';

interface TechItem {
  name: string;
  category: string;
  color: string;
}

const techStack: TechItem[] = [
  { name: 'TypeScript', category: '前端', color: '#2E86DE' },
  { name: 'React', category: '前端', color: '#4A69BD' },
  { name: 'Next.js', category: '前端', color: '#111827' },
  { name: 'Tailwind CSS', category: '前端', color: '#38BDF8' },
  { name: 'Framer Motion', category: '前端', color: '#FF6B81' },
  { name: 'Three.js / WebGL', category: '前端', color: '#7BED9F' },
  { name: 'Python', category: '后端', color: '#6C5CE7' },
  { name: 'FastAPI', category: '后端', color: '#00D2D3' },
  { name: 'Node.js', category: '后端', color: '#1DD1A1' },
  { name: 'Go / Gin', category: '后端', color: '#FF9F43' },
  { name: 'Java / Spring Boot', category: '后端', color: '#F368E0' },
  { name: 'C / C++', category: '后端', color: '#5F27CD' },
  { name: 'PyTorch', category: 'AI / 数据', color: '#FF5252' },
  { name: 'OpenCV', category: 'AI / 数据', color: '#34ACE0' },
  { name: 'NumPy / Pandas', category: 'AI / 数据', color: '#706FD3' },
  { name: 'YOLO / Transformer', category: 'AI / 数据', color: '#B53471' },
  { name: 'MySQL', category: '数据库', color: '#C44569' },
  { name: 'Redis', category: '数据库', color: '#6C5CE7' },
  { name: 'ClickHouse', category: '数据库', color: '#F8B500' },
  { name: 'Docker', category: 'DevOps', color: '#FF6B6B' },
  { name: 'GitHub Actions', category: 'DevOps', color: '#00CEC9' },
  { name: 'Linux / Shell', category: '系统', color: '#55A3FF' },
  { name: 'EdgeOne', category: '云服务', color: '#2ECC71' },
  { name: 'Cloudflare', category: '云服务', color: '#F1C40F' },
];

const achievementSlides = [
  {
    id: 1,
    title: '2024年中国大学生计算机博弈大赛',
    subtitle: '全国冠军',
    description: '在全国计算机博弈大赛中斩获冠军，展现了优秀的算法设计与工程实现能力。',
    color: '#fbbf24',
    year: '2024',
    image: '/image/about/by2024.webp',
    fallbackIcon: Trophy,
  },
  {
    id: 2,
    title: '2025年计算机博弈大赛',
    subtitle: '全国亚军',
    description: '连续两年在国家级赛事中取得优异成绩，持续保持技术竞争力。',
    color: '#c0c0c0',
    year: '2025',
    image: '/image/about/by2025.webp',
    fallbackIcon: Award,
  },
  {
    id: 3,
    title: '2024年挑战杯大赛',
    subtitle: '辽宁省铜奖',
    description: '在创新创业大赛中展现出色的项目实践能力与团队协作精神。',
    color: '#cd7f32',
    year: '2024',
    image: '/image/about/tzb.webp',
    fallbackIcon: Star,
  },
];

const projectStats = [
  { label: '项目模块', value: '120+', icon: Layers },
  { label: '代码行数', value: '70K+', icon: Code2 },
  { label: '技术栈', value: '15+', icon: Cpu },
  { name: '开源依赖', value: '90+', icon: Github },
];

const contactLinks = [
  { href: 'https://github.com/IYeaSakura', icon: Github, label: 'GitHub' },
  { href: 'mailto:Yae_SakuRain@outlook.com', icon: Mail, label: 'Email' },
];

const PIXEL_BORDER = '2px solid var(--border-subtle)';
const PIXEL_SHADOW = '4px 4px 0 var(--border-subtle)';

export default function AboutPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [footerData, setFooterData] = useState<SiteData['footer'] | null>(null);
  const animationEnabled = useAnimationEnabled();
  const { navigateTo } = useNavigation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    fetch('/data/site-data.json')
      .then((res) => res.json())
      .then((data: SiteData) => setFooterData(data.footer))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % achievementSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % achievementSlides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + achievementSlides.length) % achievementSlides.length);
  }, []);

  const techByCategory = useMemo(() => {
    const grouped: Record<string, TechItem[]> = {};
    for (const tech of techStack) {
      if (!grouped[tech.category]) grouped[tech.category] = [];
      grouped[tech.category].push(tech);
    }
    return grouped;
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-24 lg:py-28">
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button
            onClick={() => navigateTo('/')}
            className="inline-flex items-center gap-2 px-2 py-1 rounded-sm text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-70 mb-6"
            style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
          >
            <ChevronLeft className="w-4 h-4" />
            返回首页
          </button>
        </motion.div>

        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div
              className="shrink-0 p-2 rounded-sm"
              style={{ background: 'var(--bg-secondary)', border: PIXEL_BORDER, boxShadow: PIXEL_SHADOW }}
            >
              <img
                src="/image/about/head.jpg"
                alt="Yuyang"
                className="w-40 h-40 sm:w-48 sm:h-48 object-cover rounded-sm"
              />
            </div>
            <div className="flex-1">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 text-[10px] font-bold uppercase tracking-wider border"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
              >
                <Globe className="w-3 h-3" />
                全栈开发 · 博弈算法 · AI 研究
              </div>
              <h1
                className="text-3xl sm:text-5xl font-bold uppercase mb-3"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
              >
                Yuyang
              </h1>
              <p className="text-sm sm:text-base mb-4" style={{ color: 'var(--text-secondary)' }}>
                00后 | 26届本科毕业 | 软件工程专业
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Briefcase, text: '博弈算法专长' },
                  { icon: Calendar, text: '软件工程师' },
                  { icon: Star, text: '中共党员' },
                  { icon: GraduationCap, text: '26届本科毕业' },
                ].map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase border"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <item.icon className="w-3 h-3" />
                    {item.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-16"
        >
          <h2
            className="text-sm font-bold uppercase tracking-wider mb-4"
            style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
          >
            关于我
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard icon={BookOpen} title="个人简介" delay={0}>
              中共党员，青年马克思主义者培养工程结业，在校期间担任班长、校计算机协会技术部部长。
              中国人工智能学会机器博弈专委会成员，获得过计算机博弈大赛全国冠亚军。
            </InfoCard>
            <InfoCard icon={Code2} title="技术之路" delay={0.05}>
              从中学时开发 LNMP 架构到大学深入学习 React、FastAPI、PyTorch 等框架，并积极参与科研项目。
              坚信：代码构建未来，技术赋能社会。
            </InfoCard>
          </div>
        </motion.section>

        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-16"
        >
          <h2
            className="text-sm font-bold uppercase tracking-wider mb-4"
            style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
          >
            技术栈
          </h2>
          <div className="space-y-6">
            {Object.entries(techByCategory).map(([category, items]) => (
              <div key={category}>
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-3"
                  style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}
                >
                  {category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {items.map((tech, index) => (
                    <TechTag key={tech.name} tech={tech} index={index} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-16"
        >
          <h2
            className="text-sm font-bold uppercase tracking-wider mb-4"
            style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
          >
            项目数据
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {projectStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="p-4 rounded-sm"
                  style={{ background: 'var(--bg-secondary)', border: PIXEL_BORDER, boxShadow: PIXEL_SHADOW }}
                >
                  <Icon className="w-6 h-6 mb-3" style={{ color: 'var(--accent-primary)' }} />
                  <div
                    className="text-2xl sm:text-3xl font-bold mb-1"
                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-16"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <h2
            className="text-sm font-bold uppercase tracking-wider mb-4"
            style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
          >
            荣誉成就
          </h2>
          <div
            className="relative overflow-hidden rounded-sm"
            style={{ background: 'var(--bg-secondary)', border: PIXEL_BORDER, boxShadow: PIXEL_SHADOW }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative aspect-[4/3] lg:aspect-auto overflow-hidden border-b-2 lg:border-b-0 lg:border-r-2" style={{ borderColor: 'var(--border-subtle)' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                  >
                    <AchievementImage slide={achievementSlides[currentSlide]} />
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-1 mb-3 text-[10px] font-bold uppercase border"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--accent-primary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <Calendar className="w-3 h-3" />
                      {achievementSlides[currentSlide].year}
                    </span>
                    <h3
                      className="text-xl sm:text-2xl font-bold mb-1"
                      style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
                    >
                      {achievementSlides[currentSlide].subtitle}
                    </h3>
                    <p className="text-sm sm:text-base mb-3" style={{ color: 'var(--text-secondary)' }}>
                      {achievementSlides[currentSlide].title}
                    </p>
                    <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {achievementSlides[currentSlide].description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-2">
                    {achievementSlides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className="transition-all duration-300"
                        style={{
                          width: currentSlide === index ? 24 : 8,
                          height: 8,
                          background: currentSlide === index ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        }}
                        aria-label={`切换到第 ${index + 1} 项`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevSlide}
                      className="p-2 border transition-opacity hover:opacity-70"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                      aria-label="上一项"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="p-2 border transition-opacity hover:opacity-70"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                      aria-label="下一项"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-16"
        >
          <h2
            className="text-sm font-bold uppercase tracking-wider mb-4"
            style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
          >
            GitHub 贡献
          </h2>
          <GitHubHeatmap username="IYeaSakura" />
        </motion.section>

        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-16"
        >
          <h2
            className="text-sm font-bold uppercase tracking-wider mb-4"
            style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
          >
            联系我
          </h2>
          <div className="flex flex-wrap gap-3">
            {contactLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                  boxShadow: '3px 3px 0 var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <link.icon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                {link.label}
              </a>
            ))}
            <a
              href="https://wpa.qq.com/msgrd?v=3&uin=2059511844&site=qq&menu=yes"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
                boxShadow: '3px 3px 0 var(--border-subtle)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <QqIcon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              QQ
            </a>
          </div>
        </motion.section>
      </div>

      {footerData && <Footer data={footerData} />}
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  delay,
  children,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  delay: number;
  children: React.ReactNode;
}) {
  const animationEnabled = useAnimationEnabled();

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="p-5 rounded-sm"
      style={{ background: 'var(--bg-secondary)', border: PIXEL_BORDER, boxShadow: PIXEL_SHADOW }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
        <h3
          className="font-bold text-sm uppercase tracking-wider"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
        >
          {title}
        </h3>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {children}
      </p>
    </motion.div>
  );
}

function TechTag({ tech, index }: { tech: TechItem; index: number }) {
  const animationEnabled = useAnimationEnabled();

  return (
    <motion.span
      initial={animationEnabled ? { opacity: 0, scale: 0.9 } : undefined}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.2, delay: (index % 20) * 0.01 }}
      className="inline-flex items-center gap-1.5 px-2 py-1 text-xs border transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
      style={{
        borderColor: 'var(--border-subtle)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-mono)',
        boxShadow: '2px 2px 0 var(--border-subtle)',
      }}
    >
      <span className="w-1.5 h-1.5" style={{ background: tech.color }} />
      {tech.name}
    </motion.span>
  );
}

function AchievementImage({ slide }: { slide: typeof achievementSlides[0] }) {
  const [error, setError] = useState(false);
  const IconComponent = slide.fallbackIcon;

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8" style={{ background: 'var(--bg-primary)' }}>
        <div
          className="w-24 h-24 flex items-center justify-center mb-4 rounded-sm"
          style={{ background: 'var(--bg-secondary)', border: PIXEL_BORDER }}
        >
          <IconComponent className="w-12 h-12" style={{ color: slide.color }} />
        </div>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {slide.subtitle}
        </span>
      </div>
    );
  }

  return (
    <img
      src={slide.image}
      alt={slide.title}
      className="w-full h-full object-cover"
      onError={() => setError(true)}
    />
  );
}

function QqIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
      <path d="M824.8 613.2c-16-51.4-34.4-94.6-62.7-165.3C766.5 262.2 689.3 112 511.5 112 331.5 112 256.2 265.2 261 447.9c-28.4 70.8-46.7 113.9-62.7 165.3-34 109.5-23 154.8-14.6 155.8 18 2.2 70.1-82.4 70.1-82.4 0 49 25.2 112.9 79.8 159-26.4 8.1-85.7 29.9-71.6 53.8 11.4 19.3 174.3 108.3 265.4 108.3 91.1 0 254-89 265.4-108.3 14.1-23.9-45.2-45.6-71.6-53.8 54.6-46.1 79.8-110.1 79.8-159 0 0 52.1 84.6 70.1 82.4 8.5-1.1 19.5-46.4-14.5-155.8z" />
    </svg>
  );
}
