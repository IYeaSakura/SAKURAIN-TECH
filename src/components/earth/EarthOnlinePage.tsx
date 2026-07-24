'use client';

/**
 * Earth Online sub-page (migrated from legacy Vite project src/pages/EarthOnline/index.tsx)
 *
 * Layout: left info panel + right showcase container
 * Reuses the homepage showcase container (GlobeShowcase component)
 *
 * @author SAKURAIN
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Map,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { GlobeShowcase, DEMOS, type DemoType } from './GlobeShowcase';
import { Footer } from '@/components/sections/Footer';
import { RouteLoader } from '@/components/RouteLoader';
import { useConfig } from '@/hooks';
import { CommentSection } from '@/components/blog/components/CommentSection';
import type { SiteData } from '@/types';

// Feature card with neo-brutalist border, offset shadow and hover nudge
interface FeatureCardProps {
  icon: typeof Globe;
  title: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
  delay: number;
}

const FeatureCard = ({ icon: Icon, title, description, isActive, onClick, delay }: FeatureCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full text-left relative group"
    >
      <div
        className="relative p-4 overflow-hidden transition-all duration-200"
        style={{
          background: isActive ? 'var(--bg-secondary)' : 'var(--bg-primary)',
          border: `2px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
          boxShadow: isActive
            ? '4px 4px 0 var(--accent-primary)'
            : '4px 4px 0 var(--border-subtle)',
          transform: isHovered ? 'translate(-2px, -2px)' : 'translate(0, 0)',
        }}
      >
        {/* Active indicator on the left edge */}
        {isActive && (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8"
            style={{ background: 'var(--accent-primary)' }}
          />
        )}

        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center transition-all duration-200"
            style={{
              background: isActive ? 'var(--bg-primary)' : 'var(--bg-secondary)',
              border: `2px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
            }}
          >
            <Icon
              className="w-6 h-6 transition-colors duration-200"
              style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-sm mb-1 uppercase tracking-wider transition-colors duration-200"
              style={{
                fontFamily: 'var(--font-mono)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {title}
            </h3>
            <p
              className="text-xs line-clamp-2 transition-colors duration-200"
              style={{ color: 'var(--text-muted)' }}
            >
              {description}
            </p>
          </div>

          <ChevronRight
            className="flex-shrink-0 w-5 h-5 transition-all duration-200"
            style={{
              color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
              opacity: isActive || isHovered ? 1 : 0,
              transform: isActive || isHovered ? 'translateX(0)' : 'translateX(-10px)',
            }}
          />
        </div>
      </div>
    </motion.button>
  );
};

// Left info panel with brutalist header, current demo card and feature switcher
const InfoPanel = ({
  selectedDemo,
  onSelectDemo
}: {
  selectedDemo: DemoType;
  onSelectDemo: (demo: DemoType) => void;
}) => {
  const currentDemo = DEMOS.find(d => d.id === selectedDemo) || DEMOS[0];
  const Icon = currentDemo.icon;

  const features = [
    {
      id: 'cesium' as DemoType,
      icon: Globe,
      title: '3D 地球可视化',
      description: '基于 CesiumJS 的全球实时数据渲染，支持卫星影像和地形数据',
    },
    {
      id: 'chinamap' as DemoType,
      icon: Map,
      title: '中国区域地图',
      description: '高精度 3D 中国地图，立体地形渲染与省份边界可视化',
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header badge, title and description */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3 py-1.5 mb-4"
          style={{
            background: 'var(--bg-secondary)',
            border: '2px solid var(--accent-primary)',
            boxShadow: '4px 4px 0 var(--accent-primary)',
          }}
        >
          <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}
          >
            交互式展示
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl font-bold mb-3 uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-pixel)', color: 'var(--text-primary)' }}
        >
          地球 Online
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          探索两种不同的交互式可视化效果。从 3D 地球到中国地图，体验浏览器端的高性能图形渲染技术。
        </motion.p>
      </div>

      {/* Current selected demo card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 p-4"
        style={{
          background: 'var(--bg-secondary)',
          border: '2px solid var(--accent-primary)',
          boxShadow: '4px 4px 0 var(--accent-primary)',
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Icon className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}
          >
            当前展示
          </span>
        </div>
        <h3
          className="text-base font-bold mb-1 uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}
        >
          {currentDemo.title}
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {currentDemo.description}
        </p>
      </motion.div>

      {/* Feature switcher list */}
      <div className="flex-1 space-y-3 mb-6">
        <h3
          className="text-[10px] font-bold uppercase tracking-wider mb-4"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
        >
          切换展示
        </h3>
        {features.map((feature, index) => (
          <FeatureCard
            key={feature.id}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            isActive={selectedDemo === feature.id}
            onClick={() => onSelectDemo(feature.id)}
            delay={0.4 + index * 0.1}
          />
        ))}
      </div>
    </div>
  );
};

// Main page component
export default function EarthOnlinePage() {
  const [selectedDemo, setSelectedDemo] = useState<DemoType>('cesium');
  const [isLoading, setIsLoading] = useState(true);
  const { data: siteData } = useConfig<SiteData>('/data/site-data.json');

  useEffect(() => {
    // Simulate loading completion
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <RouteLoader />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Subtle grid background using theme border color */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(var(--border-subtle) 1px, transparent 1px),
                             linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            opacity: 0.15,
          }}
        />
      </div>

      {/* Main content area */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top navigation placeholder - global layout provides the actual nav */}
        <div className="h-16" />

        {/* Main body - left info panel + right showcase */}
        <main className="flex-1 flex flex-col lg:flex-row">
          {/* Left info panel */}
          <motion.aside
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-[400px] xl:w-[450px] flex-shrink-0 p-6 lg:p-8 lg:border-r-2"
            style={{
              borderColor: 'var(--border-subtle)',
              background: 'var(--bg-primary)',
            }}
          >
            <InfoPanel
              selectedDemo={selectedDemo}
              onSelectDemo={setSelectedDemo}
            />
          </motion.aside>

          {/* Right showcase area - fills remaining space */}
          <motion.section
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 p-4 lg:p-8"
            style={{ background: 'var(--bg-primary)' }}
          >
            <div className="w-full h-[500px] lg:h-[calc(100vh-140px)]">
              <GlobeShowcase
                pageMode={true}
                initialDemo={selectedDemo}
                key={selectedDemo} // force remount on demo switch
              />
            </div>
          </motion.section>
        </main>

        {/* Feedback comment section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full px-6 lg:px-8 py-8 border-t-2"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="max-w-4xl mx-auto">
            <CommentSection postId="earth-online-feedback" />
          </div>
        </motion.section>

        {/* Footer */}
        {siteData?.footer && (
          <div className="relative z-10">
            <Footer data={siteData.footer} />
          </div>
        )}
      </div>
    </div>
  );
}
