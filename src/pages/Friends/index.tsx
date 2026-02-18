import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Globe,
  ExternalLink,
  Users,
  FolderOpen,
  Wifi,
  Mail,
  Sparkles,
  Star,
  Monitor,
  Code,
  Palette,
  Wrench,
  Heart,
  User,
  FileText,
  Send,
} from 'lucide-react';
import { Footer } from '@/components/sections/Footer';
import { AmbientGlow, LightBeam } from '@/components/effects';
import { useMobile, useAnimationEnabled } from '@/hooks';
import { RouteLoader } from '@/components/RouterTransition';
import type { SiteData } from '@/types';

// Types
interface Friend {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string;
  category: string;
  featured: boolean;
  status?: 'online' | 'offline';
  unidirectional?: boolean;
}

interface FriendCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface ApplyInfo {
  title: string;
  description: string;
  requirements: string[];
  contact: string;
}

interface FriendsData {
  title: string;
  description: string;
  friends: Friend[];
  categories: FriendCategory[];
  applyInfo: ApplyInfo;
  lastUpdated?: string;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Monitor,
  Code,
  Palette,
  Wrench,
  Globe,
  User,
};

// CSS clip-path helpers
const clipPathRounded = (r: number) => `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

// Pixel Card Component - 方块像素风格 + 高级感边框光效
const PixelCard = memo(function PixelCard({
  friend,
  index,
  onClick
}: {
  friend: Friend;
  index: number;
  onClick: (friend: Friend) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const animationEnabled = useAnimationEnabled();
  const isMobile = useMobile();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!animationEnabled) return;
    const element = cardRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 20;
    const y = (e.clientY - rect.top - rect.height / 2) / 20;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY, animationEnabled]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }, [mouseX]);

  const rotateX = useSpring(mouseY, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const rotateXValue = useTransform(rotateX, (value) => isHovered ? value : 0);
  const rotateYValue = useTransform(rotateY, (value) => isHovered ? value : 0);
  const [currentRotateX, setCurrentRotateX] = useState(0);
  const [currentRotateY, setCurrentRotateY] = useState(0);

  useEffect(() => {
    const unsubscribeX = rotateXValue.on('change', setCurrentRotateX);
    const unsubscribeY = rotateYValue.on('change', setCurrentRotateY);
    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [rotateXValue, rotateYValue]);

  return (
    <motion.div
      ref={cardRef}
      initial={animationEnabled ? { opacity: 0, y: 50, scale: 0.9 } : undefined}
      animate={animationEnabled ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{
        duration: 0.6,
        delay: index * 0.05,
        type: 'spring',
        stiffness: 100,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={() => onClick(friend)}
      className="group relative block cursor-pointer h-full"
      style={{ perspective: '1000px' }}
    >
      {/* 像素风格外框 - 边框在外层，避免被 clip-path 裁剪 */}
      <div
        className="relative h-full transition-all duration-300"
        style={{
          background: isHovered ? 'var(--bg-secondary)' : 'var(--bg-card)',
          border: `2px solid ${isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
          clipPath: clipPathRounded(8),
          transform: isHovered ? 'translateY(-4px)' : 'none',
        }}
      >
        {/* 内容容器 - 使用 padding 而不是 margin，确保边框完整显示 */}
        <div className="relative p-4 sm:p-6 h-full flex flex-col">
        {!isMobile && (
          <>
            <div className="absolute top-0 left-0 w-4 h-4 pointer-events-none">
              <motion.div
                key={`tl-h-${isHovered}`}
                className="absolute top-0 left-0 w-full h-[2px]"
                style={{ background: 'linear-gradient(to right, transparent, var(--accent-primary), transparent)' }}
                animate={isHovered ? { opacity: 1, x: [-16, 16] } : { opacity: 0, x: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              {isHovered && (
                <motion.div
                  key={`tl-v-${isHovered}`}
                  className="absolute top-0 left-0 w-[2px] h-full"
                  style={{ background: 'linear-gradient(to bottom, var(--accent-primary), transparent)' }}
                  animate={animationEnabled ? { opacity: 1 } : undefined}
                  transition={{ duration: 0.3 }}
                />
              )}
            </div>
            <div className="absolute top-0 right-0 w-4 h-4 pointer-events-none">
              <motion.div
                key={`tr-h-${isHovered}`}
                className="absolute top-0 right-0 w-full h-[2px]"
                style={{ background: 'linear-gradient(to right, transparent, var(--accent-secondary), transparent)' }}
                animate={isHovered ? { opacity: 1, x: [16, -16] } : { opacity: 0, x: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              {isHovered && (
                <motion.div
                  key={`tr-v-${isHovered}`}
                  className="absolute top-0 right-0 w-[2px] h-full"
                  style={{ background: 'linear-gradient(to bottom, var(--accent-secondary), transparent)' }}
                  animate={animationEnabled ? { opacity: 1 } : undefined}
                  transition={{ duration: 0.3 }}
                />
              )}
            </div>
            <div className="absolute bottom-0 left-0 w-4 h-4 pointer-events-none">
              <motion.div
                key={`bl-h-${isHovered}`}
                className="absolute bottom-0 left-0 w-full h-[2px]"
                style={{ background: 'linear-gradient(to right, transparent, var(--accent-secondary), transparent)' }}
                animate={isHovered ? { opacity: 1, x: [-16, 16] } : { opacity: 0, x: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              {isHovered && (
                <motion.div
                  key={`bl-v-${isHovered}`}
                  className="absolute bottom-0 left-0 w-[2px] h-full"
                  style={{ background: 'linear-gradient(to top, var(--accent-secondary), transparent)' }}
                  animate={animationEnabled ? { opacity: 1 } : undefined}
                  transition={{ duration: 0.3 }}
                />
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none">
              <motion.div
                key={`br-h-${isHovered}`}
                className="absolute bottom-0 right-0 w-full h-[2px]"
                style={{ background: 'linear-gradient(to right, transparent, var(--accent-primary), transparent)' }}
                animate={isHovered ? { opacity: 1, x: [16, -16] } : { opacity: 0, x: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              {isHovered && (
                <motion.div
                  key={`br-v-${isHovered}`}
                  className="absolute bottom-0 right-0 w-[2px] h-full"
                  style={{ background: 'linear-gradient(to top, var(--accent-primary), transparent)' }}
                  animate={animationEnabled ? { opacity: 1 } : undefined}
                  transition={{ duration: 0.3 }}
                />
              )}
            </div>
          </>
        )}

        {!isMobile && (
          <>
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 50% 0%, var(--accent-glow), transparent 60%)' }}
              animate={animationEnabled ? { opacity: isHovered ? 1 : 0 } : undefined}
              transition={{ duration: 0.3 }}
            />

            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)',
                opacity: isHovered ? 0.5 : 0,
              }}
            />

            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 55%, transparent 60%)',
              }}
              animate={isHovered ? { x: '200%' } : { x: '-100%' }}
              transition={{ duration: 0.8 }}
            />
          </>
        )}

        {/* Content - 使用 flex-1 确保内容区填满剩余空间 */}
        <div className="flex items-start gap-3 sm:gap-4 relative z-10 flex-1">
          {/* Icon with pixel border */}
          <motion.div
            animate={animationEnabled && !isMobile ? { rotateX: currentRotateX, rotateY: currentRotateY } : undefined}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center overflow-hidden relative"
            style={{
              background: 'var(--bg-secondary)',
              border: `2px solid ${isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              clipPath: clipPathRounded(4),
            }}
          >
            {!imageError ? (
              <img
                src={friend.icon}
                alt={friend.name}
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <Globe className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: 'var(--accent-primary)' }} />
            )}

            {!isMobile && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at center, var(--accent-glow), transparent 70%)' }}
                animate={animationEnabled ? { opacity: isHovered ? 0.5 : 0 } : undefined}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0 overflow-visible">
            {/* Name row with status - 使用 flex-wrap 允许换行，标签固定不换行 */}
            <div className="flex items-start gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
              {/* 标题容器 - 设置最大宽度，悬浮时显示完整名称 */}
              <div className="relative group/title flex-1 min-w-0">
                <motion.h3
                  animate={animationEnabled && !isMobile ? { scale: isHovered ? 1.02 : 1 } : undefined}
                  transition={{ duration: 0.2 }}
                  className="font-bold text-base sm:text-lg truncate"
                  style={{
                    color: 'var(--text-primary)',
                    textShadow: !isMobile && isHovered ? '0 0 10px var(--accent-glow)' : 'none',
                    maxWidth: '100%',
                  }}
                >
                  {friend.name}
                </motion.h3>

                {/* 悬浮提示 - 显示完整名称 */}
                <div
                  className="absolute left-0 -top-1 -translate-y-full opacity-0 group-hover/title:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {friend.name}
                  </span>
                  {/* 小三角箭头 */}
                  <div
                    className="absolute left-4 top-full w-0 h-0"
                    style={{
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: '5px solid var(--border-color)',
                    }}
                  />
                </div>
              </div>

              {/* Status indicator - 固定宽度，不被挤压 */}
              {friend.status && (
                <div
                  className="flex-shrink-0 flex items-center gap-0.5 px-1 py-0.5 text-[10px] font-medium whitespace-nowrap"
                  style={{
                    background: friend.status === 'online' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${friend.status === 'online' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                    color: friend.status === 'online' ? '#22c55e' : '#ef4444',
                    clipPath: clipPathRounded(2),
                  }}
                >
                  <motion.div
                    animate={friend.status === 'online' ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-1 h-1"
                    style={{
                      background: friend.status === 'online' ? '#22c55e' : '#ef4444',
                      boxShadow: friend.status === 'online' ? '0 0 4px #22c55e' : 'none',
                    }}
                  />
                  {friend.status === 'online' ? '在线' : '离线'}
                </div>
              )}

              {/* Unidirectional indicator - 固定宽度 */}
              {friend.unidirectional && (
                <div
                  className="flex-shrink-0 flex items-center gap-0.5 px-1 py-0.5 text-[10px] font-medium whitespace-nowrap"
                  style={{
                    background: 'rgba(234, 179, 8, 0.15)',
                    border: '1px solid rgba(234, 179, 8, 0.4)',
                    color: '#eab308',
                    clipPath: clipPathRounded(2),
                  }}
                >
                  单向
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
              {friend.description}
            </p>

            {/* Featured badge */}
            {friend.featured && (
              <div
                className="inline-flex items-center gap-1 mt-3 px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#60a5fa',
                  clipPath: clipPathRounded(2),
                }}
              >
                <Star className="w-3 h-3" />
                友链
              </div>
            )}
          </div>

          {/* External link icon - 移动端始终显示 */}
          <motion.div
            initial={animationEnabled ? { opacity: 0, x: -10 } : undefined}
            animate={{ 
              opacity: isMobile ? 0.6 : (isHovered ? 1 : 0), 
              x: isMobile ? 0 : (isHovered ? 0 : -10) 
            }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0 self-center"
          >
            <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--accent-primary)' }} />
          </motion.div>
        </div>
        </div>
      </div>
    </motion.div>
  );
});

// Category Section Component
const CategorySection = memo(function CategorySection({
  category,
  friends,
  index,
  onClick
}: {
  category: FriendCategory;
  friends: Friend[];
  index: number;
  onClick: (friend: Friend) => void;
}) {
  const animationEnabled = useAnimationEnabled();
  const isMobile = useMobile();
  const IconComponent = iconMap[category.icon] || Globe;

  return (
    <motion.section
      initial={animationEnabled ? { opacity: 0, y: 50 } : undefined}
      whileInView={animationEnabled ? { opacity: 1, y: 0 } : undefined}
      viewport={{ margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.1, type: 'spring', stiffness: 100 }}
      className="mb-24"
    >
      {/* Category Header */}
      <motion.div
        initial={animationEnabled ? { opacity: 0, x: -30 } : undefined}
        whileInView={animationEnabled ? { opacity: 1, x: 0 } : undefined}
        viewport={{ margin: '-50px' }}
        transition={{ duration: 0.5, delay: index * 0.1 + 0.1 }}
        className="flex items-center gap-4 mb-10"
      >
        <motion.div
          whileHover={animationEnabled ? { scale: 1.1, rotate: 5 } : undefined}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex items-center justify-center w-14 h-14 relative overflow-hidden"
          style={{
            background: 'var(--bg-secondary)',
            border: '2px solid var(--border-subtle)',
            clipPath: clipPathRounded(6),
          }}
        >
          {!isMobile && (
            <motion.div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(circle at 50% 50%, var(--accent-glow), transparent 70%)' }}
              animate={animationEnabled ? { opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] } : undefined}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <IconComponent className="w-7 h-7 relative z-10" style={{ color: 'var(--accent-primary)' }} />
        </motion.div>
        <div>
          <motion.div
            initial={animationEnabled ? { opacity: 0 } : undefined}
            whileInView={animationEnabled ? { opacity: 1 } : undefined}
            viewport={{ margin: '-50px' }}
            transition={{ delay: index * 0.1 + 0.2 }}
          >
            <h2
              className="font-sans font-bold text-2xl"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {category.name}
            </h2>
          </motion.div>
          <motion.p
            initial={animationEnabled ? { opacity: 0 } : undefined}
            whileInView={animationEnabled ? { opacity: 1 } : undefined}
            viewport={{ margin: '-50px' }}
            transition={{ delay: index * 0.1 + 0.3 }}
            className="text-sm font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            {category.description}
          </motion.p>
        </div>
      </motion.div>

      {/* Friends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {friends.map((friend, friendIndex) => (
          <PixelCard key={friend.id} friend={friend} index={friendIndex} onClick={onClick} />
        ))}
      </div>
    </motion.section>
  );
});

// Hero Section Component - 非对称布局
const HeroSection = memo(function HeroSection({
  title,
  description,
  stats,
  lastUpdated,
  onApplyClick
}: {
  title: string;
  description: string;
  stats: { friends: number; categories: number; online: number };
  lastUpdated?: string;
  onApplyClick: () => void;
}) {
  const animationEnabled = useAnimationEnabled();
  const isMobile = useMobile();
  return (
    <section className="relative pt-20 pb-16 overflow-hidden">
      {!isMobile && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-20 right-20 w-64 h-64 opacity-20"
            style={{ background: 'radial-gradient(circle, var(--accent-glow), transparent 70%)' }}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Title and description */}
          <motion.div
            initial={animationEnabled ? { opacity: 0, x: -50 } : undefined}
            animate={animationEnabled ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
          >
            <motion.div
              initial={animationEnabled ? { opacity: 0, scale: 0.9 } : undefined}
              animate={animationEnabled ? { opacity: 1, scale: 1 } : undefined}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6"
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                clipPath: clipPathRounded(4),
              }}
            >
              <Heart className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>友情链接</span>
            </motion.div>

            <h1
              className="font-sans font-bold text-4xl md:text-5xl lg:text-6xl mb-6"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {title}
            </h1>
            <p className="text-lg md:text-xl leading-relaxed max-w-xl mb-6" style={{ color: 'var(--text-muted)' }}>
              {description}
            </p>
            
            {/* Apply Button - Prominent position */}
            <motion.button
              initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
              animate={animationEnabled ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.4, duration: 0.5 }}
              whileHover={animationEnabled ? { scale: 1.02 } : undefined}
              whileTap={{ scale: 0.98 }}
              onClick={onApplyClick}
              className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                clipPath: clipPathRounded(6),
                boxShadow: '0 4px 20px rgba(86, 156, 214, 0.3)',
              }}
            >
              <Mail className="w-5 h-5" />
              申请友链
            </motion.button>
            
            {lastUpdated && (
              <motion.div
                initial={animationEnabled ? { opacity: 0 } : undefined}
                animate={animationEnabled ? { opacity: 1 } : undefined}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-4 inline-flex items-center gap-2 px-3 py-1.5"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  clipPath: clipPathRounded(3),
                }}
              >
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  最后更新: {new Date(lastUpdated).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Right: Stats */}
          <motion.div
            initial={animationEnabled ? { opacity: 0, x: 50 } : undefined}
            animate={animationEnabled ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: 0.8, delay: 0.2, type: 'spring', stiffness: 100 }}
            className="grid grid-cols-3 gap-2 sm:gap-4"
          >
            {[
              { icon: Users, value: stats.friends, label: '友链站点' },
              { icon: FolderOpen, value: stats.categories, label: '分类目录' },
              { icon: Wifi, value: stats.online, label: '在线站点' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
                animate={animationEnabled ? { opacity: 1, y: 0 } : undefined}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                whileHover={animationEnabled && !isMobile ? { scale: 1.05, y: -4 } : undefined}
                className="relative p-3 sm:p-6 text-center cursor-default group"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-subtle)',
                  clipPath: clipPathRounded(6),
                }}
              >
                {!isMobile && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at center, var(--accent-glow), transparent 70%)' }}
                    initial={animationEnabled ? { opacity: 0 } : undefined}
                    whileHover={animationEnabled ? { opacity: 0.5 } : undefined}
                    transition={{ duration: 0.3 }}
                  />
                )}

                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 sm:mb-3" style={{ color: 'var(--accent-primary)' }} />
                <div className="font-sans font-bold text-xl sm:text-3xl mb-0.5 sm:mb-1" style={{ color: 'var(--text-primary)' }}>
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
});

// Apply Modal Component - 申请友链弹窗
const ApplyModal = memo(function ApplyModal({
  isOpen,
  onClose,
  contact,
}: {
  isOpen: boolean;
  onClose: () => void;
  contact: string;
}) {
  const animationEnabled = useAnimationEnabled();
  const [copied, setCopied] = useState(false);
  const [siteInfoCopied, setSiteInfoCopied] = useState(false);

  // Site info for reference
  const siteInfo = {
    name: 'SAKURAIN TEAM',
    url: 'https://sakurain.net',
    icon: 'https://sakurain.net/favicon',
    rss: 'https://sakurain.net/feed',
    description: '用代码构建未来',
  };

  const emailTemplate = `此邮件用于申请添加友链。

网站名称：${siteInfo.name}
网站链接：${siteInfo.url}
网站图标：${siteInfo.icon}
RSS订阅（可选）：${siteInfo.rss}
网站描述：${siteInfo.description}

已添加到友链列表中，并替换为自己的站点信息。
发送本邮件即代表承诺网站内容健康、合法、无恶意代码。`;

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contact);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleCopySiteInfo = async () => {
    try {
      const siteInfoText = `网站名称：${siteInfo.name}
网站链接：${siteInfo.url}
网站图标：${siteInfo.icon}
RSS订阅：${siteInfo.rss}
网站描述：${siteInfo.description}`;
      await navigator.clipboard.writeText(siteInfoText);
      setSiteInfoCopied(true);
      setTimeout(() => setSiteInfoCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // Open default email client
  const handleOpenMailto = () => {
    const subject = '申请友链 - SAKURAIN';
    const mailtoLink = `mailto:${contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailTemplate)}`;
    window.location.href = mailtoLink;
  };

  // Open WPS form
  const handleOpenForm = () => {
    window.open('https://f.wps.cn/g/oEZK9Vpu/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={animationEnabled ? { opacity: 0 } : undefined}
        animate={animationEnabled ? { opacity: 1 } : undefined}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      />
      <motion.div
        initial={animationEnabled ? { opacity: 0, scale: 0.9, y: 20 } : undefined}
        animate={animationEnabled ? { opacity: 1, scale: 1, y: 0 } : undefined}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        style={{
          background: 'var(--bg-secondary)',
          border: '2px solid var(--border-color)',
          clipPath: clipPathRounded(12),
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex items-center justify-center w-12 h-12"
            style={{
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border-subtle)',
              clipPath: clipPathRounded(4),
            }}
          >
            <Mail className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              申请友链
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              请先添加本站友链，再提交申请
            </p>
          </div>
        </div>

        {/* Important Notice */}
        <div
          className="mb-4 p-4"
          style={{
            background: 'rgba(251, 146, 60, 0.1)',
            border: '1px solid rgba(251, 146, 60, 0.3)',
            clipPath: clipPathRounded(4),
          }}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg" style={{ color: '#fbbf24' }}>⚠️</span>
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                重要提示
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                请在发送申请邮件之前，先在自己的站点上添加本站友链信息
              </p>
            </div>
          </div>
        </div>

        {/* Site Info */}
        <div
          className="mb-4 p-4"
          style={{
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            clipPath: clipPathRounded(4),
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>
              本站友链信息（请添加到您的友链页面）
            </p>
            <motion.button
              onClick={handleCopySiteInfo}
              whileHover={animationEnabled ? { scale: 1.02 } : undefined}
              whileTap={{ scale: 0.98 }}
              className="px-2 py-1 text-xs font-medium transition-all"
              style={{
                background: siteInfoCopied ? 'rgba(34, 197, 94, 0.2)' : 'var(--accent-primary)',
                color: siteInfoCopied ? '#22c55e' : 'white',
                clipPath: clipPathRounded(2),
              }}
            >
              {siteInfoCopied ? '已复制' : '复制'}
            </motion.button>
          </div>
          <div className="space-y-1.5 text-sm" style={{ color: 'var(--text-primary)' }}>
            <p><span style={{ color: 'var(--text-muted)' }}>网站名称：</span>{siteInfo.name}</p>
            <p><span style={{ color: 'var(--text-muted)' }}>网站链接：</span>{siteInfo.url}</p>
            <p><span style={{ color: 'var(--text-muted)' }}>网站图标：</span>{siteInfo.icon}</p>
            <p><span style={{ color: 'var(--text-muted)' }}>RSS订阅：</span>{siteInfo.rss}</p>
            <p><span style={{ color: 'var(--text-muted)' }}>网站描述：</span>{siteInfo.description}</p>
          </div>
        </div>

        {/* Contact Email */}
        <div
          className="mb-4 p-4"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            clipPath: clipPathRounded(4),
          }}
        >
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            收件邮箱
          </p>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 px-3 py-2 text-sm font-mono rounded"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'var(--accent-primary)',
              }}
            >
              {contact}
            </code>
            <motion.button
              onClick={handleCopyEmail}
              whileHover={animationEnabled ? { scale: 1.02 } : undefined}
              whileTap={{ scale: 0.98 }}
              className="px-3 py-2 text-sm font-medium transition-all whitespace-nowrap"
              style={{
                background: copied ? 'rgba(34, 197, 94, 0.2)' : 'var(--accent-primary)',
                color: copied ? '#22c55e' : 'white',
                clipPath: clipPathRounded(4),
              }}
            >
              {copied ? '已复制' : '复制'}
            </motion.button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            选择申请方式
          </p>
          <div className="flex gap-3">
            <motion.button
              onClick={handleOpenMailto}
              whileHover={animationEnabled ? { scale: 1.02 } : undefined}
              whileTap={{ scale: 0.98 }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                color: 'white',
                clipPath: clipPathRounded(6),
              }}
            >
              <Send className="w-4 h-4" />
              邮箱申请
            </motion.button>
            <motion.button
              onClick={handleOpenForm}
              whileHover={animationEnabled ? { scale: 1.02 } : undefined}
              whileTap={{ scale: 0.98 }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-all"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--accent-primary)',
                color: 'var(--accent-primary)',
                clipPath: clipPathRounded(6),
              }}
            >
              <FileText className="w-4 h-4" />
              表单申请
            </motion.button>
          </div>
        </div>

        {/* Close Button */}
        <motion.button
          onClick={onClose}
          whileHover={animationEnabled ? { scale: 1.02 } : undefined}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-4 px-4 py-2 font-medium transition-all"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            clipPath: clipPathRounded(4),
          }}
        >
          关闭
        </motion.button>
      </motion.div>
    </div>
  );
});

// Apply Section Component
const ApplySection = memo(function ApplySection({
  applyInfo,
  onApplyClick
}: {
  applyInfo: ApplyInfo;
  onApplyClick: () => void;
}) {
  const animationEnabled = useAnimationEnabled();
  const isMobile = useMobile();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.section
      initial={animationEnabled ? { opacity: 0, y: 50 } : undefined}
      whileInView={animationEnabled ? { opacity: 1, y: 0 } : undefined}
      viewport={{ margin: '-50px' }}
      transition={{ duration: 0.6, delay: 0.4, type: 'spring', stiffness: 100 }}
      className="mt-12 mb-8 relative overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '2px solid var(--border-subtle)',
        clipPath: clipPathRounded(12),
      }}
    >
      {!isMobile && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 0%, var(--accent-glow), transparent 70%)' }}
          animate={animationEnabled ? { opacity: isHovered ? 1 : 0 } : undefined}
          transition={{ duration: 0.3 }}
        />
      )}

      <div className="p-5 sm:p-8 md:p-12 relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-8">
          <div className="flex-1">
            <motion.div
              initial={animationEnabled ? { opacity: 0, x: -20 } : undefined}
              whileInView={animationEnabled ? { opacity: 1, x: 0 } : undefined}
              viewport={{ margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-3 mb-4"
            >
              <motion.div
                whileHover={animationEnabled ? { scale: 1.1, rotate: 10 } : undefined}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex items-center justify-center w-12 h-12 relative overflow-hidden"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-subtle)',
                  clipPath: clipPathRounded(4),
                }}
              >
                {!isMobile && (
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: 'radial-gradient(circle at 50% 50%, var(--accent-glow), transparent 70%)' }}
                    animate={animationEnabled ? { opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] } : undefined}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                <Sparkles className="w-6 h-6 relative z-10" style={{ color: 'var(--accent-primary)' }} />
              </motion.div>
              <h2
                className="font-sans font-bold text-2xl"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {applyInfo.title}
              </h2>
            </motion.div>
            <motion.p
              initial={animationEnabled ? { opacity: 0 } : undefined}
              whileInView={animationEnabled ? { opacity: 1 } : undefined}
              viewport={{ margin: '-50px' }}
              transition={{ delay: 0.3 }}
              className="mb-6"
              style={{ color: 'var(--text-muted)' }}
            >
              {applyInfo.description}
            </motion.p>
            <motion.ul
              initial={animationEnabled ? { opacity: 0 } : undefined}
              whileInView={animationEnabled ? { opacity: 1 } : undefined}
              viewport={{ margin: '-50px' }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              {applyInfo.requirements.map((req, index) => (
                <motion.li
                  key={index}
                  initial={animationEnabled ? { opacity: 0, x: -10 } : undefined}
                  whileInView={animationEnabled ? { opacity: 1, x: 0 } : undefined}
                  viewport={{ margin: '-50px' }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3 text-sm font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <motion.div
                    whileHover={animationEnabled ? { scale: 1.2 } : undefined}
                    transition={{ type: 'spring', stiffness: 400 }}
                    className="w-2 h-2"
                    style={{ background: 'var(--accent-primary)', boxShadow: '0 0 6px var(--accent-primary)' }}
                  />
                  {req}
                </motion.li>
              ))}
            </motion.ul>
          </div>

          <motion.button
            onClick={onApplyClick}
            initial={animationEnabled ? { opacity: 0, scale: 0.9 } : undefined}
            whileInView={animationEnabled ? { opacity: 1, scale: 1 } : undefined}
            viewport={{ margin: '-50px' }}
            transition={{ delay: 0.5, type: 'spring' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative flex items-center gap-2 px-5 sm:px-8 py-3 sm:py-4 font-bold transition-all duration-300 overflow-hidden w-full sm:w-auto justify-center"
            style={{
              background: isHovered ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--accent-primary)',
              color: 'white',
              border: `2px solid ${isHovered ? 'transparent' : 'var(--accent-primary)'}`,
              clipPath: clipPathRounded(6),
              boxShadow: !isMobile && isHovered ? '0 0 30px var(--accent-glow)' : 'none',
              transform: isHovered ? 'translateY(-2px)' : 'none',
            }}
          >
            {!isMobile && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
                animate={isHovered ? { x: '200%' } : { x: '-100%' }}
                transition={{ duration: 0.6 }}
              />
            )}
            <Mail className="w-5 h-5 relative z-10" />
            <span className="relative z-10">申请友链</span>
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
});

// Redirect Modal Component
const RedirectModal = memo(function RedirectModal({
  isOpen,
  friend,
  onConfirm,
  onCancel
}: {
  isOpen: boolean;
  friend: Friend | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const animationEnabled = useAnimationEnabled();
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setTimeLeft(3);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onConfirm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [isOpen, onConfirm]);

  if (!isOpen || !friend) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={animationEnabled ? { opacity: 0 } : undefined}
        animate={animationEnabled ? { opacity: 1 } : undefined}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onCancel}
      />
      <motion.div
        initial={animationEnabled ? { opacity: 0, scale: 0.9, y: 20 } : undefined}
        animate={animationEnabled ? { opacity: 1, scale: 1, y: 0 } : undefined}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md p-6"
        style={{
          background: 'var(--bg-secondary)',
          border: '2px solid var(--border-color)',
          clipPath: clipPathRounded(12),
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex items-center justify-center w-12 h-12"
            style={{
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border-subtle)',
              clipPath: clipPathRounded(4),
            }}
          >
            <Globe className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              即将离开本站
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              跳转到友链网站
            </p>
          </div>
        </div>

        <div
          className="mb-4 p-4"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            clipPath: clipPathRounded(4),
          }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            {friend.name}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {friend.url}
          </p>
        </div>

        <div
          className="mb-4 p-3"
          style={{
            background: 'rgba(251, 146, 60, 0.1)',
            border: '1px solid rgba(251, 146, 60, 0.3)',
            clipPath: clipPathRounded(4),
          }}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg" style={{ color: '#fbbf24' }}>⚠️</span>
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                注意
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                即将访问外部网站，本站无法保证其安全性，请保持警惕
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: 'var(--text-muted)' }}>自动跳转</span>
            <span style={{ color: 'var(--text-primary)' }}>{timeLeft} 秒</span>
          </div>
          <div
            className="h-2 overflow-hidden"
            style={{
              background: 'var(--border-subtle)',
              clipPath: clipPathRounded(2),
            }}
          >
            <motion.div
              className="h-full"
              style={{ background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <motion.button
            onClick={onCancel}
            whileHover={animationEnabled ? { scale: 1.02 } : undefined}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-4 py-2 font-medium transition-all"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              clipPath: clipPathRounded(4),
            }}
          >
            取消跳转
          </motion.button>
          <motion.button
            onClick={onConfirm}
            whileHover={animationEnabled ? { scale: 1.02 } : undefined}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-4 py-2 font-medium transition-all"
            style={{
              background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
              color: 'white',
              clipPath: clipPathRounded(4),
            }}
          >
            立即访问
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
});

// Main Friends Page Component
export default function FriendsPage() {
  const [data, setData] = useState<FriendsData | null>(null);
  const [footerData, setFooterData] = useState<SiteData['footer'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [mailtoModalOpen, setMailtoModalOpen] = useState(false);
  const isMobile = useMobile();
  const animationEnabled = useAnimationEnabled();

  const handleFriendClick = useCallback((friend: Friend) => {
    setSelectedFriend(friend);
    setRedirectModalOpen(true);
  }, []);

  const handleConfirmRedirect = useCallback(() => {
    if (selectedFriend) {
      window.open(selectedFriend.url, '_blank', 'noopener,noreferrer');
    }
    setRedirectModalOpen(false);
    setSelectedFriend(null);
  }, [selectedFriend]);

  const handleCancelRedirect = useCallback(() => {
    setRedirectModalOpen(false);
    setSelectedFriend(null);
  }, []);

  const handleApplyClick = useCallback(() => {
    setMailtoModalOpen(true);
  }, []);

  const handleCloseMailtoModal = useCallback(() => {
    setMailtoModalOpen(false);
  }, []);

  // Load friends data and footer data
  useEffect(() => {
    Promise.all([
      fetch(`/data/friends.json?v=${Date.now()}`, { cache: 'no-store' }).then(res => {
        if (!res.ok) throw new Error('Failed to load friends data');
        return res.json();
      }),
      fetch(`/data/site-data.json?v=${Date.now()}`, { cache: 'no-store' }).then(res => res.json())
    ])
      .then(([friendsData, siteData]: [FriendsData, SiteData]) => {
        setData(friendsData);
        setFooterData(siteData.footer);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Display order: personal > featured (middle) > demo (bottom)
  // demo is rendered separately at the bottom
  const VISIBLE_CATEGORIES = ['personal'];

  // Demo category for bottom display
  const DEMO_CATEGORY_ID = 'demo';

  // Group friends by category (只包含可见分类，按指定顺序)
  const friendsByCategory = useMemo(() => {
    if (!data) return [];
    return VISIBLE_CATEGORIES
      .map(catId => {
        const category = data.categories.find(c => c.id === catId);
        if (!category) return null;
        return {
          category,
          friends: data.friends.filter(friend => friend.category === catId)
        };
      })
      .filter((item): item is { category: FriendCategory; friends: Friend[] } => item !== null && item.friends.length > 0);
  }, [data]);

  // Demo category friends for bottom section
  const demoFriends = useMemo(() => {
    if (!data) return [];
    return data.friends.filter(friend => friend.category === DEMO_CATEGORY_ID);
  }, [data]);

  const demoCategory = useMemo(() => {
    if (!data) return null;
    return data.categories.find(c => c.id === DEMO_CATEGORY_ID) || null;
  }, [data]);

  // Calculate stats - 只统计标记为 featured（友链推荐）的站点
  const stats = useMemo(() => {
    if (!data) return { friends: 0, categories: 0, online: 0 };
    const featuredFriends = data.friends.filter(f => f.featured);
    return {
      friends: featuredFriends.length,
      categories: 3, // 与我相关 + 友链推荐 + 演示站点
      online: featuredFriends.filter(f => f.status === 'online').length
    };
  }, [data]);

  if (loading) {
    return <RouteLoader />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
            {error || '无法加载友链数据'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-white transition-all hover:scale-105"
            style={{
              background: 'var(--accent-primary)',
              clipPath: clipPathRounded(4),
            }}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {!isMobile && (
        <div className="fixed inset-0 pointer-events-none">
          <AmbientGlow color="var(--accent-primary)" opacity={0.15} position="top-right" />
          <AmbientGlow color="var(--accent-secondary)" opacity={0.1} position="bottom-left" />
          <AmbientGlow color="var(--accent-primary)" opacity={0.08} position="center" size={600} />
        </div>
      )}

      {/* 网格背景 */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255, 0.1) 1px, transparent 1px)`,
          background: 'var(--bg-primary)',
          backgroundSize: '80px 80px'
        }}
      />

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <HeroSection
          title={data.title}
          description={data.description}
          stats={stats}
          lastUpdated={data.lastUpdated}
          onApplyClick={handleApplyClick}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {/* Categories - 与我相关 */}
          {friendsByCategory.map(({ category, friends }, index) => (
            friends.length > 0 && (
              <CategorySection
                key={category.id}
                category={category}
                friends={friends}
                index={index + 1}
                onClick={handleFriendClick}
              />
            )
          ))}

          {/* Featured Friends - 显示 featured=true 的友链 */}
          {data.friends.some(f => f.featured) && (
            <motion.section
              initial={animationEnabled ? { opacity: 0, y: 50 } : undefined}
              whileInView={animationEnabled ? { opacity: 1, y: 0 } : undefined}
              viewport={{ margin: '-50px' }}
              transition={{ duration: 0.6, delay: 0.1, type: 'spring', stiffness: 100 }}
              className="mb-20"
            >
              <motion.div
                initial={animationEnabled ? { opacity: 0, x: -30 } : undefined}
                whileInView={animationEnabled ? { opacity: 1, x: 0 } : undefined}
                viewport={{ margin: '-50px' }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center gap-3 mb-10"
              >
                <motion.div
                  whileHover={animationEnabled ? { scale: 1.1, rotate: 10 } : undefined}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex items-center justify-center w-12 h-12 relative overflow-hidden"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--border-subtle)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  {!isMobile && (
                    <motion.div
                      className="absolute inset-0"
                      style={{ background: 'radial-gradient(circle at 50% 50%, var(--accent-glow), transparent 70%)' }}
                      animate={animationEnabled ? { opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] } : undefined}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <Star className="w-6 h-6 relative z-10" style={{ color: 'var(--accent-primary)' }} />
                </motion.div>
                <h2
                  className="font-sans font-bold text-2xl"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  友链推荐
                </h2>
              </motion.div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {data.friends
                  .filter(f => f.featured)
                  .map((friend, index) => (
                    <PixelCard
                      key={friend.id}
                      friend={friend}
                      index={index}
                      onClick={handleFriendClick}
                    />
                  ))}
              </div>
            </motion.section>
          )}

          {/* Demo Sites - 演示站点放底部 */}
          {demoFriends.length > 0 && demoCategory && (
            <CategorySection
              category={demoCategory}
              friends={demoFriends}
              index={3}
              onClick={handleFriendClick}
            />
          )}

          {/* Apply Section */}
          <ApplySection applyInfo={data.applyInfo} onApplyClick={handleApplyClick} />
        </div>
      </main>

      {/* Footer - 使用共享组件 */}
      {footerData && <Footer data={footerData} />}

      {/* 底部光剑 - 仅桌面端显示 */}
      {!isMobile && <LightBeam position="bottom" color="var(--accent-secondary)" intensity={0.2} />}

      <RedirectModal
        isOpen={redirectModalOpen}
        friend={selectedFriend}
        onConfirm={handleConfirmRedirect}
        onCancel={handleCancelRedirect}
      />

      {/* Apply Modal - 页面根级别渲染，避免被遮罩 */}
      {data && (
        <ApplyModal
          isOpen={mailtoModalOpen}
          onClose={handleCloseMailtoModal}
          contact={data.applyInfo.contact}
        />
      )}
    </div>
  );
}
