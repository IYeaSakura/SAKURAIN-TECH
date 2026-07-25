'use client';

/**
 * AboutPage — a concise, externally-facing personal profile in neo-brutalist pixel style.
 *
 * The page leads with identity, impact numbers and core strengths, then shows the
 * tech stack, honors and contact channels. Everything is kept short and scannable.
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
  Calendar,
  Layers,
  Globe,
  Zap,
  Rocket,
  Terminal,
  Star,
} from 'lucide-react';
import { useAnimationEnabled, useNavigation, useTranslation } from '@/hooks';
import { Footer } from '@/components/sections/Footer';
import { GithubIcon as Github } from './GithubIcon';
import type { SiteData } from '@/types';

interface TechItem {
  name: string;
  category: string;
  color: string;
}

interface AchievementSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  year: string;
  image: string;
  fallbackIcon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const techStack: TechItem[] = [
  { name: 'TypeScript', category: 'Frontend', color: '#2E86DE' },
  { name: 'React', category: 'Frontend', color: '#4A69BD' },
  { name: 'Next.js', category: 'Frontend', color: '#111827' },
  { name: 'Vue 3', category: 'Frontend', color: '#42B883' },
  { name: 'Tailwind CSS', category: 'Frontend', color: '#38BDF8' },
  { name: 'Framer Motion', category: 'Frontend', color: '#FF6B81' },
  { name: 'Three.js / WebGL', category: 'Frontend', color: '#7BED9F' },
  { name: 'Python', category: 'Backend', color: '#6C5CE7' },
  { name: 'FastAPI', category: 'Backend', color: '#00D2D3' },
  { name: 'Node.js', category: 'Backend', color: '#1DD1A1' },
  { name: 'Go / Gin', category: 'Backend', color: '#FF9F43' },
  { name: 'Java / Spring Boot', category: 'Backend', color: '#F368E0' },
  { name: 'C / C++', category: 'Backend', color: '#5F27CD' },
  { name: 'PyTorch', category: 'AI / Data', color: '#FF5252' },
  { name: 'OpenCV', category: 'AI / Data', color: '#34ACE0' },
  { name: 'NumPy / Pandas', category: 'AI / Data', color: '#706FD3' },
  { name: 'YOLO / Transformer', category: 'AI / Data', color: '#B53471' },
  { name: 'MySQL', category: 'Database', color: '#C44569' },
  { name: 'Oracle', category: 'Database', color: '#F80000' },
  { name: 'MongoDB', category: 'Database', color: '#47A248' },
  { name: 'Redis', category: 'Database', color: '#6C5CE7' },
  { name: 'ClickHouse', category: 'Database', color: '#F8B500' },
  { name: 'Elasticsearch', category: 'Database', color: '#F0A30B' },
  { name: 'Docker', category: 'DevOps', color: '#FF6B6B' },
  { name: 'Kubernetes', category: 'DevOps', color: '#326CE5' },
  { name: 'GitHub Actions', category: 'DevOps', color: '#00CEC9' },
  { name: 'Nginx', category: 'DevOps', color: '#009639' },
  { name: 'Grafana', category: 'DevOps', color: '#F46800' },
  { name: 'Prometheus', category: 'DevOps', color: '#E6522C' },
  { name: 'Linux / Shell', category: 'System', color: '#55A3FF' },
  { name: 'EdgeOne', category: 'Cloud', color: '#2ECC71' },
  { name: 'Cloudflare', category: 'Cloud', color: '#F1C40F' },
];

const getAchievementSlides = (t: ReturnType<typeof useTranslation>['t']): AchievementSlide[] => [
  {
    id: 1,
    title: t.about.achievements.gameTheory2024.title,
    subtitle: t.about.achievements.gameTheory2024.subtitle,
    description: t.about.achievements.gameTheory2024.description,
    color: '#fbbf24',
    year: '2024',
    image: '/image/about/by2024.webp',
    fallbackIcon: Trophy,
  },
  {
    id: 2,
    title: t.about.achievements.gameTheory2025.title,
    subtitle: t.about.achievements.gameTheory2025.subtitle,
    description: t.about.achievements.gameTheory2025.description,
    color: '#c0c0c0',
    year: '2025',
    image: '/image/about/by2025.webp',
    fallbackIcon: Award,
  },
  {
    id: 3,
    title: t.about.achievements.challengeCup2024.title,
    subtitle: t.about.achievements.challengeCup2024.subtitle,
    description: t.about.achievements.challengeCup2024.description,
    color: '#cd7f32',
    year: '2024',
    image: '/image/about/tzb.webp',
    fallbackIcon: Star,
  },
];

const getProjectStats = (t: ReturnType<typeof useTranslation>['t']) => [
  { label: t.about.statsProjects, value: '120+', icon: Layers },
  { label: t.about.statsLines, value: '70K+', icon: Code2 },
  { label: t.about.statsStack, value: '15+', icon: Cpu },
  { label: t.about.statsDeps, value: '90+', icon: Github },
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
  const { t, tReplace } = useTranslation();

  // Scroll to top immediately when the page mounts.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Load footer data from the shared site-data.json source.
  useEffect(() => {
    fetch('/data/site-data.json')
      .then((res) => res.json())
      .then((data: SiteData) => setFooterData(data.footer))
      .catch(console.error);
  }, []);

  // Auto-advance the honors carousel every 5 seconds.
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

  // Group the tech stack by category for the bento grid layout.
  const techByCategory = useMemo(() => {
    const grouped: Record<string, TechItem[]> = {};
    for (const tech of techStack) {
      if (!grouped[tech.category]) grouped[tech.category] = [];
      grouped[tech.category].push(tech);
    }
    return grouped;
  }, []);

  const projectStats = useMemo(() => getProjectStats(t), [t]);
  const achievementSlides = useMemo(() => getAchievementSlides(t), [t]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-24 lg:py-28">
        {/* Back-to-home button with pixel hover nudge. */}
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button
            onClick={() => navigateTo('/')}
            className="group inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 mb-8"
            style={{
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-mono)',
              border: PIXEL_BORDER,
              background: 'var(--bg-secondary)',
              boxShadow: PIXEL_SHADOW,
            }}
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            {t.about.backToHome}
          </button>
        </motion.div>

        {/* Hero: pixel name, role and compact metadata. */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
            <div
              className="shrink-0 p-2"
              style={{ background: 'var(--bg-secondary)', border: PIXEL_BORDER, boxShadow: PIXEL_SHADOW }}
            >
              <img
                src="/image/about/head.jpg"
                alt="Yuyang"
                className="w-40 h-40 sm:w-52 sm:h-52 object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 text-[10px] font-bold uppercase tracking-wider border"
                style={{
                  borderColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary)',
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--bg-secondary)',
                }}
              >
                <Globe className="w-3 h-3" />
                {t.about.role}
              </div>

              <h1
                className="text-5xl sm:text-7xl lg:text-8xl font-bold uppercase leading-none mb-4"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
              >
                YUYANG
              </h1>
              <p
                className="text-base sm:text-lg font-bold uppercase tracking-wide mb-6"
                style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}
              >
                {t.about.education}
              </p>

              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Trophy, text: t.about.badges.gameTheoryChampion },
                  { icon: Rocket, text: t.about.badges.fullStack },
                  { icon: Terminal, text: t.about.badges.aiEngineering },
                  { icon: GraduationCap, text: t.about.badges.undergraduate },
                ].map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase border transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      background: 'var(--bg-secondary)',
                      boxShadow: '2px 2px 0 var(--border-subtle)',
                    }}
                  >
                    <item.icon className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
                    {item.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Stats strip: impact numbers first. */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-16"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {projectStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-5 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: PIXEL_BORDER,
                    boxShadow: PIXEL_SHADOW,
                  }}
                >
                  <Icon className="w-7 h-7 mb-4" style={{ color: 'var(--accent-primary)' }} />
                  <div
                    className="text-3xl sm:text-4xl font-bold mb-1"
                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Three core strengths in a bento row. */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HighlightCard
              icon={Zap}
              title={t.about.skillGameTheory}
              description={t.about.skillGameTheoryDesc}
              index={0}
            />
            <HighlightCard
              icon={Rocket}
              title={t.about.skillFullStack}
              description={t.about.skillFullStackDesc}
              index={1}
            />
            <HighlightCard
              icon={Terminal}
              title={t.about.skillAI}
              description={t.about.skillAIDesc}
              index={2}
            />
          </div>
        </motion.section>

        {/* Tech stack grouped by category. */}
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
            {t.about.techStack}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(techByCategory).map(([category, items], categoryIndex) => (
              <motion.div
                key={category}
                initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: categoryIndex * 0.05 }}
                className="p-4"
                style={{ background: 'var(--bg-secondary)', border: PIXEL_BORDER, boxShadow: PIXEL_SHADOW }}
              >
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
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Honors carousel. */}
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
            {t.about.honors}
          </h2>
          <div
            className="relative overflow-hidden"
            style={{ background: 'var(--bg-secondary)', border: PIXEL_BORDER, boxShadow: PIXEL_SHADOW }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div
                className="relative aspect-[4/3] overflow-hidden border-b-2 lg:border-b-0 lg:border-r-2"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
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
              <div className="p-6 sm:p-10 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase border"
                        style={{
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--accent-primary)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        <Calendar className="w-3 h-3" />
                        {achievementSlides[currentSlide].year}
                      </span>
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase border"
                        style={{
                          borderColor: achievementSlides[currentSlide].color,
                          color: achievementSlides[currentSlide].color,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        <Award className="w-3 h-3" />
                        {achievementSlides[currentSlide].subtitle}
                      </span>
                    </div>
                    <h3
                      className="text-2xl sm:text-3xl font-bold mb-3"
                      style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
                    >
                      {achievementSlides[currentSlide].subtitle}
                    </h3>
                    <p className="text-sm sm:text-base mb-4" style={{ color: 'var(--text-secondary)' }}>
                      {achievementSlides[currentSlide].title}
                    </p>
                    <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {achievementSlides[currentSlide].description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between mt-8">
                  <div className="flex items-center gap-2">
                    {achievementSlides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className="transition-all duration-300"
                        style={{
                          width: currentSlide === index ? 28 : 8,
                          height: 8,
                          background: currentSlide === index ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        }}
                        aria-label={tReplace(t.about.carousel.goToSlide, { index: index + 1 })}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <CarouselArrow onClick={prevSlide} ariaLabel={t.about.carousel.prev}>
                      <ChevronLeft className="w-4 h-4" />
                    </CarouselArrow>
                    <CarouselArrow onClick={nextSlide} ariaLabel={t.about.carousel.next}>
                      <ChevronRight className="w-4 h-4" />
                    </CarouselArrow>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Contact CTA. */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-16"
        >
          <div
            className="p-6 sm:p-10"
            style={{ background: 'var(--bg-secondary)', border: PIXEL_BORDER, boxShadow: PIXEL_SHADOW }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h2
                  className="text-2xl sm:text-3xl font-bold mb-2"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
                >
                  {t.about.contactTitle}
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t.about.contactDesc}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {contactLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider border transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                      boxShadow: PIXEL_SHADOW,
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider border transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                  style={{
                    background: 'var(--bg-primary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                    boxShadow: PIXEL_SHADOW,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <QqIcon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  {t.about.qq}
                </a>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {footerData && <Footer data={footerData} />}
    </div>
  );
}

/**
 * A small pixel-styled bento card used for the three highlight identities.
 */
function HighlightCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  index: number;
}) {
  const animationEnabled = useAnimationEnabled();

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group p-5 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
      style={{ background: 'var(--bg-secondary)', border: PIXEL_BORDER, boxShadow: PIXEL_SHADOW }}
    >
      <div
        className="w-11 h-11 flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
        style={{ background: 'var(--bg-primary)', border: PIXEL_BORDER }}
      >
        <Icon className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
      </div>
      <h3
        className="font-bold text-sm uppercase tracking-wider mb-2"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
      >
        {title}
      </h3>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {description}
      </p>
    </motion.div>
  );
}

/**
 * A single colored-dot technology tag with pixel shadow and hover lift.
 */
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
        background: 'var(--bg-primary)',
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

/**
 * Renders an honor slide image with a pixel fallback icon on load failure.
 */
function AchievementImage({ slide }: { slide: AchievementSlide }) {
  const [error, setError] = useState(false);
  const IconComponent = slide.fallbackIcon;

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8" style={{ background: 'var(--bg-primary)' }}>
        <div
          className="w-24 h-24 flex items-center justify-center mb-4"
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

/**
 * Small pixel-styled arrow button used for the honors carousel navigation.
 */
function CarouselArrow({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="p-2 border transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
      style={{
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-primary)',
        background: 'var(--bg-primary)',
        boxShadow: '2px 2px 0 var(--border-subtle)',
      }}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

/**
 * Inline QQ icon used by the contact CTA buttons.
 */
function QqIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
      <path d="M824.8 613.2c-16-51.4-34.4-94.6-62.7-165.3C766.5 262.2 689.3 112 511.5 112 331.5 112 256.2 265.2 261 447.9c-28.4 70.8-46.7 113.9-62.7 165.3-34 109.5-23 154.8-14.6 155.8 18 2.2 70.1-82.4 70.1-82.4 0 49 25.2 112.9 79.8 159-26.4 8.1-85.7 29.9-71.6 53.8 11.4 19.3 174.3 108.3 265.4 108.3 91.1 0 254-89 265.4-108.3 14.1-23.9-45.2-45.6-71.6-53.8 54.6-46.1 79.8-110.1 79.8-159 0 0 52.1 84.6 70.1 82.4 8.5-1.1 19.5-46.4-14.5-155.8z" />
    </svg>
  );
}
