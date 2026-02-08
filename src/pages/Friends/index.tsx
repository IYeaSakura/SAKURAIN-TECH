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
} from 'lucide-react';
import { Footer } from '@/components/sections/Footer';
import { AmbientGlow, LightBeam } from '@/components/effects';
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
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Monitor,
  Code,
  Palette,
  Wrench,
  Globe,
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
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const element = cardRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 20;
    const y = (e.clientY - rect.top - rect.height / 2) / 20;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

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
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
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
          background: isHovered ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
          border: `2px solid ${isHovered ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)'}`,
          clipPath: clipPathRounded(8),
          transform: isHovered ? 'translateY(-4px)' : 'none',
        }}
      >
        {/* 内容容器 - 使用 padding 而不是 margin，确保边框完整显示 */}
        <div className="relative p-6 h-full flex flex-col">
        {/* 高级感动画边框光效 - 四角 */}
        <div className="absolute top-0 left-0 w-4 h-4 pointer-events-none">
          <motion.div
            className="absolute top-0 left-0 w-full h-[2px]"
            style={{ background: 'linear-gradient(to right, transparent, var(--accent-primary), transparent)' }}
            animate={isHovered ? { opacity: 1, x: [-16, 16] } : { opacity: 0, x: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute top-0 left-0 w-[2px] h-full"
            style={{ background: 'linear-gradient(to bottom, var(--accent-primary), transparent)' }}
            animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="absolute top-0 right-0 w-4 h-4 pointer-events-none">
          <motion.div
            className="absolute top-0 right-0 w-full h-[2px]"
            style={{ background: 'linear-gradient(to right, transparent, var(--accent-secondary), transparent)' }}
            animate={isHovered ? { opacity: 1, x: [16, -16] } : { opacity: 0, x: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute top-0 right-0 w-[2px] h-full"
            style={{ background: 'linear-gradient(to bottom, var(--accent-secondary), transparent)' }}
            animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="absolute bottom-0 left-0 w-4 h-4 pointer-events-none">
          <motion.div
            className="absolute bottom-0 left-0 w-full h-[2px]"
            style={{ background: 'linear-gradient(to right, transparent, var(--accent-secondary), transparent)' }}
            animate={isHovered ? { opacity: 1, x: [-16, 16] } : { opacity: 0, x: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-[2px] h-full"
            style={{ background: 'linear-gradient(to top, var(--accent-secondary), transparent)' }}
            animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none">
          <motion.div
            className="absolute bottom-0 right-0 w-full h-[2px]"
            style={{ background: 'linear-gradient(to right, transparent, var(--accent-primary), transparent)' }}
            animate={isHovered ? { opacity: 1, x: [16, -16] } : { opacity: 0, x: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-[2px] h-full"
            style={{ background: 'linear-gradient(to top, var(--accent-primary), transparent)' }}
            animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Hover glow background */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 0%, var(--accent-glow), transparent 60%)' }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Scanline effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)',
            opacity: isHovered ? 0.5 : 0,
          }}
        />

        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 55%, transparent 60%)',
          }}
          animate={isHovered ? { x: '200%' } : { x: '-100%' }}
          transition={{ duration: 0.8 }}
        />

        {/* Content - 使用 flex-1 确保内容区填满剩余空间 */}
        <div className="flex items-start gap-4 relative z-10 flex-1">
          {/* Icon with pixel border */}
          <motion.div
            animate={{ rotateX: currentRotateX, rotateY: currentRotateY }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-shrink-0 w-16 h-16 flex items-center justify-center overflow-hidden relative"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: `2px solid ${isHovered ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)'}`,
              clipPath: clipPathRounded(4),
            }}
          >
            {!imageError ? (
              <img
                src={friend.icon}
                alt={friend.name}
                className="w-10 h-10 object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <Globe className="w-10 h-10" style={{ color: 'var(--accent-primary)' }} />
            )}
            
            {/* Icon glow */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at center, var(--accent-glow), transparent 70%)' }}
              animate={{ opacity: isHovered ? 0.5 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name row with status */}
            <div className="flex items-center gap-2 mb-2">
              <motion.h3
                animate={{ scale: isHovered ? 1.02 : 1 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-lg truncate"
                style={{ 
                  color: 'var(--text-primary)',
                  textShadow: isHovered ? '0 0 10px var(--accent-glow)' : 'none',
                }}
              >
                {friend.name}
              </motion.h3>
              
              {/* Status indicator - inline with name */}
              {friend.status && (
                <div 
                  className="flex items-center gap-0.5 px-1 py-0.5 text-[10px] font-medium"
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

              {/* Unidirectional indicator */}
              {friend.unidirectional && (
                <div 
                  className="flex items-center gap-0.5 px-1 py-0.5 text-[10px] font-medium"
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
            
            <p className="text-sm line-clamp-2" style={{ color: 'var(--text-muted)' }}>
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
          
          {/* External link icon */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0 self-center"
          >
            <ExternalLink className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
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
  const IconComponent = iconMap[category.icon] || Globe;

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.1, type: 'spring', stiffness: 100 }}
      className="mb-24"
    >
      {/* Category Header */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ margin: '-50px' }}
        transition={{ duration: 0.5, delay: index * 0.1 + 0.1 }}
        className="flex items-center gap-4 mb-10"
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex items-center justify-center w-14 h-14 relative overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            clipPath: clipPathRounded(6),
          }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(circle at 50% 50%, var(--accent-glow), transparent 70%)' }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <IconComponent className="w-7 h-7 relative z-10" style={{ color: 'var(--accent-primary)' }} />
        </motion.div>
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
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
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
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
  stats
}: {
  title: string;
  description: string;
  stats: { friends: number; categories: number; online: number };
}) {
  return (
    <section className="relative pt-20 pb-16 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-20 right-20 w-64 h-64 opacity-20"
          style={{ background: 'radial-gradient(circle, var(--accent-glow), transparent 70%)' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Title and description */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
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
            <p className="text-lg md:text-xl leading-relaxed max-w-xl" style={{ color: 'var(--text-muted)' }}>
              {description}
            </p>
          </motion.div>

          {/* Right: Stats */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: 'spring', stiffness: 100 }}
            className="grid grid-cols-3 gap-4"
          >
            {[
              { icon: Users, value: stats.friends, label: '友链站点' },
              { icon: FolderOpen, value: stats.categories, label: '分类目录' },
              { icon: Wifi, value: stats.online, label: '在线站点' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="relative p-6 text-center cursor-default group"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '2px solid rgba(255, 255, 255, 0.08)',
                  clipPath: clipPathRounded(6),
                }}
              >
                {/* Hover glow */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(circle at center, var(--accent-glow), transparent 70%)' }}
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 0.5 }}
                  transition={{ duration: 0.3 }}
                />
                
                <stat.icon className="w-6 h-6 mx-auto mb-3" style={{ color: 'var(--accent-primary)' }} />
                <div className="font-sans font-bold text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>
                  {stat.value}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
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

// Apply Section Component
const ApplySection = memo(function ApplySection({
  applyInfo
}: {
  applyInfo: ApplyInfo;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleApplyClick = useCallback(() => {
    const subject = '申请友链 - SAKURAIN';
    const body = `此邮件用于申请添加友链。\n\n以下是站点信息：\n\n{\n  "id": "sakurain",\n  "name": "SAKURAIN TEAM",\n  "url": "https://sakurain.net",\n  "icon": "https://sakurain.net/image/logo.webp",\n  "description": "用代码构建世界",\n  "category": "blogs",\n  "featured": true\n},\n\n字段说明：\n- id: 非必填，站点唯一标识符，用于存储索引，建议使用短域名或拼音缩写，只支持字母和数字。\n- name: 必填，站点名称。\n- url: 必填，站点链接。\n- icon: 必填，站点图标链接。\n- description: 必填，站点描述。\n- category: 非必填，站点分类，默认值为 "blogs"，可选值为 "blogs"（个人博客）、"tech"（技术社区）、"design"（设计资源）、"tools"（开发工具）。\n- featured: 非必填，是否作为推荐站点置顶显示，默认值为 true。\n\n已添加到友链列表中，并替换为自己的站点信息。\n发送本邮件即代表承诺网站内容健康、合法、无恶意代码。\n\n---\n此邮件由 SAKURAIN 网站友链申请自动生成`;

    const mailtoLink = `mailto:${applyInfo.contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  }, [applyInfo.contact]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: '-50px' }}
      transition={{ duration: 0.6, delay: 0.4, type: 'spring', stiffness: 100 }}
      className="mt-12 mb-8 relative overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '2px solid rgba(255, 255, 255, 0.08)',
        clipPath: clipPathRounded(12),
      }}
    >
      {/* Glow background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 0%, var(--accent-glow), transparent 70%)' }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      <div className="p-8 md:p-12 relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-3 mb-4"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex items-center justify-center w-12 h-12 relative overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  clipPath: clipPathRounded(4),
                }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{ background: 'radial-gradient(circle at 50% 50%, var(--accent-glow), transparent 70%)' }}
                  animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
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
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ margin: '-50px' }}
              transition={{ delay: 0.3 }}
              className="mb-6"
              style={{ color: 'var(--text-muted)' }}
            >
              {applyInfo.description}
            </motion.p>
            <motion.ul
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ margin: '-50px' }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              {applyInfo.requirements.map((req, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ margin: '-50px' }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3 text-sm font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <motion.div
                    whileHover={{ scale: 1.2 }}
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
            onClick={handleApplyClick}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ margin: '-50px' }}
            transition={{ delay: 0.5, type: 'spring' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative flex items-center gap-2 px-8 py-4 font-bold transition-all duration-300 overflow-hidden"
            style={{
              background: isHovered ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'rgba(59, 130, 246, 0.1)',
              color: 'white',
              border: `2px solid ${isHovered ? 'transparent' : 'var(--accent-primary)'}`,
              clipPath: clipPathRounded(6),
              boxShadow: isHovered ? '0 0 30px var(--accent-glow)' : 'none',
              transform: isHovered ? 'translateY(-2px)' : 'none',
            }}
          >
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
              animate={isHovered ? { x: '200%' } : { x: '-100%' }}
              transition={{ duration: 0.6 }}
            />
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.7)' }}
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md p-6"
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          clipPath: clipPathRounded(12),
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="flex items-center justify-center w-12 h-12"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '2px solid rgba(255, 255, 255, 0.1)',
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
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
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
              background: 'rgba(255, 255, 255, 0.1)',
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-4 py-2 font-medium transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-primary)',
              clipPath: clipPathRounded(4),
            }}
          >
            取消跳转
          </motion.button>
          <motion.button
            onClick={onConfirm}
            whileHover={{ scale: 1.02 }}
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

  // Load friends data and footer data
  useEffect(() => {
    Promise.all([
      fetch('/data/friends.json').then(res => {
        if (!res.ok) throw new Error('Failed to load friends data');
        return res.json();
      }),
      fetch('/data/site-data.json').then(res => res.json())
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

  // Group friends by category
  const friendsByCategory = useMemo(() => {
    if (!data) return [];
    return data.categories.map(category => ({
      category,
      friends: data.friends.filter(friend => friend.category === category.id)
    }));
  }, [data]);

  // Calculate stats - 只统计 featured=true 的友链
  const stats = useMemo(() => {
    if (!data) return { friends: 0, categories: 0, online: 0 };
    const featuredFriends = data.friends.filter(f => f.featured);
    return {
      friends: featuredFriends.length,
      categories: data.categories.length,
      online: featuredFriends.filter(f => f.status === 'online').length
    };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-2 border-t-transparent animate-spin"
            style={{ 
              borderColor: 'var(--accent-primary)', 
              borderTopColor: 'transparent',
              clipPath: clipPathRounded(2),
            }}
          />
          <p style={{ color: 'var(--text-muted)' }}>加载中...</p>
        </div>
      </div>
    );
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
      {/* 统一背景特效 */}
      <div className="fixed inset-0 pointer-events-none">
        <AmbientGlow color="var(--accent-primary)" opacity={0.15} position="top-right" />
        <AmbientGlow color="var(--accent-secondary)" opacity={0.1} position="bottom-left" />
        <AmbientGlow color="var(--accent-primary)" opacity={0.08} position="center" size={600} />

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

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <HeroSection 
          title={data.title}
          description={data.description}
          stats={stats}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {/* Featured Friends */}
          {data.friends.some(f => f.featured) && (
            <motion.section
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ margin: '-50px' }}
              transition={{ duration: 0.6, delay: 0.1, type: 'spring', stiffness: 100 }}
              className="mb-20"
            >
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ margin: '-50px' }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center gap-3 mb-10"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex items-center justify-center w-12 h-12 relative overflow-hidden"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: 'radial-gradient(circle at 50% 50%, var(--accent-glow), transparent 70%)' }}
                    animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
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

          {/* Categories */}
          {friendsByCategory.map(({ category, friends }, index) => (
            friends.length > 0 && (
              <CategorySection
                key={category.id}
                category={category}
                friends={friends}
                index={index + 2}
                onClick={handleFriendClick}
              />
            )
          ))}

          {/* Apply Section */}
          <ApplySection applyInfo={data.applyInfo} />
        </div>
      </main>

      {/* Footer - 使用共享组件 */}
      {footerData && <Footer data={footerData} />}

      {/* 底部光剑 */}
      <LightBeam position="bottom" color="var(--accent-secondary)" intensity={0.2} />

      <RedirectModal
        isOpen={redirectModalOpen}
        friend={selectedFriend}
        onConfirm={handleConfirmRedirect}
        onCancel={handleCancelRedirect}
      />
    </div>
  );
}
