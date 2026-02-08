"use client"

import { motion, AnimatePresence } from 'framer-motion';
import {
  Github,
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
  BrainCircuit,
  Globe,
  Layers,
  Sparkles,
  ArrowUp,
  Calendar,
  Target,
  Workflow,
  Rocket,
  Server,
  Lock,
  Palette,
  FileCode,
  Gauge
} from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { GitHubHeatmap } from '@/components/GitHubHeatmap';
import { Footer } from '@/components/sections/Footer';
import { TwinklingStars, GradientText, LightBeam } from '@/components/effects';
import type { SiteData } from '@/types';

// 技术栈词云数据 - 随机颜色版本
const techCloudData = [
  // 基础设施 & DevOps
  { name: 'Docker', level: 90, category: 'devops', color: '#FF6B6B' },
  { name: 'Kubernetes', level: 75, category: 'devops', color: '#FF8E53' },
  { name: 'Nginx', level: 88, category: 'devops', color: '#FF6B9D' },
  { name: 'MySQL', level: 92, category: 'database', color: '#C44569' },
  { name: 'ClickHouse', level: 70, category: 'database', color: '#F8B500' },
  { name: 'Redis', level: 85, category: 'database', color: '#6C5CE7' },
  { name: 'Oracle', level: 80, category: 'database', color: '#A29BFE' },
  { name: 'MongoDB', level: 78, category: 'database', color: '#74B9FF' },
  { name: 'PostgreSQL', level: 80, category: 'database', color: '#0984E3' },
  { name: 'Git', level: 95, category: 'tool', color: '#00B894' },
  { name: 'GitHub Actions', level: 82, category: 'devops', color: '#00CEC9' },
  { name: 'Linux', level: 90, category: 'system', color: '#55A3FF' },
  { name: 'CI/CD', level: 85, category: 'system', color: '#FD79A8' },
  { name: 'Shell', level: 87, category: 'system', color: '#FDCB6E' },
  { name: 'DevOps', level: 85, category: 'system', color: '#E17055' },

  // 后端语言
  { name: 'Python', level: 95, category: 'backend', color: '#6C5CE7' },
  { name: 'FastAPI', level: 92, category: 'backend', color: '#00D2D3' },
  { name: 'Flask', level: 88, category: 'backend', color: '#54A0FF' },
  { name: 'Django', level: 85, category: 'backend', color: '#48DBFB' },
  { name: 'Node.js', level: 90, category: 'backend', color: '#1DD1A1' },
  { name: 'NestJS', level: 78, category: 'backend', color: '#FECA57' },
  { name: 'Go', level: 82, category: 'backend', color: '#FF9F43' },
  { name: 'Gin', level: 70, category: 'backend', color: '#EE5A24' },
  { name: 'Java', level: 85, category: 'backend', color: '#F368E0' },
  { name: 'Spring Boot', level: 83, category: 'backend', color: '#00D8D6' },
  { name: 'C/C++', level: 80, category: 'backend', color: '#5F27CD' },
  { name: 'PHP', level: 88, category: 'backend', color: '#341F97' },
  { name: 'WordPress', level: 75, category: 'backend', color: '#10AC84' },

  // 前端技术
  { name: 'TypeScript', level: 95, category: 'frontend', color: '#2E86DE' },
  { name: 'JavaScript', level: 96, category: 'frontend', color: '#F6B93B' },
  { name: 'React', level: 95, category: 'frontend', color: '#4A69BD' },
  { name: 'Next.js', level: 88, category: 'frontend', color: '#1E3799' },
  { name: 'Vue 3', level: 92, category: 'frontend', color: '#42B883' },
  { name: 'Vite', level: 90, category: 'frontend', color: '#646CFF' },
  { name: 'Tailwind CSS', level: 93, category: 'frontend', color: '#38BDF8' },
  { name: 'Framer Motion', level: 85, category: 'frontend', color: '#FF6B81' },
  { name: 'Three.js', level: 80, category: 'frontend', color: '#7BED9F' },
  { name: 'WebGL', level: 78, category: 'frontend', color: '#70A1FF' },
  { name: 'Cesium', level: 82, category: 'frontend', color: '#5352ED' },
  { name: "echarts", level: 85, category: 'frontend', color: '#FF4757' },
  { name: 'HTML5', level: 98, category: 'frontend', color: '#E15F41' },
  { name: 'CSS3', level: 95, category: 'frontend', color: '#25CCF7' },
  { name: 'Sass', level: 88, category: 'frontend', color: '#FD7272' },
  { name: 'Webpack', level: 85, category: 'frontend', color: '#58B19F' },
  { name: 'ESLint', level: 88, category: 'frontend', color: '#82589F' },
  { name: 'Prettier', level: 90, category: 'frontend', color: '#2BCBBA' },
  { name: 'shadcn/ui', level: 87, category: 'frontend', color: '#9AECDB' },
  { name: 'TDesign', level: 85, category: 'frontend', color: '#D6A2E8' },

  // AI & 数据科学
  { name: 'PyTorch', level: 88, category: 'ai', color: '#FF5252' },
  { name: 'TensorFlow', level: 88, category: 'ai', color: '#FF793F' },
  { name: 'OpenCV', level: 82, category: 'ai', color: '#34ACE0' },
  { name: 'NumPy', level: 90, category: 'ai', color: '#33D9B2' },
  { name: 'Pandas', level: 92, category: 'ai', color: '#706FD3' },
  { name: 'Scikit-learn', level: 85, category: 'ai', color: '#FF9FF3' },
  { name: 'Matplotlib', level: 88, category: 'ai', color: '#48DBFB' },
  { name: 'Seaborn', level: 92, category: 'ai', color: '#0ABDE3' },
  { name: 'Pyecharts', level: 85, category: 'ai', color: '#10AC84' },
  { name: 'LangChain', level: 85, category: 'ai', color: '#F368E0' },
  { name: 'Hugging Face', level: 80, category: 'ai', color: '#FFC312' },
  { name: 'ONNX', level: 72, category: 'ai', color: '#12CBC4' },
  { name: 'TensorRT', level: 70, category: 'ai', color: '#FDA7DF' },
  { name: 'CUDA', level: 68, category: 'ai', color: '#ED4C67' },
  { name: 'YOLO', level: 78, category: 'ai', color: '#B53471' },
  { name: "Transformer", level: 82, category: 'ai', color: '#6F1E51' },
  { name: "Diffusion Models", level: 85, category: 'ai', color: '#9980FA' },
  { name: "GAN", level: 82, category: 'ai', color: '#D980FA' },
  { name: "PPO", level: 85, category: 'ai', color: '#1289A7' },
  { name: "Conversation", level: 82, category: 'ai', color: '#0652DD' },
  { name: "SVM", level: 85, category: 'ai', color: '#1B1464' },

  // 桌面 & 移动开发
  { name: 'Qt C++', level: 78, category: 'desktop', color: '#009432' },
  { name: 'PySide6', level: 82, category: 'desktop', color: '#A3CB38' },
  { name: 'Electron', level: 85, category: 'desktop', color: '#1289A7' },
  { name: 'React Native', level: 78, category: 'mobile', color: '#EA2027' },
  { name: 'Flutter', level: 72, category: 'mobile', color: '#006266' },
  { name: 'Kotlin', level: 70, category: 'mobile', color: '#5758BB' },

  // WebAssembly & 性能
  { name: 'WebAssembly', level: 75, category: 'frontend', color: '#6F1E51' },
  { name: 'Rust WASM', level: 72, category: 'frontend', color: '#833471' },
  { name: 'AssemblyScript', level: 68, category: 'frontend', color: '#B53471' },
  { name: 'Web Workers', level: 85, category: 'frontend', color: '#40407A' },
  { name: 'Service Worker', level: 82, category: 'frontend', color: '#2C2C54' },
  { name: 'PWA', level: 88, category: 'frontend', color: '#227093' },

  // 测试 & 工具
  { name: 'Jest', level: 88, category: 'tool', color: '#218C74' },
  { name: 'Vitest', level: 85, category: 'tool', color: '#34B3F1' },
  { name: 'Cypress', level: 82, category: 'tool', color: '#6D214F' },
  { name: 'Playwright', level: 80, category: 'tool', color: '#182C61' },
  { name: 'Postman', level: 92, category: 'tool', color: '#FC5C65' },
  { name: 'Insomnia', level: 85, category: 'tool', color: '#9B59B6' },
  { name: 'Figma', level: 88, category: 'tool', color: '#E74C3C' },

  // 云服务
  { name: 'AWS', level: 78, category: 'cloud', color: '#F39C12' },
  { name: 'Azure', level: 75, category: 'cloud', color: '#3498DB' },
  { name: 'GCP', level: 72, category: 'cloud', color: '#E67E22' },
  { name: 'Cloud Functions', level: 85, category: 'cloud', color: '#1ABC9C' },
  { name: 'EdgeOne', level: 88, category: 'cloud', color: '#2ECC71' },
  { name: 'Vercel', level: 92, category: 'cloud', color: '#34495E' },
  { name: 'Cloudflare', level: 85, category: 'cloud', color: '#F1C40F' },
  { name: 'Supabase', level: 88, category: 'cloud', color: '#2ECC71' },
  { name: 'Firebase', level: 82, category: 'cloud', color: '#E74C3C' },

  // 安全
  { name: 'JWT', level: 90, category: 'security', color: '#9B59B6' },
  { name: 'OAuth 2.0', level: 88, category: 'security', color: '#16A085' },
  { name: 'OpenID Connect', level: 85, category: 'security', color: '#27AE60' },
  { name: 'HTTPS/TLS', level: 92, category: 'security', color: '#2980B9' },
  { name: 'CORS', level: 95, category: 'security', color: '#8E44AD' },
  { name: 'CSP', level: 88, category: 'security', color: '#2C3E50' },
  { name: 'WAF', level: 80, category: 'security', color: '#C0392B' },
  { name: "HMAC", level: 88, category: 'security', color: '#D35400' },
  { name: 'DDoS Protection', level: 78, category: 'security', color: '#7F8C8D' },
];

// 成就轮播图数据（图片 + 描述）
const achievementSlides = [
  {
    id: 1,
    title: "2024年中国大学生计算机博弈大赛",
    subtitle: "全国冠军",
    description: "在全国计算机博弈大赛中斩获冠军，展现了优秀的算法设计与工程实现能力。",
    color: "#fbbf24",
    year: "2024",
    image: "/image/about/by2024.webp",
    fallbackIcon: Trophy
  },
  {
    id: 2,
    title: "2025年计算机博弈大赛",
    subtitle: "全国亚军",
    description: "连续两年在国家级赛事中取得优异成绩，持续保持技术竞争力。",
    color: "#c0c0c0",
    year: "2025",
    image: "/image/about/by2025.webp",
    fallbackIcon: Award
  },
  {
    id: 3,
    title: "2024年挑战杯大赛",
    subtitle: "辽宁省铜奖",
    description: "在创新创业大赛中展现出色的项目实践能力与团队协作精神。",
    color: "#cd7f32",
    year: "2024",
    image: "/image/about/tzb.webp",
    fallbackIcon: Star
  }
];

// 项目统计数据
const projectStats = [
  { label: "项目模块", value: "120+", icon: Layers, color: "#60a5fa" },
  { label: "代码行数", value: "70K+", icon: Code2, color: "#34d399" },
  { label: "技术栈", value: 15, icon: Cpu, color: "#f472b6" },
  { label: "开源依赖", value: 93, icon: Github, color: "#fbbf24" },
];

// 词云图组件
function TechWordCloud() {
  const [hoveredTech, setHoveredTech] = useState<string | null>(null);

  // 打乱词云顺序
  const shuffledTechData = useMemo(() => {
    const array = [...techCloudData];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }, []);

  const getFontSize = (level: number) => {
    if (level >= 95) return 'text-2xl';
    if (level >= 90) return 'text-xl';
    if (level >= 85) return 'text-lg';
    if (level >= 80) return 'text-base';
    if (level >= 75) return 'text-sm';
    return 'text-xs';
  };

  const getOpacity = (level: number) => {
    return 0.4 + (level / 100) * 0.6;
  };

  const getRandomOffset = (index: number) => {
    const offsets = [
      { x: 0, y: 0 },
      { x: 10, y: -5 },
      { x: -5, y: 10 },
      { x: 15, y: 5 },
      { x: -10, y: -10 },
      { x: 5, y: 15 },
      { x: -15, y: 0 },
      { x: 0, y: -15 },
    ];
    return offsets[index % offsets.length];
  };

  const categories = {
    frontend: { label: '前端', color: '#61DAFB' },
    backend: { label: '后端', color: '#00D4AA' },
    ai: { label: 'AI/ML', color: '#FF6B6B' },
    database: { label: '数据库', color: '#F59E0B' },
    devops: { label: 'DevOps', color: '#8B5CF6' },
    cloud: { label: '云服务', color: '#EC4899' },
    desktop: { label: '桌面', color: '#10B981' },
    mobile: { label: '移动', color: '#3B82F6' },
    security: { label: '安全', color: '#EF4444' },
    system: { label: '系统', color: '#6B7280' },
    tool: { label: '工具', color: '#9CA3AF' },
  };

  return (
    <div className="relative">
      {/* 类别图例 */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {Object.entries(categories).map(([key, { label, color }]) => (
          <div
            key={key}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{
              background: `${color}15`,
              border: `1px solid ${color}30`,
              color: color
            }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* 词云 */}
      <div
        className="relative min-h-[500px] p-8 rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--bg-card), var(--bg-secondary))',
          border: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* 背景装饰 - 使用主题色并降低透明度 */}
        <div className="absolute inset-0 opacity-[0.08] dark:opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, var(--accent-primary), transparent)' }} />
          <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, var(--accent-secondary), transparent)' }} />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" style={{ background: 'radial-gradient(circle, var(--accent-tertiary), transparent)' }} />
        </div>

        {/* 技术词汇 */}
        <div className="relative flex flex-wrap justify-center items-center gap-3">
          {shuffledTechData.map((tech, index) => {
            const offset = getRandomOffset(index);
            return (
              <motion.span
                key={tech.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.02, type: 'spring', stiffness: 100 }}
                whileHover={{ scale: 1.2, zIndex: 10, textShadow: `0 0 20px ${tech.color}` }}
                onMouseEnter={() => setHoveredTech(tech.name)}
                onMouseLeave={() => setHoveredTech(null)}
                className={`inline-block px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-300 font-medium ${getFontSize(tech.level)}`}
                style={{
                  color: hoveredTech === tech.name ? tech.color : `${tech.color}DD`,
                  opacity: getOpacity(tech.level),
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                  textShadow: hoveredTech === tech.name ? `0 0 30px ${tech.color}50` : 'none',
                }}
              >
                {tech.name}
                {hoveredTech === tech.name && (
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs whitespace-nowrap z-20"
                    style={{ background: 'rgba(0,0,0,0.8)', color: tech.color, border: `1px solid ${tech.color}40` }}
                  >
                    熟练度: {tech.level}%
                  </motion.span>
                )}
              </motion.span>
            );
          })}
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-500">
          悬停查看熟练度
        </div>
      </div>
    </div>
  );
}

// 标题组件 - 艺术字体效果
function SectionTitle({ children, className = '', animated = true }: { children: string; className?: string; animated?: boolean }) {
  return (
    <h2 className={`text-4xl font-bold mb-4 ${className}`}>
      {animated ? (
        <GradientText
          className="font-sans font-black"
          colors={['var(--accent-primary)', 'var(--accent-secondary)', 'var(--accent-primary)']}
          animate={true}
          speed={4}
        >
          {children}
        </GradientText>
      ) : (
        <span
          className="bg-clip-text text-transparent font-sans font-black"
          style={{
            backgroundImage: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          }}
        >
          {children}
        </span>
      )}
    </h2>
  );
}

// 玻璃反光效果卡片组件
function GlassCard({
  children,
  className = '',
  hoverScale = 1.01,
  accentColor = 'var(--accent-primary)',
}: {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  accentColor?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: hoverScale, y: -3 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`relative ${className}`}
    >
      {/* 玻璃反光层 - 顶部高光 */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, transparent 60%)',
          opacity: isHovered ? 1 : 0.6,
        }}
      />

      {/* 悬浮时的边缘发光 */}
      <div
        className="absolute -inset-[1px] rounded-2xl transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, ${accentColor}60, transparent 50%)`,
          opacity: isHovered ? 0.4 : 0,
          filter: 'blur(4px)',
          zIndex: -1,
        }}
      />

      {/* 内容 */}
      <div className="relative h-full">
        {children}
      </div>
    </motion.div>
  );
}

// 星光背景容器
function StarryBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* 深色背景层 */}
      <div className="absolute inset-0" style={{ background: 'var(--bg-primary)' }} />

      {/* 星光效果 */}
      <TwinklingStars count={50} color="var(--accent-primary)" secondaryColor="var(--accent-secondary)" shootingStars={true} />

      {/* 环境光效 */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, var(--accent-secondary) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* 网格背景 */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />
    </div>
  );
}

export default function AboutPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [footerData, setFooterData] = useState<SiteData['footer'] | null>(null);

  // 加载 footer 数据
  useEffect(() => {
    fetch('/data/site-data.json')
      .then(res => res.json())
      .then((data: SiteData) => {
        setFooterData(data.footer);
      })
      .catch(console.error);
  }, []);

  // 轮播图自动播放
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

  // 滚动到顶部
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* 星光背景 */}
      <StarryBackground />

      {/* Hero 区域 - 不对称布局 */}
      <section id="about" className="relative pt-28 pb-20 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-8 items-end">
            {/* 左侧：头像和标签 - 占2列，底部对齐 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 flex flex-col items-center"
            >
              {/* 顶部问候语徽章 - 交互特效版 */}
              <GreetingBadge />

              {/* 头像 - 放大并居中 */}
              <div className="relative mb-8">
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {/* 发光环 */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                      filter: 'blur(25px)',
                    }}
                    animate={{
                      opacity: [0.3, 0.7, 0.3],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  <div
                    className="relative w-72 h-72 rounded-full p-1"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    }}
                  >
                    <div
                      className="w-full h-full rounded-full overflow-hidden"
                      style={{
                        background: 'var(--bg-card)',
                        border: '4px solid var(--bg-primary)',
                      }}
                    >
                      <img src="/image/about/head.jpg" alt="Yuyang" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <div
                    className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: 'var(--bg-primary)',
                      border: '3px solid var(--bg-primary)',
                    }}
                  >
                    <motion.div
                      className="w-5 h-5 rounded-full"
                      style={{ background: '#10b981' }}
                      animate={{
                        boxShadow: ['0 0 0 0 rgba(16, 185, 129, 0.4)', '0 0 0 6px rgba(16, 185, 129, 0)'],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                </motion.div>
              </div>

              {/* 标签信息 - 下移与右侧卡片底部对齐 */}
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { icon: Briefcase, text: "中国移动通讯集团工业互联网创新研究院" },
                  { icon: Calendar, text: "大四在读" },
                  { icon: Star, text: "中共党员" },
                  { icon: GraduationCap, text: "软件工程" },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
                    style={{
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.15)',
                      color: '#60a5fa'
                    }}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.text}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 右侧：文字内容 - 占3列 */}
            <div className="lg:col-span-3">
              <div className="flex justify-end mb-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full"
                  style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}
                >
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <span className="text-base font-medium text-blue-400">全栈开发 · 博弈算法 · AI 研究</span>
                </motion.div>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-6xl lg:text-7xl font-bold mb-5 text-right"
              >
                <span
                  className="bg-clip-text text-transparent animate-gradient-flow"
                  style={{ 
                    backgroundImage: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4, #3b82f6)',
                    backgroundSize: '300% 100%',
                  }}
                >
                  Yuyang
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-400 mb-10 text-right"
              >
                00后 | 大四在读 | 软件工程专业
              </motion.p>

              {/* 双栏介绍 */}
              <div className="grid sm:grid-cols-2 gap-5">
                <InfoCard 
                  icon={BookOpen}
                  title="关于我"
                  color="#60a5fa"
                  delay={0.5}
                >
                  热爱计算机技术的00后大学生，来自安徽宿州。中共党员，青年马克思主义者培养工程结业，在校期间担任班长。
                  <br /><br />
                  中国人工智能学会机器博弈专委会成员，发表过多智能体演化博弈领域的 SCI 三区论文，获得过计算机博弈大赛全国冠亚军。
                </InfoCard>

                <InfoCard 
                  icon={Code2}
                  title="技术之路"
                  color="#34d399"
                  delay={0.6}
                >
                  从中学时开发 LNMP 架构到大学深入学习 React、FastAPI、PyTorch 等框架，并积极参与科研项目。
                  <br /><br />
                  先后在沈阳人工智能研究院、合肥联想实习过，目前在中国移动通讯集团工业互联网创新研究院实习。
                  坚信：代码构建未来，技术赋能社会。
                </InfoCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 词云图区域 */}
      <section id="tech-cloud" className="relative py-20">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <SectionTitle>我的技术栈词云</SectionTitle>
            <p className="text-gray-500">熟练掌握 {techCloudData.length}+ 项技术</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <TechWordCloud />
          </motion.div>
        </div>
      </section>

      {/* 关于本项目 - 详细版 Bento Grid */}
      <section id="project" className="relative py-20">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <SectionTitle>关于本项目</SectionTitle>
            <p className="text-gray-500 mt-2">SAKURAIN TEAM - 技术展示与学习平台</p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-min">
            {/* 大卡片 - 3D地球 */}
            <GlassCard
              className="md:col-span-2 md:row-span-2 p-6 rounded-3xl relative overflow-hidden"
              accentColor="#3b82f6"
              hoverScale={1.01}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="h-full p-5 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
                  minHeight: '280px'
                }}
              >
                <Globe className="w-10 h-10 text-blue-400 mb-4" />
                <h3 className="text-2xl font-bold mb-3">3D 地球可视化</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  集成 Cesium 地球引擎，支持卫星轨道模拟、实时弹幕交互、多轨道类型展示。
                  支持 TLE 数据解析、SGP4 轨道预测算法，可实时计算卫星位置并展示在 3D 地球上。
                  支持 LEO、MEO、GEO 等多种轨道类型的可视化展示。
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Cesium', 'WebGL', 'Satellite.js', 'TLE'].map(tag => (
                    <span key={tag} className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-300">{tag}</span>
                  ))}
                </div>
              </motion.div>
            </GlassCard>

            {/* 架构设计卡片 */}
            <GlassCard
              className="p-5 rounded-2xl"
              accentColor="#a855f7"
              hoverScale={1.03}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                }}
              >
                <Server className="w-8 h-8 text-purple-400 mb-3" />
                <h4 className="font-bold mb-2">前端架构</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  React 19 + TypeScript + Vite 构建，采用模块化设计，支持代码分割和懒加载。
                </p>
              </motion.div>
            </GlassCard>

            {/* 性能优化卡片 */}
            <GlassCard
              className="p-5 rounded-2xl"
              accentColor="#10b981"
              hoverScale={1.03}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
                className="p-4 rounded-xl"
              >
                <Gauge className="w-8 h-8 text-emerald-400 mb-3" />
                <h4 className="font-bold mb-2">性能优化</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  虚拟滚动、图片懒加载、组件懒加载、CDN 加速，首屏加载时间 &lt; 1.5s。
                </p>
              </motion.div>
            </GlassCard>

            {/* 统计卡片 */}
            {projectStats.map((stat, index) => (
              <GlassCard
                key={stat.label}
                className="p-5 rounded-2xl flex flex-col justify-between"
                accentColor={stat.color}
                hoverScale={1.05}
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <stat.icon className="w-8 h-8 mb-3" style={{ color: stat.color }} />
                  <div>
                    <motion.div
                      className="text-3xl font-bold transition-all duration-300"
                      style={{ color: stat.color }}
                      whileHover={{ scale: 1.1, textShadow: `0 0 20px ${stat.color}` }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                </motion.div>
              </GlassCard>
            ))}

            {/* 安全防护卡片 */}
            <GlassCard
              className="p-5 rounded-2xl"
              accentColor="#10b981"
              hoverScale={1.03}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="p-4 rounded-xl"
              >
                <Lock className="w-8 h-8 text-emerald-400 mb-3" />
                <h4 className="font-bold mb-2">安全防护</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  API 鉴权、防爬策略、内容安全过滤、XSS/CSRF 防护、Rate Limiting。
                </p>
              </motion.div>
            </GlassCard>

            {/* 文档系统卡片 */}
            <GlassCard
              className="p-5 rounded-2xl"
              accentColor="#8b5cf6"
              hoverScale={1.03}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 }}
                className="p-4 rounded-xl"
              >
                <FileCode className="w-8 h-8 text-violet-400 mb-3" />
                <h4 className="font-bold mb-2">文档系统</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  支持 Markdown、代码高亮、PlantUML 图表、Mermaid 流程图、全文搜索。
                </p>
              </motion.div>
            </GlassCard>

            {/* UI/UX 设计卡片 */}
            <GlassCard
              className="p-5 rounded-2xl"
              accentColor="#ec4899"
              hoverScale={1.03}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="p-4 rounded-xl"
              >
                <Palette className="w-8 h-8 text-pink-400 mb-3" />
                <h4 className="font-bold mb-2">UI/UX 设计</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Framer Motion 动画、Tailwind CSS 样式、响应式设计、暗黑模式支持。
                </p>
              </motion.div>
            </GlassCard>

            {/* 部署架构卡片 */}
            <GlassCard
              className="md:col-span-2 p-5 rounded-2xl"
              accentColor="#f59e0b"
              hoverScale={1.01}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.45 }}
                className="p-4 rounded-xl"
              >
                <div className="flex items-start gap-4">
                  <Rocket className="w-8 h-8 text-amber-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold mb-2">现代部署架构</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Edge Functions + CDN 全球加速，支持 Serverless 部署。采用 Vercel/Cloudflare Pages
                      边缘计算平台，静态资源 CDN 分发，API 边缘函数处理，实现秒级响应和全球低延迟访问。
                      支持自动 CI/CD 流水线，代码提交后自动构建部署。
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['Vercel', 'Cloudflare', 'Edge Functions', 'CI/CD', 'Serverless'].map(tag => (
                        <span key={tag} className="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-300">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* AI 时代思考 */}
      <section id="ai-insights" className="relative py-20">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <SectionTitle>AI 时代的思考与实践</SectionTitle>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* AI 理解 */}
            <GlassCard
              className="p-8 rounded-3xl"
              accentColor="#a855f7"
              hoverScale={1.02}
            >
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-5 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.08), rgba(96, 165, 250, 0.08))',
                }}
              >
                <BrainCircuit className="w-10 h-10 text-purple-400 mb-4" />
                <h3 className="text-xl font-bold mb-4">我对 AI 技术的理解</h3>
                <div className="space-y-3 text-sm text-gray-400">
                  <p>
                    <strong className="text-purple-400">AI 是放大人类创造力的杠杆</strong>，而非替代工具。
                    大语言模型让编程从"写代码"转变为"设计 AI 工作流"。
                  </p>
                  <p>
                    我亲历大模型浪潮，从学术研究到工业落地，见证并参与 AI 重塑千行百业的变革。
                  </p>
                </div>
              </motion.div>
            </GlassCard>

            {/* AI 实践 */}
            <GlassCard
              className="p-8 rounded-3xl"
              accentColor="#3b82f6"
              hoverScale={1.02}
            >
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-5 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.08), rgba(52, 211, 153, 0.08))',
                }}
              >
                <Workflow className="w-10 h-10 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold mb-4">AI 实践探索</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  {[
                    "多智能体博弈研究 - SCI 论文",
                    "AI 辅助开发 workflow - 效率提升 300%",
                    "工业 AI 应用 - 设备预测性维护",
                    "持续学习跟踪前沿"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>
            </GlassCard>
          </div>

          {/* 价值理念 */}
          <GlassCard
            className="mt-6 p-8 rounded-3xl"
            accentColor="#f59e0b"
            hoverScale={1.01}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-5 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(245, 158, 11, 0.08))',
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-8 h-8 text-amber-400" />
                <h3 className="text-xl font-bold">在 AI 时代创造价值的理念</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { title: "深耕垂直领域", desc: "AI 让通用知识廉价，垂直领域深度经验才是稀缺资源" },
                  { title: "人机协作思维", desc: "AI 处理重复工作，人类专注创造性决策" },
                  { title: "快速迭代能力", desc: "保持学习热情和快速适应能力，始终站在技术前沿" },
                ].map((item, i) => (
                  <div key={i}>
                    <h4 className="font-bold mb-2 text-amber-400">{item.title}</h4>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </GlassCard>
        </div>
      </section>

      {/* 荣誉成就 - 图片轮播 */}
      <section id="achievements" className="relative py-20">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <SectionTitle>荣誉成就</SectionTitle>
            <p className="text-gray-500 mt-2">竞赛获奖与学术成果</p>
          </motion.div>

          {/* 轮播容器 */}
          <GlassCard
            className="relative rounded-3xl overflow-hidden"
            accentColor="#fbbf24"
            hoverScale={1.005}
          >
            <div
              className="h-full"
              style={{
                background: 'linear-gradient(135deg, var(--bg-card), var(--bg-secondary))',
              }}
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5 }}
                className="grid lg:grid-cols-2"
              >
                {/* 图片区域 - 固定尺寸容器 */}
                <div
                  className="relative h-[300px] sm:h-[350px] lg:h-[400px] overflow-hidden group"
                  style={{
                    background: `linear-gradient(135deg, ${achievementSlides[currentSlide].color}15, ${achievementSlides[currentSlide].color}05)`,
                  }}
                >
                  {/* 尝试加载图片，失败则显示图标 */}
                  <AchievementImage slide={achievementSlides[currentSlide]} />
                </div>

                {/* 文字内容 */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <span
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 w-fit"
                    style={{
                      background: `${achievementSlides[currentSlide].color}20`,
                      color: achievementSlides[currentSlide].color
                    }}
                  >
                    <Calendar className="w-4 h-4" />
                    {achievementSlides[currentSlide].year}
                  </span>

                  <h3 className="text-3xl lg:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {achievementSlides[currentSlide].subtitle}
                  </h3>

                  <p className="text-xl mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {achievementSlides[currentSlide].title}
                  </p>

                  <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {achievementSlides[currentSlide].description}
                  </p>

                  {/* 奖杯图标装饰 */}
                  <div className="mt-6 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <Trophy className="w-5 h-5" style={{ color: achievementSlides[currentSlide].color }} />
                    <span className="text-sm">国家级奖项</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* 导航按钮 */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* 指示器 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {achievementSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className="transition-all duration-300"
                  style={{
                    width: currentSlide === index ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: currentSlide === index ? 'var(--accent-primary)' : 'var(--border-subtle)'
                  }}
                />
              ))}
            </div>
          </div>
          </GlassCard>
        </div>
      </section>

      {/* GitHub 贡献 */}
      <section className="relative py-20">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <GlassCard accentColor="#10b981" hoverScale={1.005} className="rounded-3xl">
              <GitHubHeatmap username="IYeaSakura" />
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* 联系方式 */}
      <section className="relative py-20">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold mb-8">联系我</h2>
            <div className="flex justify-center gap-4">
              {[
                { icon: Github, href: 'https://github.com/IYeaSakura', color: '#ffffff', label: 'GitHub' },
                { icon: Mail, href: 'mailto:Yae_SakuRain@outlook.com', color: '#fbbf24', label: 'Email' },
              ].map((link, index) => (
                <motion.a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -6 }}
                  className="relative w-14 h-14 rounded-2xl flex items-center justify-center group overflow-hidden"
                  style={{
                    background: `${link.color}10`,
                    border: `1px solid ${link.color}30`,
                    color: link.color,
                    boxShadow: `0 0 0 ${link.color}00`,
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 0 30px ${link.color}40, 0 0 60px ${link.color}20`;
                    e.currentTarget.style.borderColor = `${link.color}80`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `0 0 0 ${link.color}00`;
                    e.currentTarget.style.borderColor = `${link.color}30`;
                  }}
                  title={link.label}
                >
                  {/* 光效背景 */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(circle at center, ${link.color}30, transparent 70%)`,
                    }}
                  />
                  {/* 扫光效果 */}
                  <div
                    className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${link.color}40, transparent)`,
                    }}
                  />
                  <link.icon className="w-6 h-6 relative z-10" />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 回到顶部按钮 */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={scrollToTop}
        className="fixed right-6 bottom-6 z-50 w-12 h-12 rounded-xl flex items-center justify-center bg-gray-900/80 border border-gray-700 hover:bg-gray-800 transition-colors"
      >
        <ArrowUp className="w-5 h-5" />
      </motion.button>

      {/* Footer - 使用首页相同的组件 */}
      {footerData && <Footer data={footerData} />}

      {/* 底部光剑 */}
      <LightBeam position="bottom" color="var(--accent-secondary)" intensity={0.2} />
    </div>
  );
}

// 成就图片组件 - 带 fallback
function AchievementImage({ slide }: { slide: typeof achievementSlides[0] }) {
  const [error, setError] = useState(false);

  if (error) {
    const IconComponent = slide.fallbackIcon;
    return (
      <div className="flex flex-col items-center">
        <div
          className="w-32 h-32 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: `${slide.color}20` }}
        >
          <IconComponent className="w-16 h-16" style={{ color: slide.color }} />
        </div>
        <span className="text-sm text-gray-500">{slide.subtitle}</span>
      </div>
    );
  }

  return (
    <img
      src={slide.image}
      alt={slide.title}
      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
      onError={() => setError(true)}
    />
  );
}

// 问候语徽章 - 交互特效版
const greetings = [
  { text: "Hello, World!", emoji: "👋", color: "#818cf8" },
  { text: "Stay Hungry", emoji: "🔥", color: "#f472b6" },
  { text: "Code & Create", emoji: "💻", color: "#60a5fa" },
  { text: "Think Different", emoji: "✨", color: "#a78bfa" },
  { text: "Keep Coding", emoji: "⚡", color: "#34d399" },
  { text: "Stay Foolish", emoji: "🚀", color: "#fbbf24" },
  { text: "Dream Big", emoji: "🌟", color: "#fb923c" },
  { text: "Just Do It", emoji: "💪", color: "#f87171" },
  { text: "Never Give Up", emoji: "🔮", color: "#c084fc" },
  { text: "Explore More", emoji: "🗺️", color: "#22d3ee" },
];

function GreetingBadge() {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // 悬浮时自动切换文字 - 放慢到2.5秒
  useEffect(() => {
    if (!isHovered) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % greetings.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isHovered]);

  const current = greetings[index];
  const next = greetings[(index + 1) % greetings.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      className="mb-6 relative cursor-pointer select-none overflow-visible"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => {
        setClickCount((c) => c + 1);
        setIndex((prev) => (prev + 1) % greetings.length);
      }}
      whileHover={{ 
        scale: 1.1,
      }}
      whileTap={{ scale: 0.95 }}
    >
      {/* 发光背景 */}
      <motion.div
        className="absolute inset-[-10px] rounded-full"
        animate={{
          background: `radial-gradient(circle, ${current.color}40, transparent 70%)`,
          scale: isHovered ? [1, 1.3, 1] : 1,
          opacity: isHovered ? [0.5, 0.8, 0.5] : 0.3,
        }}
        transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}
        style={{ filter: "blur(8px)" }}
      />

      {/* 外层光晕 */}
      <motion.div
        className="absolute inset-[-4px] rounded-full"
        style={{
          background: `linear-gradient(135deg, ${current.color}60, ${next.color}30)`,
          opacity: 0.6,
        }}
        animate={{
          scale: isHovered ? [1, 1.05, 1] : 1,
        }}
        transition={{ 
          duration: 1.5, repeat: Infinity
        }}
      />

      {/* 徽章主体 - 固定尺寸 */}
      <motion.div
        className="relative w-[160px] h-[42px] flex items-center justify-center rounded-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${current.color}25, ${current.color}08)`,
          border: `2px solid ${current.color}60`,
        }}
        animate={{
          boxShadow: isHovered 
            ? `0 0 30px ${current.color}50, 0 0 60px ${current.color}30, inset 0 0 20px ${current.color}20`
            : `0 0 15px ${current.color}30, inset 0 0 10px ${current.color}10`,
        }}
      >
        {/* 内部光流动效 */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent, ${current.color}30, transparent)`,
          }}
          animate={{
            x: isHovered ? ["-100%", "100%"] : "-100%",
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* 粒子效果 */}
        <AnimatePresence>
          {clickCount > 0 && (
            <motion.div
              key={clickCount}
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              {[...Array(8)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute"
                  initial={{ x: 80, y: 21, scale: 0, opacity: 1 }}
                  animate={{
                    x: 80 + (i - 4) * 25,
                    y: 21 + (Math.random() - 0.5) * 60,
                    scale: [0, 1.2, 0],
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ fontSize: "14px" }}
                >
                  {["✨", "⭐", "💫", "🌟", "✦", "◆", "●", "○"][i]}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 文字内容 - 固定位置 */}
        <div className="flex items-center gap-2 relative z-10">
          <motion.span
            key={current.emoji}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
            transition={{ 
              scale: { type: "spring", stiffness: 400 },
              rotate: { duration: 0.5, delay: 0.1 }
            }}
            className="text-base"
          >
            {current.emoji}
          </motion.span>
          <div className="relative h-5 w-[100px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={current.text}
                initial={{ opacity: 0, y: 15, scale: 0.8, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -15, scale: 0.8, filter: "blur(8px)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute text-sm font-bold whitespace-nowrap"
                style={{ color: current.color }}
              >
                {current.text}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// 信息卡片组件 - 带悬浮动画和反光效果
interface InfoCardProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  color: string;
  delay: number;
  children: React.ReactNode;
}

function InfoCard({ icon: Icon, title, color, delay, children }: InfoCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative p-6 rounded-xl overflow-hidden cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${isHovered ? color + '40' : 'rgba(255, 255, 255, 0.08)'}`,
      }}
      whileHover={{ 
        y: -8,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
    >
      {/* 悬浮发光边框 */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${color}20, transparent, ${color}10)`,
          boxShadow: `inset 0 0 30px ${color}15, 0 0 30px ${color}20`,
        }}
      />

      {/* 反光扫光效果 */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ x: '-100%', opacity: 0 }}
        animate={isHovered ? { x: '100%', opacity: [0, 0.6, 0] } : { x: '-100%', opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        style={{
          background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
          width: '50%',
        }}
      />

      {/* 顶部渐变光条 */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={isHovered ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* 内容 */}
      <div className="relative z-10">
        <motion.div 
          className="flex items-center gap-2 mb-4"
          animate={isHovered ? { x: 4 } : { x: 0 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <motion.div
            animate={isHovered ? { rotate: [0, -10, 10, 0], scale: 1.1 } : { rotate: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </motion.div>
          <motion.span 
            className="font-medium text-lg"
            style={{ color: isHovered ? color : 'inherit' }}
            transition={{ duration: 0.3 }}
          >
            {title}
          </motion.span>
        </motion.div>
        <p className="text-base leading-relaxed text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
          {children}
        </p>
      </div>

      {/* 角落装饰 */}
      <motion.div
        className="absolute top-3 right-3 w-2 h-2 rounded-full"
        style={{ background: color }}
        initial={{ scale: 0, opacity: 0 }}
        animate={isHovered ? { scale: [0, 1.2, 1], opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}
