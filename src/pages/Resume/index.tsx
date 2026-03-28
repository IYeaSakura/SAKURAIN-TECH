/**
 * 简历页面
 *
 * 非对称布局设计，左侧固定个人信息/技能，右侧滚动展示项目经历
 * 采用Studio页面的动画效果：AmbientGlow、粒子效果、滚动动画
 *
 * @author SAKURAIN
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Github,
  Globe,
  Code2,
  Cpu,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Users,
  Zap,
  X,
  FileText,
  Eye,
  Award,
  Mail
} from 'lucide-react';
import {
  AmbientGlow,
  TwinklingStars,
  ScrollProgress
} from '@/components/effects';
import { GradientText } from '@/components/effects/TextEffects';
import { usePrefersReducedMotion } from '@/lib/performance';
import { ThemeToggle } from '@/components/atoms/ThemeToggle';
import { useTheme } from '@/hooks';

// 鼠标位置追踪 Hook（用于 3D 卡片效果）
function useMousePosition(ref: React.RefObject<HTMLElement | null>) {
  const [position, setPosition] = useState({ x: 0, y: 0, isInside: false });
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setPosition({ x, y, isInside: true });
    };
    
    const handleMouseLeave = () => {
      setPosition({ x: 0.5, y: 0.5, isInside: false });
    };
    
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref]);
  
  return position;
}
import { RouteLoader } from '@/components/RouterTransition';
import { MarkdownRenderer } from '@/pages/Docs/components/MarkdownRenderer';

// 简历数据类型
interface ResumeData {
  profile: {
    name: string;
    title: string;
    subtitle: string;
    age: number;
    gender: string;
    political: string;
    phone: string;
    email: string;
    salary: string;
    location: string;
    website: string;
    github: string;
  };
  advantages: {
    title: string;
    highlight: string;
    tech: string[];
    description: string;
  }[];
  skills: {
    languages: { name: string; level: number; category: string }[];
    frontend: { name: string; level: number }[];
    backend: { name: string; level: number }[];
    ai: { name: string; level: number }[];
    devops: { name: string; level: number }[];
    databases: { name: string; level: number }[];
  };
  internships: {
    company: string;
    position: string;
    duration: string;
    highlights: string[];
    achievements: string[];
  }[];
  projects: {
    name: string;
    role: string;
    duration: string;
    url?: string;
    repo?: string;
    tech: string[];
    highlights: string[];
    images?: string[];
    readme?: string;
  }[];
  education: {
    school: string;
    degree: string;
    major: string;
    duration: string;
    honors: string[];
    courses: string[];
    description: string;
  };
  club: {
    name: string;
    position: string;
    duration: string;
    description: string;
  };
  awards: {
    title: string;
    images: string[];
  }[];
  stats: { value: string; label: string }[];
}

// 图片轮播组件 - 用于项目卡片内小图预览
function ImageCarousel({ images, alt }: { images?: string[]; alt: string }) {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  if (!images || images.length === 0) return null;

  // 单张图片直接展示
  if (images.length === 1) {
    return (
      <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden">
        <img
          src={images[0]}
          alt={alt}
          className="w-full h-full object-cover transition-all duration-300"
          style={{ filter: 'brightness(var(--image-brightness, 1))' }}
        />
      </div>
    );
  }

  const next = () => setCurrent((prev) => (prev + 1) % images.length);
  const prev = () => setCurrent((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div
      className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={images[current]}
          alt={`${alt} - ${current + 1}`}
          className="w-full h-full object-cover transition-all duration-300"
          style={{ filter: 'brightness(var(--image-brightness, 1))' }}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
        />
      </AnimatePresence>

      {/* 悬停遮罩 */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* 导航按钮 */}
      <motion.button
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
        onClick={(e) => { e.stopPropagation(); prev(); }}
      >
        <ChevronLeft className="w-5 h-5" />
      </motion.button>
      <motion.button
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
        onClick={(e) => { e.stopPropagation(); next(); }}
      >
        <ChevronRight className="w-5 h-5" />
      </motion.button>

      {/* 指示器 */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {images.map((_, idx) => (
          <button
            key={idx}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              idx === current ? 'bg-white w-4' : 'bg-white/50'
            }`}
            onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
          />
        ))}
      </div>

      {/* 图片计数 */}
      <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/50 text-white text-xs">
        {current + 1} / {images.length}
      </div>
    </div>
  );
}

// 图片预览模态框
function ImagePreviewModal({ images, title, isOpen, onClose }: {
  images: string[];
  title: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
  const [isLoading, setIsLoading] = useState(true);

  // 重置状态当模态框打开时
  useEffect(() => {
    if (isOpen) {
      setCurrent(0);
      setLoadedImages(new Set([0]));
      setIsLoading(true);
      // 预加载第一张
      preloadImage(0);
    }
  }, [isOpen]);

  // 预加载图片
  const preloadImage = (index: number) => {
    if (index < 0 || index >= images.length) return;
    const img = new Image();
    img.onload = () => {
      setLoadedImages(prev => new Set([...prev, index]));
      if (index === current) setIsLoading(false);
    };
    img.src = images[index];
  };

  // 当前图片变化时标记加载状态
  useEffect(() => {
    if (loadedImages.has(current)) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
      preloadImage(current);
    }
    // 预加载下一张
    preloadImage(current + 1);
  }, [current]);

  // 键盘导航
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, current, images.length]);

  const goToNext = () => {
    setCurrent((prev) => (prev + 1) % images.length);
  };

  const goToPrev = () => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!isOpen || !images.length) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-[95vw] h-[90vh] max-w-[1400px] bg-[var(--bg-primary)] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 - 固定高度 */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
            <h3 className="text-lg font-bold text-[var(--text-primary)] truncate pr-4">
              {title} - 项目预览
            </h3>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
          </div>

          {/* 图片区域 - 固定高度，居中显示 */}
          <div className="flex-1 relative bg-black/60 flex items-center justify-center overflow-hidden">
            {/* 加载状态 */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-[var(--text-muted)]">加载中...</span>
                </div>
              </div>
            )}

            {/* 图片容器 - 固定尺寸 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="relative w-full h-full flex items-center justify-center p-8"
              >
                {loadedImages.has(current) && (
                  <img
                    src={images[current]}
                    alt={`${title} - ${current + 1}`}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                    style={{ maxHeight: 'calc(90vh - 140px)' }}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* 导航按钮 */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all hover:scale-110"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all hover:scale-110"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* 底部指示器 - 固定高度 */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center justify-center gap-4">
            <span className="text-sm text-[var(--text-muted)] font-medium min-w-[3rem] text-center">
              {current + 1} / {images.length}
            </span>
            {images.length > 1 && (
              <div className="flex gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrent(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === current
                        ? 'bg-[var(--accent-primary)] w-6'
                        : 'bg-[var(--border-subtle)] w-2 hover:bg-[var(--text-muted)]'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// README 模态框
function ReadmeModal({ readmeUrl, title, isOpen, onClose }: {
  readmeUrl: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && readmeUrl) {
      setLoading(true);
      fetch(readmeUrl)
        .then(res => res.text())
        .then(text => {
          setContent(text);
          setLoading(false);
        })
        .catch(() => {
          setContent('加载文档失败');
          setLoading(false);
        });
    }
  }, [isOpen, readmeUrl]);

  // 键盘交互 - ESC关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-[95vw] h-[90vh] max-w-4xl bg-[var(--bg-primary)] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 - 固定高度 */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="text-lg font-bold text-[var(--text-primary)] truncate pr-4">{title} - 设计文档</h3>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <MarkdownRenderer content={content} />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// 磁吸按钮组件
function MagneticButton({ children, className, onClick, title }: { 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void;
  title?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = (e.clientX - centerX) * 0.15;
    const distanceY = (e.clientY - centerY) * 0.15;
    setPosition({ x: distanceX, y: distanceY });
  }, [prefersReducedMotion]);

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  return (
    <motion.button
      ref={ref}
      className={className}
      onClick={onClick}
      title={title}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 350, damping: 15 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}

// 磁吸链接组件
function MagneticLink({ children, className, href, target, rel, title }: { 
  children: React.ReactNode; 
  className?: string; 
  href: string;
  target?: string;
  rel?: string;
  title?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = (e.clientX - centerX) * 0.15;
    const distanceY = (e.clientY - centerY) * 0.15;
    setPosition({ x: distanceX, y: distanceY });
  }, [prefersReducedMotion]);

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  return (
    <motion.a
      ref={ref}
      className={className}
      href={href}
      target={target}
      rel={rel}
      title={title}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 350, damping: 15 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.a>
  );
}

// 技能分类区块 - 带颜色主题（柔和彩色配色）
function SkillCategorySection({ 
  title, 
  skills, 
  color = 'blue' 
}: { 
  title: string; 
  skills: { name: string; level: number }[];
  color?: 'blue' | 'emerald' | 'violet' | 'amber' | 'rose';
}) {
  // 柔和彩色配色 - 平衡饱和度
  const colorMap = {
    blue: { text: 'text-sky-500/80', bg: 'bg-sky-500/8', border: 'border-sky-500/20', hover: 'hover:bg-sky-500/15', accent: 'bg-sky-400/60' },
    emerald: { text: 'text-teal-500/80', bg: 'bg-teal-500/8', border: 'border-teal-500/20', hover: 'hover:bg-teal-500/15', accent: 'bg-teal-400/60' },
    violet: { text: 'text-indigo-500/80', bg: 'bg-indigo-500/8', border: 'border-indigo-500/20', hover: 'hover:bg-indigo-500/15', accent: 'bg-indigo-400/60' },
    amber: { text: 'text-amber-600/80', bg: 'bg-amber-500/8', border: 'border-amber-500/20', hover: 'hover:bg-amber-500/15', accent: 'bg-amber-400/60' },
    rose: { text: 'text-rose-500/80', bg: 'bg-rose-500/8', border: 'border-rose-500/20', hover: 'hover:bg-rose-500/15', accent: 'bg-rose-400/60' },
  };

  const theme = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <h4 className="text-xs text-[var(--text-muted)] mb-2 flex items-center gap-2">
        <span className={`w-4 h-px ${theme.accent}`} />
        <span className="text-[var(--text-secondary)]">{title}</span>
        <span className="text-[10px] text-[var(--text-muted)]">({skills.length})</span>
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill, idx) => (
          <motion.span
            key={skill.name}
            className={`relative px-2.5 py-1 text-xs rounded-md border cursor-default overflow-hidden ${theme.bg} ${theme.border} ${theme.text} ${theme.hover} transition-all duration-300`}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.03, type: 'spring', stiffness: 300 }}
            whileHover={{ 
              scale: 1.05, 
              y: -2,
              transition: { type: 'spring', stiffness: 400, damping: 17 }
            }}
          >
            {/* 微光扫过效果 */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5 }}
            />
            <span className="relative z-10 flex items-center gap-1.5">
              {skill.name}
              {/* 熟练度指示点 - 低饱和度 */}
              <span 
                className={`w-1 h-1 rounded-full ${
                  skill.level >= 90 ? 'bg-emerald-400/60' : 
                  skill.level >= 80 ? 'bg-blue-400/60' : 
                  skill.level >= 70 ? 'bg-amber-400/60' : 'bg-gray-400/60'
                }`}
              />
            </span>
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}

// 技能熟练度标识 - 更克制的样式
function SkillLevelBadge({ level }: { level: number }) {
  if (level >= 90) return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-medium">
      精通
    </span>
  );
  if (level >= 75) return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-secondary)]/15 text-[var(--accent-secondary)] font-medium">
      熟练
    </span>
  );
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)]">
      掌握
    </span>
  );
}

// 核心语言展示 - 3D倾斜卡片 + 流光边框 + 动态进度
function CoreLanguageCard({ name, level, delay = 0, index = 0 }: {
  name: string;
  level: number;
  delay?: number;
  index?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { x, y, isInside } = useMousePosition(cardRef);
  const prefersReducedMotion = usePrefersReducedMotion();

  // 3D倾斜计算
  const rotateX = prefersReducedMotion ? 0 : (isInside ? (y - 0.5) * -12 : 0);
  const rotateY = prefersReducedMotion ? 0 : (isInside ? (x - 0.5) * 12 : 0);
  const glowX = isInside ? x * 100 : 50;
  const glowY = isInside ? y * 100 : 50;

  // 根据熟练度获取颜色
  const getLevelColor = (lvl: number) => {
    if (lvl >= 90) return 'from-emerald-400 to-teal-500';
    if (lvl >= 80) return 'from-blue-400 to-indigo-500';
    if (lvl >= 70) return 'from-violet-400 to-purple-500';
    return 'from-amber-400 to-orange-500';
  };

  const levelColor = getLevelColor(level);

  return (
    <motion.div
      ref={cardRef}
      className="relative group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="relative p-4 rounded-xl border cursor-default overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
          boxShadow: isInside
            ? '0 20px 40px -20px rgba(0,0,0,0.4), 0 0 30px -5px var(--accent-primary)15'
            : '0 4px 15px -10px rgba(0,0,0,0.2)',
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d',
        }}
        animate={{ rotateX, rotateY }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* 流光边框效果 */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(400px circle at ${glowX}% ${glowY}%, var(--accent-primary)20, transparent 40%)`,
          }}
        />

        {/* 顶部渐变线 */}
        <motion.div
          className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${levelColor}`}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: delay + 0.2 }}
        />

        {/* 内容 */}
        <div className="relative z-10">
          {/* 头部：语言名 + 熟练度标签 */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
              {name}
            </span>
            <SkillLevelBadge level={level} />
          </div>

          {/* 进度条 */}
          <div className="relative">
            <div className="h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${levelColor}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${level}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: delay + 0.3, ease: 'easeOut' }}
              />
            </div>
            {/* 进度百分比 */}
            <motion.span
              className="absolute -top-5 right-0 text-[10px] font-mono text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
              initial={{ y: 5 }}
              whileHover={{ y: 0 }}
            >
              {level}%
            </motion.span>
          </div>
        </div>

        {/* 角落装饰 */}
        <motion.div
          className="absolute -bottom-2 -right-2 w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle, var(--accent-primary)20, transparent 70%)`,
          }}
        />
      </motion.div>
    </motion.div>
  );
}

// 技能标签云 - 弹性悬停 + 微光效果
function SkillTagCloud({ skills }: { skills: { name: string; level: number; category?: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill, idx) => (
        <motion.span
          key={skill.name}
          className="relative px-2.5 py-1 text-xs rounded border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] overflow-hidden cursor-default"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.03 }}
          whileHover={{ 
            scale: 1.08, 
            y: -2,
            borderColor: 'var(--accent-primary)50',
            color: 'var(--accent-primary)',
            backgroundColor: 'var(--accent-primary)10',
            transition: { type: 'spring', stiffness: 400, damping: 17 }
          }}
        >
          {/* 微光扫过效果 */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.5 }}
          />
          <span className="relative z-10">{skill.name}</span>
        </motion.span>
      ))}
    </div>
  );
}

// 项目卡片 - 3D 倾斜 + 流光边框
function ProjectCard({ project, index }: { project: ResumeData['projects'][0]; index: number }) {
  const [showImages, setShowImages] = useState(false);
  const [showReadme, setShowReadme] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { x, y, isInside } = useMousePosition(cardRef);
  const prefersReducedMotion = usePrefersReducedMotion();

  const hasImages = project.images && project.images.length > 0;
  const hasReadme = project.readme && project.readme.trim() !== '';

  // 3D 倾斜计算
  const rotateX = prefersReducedMotion ? 0 : (isInside ? (y - 0.5) * -10 : 0);
  const rotateY = prefersReducedMotion ? 0 : (isInside ? (x - 0.5) * 10 : 0);
  const glowX = isInside ? x * 100 : 50;
  const glowY = isInside ? y * 100 : 50;

  return (
    <>
      <motion.div
        className="relative group"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ delay: index * 0.1 }}
        style={{ perspective: '1000px' }}
      >
        <motion.div
          ref={cardRef}
          className="relative p-6 rounded-2xl border overflow-hidden cursor-pointer"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
            boxShadow: isInside 
              ? '0 20px 40px -20px rgba(0,0,0,0.4), 0 0 20px -5px var(--accent-primary)20' 
              : '0 4px 20px -10px rgba(0,0,0,0.2)',
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transformStyle: 'preserve-3d',
          }}
          animate={{
            rotateX,
            rotateY,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* 流光边框效果 */}
          <div 
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(600px circle at ${glowX}% ${glowY}%, var(--accent-primary)20, transparent 40%)`,
            }}
          />
          
          {/* 顶部光晕 */}
          <div
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-20 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl pointer-events-none"
            style={{
              background: 'var(--accent-primary)',
            }}
          />
          
          {/* 边框高亮 */}
          <div 
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              boxShadow: 'inset 0 1px 0 0 var(--accent-primary)30, inset 0 -1px 0 0 var(--accent-primary)10',
            }}
          />

          {/* 项目图片 - 卡片内预览 */}
          {hasImages && (
            <div className="mb-4">
              <ImageCarousel images={project.images} alt={project.name} />
            </div>
          )}

          {/* 头部信息 */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent-primary)] transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-[var(--text-muted)]">
                {project.role} · {project.duration}
              </p>
            </div>
            <div className="flex gap-2">
              {hasImages && (
                <MagneticButton
                  onClick={() => setShowImages(true)}
                  className="p-2 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all flex items-center gap-1.5"
                  title="项目预览"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-xs font-medium">预览</span>
                </MagneticButton>
              )}
              {project.url && (
                <MagneticLink
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all"
                  title="访问网站"
                >
                  <Globe className="w-4 h-4" />
                </MagneticLink>
              )}
              {project.repo && (
                <MagneticLink
                  href={project.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all"
                  title="查看源码"
                >
                  <Github className="w-4 h-4" />
                </MagneticLink>
              )}
            </div>
          </div>

          {/* 技术栈 - 弹性标签 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tech.map((t, idx) => (
              <motion.span
                key={t}
                className="px-2.5 py-1 text-xs rounded-md bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] group-hover:border-[var(--accent-primary)]/30 group-hover:text-[var(--accent-primary)] transition-colors cursor-default"
                whileHover={{ 
                  scale: 1.1, 
                  y: -2,
                  transition: { type: 'spring', stiffness: 400, damping: 17 }
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                {t}
              </motion.span>
            ))}
          </div>

          {/* 亮点 */}
          <div className="space-y-2">
            {project.highlights.map((highlight, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <span className="text-[var(--accent-primary)] mt-1">▸</span>
                <span>{highlight}</span>
              </div>
            ))}
          </div>

          {/* 操作按钮 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {hasReadme && (
              <MagneticButton
                onClick={() => setShowReadme(true)}
                className="px-4 py-2 text-sm rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                查看设计文档
              </MagneticButton>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* 图片预览模态框 */}
      {hasImages && (
        <ImagePreviewModal
          images={project.images!}
          title={project.name}
          isOpen={showImages}
          onClose={() => setShowImages(false)}
        />
      )}

      {/* README 模态框 */}
      {hasReadme && (
        <ReadmeModal
          readmeUrl={project.readme!}
          title={project.name}
          isOpen={showReadme}
          onClose={() => setShowReadme(false)}
        />
      )}
    </>
  );
}

// 实习经历卡片 - 增强时间线动效
function InternshipCard({ internship, index }: { internship: ResumeData['internships'][0]; index: number }) {
  return (
    <motion.div
      className="relative pl-8 pb-8 last:pb-0 group"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      {/* 时间线 - 带脉冲效果 */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--accent-primary)] to-transparent">
        <motion.div 
          className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[var(--accent-primary)] to-transparent"
          animate={{ 
            top: ['0%', '100%'],
            opacity: [1, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            repeatDelay: 1,
            ease: 'easeInOut'
          }}
        />
      </div>
      
      {/* 时间节点 - 悬停发光 */}
      <motion.div
        className="absolute left-0 top-0 w-2 h-2 -translate-x-[3px] rounded-full z-10"
        style={{ background: 'var(--accent-primary)' }}
        whileHover={{ 
          scale: 1.5,
          boxShadow: '0 0 20px var(--accent-primary)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      />

      <motion.div 
        className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden relative"
        whileHover={{ 
          borderColor: 'var(--accent-primary)50',
          x: 4,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* 悬停背景光效 */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
              {internship.company}
            </h4>
            <span className="text-xs text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded group-hover:bg-[var(--accent-primary)]/20 transition-colors">
              {internship.duration}
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-3">{internship.position}</p>

          {/* 技能标签 - 弹性悬停 */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {internship.highlights.map((h, idx) => (
              <motion.span 
                key={h} 
                className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-transparent hover:border-[var(--accent-primary)]/30 hover:text-[var(--accent-primary)] transition-colors cursor-default"
                whileHover={{ scale: 1.1, y: -1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                {h}
              </motion.span>
            ))}
          </div>

          {/* 成果 - 逐行滑入 */}
          <ul className="space-y-1.5">
            {internship.achievements.map((achievement, idx) => (
              <motion.li 
                key={idx} 
                className="text-sm text-[var(--text-secondary)] flex items-start gap-2 group/item"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + idx * 0.1 }}
                whileHover={{ x: 4 }}
              >
                <span className="text-[var(--accent-secondary)] mt-1 group-hover/item:text-[var(--accent-primary)] transition-colors">▸</span>
                <span className="group-hover/item:text-[var(--text-primary)] transition-colors">{achievement}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}

// 核心优势项 - 增强悬停动效
function AdvantageItem({ advantage, index }: { advantage: ResumeData['advantages'][0]; index: number }) {
  return (
    <motion.div
      className="relative group py-3 border-b border-[var(--border-subtle)] last:border-0 cursor-default"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ x: 4 }}
    >
      {/* 左侧渐变装饰线 - 带发光动画 */}
      <motion.div 
        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 bg-gradient-to-b from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full"
        initial={{ height: 0 }}
        whileHover={{ height: '100%' }}
        transition={{ duration: 0.3 }}
      />
      
      {/* 发光点 */}
      <motion.div
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[3px] w-2 h-2 rounded-full bg-[var(--accent-primary)] opacity-0 group-hover:opacity-100"
        animate={{ 
          boxShadow: [
            '0 0 5px var(--accent-primary)',
            '0 0 15px var(--accent-primary)',
            '0 0 5px var(--accent-primary)'
          ]
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      <div className="pl-4">
        {/* 标题行：分类标签 + 亮点 */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-xs text-[var(--text-muted)]">
            {advantage.title}
          </span>
          <motion.span 
            className="w-1 h-1 rounded-full bg-[var(--border-subtle)] group-hover:bg-[var(--accent-primary)] transition-colors"
          />
          <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
            {advantage.highlight}
          </span>
        </div>

        {/* 技术栈 - 标签动画 */}
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {advantage.tech.map((t, idx) => (
            <motion.span
              key={t}
              className="text-xs px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] cursor-default"
              whileHover={{ 
                scale: 1.1, 
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--bg-primary)'
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {t}
            </motion.span>
          ))}
        </div>

        {/* 描述 - 淡入效果 */}
        <motion.p 
          className="text-xs text-[var(--text-secondary)] leading-relaxed group-hover:text-[var(--text-muted)] transition-colors"
        >
          {advantage.description}
        </motion.p>
      </div>
    </motion.div>
  );
}

// 获奖证书轮播组件 - 增强图片悬停效果
function AwardCarousel({ awards }: { awards: ResumeData['awards'] }) {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  // 获取所有图片的扁平化数组，包含award索引
  const allImages = useMemo(() => {
    const images: { awardIdx: number; imageIdx: number; src: string; title: string }[] = [];
    awards.forEach((award, awardIdx) => {
      award.images.forEach((src, imageIdx) => {
        images.push({ awardIdx, imageIdx, src, title: award.title });
      });
    });
    return images;
  }, [awards]);

  const totalImages = allImages.length;
  const currentImage = allImages[currentImageIdx];

  // 自动轮播
  useEffect(() => {
    if (isHovered || totalImages <= 1) return;
    const timer = setInterval(() => {
      setCurrentImageIdx((prev) => (prev + 1) % totalImages);
    }, 3000);
    return () => clearInterval(timer);
  }, [isHovered, totalImages]);

  if (totalImages === 0) return null;

  return (
    <motion.section
      className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] group"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.35 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ borderColor: 'var(--accent-primary)40' }}
    >
      <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
        <Award className="w-5 h-5 text-[var(--accent-primary)]" />
        获奖证书
      </h2>

      <div className="relative">
        {/* 图片容器 - 悬停缩放 */}
        <motion.div 
          className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[var(--bg-secondary)] cursor-pointer"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIdx}
              className="w-full h-full"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: 'easeOut' }}
              onClick={() => window.open(currentImage.src, '_blank')}
            >
              <motion.img
                src={currentImage.src}
                alt={currentImage.title}
                className="w-full h-full object-cover transition-all duration-300"
                style={{ filter: 'brightness(var(--image-brightness, 1))' }}
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.4 }}
              />
            </motion.div>
          </AnimatePresence>

          {/* 悬停遮罩 */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-white text-xs font-medium">点击查看大图</span>
          </motion.div>

          {/* 图片计数器 - 动态样式 */}
          <motion.div 
            className="absolute top-2 right-2 px-2 py-1 rounded-full text-white text-xs font-medium"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            animate={{
              background: isHovered ? 'var(--accent-primary)' : 'rgba(0,0,0,0.6)'
            }}
            transition={{ duration: 0.3 }}
          >
            {currentImageIdx + 1} / {totalImages}
          </motion.div>

          {/* 左右切换按钮 - 磁吸效果 */}
          {totalImages > 1 && (
            <>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIdx((prev) => (prev - 1 + totalImages) % totalImages);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-white"
                style={{ background: 'rgba(0,0,0,0.5)' }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                whileHover={{ scale: 1.15, background: 'var(--accent-primary)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIdx((prev) => (prev + 1) % totalImages);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-white"
                style={{ background: 'rgba(0,0,0,0.5)' }}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
                whileHover={{ scale: 1.15, background: 'var(--accent-primary)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </>
          )}
        </motion.div>

        {/* 当前奖项标题 - 渐变文字 */}
        <motion.p 
          className="mt-3 text-sm text-[var(--text-secondary)] text-center truncate font-medium"
          animate={{ 
            color: isHovered ? 'var(--accent-primary)' : 'var(--text-secondary)'
          }}
          transition={{ duration: 0.3 }}
        >
          {currentImage.title}
        </motion.p>

        {/* 底部指示器 - 弹性动画 */}
        {totalImages > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {allImages.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => setCurrentImageIdx(idx)}
                className={`h-1.5 rounded-full ${
                  idx === currentImageIdx
                    ? 'bg-[var(--accent-primary)]'
                    : 'bg-[var(--border-subtle)] hover:bg-[var(--text-muted)]'
                }`}
                animate={{
                  width: idx === currentImageIdx ? 16 : 6,
                }}
                whileHover={{ scale: 1.3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}

export default function ResumePage() {
  const [data, setData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { theme, isTransitioning, toggleTheme } = useTheme();

  const { scrollYProgress } = useScroll({ container: containerRef });
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.8]);

  useEffect(() => {
    fetch(`/resume/resume-data.json?v=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((d: ResumeData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <RouteLoader />;
  if (!data) return <div className="p-10 text-center">加载失败</div>;

  return (
    <div 
      className="relative min-h-screen overflow-hidden" 
      style={{ 
        background: 'var(--bg-primary)',
        '--image-brightness': theme === 'dark' ? '0.75' : '1',
      } as React.CSSProperties}
    >
      <ScrollProgress />

      {/* 背景效果 - 与其他页面保持一致 */}
      <div className="fixed inset-0 pointer-events-none">
        {/* 网格背景 */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
        {/* 柔和渐变光效 */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle, var(--accent-primary)20 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, var(--accent-secondary)15 0%, transparent 70%)' }} />
        </div>
        <TwinklingStars count={20} color="rgba(148, 163, 184, 0.4)" secondaryColor="rgba(99, 102, 241, 0.3)" />
      </div>

      {/* 固定导航栏 - 主题切换 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-4 right-4 z-50"
      >
        <ThemeToggle 
          theme={theme} 
          onToggle={toggleTheme} 
          isTransitioning={isTransitioning}
        />
      </motion.div>

      {/* 主容器 */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* 头部横幅 */}
        <motion.header
          className="relative px-6 py-12 md:py-16 pt-20 md:pt-24"
          style={{ opacity: prefersReducedMotion ? 1 : headerOpacity }}
        >
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 mb-6"
            >
              <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="text-sm text-[var(--accent-primary)]">求职意向：{data.profile.title}</span>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl font-bold mb-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GradientText>{data.profile.name}</GradientText>
            </motion.h1>

            <motion.p
              className="text-lg text-[var(--text-muted)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {data.profile.subtitle}
            </motion.p>
          </div>
        </motion.header>

        {/* 非对称布局主体 */}
        <div className="px-6 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* 左侧：个人信息与技能（固定） */}
            <div className="lg:col-span-4 space-y-6">
              <div className="lg:sticky lg:top-6 space-y-6">

                {/* 基本信息卡片 - 微浮动效果 */}
                <motion.section
                  className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] group relative overflow-hidden"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ 
                    y: -2,
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3), 0 0 0 1px var(--accent-primary)20'
                  }}
                >
                  {/* 顶部光效 */}
                  <motion.div 
                    className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-0 group-hover:opacity-100"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.5 }}
                  />

                  <div className="mb-4">
                    <motion.h2 
                      className="text-lg font-bold text-[var(--text-primary)]"
                      whileHover={{ x: 2 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      {data.profile.name}
                    </motion.h2>
                    <p className="text-sm text-[var(--text-muted)]">{data.profile.title}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <motion.div 
                      className="flex items-center gap-2 text-[var(--text-secondary)]"
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <span className="w-16 text-[var(--text-muted)]">年龄</span>
                      <span>{data.profile.age}岁 · {data.profile.gender} · {data.profile.political}</span>
                    </motion.div>
                    <motion.div 
                      className="flex items-center gap-2 text-[var(--text-secondary)]"
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <span className="w-16 text-[var(--text-muted)]">籍贯</span>
                      <span>{data.profile.location}</span>
                    </motion.div>
                    <motion.div 
                      className="flex items-center gap-2 text-[var(--text-secondary)]"
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <span className="w-16 text-[var(--text-muted)]">期望薪资</span>
                      <span className="text-[var(--accent-primary)] font-medium">{data.profile.salary}</span>
                    </motion.div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-2">
                    <MagneticLink
                      href={`mailto:${data.profile.email}`}
                      className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors group/link"
                    >
                      <motion.div whileHover={{ rotate: 15, scale: 1.1 }}>
                        <Mail className="w-4 h-4" />
                      </motion.div>
                      <span className="group-hover/link:underline decoration-[var(--accent-primary)]/50 underline-offset-2">{data.profile.email}</span>
                    </MagneticLink>
                    <MagneticLink
                      href={data.profile.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors group/link"
                    >
                      <motion.div whileHover={{ rotate: 15, scale: 1.1 }}>
                        <Github className="w-4 h-4 flex-shrink-0" />
                      </motion.div>
                      <span className="truncate group-hover/link:underline decoration-[var(--accent-primary)]/50 underline-offset-2">{data.profile.github}</span>
                    </MagneticLink>
                    <MagneticLink
                      href={data.profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors group/link"
                    >
                      <motion.div whileHover={{ rotate: 15, scale: 1.1 }}>
                        <Globe className="w-4 h-4" />
                      </motion.div>
                      <span className="group-hover/link:underline decoration-[var(--accent-primary)]/50 underline-offset-2">{data.profile.website}</span>
                    </MagneticLink>
                  </div>
                </motion.section>

                {/* 核心优势 - 增强悬停 */}
                <motion.section
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.h2 
                    className="text-lg font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2 group cursor-default"
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <motion.div whileHover={{ rotate: 15, scale: 1.2 }} transition={{ type: 'spring' }}>
                      <Zap className="w-5 h-5 text-[var(--accent-primary)]" />
                    </motion.div>
                    <span className="group-hover:text-[var(--accent-primary)] transition-colors">核心优势</span>
                  </motion.h2>
                  <motion.div 
                    className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] px-4"
                    whileHover={{ borderColor: 'var(--accent-primary)30' }}
                    transition={{ duration: 0.3 }}
                  >
                    {data.advantages.map((adv, idx) => (
                      <AdvantageItem key={idx} advantage={adv} index={idx} />
                    ))}
                  </motion.div>
                </motion.section>

                {/* 技术栈 - 3D卡片 + 动态光效 */}
                <motion.section
                  className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] group relative overflow-hidden"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ 
                    y: -2,
                    boxShadow: '0 20px 40px -20px rgba(0,0,0,0.4), 0 0 0 1px var(--accent-primary)20'
                  }}
                >
                  {/* 背景光效 */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-32 h-32 bg-[var(--accent-primary)]/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-[var(--accent-secondary)]/5 rounded-full blur-3xl" />
                  </div>

                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 group-hover:text-[var(--accent-primary)] transition-colors relative z-10">
                    <motion.div whileHover={{ rotate: 10 }}>
                      <Code2 className="w-5 h-5 text-[var(--accent-primary)]" />
                    </motion.div>
                    技术栈
                  </h2>

                  {/* 核心语言 - 3D卡片网格 */}
                  <div className="mb-6 relative z-10">
                    <h4 className="text-xs text-[var(--text-muted)] mb-3 uppercase tracking-wider flex items-center gap-2">
                      <motion.span 
                        className="w-4 h-px bg-[var(--border-subtle)] group-hover:bg-[var(--accent-primary)]/50 transition-colors"
                      />
                      主要开发语言
                      <span className="text-[10px] text-[var(--text-muted)]">({data.skills.languages.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {data.skills.languages.map((skill, idx) => (
                        <CoreLanguageCard key={skill.name} {...skill} delay={idx * 0.08} index={idx} />
                      ))}
                    </div>
                  </div>

                  {/* 技术栈标签云 */}
                  <div className="space-y-4 relative z-10">
                    <SkillCategorySection 
                      title="前端技术" 
                      skills={data.skills.frontend} 
                      color="blue"
                    />
                    <SkillCategorySection 
                      title="后端框架" 
                      skills={data.skills.backend} 
                      color="emerald"
                    />
                    <SkillCategorySection 
                      title="AI / 大模型" 
                      skills={data.skills.ai} 
                      color="violet"
                    />
                    <SkillCategorySection 
                      title="运维 & 工具" 
                      skills={data.skills.devops} 
                      color="amber"
                    />
                    <SkillCategorySection 
                      title="数据存储" 
                      skills={data.skills.databases} 
                      color="rose"
                    />
                  </div>
                </motion.section>

                {/* 获奖证书轮播 */}
                {data.awards && data.awards.length > 0 && (
                  <AwardCarousel awards={data.awards} />
                )}

                {/* 教育背景 - 增强悬停效果 */}
                <motion.section
                  className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] group relative overflow-hidden"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ 
                    y: -2,
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)'
                  }}
                >
                  {/* 装饰背景 */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--accent-primary)]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 group-hover:text-[var(--accent-primary)] transition-colors">
                    <motion.div whileHover={{ rotate: 15, scale: 1.1 }} transition={{ type: 'spring' }}>
                      <GraduationCap className="w-5 h-5 text-[var(--accent-primary)]" />
                    </motion.div>
                    教育背景
                  </h2>
                  
                  <motion.div 
                    className="mb-3"
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <h4 className="font-medium text-[var(--text-primary)]">{data.education.school}</h4>
                    <p className="text-sm text-[var(--text-muted)]">
                      {data.education.degree} · {data.education.major}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{data.education.duration}</p>
                  </motion.div>
                  
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                    {data.education.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {data.education.honors.map((h, idx) => (
                      <motion.span 
                        key={h} 
                        className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-transparent hover:border-[var(--accent-primary)]/30 cursor-default"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.1, y: -1 }}
                      >
                        {h}
                      </motion.span>
                    ))}
                  </div>
                </motion.section>

                {/* 社团经历 - 增强悬停效果 */}
                <motion.section
                  className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] group relative overflow-hidden"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ 
                    y: -2,
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)'
                  }}
                >
                  {/* 装饰背景 */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--accent-secondary)]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 group-hover:text-[var(--accent-secondary)] transition-colors">
                    <motion.div whileHover={{ rotate: -15, scale: 1.1 }} transition={{ type: 'spring' }}>
                      <Users className="w-5 h-5 text-[var(--accent-primary)]" />
                    </motion.div>
                    社团经历
                  </h2>
                  
                  <motion.div 
                    className="mb-2"
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <h4 className="font-medium text-[var(--text-primary)]">{data.club.name}</h4>
                    <p className="text-sm text-[var(--text-muted)]">{data.club.position}</p>
                    <p className="text-xs text-[var(--text-muted)]">{data.club.duration}</p>
                  </motion.div>
                  
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed group-hover:text-[var(--text-muted)] transition-colors">
                    {data.club.description}
                  </p>
                </motion.section>

              </div>
            </div>

            {/* 右侧：项目经历与实习（滚动） */}
            <div className="lg:col-span-8 space-y-8">

              {/* 实习经历 */}
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <motion.h2 
                  className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3 group cursor-default"
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <Briefcase className="w-6 h-6 text-[var(--accent-primary)]" />
                  </motion.div>
                  <span className="group-hover:text-[var(--accent-primary)] transition-colors">实习经历</span>
                  <motion.div 
                    className="h-px flex-1 bg-gradient-to-r from-[var(--border-subtle)] to-transparent ml-4"
                    initial={{ scaleX: 0, originX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                  />
                </motion.h2>
                <div className="space-y-0">
                  {data.internships.map((internship, idx) => (
                    <InternshipCard key={idx} internship={internship} index={idx} />
                  ))}
                </div>
              </motion.section>

              {/* 项目经历 */}
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <motion.h2 
                  className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3 group cursor-default"
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <Cpu className="w-6 h-6 text-[var(--accent-primary)]" />
                  </motion.div>
                  <span className="group-hover:text-[var(--accent-primary)] transition-colors">项目经历</span>
                  <motion.div 
                    className="h-px flex-1 bg-gradient-to-r from-[var(--border-subtle)] to-transparent ml-4"
                    initial={{ scaleX: 0, originX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                  />
                </motion.h2>
                <div className="space-y-6">
                  {data.projects.map((project, idx) => (
                    <ProjectCard key={idx} project={project} index={idx} />
                  ))}
                </div>
              </motion.section>

            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
