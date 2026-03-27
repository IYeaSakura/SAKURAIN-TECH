/**
 * 简历页面
 * 
 * 非对称布局设计，左侧固定个人信息/技能，右侧滚动展示项目经历
 * 采用Studio页面的动画效果：AmbientGlow、粒子效果、滚动动画
 * 
 * @author SAKURAIN
 */
import { useState, useEffect, useRef, useMemo } from 'react';
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
          className="w-full h-full object-cover"
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
          className="w-full h-full object-cover"
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

// 技能条组件
function SkillBar({ name, level, color = 'var(--accent-primary)', delay = 0 }: { 
  name: string; 
  level: number; 
  color?: string;
  delay?: number;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  
  return (
    <div className="group">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors">
          {name}
        </span>
        <span className="text-xs text-[var(--text-muted)]">{level}%</span>
      </div>
      <div className="h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: prefersReducedMotion ? `${level}%` : 0 }}
          whileInView={{ width: `${level}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// 技能标签云
function SkillTagCloud({ skills }: { skills: { name: string; level: number; category?: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill, idx) => (
        <motion.span
          key={skill.name}
          className="px-3 py-1 text-xs rounded-full border transition-all cursor-default"
          style={{ 
            borderColor: skill.level >= 85 ? 'var(--accent-primary)' : 'var(--border-subtle)',
            background: skill.level >= 85 ? 'var(--accent-primary)15' : 'var(--bg-card)',
            color: skill.level >= 85 ? 'var(--accent-primary)' : 'var(--text-secondary)'
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.03 }}
          whileHover={{ scale: 1.05, y: -2 }}
        >
          {skill.name}
        </motion.span>
      ))}
    </div>
  );
}

// 项目卡片
function ProjectCard({ project, index }: { project: ResumeData['projects'][0]; index: number }) {
  const [showImages, setShowImages] = useState(false);
  const [showReadme, setShowReadme] = useState(false);
  
  const hasImages = project.images && project.images.length > 0;
  const hasReadme = project.readme && project.readme.trim() !== '';
  
  return (
    <>
      <motion.div
        className="relative group"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ delay: index * 0.1 }}
      >
        <div 
          className="relative p-6 rounded-2xl border transition-all duration-300 overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
            boxShadow: '0 4px 20px -10px rgba(0,0,0,0.2)'
          }}
        >
          {/* 发光效果 */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at top right, var(--accent-primary)10, transparent 50%)'
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
                <button
                  onClick={() => setShowImages(true)}
                  className="p-2 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all flex items-center gap-1"
                  title="项目预览"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-xs">预览</span>
                </button>
              )}
              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all"
                  title="访问网站"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {project.repo && (
                <a
                  href={project.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all"
                  title="查看源码"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
          
          {/* 技术栈 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tech.map((t) => (
              <span 
                key={t}
                className="px-2 py-0.5 text-xs rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
              >
                {t}
              </span>
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
              <button
                onClick={() => setShowReadme(true)}
                className="px-4 py-2 text-sm rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                查看设计文档
              </button>
            )}
          </div>
        </div>
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

// 实习经历卡片
function InternshipCard({ internship, index }: { internship: ResumeData['internships'][0]; index: number }) {
  return (
    <motion.div
      className="relative pl-8 pb-8 last:pb-0"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      {/* 时间线 */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--accent-primary)] to-transparent" />
      <div 
        className="absolute left-0 top-0 w-2 h-2 -translate-x-[3px] rounded-full"
        style={{ background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-primary)' }}
      />
      
      <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)]/50 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h4 className="font-bold text-[var(--text-primary)]">{internship.company}</h4>
          <span className="text-xs text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded">
            {internship.duration}
          </span>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-3">{internship.position}</p>
        
        {/* 技能标签 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {internship.highlights.map((h) => (
            <span key={h} className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
              {h}
            </span>
          ))}
        </div>
        
        {/* 成果 */}
        <ul className="space-y-1.5">
          {internship.achievements.map((achievement, idx) => (
            <li key={idx} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
              <span className="text-[var(--accent-secondary)] mt-1">•</span>
              <span>{achievement}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

// 核心优势项 - 简洁列表样式
function AdvantageItem({ advantage, index }: { advantage: ResumeData['advantages'][0]; index: number }) {
  return (
    <motion.div
      className="relative group py-3 border-b border-[var(--border-subtle)] last:border-0"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      {/* 左侧渐变装饰线 */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 group-hover:h-full bg-gradient-to-b from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-300 rounded-full" />
      
      <div className="pl-4">
        {/* 标题行：分类标签 + 亮点 */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-xs text-[var(--text-muted)]">
            {advantage.title}
          </span>
          <span className="w-1 h-1 rounded-full bg-[var(--border-subtle)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {advantage.highlight}
          </span>
        </div>
        
        {/* 技术栈 - 简洁标签 */}
        <div className="flex flex-wrap gap-1 mb-1.5">
          {advantage.tech.map((t) => (
            <span 
              key={t} 
              className="text-xs text-[var(--accent-primary)]"
            >
              #{t}
            </span>
          ))}
        </div>
        
        {/* 描述 - 更紧凑 */}
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {advantage.description}
        </p>
      </div>
    </motion.div>
  );
}

// 获奖证书轮播组件
function AwardCarousel({ awards }: { awards: ResumeData['awards'] }) {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
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
      className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.35 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
        <Award className="w-5 h-5 text-[var(--accent-primary)]" />
        获奖证书
      </h2>
      
      <div className="relative">
        {/* 图片容器 */}
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[var(--bg-secondary)]">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIdx}
              src={currentImage.src}
              alt={currentImage.title}
              className="w-full h-full object-cover cursor-pointer"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              onClick={() => window.open(currentImage.src, '_blank')}
            />
          </AnimatePresence>
          
          {/* 图片计数器 */}
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 text-white text-xs">
            {currentImageIdx + 1} / {totalImages}
          </div>
          
          {/* 左右切换按钮 */}
          {totalImages > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIdx((prev) => (prev - 1 + totalImages) % totalImages);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
                style={{ opacity: isHovered ? 1 : 0 }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIdx((prev) => (prev + 1) % totalImages);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                style={{ opacity: isHovered ? 1 : 0 }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        
        {/* 当前奖项标题 */}
        <p className="mt-2 text-sm text-[var(--text-secondary)] text-center truncate">
          {currentImage.title}
        </p>
        
        {/* 底部指示器 */}
        {totalImages > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {allImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIdx(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentImageIdx 
                    ? 'w-4 bg-[var(--accent-primary)]' 
                    : 'w-1.5 bg-[var(--border-subtle)] hover:bg-[var(--text-muted)]'
                }`}
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
    <div className="relative min-h-screen bg-[var(--bg-primary)] overflow-hidden">
      <ScrollProgress />
      
      {/* 背景效果 */}
      <div className="fixed inset-0 pointer-events-none">
        <AmbientGlow position="top-left" color="var(--accent-primary)" size={500} opacity={0.08} />
        <AmbientGlow position="bottom-right" color="var(--accent-secondary)" size={400} opacity={0.06} />
        <TwinklingStars count={30} color="var(--accent-primary)" secondaryColor="var(--accent-secondary)" />
      </div>
      
      {/* 主容器 */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* 头部横幅 */}
        <motion.header 
          className="relative px-6 py-12 md:py-16"
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
                
                {/* 基本信息卡片 */}
                <motion.section
                  className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">{data.profile.name}</h2>
                    <p className="text-sm text-[var(--text-muted)]">{data.profile.title}</p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <span className="w-16 text-[var(--text-muted)]">年龄</span>
                      <span>{data.profile.age}岁 · {data.profile.gender} · {data.profile.political}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <span className="w-16 text-[var(--text-muted)]">所在地</span>
                      <span>{data.profile.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <span className="w-16 text-[var(--text-muted)]">期望薪资</span>
                      <span className="text-[var(--accent-primary)] font-medium">{data.profile.salary}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-2">
                    <a 
                      href={`mailto:${data.profile.email}`}
                      className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {data.profile.email}
                    </a>
                    <a 
                      href={data.profile.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors truncate"
                    >
                      <Github className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{data.profile.github}</span>
                    </a>
                    <a 
                      href={data.profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      {data.profile.website}
                    </a>
                  </div>
                </motion.section>
                
                {/* 核心优势 - 简洁列表 */}
                <motion.section
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[var(--accent-primary)]" />
                    核心优势
                  </h2>
                  <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] px-4">
                    {data.advantages.map((adv, idx) => (
                      <AdvantageItem key={idx} advantage={adv} index={idx} />
                    ))}
                  </div>
                </motion.section>
                
                {/* 技能图谱 */}
                <motion.section
                  className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-[var(--accent-primary)]" />
                    技能图谱
                  </h2>
                  
                  {/* 核心语言 */}
                  <div className="mb-4">
                    <h4 className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wider">核心语言</h4>
                    <div className="space-y-2">
                      {data.skills.languages.slice(0, 3).map((skill, idx) => (
                        <SkillBar key={skill.name} {...skill} delay={idx * 0.1} />
                      ))}
                    </div>
                  </div>
                  
                  {/* 技术栈标签云 */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wider">前端</h4>
                      <SkillTagCloud skills={data.skills.frontend} />
                    </div>
                    <div>
                      <h4 className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wider">后端</h4>
                      <SkillTagCloud skills={data.skills.backend} />
                    </div>
                    <div>
                      <h4 className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wider">AI/ML</h4>
                      <SkillTagCloud skills={data.skills.ai} />
                    </div>
                    <div>
                      <h4 className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wider">DevOps</h4>
                      <SkillTagCloud skills={data.skills.devops} />
                    </div>
                    <div>
                      <h4 className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wider">数据库</h4>
                      <SkillTagCloud skills={data.skills.databases} />
                    </div>
                  </div>
                </motion.section>
                
                {/* 获奖证书轮播 */}
                {data.awards && data.awards.length > 0 && (
                  <AwardCarousel awards={data.awards} />
                )}
                
                {/* 教育背景 */}
                <motion.section
                  className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[var(--accent-primary)]" />
                    教育背景
                  </h2>
                  <div className="mb-3">
                    <h4 className="font-medium text-[var(--text-primary)]">{data.education.school}</h4>
                    <p className="text-sm text-[var(--text-muted)]">
                      {data.education.degree} · {data.education.major}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{data.education.duration}</p>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                    {data.education.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {data.education.honors.map((h) => (
                      <span key={h} className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                        {h}
                      </span>
                    ))}
                  </div>
                </motion.section>
                
                {/* 社团经历 */}
                <motion.section
                  className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[var(--accent-primary)]" />
                    社团经历
                  </h2>
                  <div className="mb-2">
                    <h4 className="font-medium text-[var(--text-primary)]">{data.club.name}</h4>
                    <p className="text-sm text-[var(--text-muted)]">{data.club.position}</p>
                    <p className="text-xs text-[var(--text-muted)]">{data.club.duration}</p>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
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
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
                  <Briefcase className="w-6 h-6 text-[var(--accent-primary)]" />
                  实习经历
                </h2>
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
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
                  <Cpu className="w-6 h-6 text-[var(--accent-primary)]" />
                  项目经历
                </h2>
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
