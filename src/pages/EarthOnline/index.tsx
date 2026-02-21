/**
 * 地球Online子页面
 *
 * 布局：左侧信息栏 + 右侧展示容器
 * 复用主页的展示容器（GlobeShowcase组件）
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
import { GlobeShowcase, DEMOS, type DemoType } from '@/components/effects/GlobeShowcase';
import { AmbientGlow, GradientText } from '@/components/effects';
import { Footer } from '@/components/sections/Footer';
import { RouteLoader } from '@/components/RouterTransition';
import { useConfig, useMobile } from '@/hooks';
import { clipPathRounded } from '@/utils/styles';
import { CommentSection } from '@/pages/Blog/components/CommentSection';
import type { SiteData } from '@/types';

// 特性卡片组件
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
        className="relative p-4 overflow-hidden transition-all duration-300"
        style={{
          background: isActive
            ? 'rgba(59, 130, 246, 0.1)'
            : isHovered
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(255, 255, 255, 0.02)',
          border: `2px solid ${isActive ? 'var(--accent-primary)' : isHovered ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
          clipPath: clipPathRounded(8),
          transform: isHovered ? 'translateX(8px)' : 'translateX(0)',
        }}
      >
        {/* 左侧激活指示器 */}
        {isActive && (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r"
            style={{ background: 'var(--accent-primary)' }}
          />
        )}

        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center transition-all duration-300"
            style={{
              background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              clipPath: clipPathRounded(6),
            }}
          >
            <Icon
              className="w-6 h-6 transition-colors duration-300"
              style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-base mb-1 transition-colors duration-300"
              style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              {title}
            </h3>
            <p
              className="text-sm line-clamp-2 transition-colors duration-300"
              style={{ color: 'var(--text-muted)' }}
            >
              {description}
            </p>
          </div>

          <ChevronRight
            className="flex-shrink-0 w-5 h-5 transition-all duration-300"
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

// 信息面板组件
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
      {/* 标题区域 */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3 py-1.5 mb-4"
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            clipPath: clipPathRounded(4),
          }}
        >
          <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>交互式展示</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl font-bold mb-3"
        >
          <GradientText animate={true}>地球 Online</GradientText>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-base leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          探索两种不同的交互式可视化效果。从 3D 地球到中国地图，体验浏览器端的高性能图形渲染技术。
        </motion.p>
      </div>

      {/* 当前选中的展示 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 p-4"
        style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          clipPath: clipPathRounded(8),
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Icon className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>当前展示</span>
        </div>
        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {currentDemo.title}
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {currentDemo.description}
        </p>
      </motion.div>

      {/* 功能切换列表 */}
      <div className="flex-1 space-y-3 mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
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

// 主页面组件
export default function EarthOnlinePage() {
  const [selectedDemo, setSelectedDemo] = useState<DemoType>('cesium');
  const [isLoading, setIsLoading] = useState(true);
  const _isMobile = useMobile();
  void _isMobile; // 显式标记为已使用，避免 TypeScript 报错
  const { data: siteData } = useConfig<SiteData>('/data/site-data.json');

  useEffect(() => {
    // 模拟加载完成
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <RouteLoader />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* 背景特效 */}
      <div className="fixed inset-0 pointer-events-none">
        <AmbientGlow color="var(--accent-primary)" opacity={0.1} position="top-right" size={500} />
        <AmbientGlow color="var(--accent-secondary)" opacity={0.08} position="bottom-left" size={400} />

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

      {/* 主内容区域 */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* 顶部导航占位 - 导航由 PageLayout 提供 */}
        <div className="h-16" />

        {/* 主体内容 - 左右布局 */}
        <main className="flex-1 flex flex-col lg:flex-row">
          {/* 左侧信息栏 */}
          <motion.aside
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-[400px] xl:w-[450px] flex-shrink-0 p-6 lg:p-8 lg:border-r"
            style={{
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <InfoPanel
              selectedDemo={selectedDemo}
              onSelectDemo={setSelectedDemo}
            />
          </motion.aside>

          {/* 右侧展示区域 - 占满剩余空间 */}
          <motion.section
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 p-4 lg:p-8"
          >
            <div className="w-full h-[500px] lg:h-[calc(100vh-140px)]">
              <GlobeShowcase
                pageMode={true}
                initialDemo={selectedDemo}
                key={selectedDemo} // 强制重新挂载以响应切换
              />
            </div>
          </motion.section>
        </main>

        {/* 功能反馈评论区 */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full px-6 lg:px-8 py-8"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
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
