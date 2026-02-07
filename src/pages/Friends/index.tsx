import { useState, useEffect, memo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowLeft, Code, Palette, Wrench, BookOpen, Monitor, ExternalLink, Heart, Mail, Sparkles, Globe, Star, Circle } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import {
  MagneticCursor, VelocityCursor,
  TwinklingStars, FlowingGradient, LightBeam,
  FloatingBubbles, AmbientGlow
} from '@/components/effects';
import { ThemeToggle } from '@/components/atoms';

// Theme type definition
type Theme = 'light' | 'dark';

// Icon mapping
const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Code, Palette, Wrench, BookOpen, Monitor
};

// Types
interface FriendCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface Friend {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string;
  category: string;
  featured: boolean;
  status?: 'online' | 'offline';
}

interface ApplyInfo {
  title: string;
  description: string;
  requirements: string[];
  contact: string;
}

interface FriendsData {
  title: string;
  subtitle: string;
  description: string;
  applyInfo: ApplyInfo;
  categories: FriendCategory[];
  friends: Friend[];
}

// Section Title Component
const SectionTitle = memo(function SectionTitle({
  title,
  subtitle,
  description
}: {
  title: string;
  subtitle: string;
  description?: string;
}) {
  return (
    <div className="text-center mb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <Heart className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {subtitle}
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="font-pixel text-4xl md:text-5xl lg:text-6xl mb-6"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </motion.h1>

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg max-w-2xl mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
});

// Friend Card Component - Enhanced with 3D tilt and glow effects
const FriendCard = memo(function FriendCard({
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
  const color = 'var(--accent-primary)';

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
      style={{
        perspective: '1000px',
        background: 'var(--bg-card)',
        border: '3px solid',
        borderColor: isHovered ? color : 'var(--border-subtle)',
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'none',
        boxShadow: isHovered
          ? `0 20px 40px var(--accent-glow), 0 0 30px ${color}20, inset -4px -4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 4px 4px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)`
          : 'inset -4px -4px 0 color-mix(in srgb, var(--bg-secondary) 40%, black), inset 4px 4px 0 color-mix(in srgb, var(--bg-secondary) 150%, white)',
      }}
      className="group relative block p-6 rounded-xl cursor-pointer overflow-hidden"
    >
        {/* Glow background - radial gradient */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${color}20, transparent 60%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Shine effect - diagonal sheen */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${color}15 45%, ${color}30 50%, ${color}15 55%, transparent 60%)`,
            transform: 'translateX(-100%)',
          }}
          animate={isHovered ? { x: '200%' } : { x: '-100%' }}
          transition={{ duration: 0.6 }}
        />

        {/* Featured Badge */}
        {friend.featured && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold z-20"
            style={{
              background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 80%, var(--accent-secondary)))`,
              color: 'white',
              boxShadow: `0 2px 10px ${color}40`,
            }}
          >
            <Star className="w-3 h-3" />
            友链
          </motion.div>
        )}

        {/* Status Indicator */}
        {friend.status && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="absolute top-2 left-2 z-20"
          >
            <Circle
              className="w-3 h-3"
              style={{
                color: friend.status === 'online' ? '#22c55e' : '#ef4444',
                filter: friend.status === 'online' ? 'drop-shadow(0 0 4px #22c55e80)' : 'drop-shadow(0 0 4px #ef444480)',
              }}
            />
          </motion.div>
        )}

        <div className="flex items-start gap-4 relative z-10">
          {/* Icon */}
          <motion.div
            animate={{
              rotateX: currentRotateX,
              rotateY: currentRotateY,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {!imageError ? (
              <img
                src={friend.icon}
                alt={friend.name}
                className="w-8 h-8 object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <Globe
                className="w-8 h-8"
                style={{ color: 'var(--accent-primary)' }}
              />
            )}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <motion.h3
                animate={{
                  scale: isHovered ? 1.05 : 1,
                }}
                transition={{ duration: 0.2 }}
                className="font-bold text-lg truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {friend.name}
              </motion.h3>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                transition={{ duration: 0.3 }}
              >
                <ExternalLink
                  className="w-4 h-4"
                  style={{ color: 'var(--accent-primary)' }}
                />
              </motion.div>
            </div>
            <p
              className="text-sm line-clamp-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {friend.description}
            </p>
          </div>
        </div>
      </motion.div>
  );
});

// Category Section Component - Enhanced with glow effects
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
  const color = 'var(--accent-primary)';

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        type: 'spring',
        stiffness: 100,
      }}
      className="mb-24"
    >
      {/* Category Header */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 + 0.1 }}
        className="flex items-center gap-4 mb-10"
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex items-center justify-center w-14 h-14 rounded-xl relative overflow-hidden"
          style={{
            background: 'var(--bg-secondary)',
            border: '2px solid var(--border-subtle)',
            boxShadow: `0 0 20px ${color}20`,
          }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-xl"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${color}30, transparent 70%)`,
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <IconComponent
            className="w-7 h-7 relative z-10"
            style={{ color: 'var(--accent-primary)' }}
          />
        </motion.div>
        <div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            className="font-pixel text-2xl"
            style={{
              color: 'var(--text-primary)',
              textShadow: '2px 2px 0 color-mix(in srgb, var(--bg-secondary) 50%, black)',
            }}
          >
            {category.name}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.3 }}
            className="text-sm font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            {category.description}
          </motion.p>
        </div>
      </motion.div>

      {/* Friends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {friends.map((friend, friendIndex) => (
          <FriendCard
            key={friend.id}
            friend={friend}
            index={friendIndex}
            onClick={onClick}
          />
        ))}
      </div>
    </motion.section>
  );
});

// Apply Section Component - Enhanced with glow effects
const ApplySection = memo(function ApplySection({
  applyInfo
}: {
  applyInfo: ApplyInfo;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const color = 'var(--accent-primary)';

  const handleApplyClick = useCallback(() => {
    const subject = '申请友链 - SAKURAIN';
    const body = `此邮件用于申请添加友链。

以下是站点信息：

{
  "id": "sakurain",
  "name": "SAKURAIN TEAM",
  "url": "https://sakurain.net",
  "icon": "https://sakurain.net/image/logo.webp",
  "description": "用代码构建世界",
  "category": "blogs",
  "featured": true
},

字段说明：
- id: 非必填，站点唯一标识符，用于存储索引，建议使用短域名或拼音缩写，只支持字母和数字。
- name: 必填，站点名称。
- url: 必填，站点链接。
- icon: 必填，站点图标链接。
- description: 必填，站点描述。
- category: 非必填，站点分类，默认值为 "blogs"，可选值为 "blogs"（个人博客）、"tech"（技术社区）、"design"（设计资源）、"tools"（开发工具）。
- featured: 非必填，是否作为推荐站点置顶显示，默认值为 false。

已添加到友链列表中，并替换为自己的站点信息。
发送本邮件即代表承诺网站内容健康、合法、无恶意代码。

---
此邮件由 SAKURAIN 网站友链申请自动生成`;

    const mailtoLink = `mailto:${applyInfo.contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  }, [applyInfo.contact]);
   return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: 0.4,
        type: 'spring',
        stiffness: 100,
      }}
      className="mt-20 p-8 md:p-12 rounded-2xl relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)',
        border: '2px solid var(--border-subtle)',
      }}
    >
      {/* Glow background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${color}10, transparent 70%)`,
        }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
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
              className="flex items-center justify-center w-12 h-12 rounded-xl relative overflow-hidden"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-subtle)',
                boxShadow: `0 0 20px ${color}20`,
              }}
            >
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${color}30, transparent 70%)`,
                }}
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <Sparkles
                className="w-6 h-6 relative z-10"
                style={{ color: 'var(--accent-primary)' }}
              />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ margin: '-50px' }}
              transition={{ delay: 0.2 }}
              className="font-pixel text-2xl"
              style={{
                color: 'var(--text-primary)',
                textShadow: '2px 2px 0 color-mix(in srgb, var(--bg-secondary) 50%, black)',
              }}
            >
              {applyInfo.title}
            </motion.h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ margin: '-50px' }}
            transition={{ delay: 0.3 }}
            className="mb-6"
            style={{ color: 'var(--text-secondary)' }}
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
                  className="w-2 h-2 rounded-full"
                  style={{ background: 'var(--accent-primary)' }}
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
          className="relative flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all duration-300 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 80%, var(--accent-secondary)))`,
            color: 'white',
            boxShadow: isHovered
              ? `0 8px 30px var(--accent-glow), 0 0 60px ${color}40, inset 0 0 20px rgba(255,255,255,0.2)`
              : '0 4px 20px var(--accent-glow)',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              transform: 'translateX(-100%)',
            }}
            animate={isHovered ? { x: '200%' } : { x: '-100%' }}
            transition={{ duration: 0.6 }}
          />
          <Mail className="w-5 h-5" />
          申请友链
        </motion.button>
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
        className="relative w-full max-w-md p-6 rounded-2xl"
        style={{
          background: 'var(--bg-card)',
          border: '2px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Globe className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              即将离开本站
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              跳转到友链网站
            </p>
          </div>
        </div>

        <div className="mb-4 p-4 rounded-lg"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            {friend.name}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {friend.url}
          </p>
        </div>

        <div className="mb-4 p-3 rounded-lg"
          style={{
            background: 'rgba(251, 146, 60, 0.1)',
            border: '1px solid rgba(251, 146, 60, 0.3)',
          }}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg" style={{ color: '#fbbf24' }}>⚠️</span>
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                注意
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                即将访问外部网站，本站无法保证其安全性，请保持警惕
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: 'var(--text-secondary)' }}>自动跳转</span>
            <span style={{ color: 'var(--text-primary)' }}>{timeLeft} 秒</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--accent-primary)' }}
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
            className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            取消跳转
          </motion.button>
          <motion.button
            onClick={onConfirm}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              background: 'var(--accent-primary)',
              color: 'white',
            }}
          >
            立即访问
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
});

// Navigation Header Component
const NavigationHeader = memo(function NavigationHeader({
  theme,
  onThemeToggle
}: {
  theme: Theme;
  onThemeToggle: (event: React.MouseEvent<HTMLElement>) => void;
}) {
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 mc-navbar"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Back Button */}
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">返回首页</span>
          </motion.button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/image/logo.webp"
              alt="SAKURAIN"
              className="w-8 h-8 object-contain"
            />
            <span
              className="font-pixel text-xl hidden sm:block"
              style={{ color: 'var(--text-primary)' }}
            >
              SAKURAIN
            </span>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle
            theme={theme}
            onToggle={onThemeToggle}
            isTransitioning={false}
          />
        </div>
      </div>
    </motion.header>
  );
});

// Main Friends Page Component
export default function FriendsPage() {
  const [data, setData] = useState<FriendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const THEME_STORAGE_KEY = 'sakurain-theme';

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

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  // Listen for theme changes from other pages
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const newTheme = e.newValue as Theme;
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Load friends data
  useEffect(() => {
    fetch('/data/friends.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load friends data');
        return res.json();
      })
      .then((data: FriendsData) => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Group friends by category
  const friendsByCategory = data?.categories.map(category => ({
    category,
    friends: data.friends.filter(friend => friend.category === category.id)
  })) || [];

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--text-muted)' }}>加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <p style={{ color: 'var(--text-muted)' }} className="mb-4">
            {error || '无法加载友链数据'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg text-white"
            style={{ background: 'var(--accent-primary)' }}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Global Effects */}
      <MagneticCursor />
      <VelocityCursor />

      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none z-0 hidden lg:block">
        <TwinklingStars
          count={35}
          color="var(--accent-primary)"
          secondaryColor="var(--accent-secondary)"
        />
      </div>

      {/* Flowing gradient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <FlowingGradient
          colors={['var(--accent-primary)', 'var(--accent-secondary)', 'var(--accent-tertiary)']}
          speed={15}
          opacity={0.05}
        />
      </div>

      {/* Ambient glow effects */}
      <AmbientGlow position="center" color="var(--accent-primary)" size={500} opacity={0.15} />
      <AmbientGlow position="top-left" color="var(--accent-secondary)" size={300} opacity={0.12} />
      <AmbientGlow position="bottom-right" color="var(--accent-tertiary)" size={400} opacity={0.1} />

      {/* Floating bubbles */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <FloatingBubbles count={8} colors={['var(--accent-primary)', 'var(--accent-secondary)']} />
      </div>

      {/* Light beams */}
      <LightBeam position="top" color="var(--accent-primary)" intensity={0.3} />

      {/* Navigation */}
      <NavigationHeader
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <SectionTitle
            title={data.title}
            subtitle="友情链接"
            description={data.description}
          />

          {/* Featured Friends */}
          {data.friends.some(f => f.featured) && (
            <motion.section
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ margin: '-50px' }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                type: 'spring',
                stiffness: 100,
              }}
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
                  className="flex items-center justify-center w-12 h-12 rounded-xl relative overflow-hidden"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--border-subtle)',
                    boxShadow: `0 0 20px var(--accent-primary)20`,
                  }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'radial-gradient(circle at 50% 50%, var(--accent-primary)30, transparent 70%)',
                    }}
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <Star
                    className="w-6 h-6 relative z-10"
                    style={{ color: 'var(--accent-primary)' }}
                  />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ margin: '-50px' }}
                  transition={{ delay: 0.3 }}
                  className="font-pixel text-2xl"
                  style={{
                    color: 'var(--text-primary)',
                    textShadow: '2px 2px 0 color-mix(in srgb, var(--bg-secondary) 50%, black)',
                  }}
                >
                  友链推荐
                </motion.h2>
              </motion.div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.friends
                  .filter(f => f.featured)
                  .map((friend, index) => (
                    <FriendCard
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

      {/* Footer */}
      <footer
        className="relative py-16 overflow-hidden"
        style={{ borderTop: '4px solid var(--border-subtle)' }}
      >
        {/* Floating bubbles */}
        <div className="absolute inset-0 pointer-events-none opacity-15">
          <FloatingBubbles count={8} colors={['var(--accent-primary)', 'var(--accent-secondary)']} />
        </div>

        {/* Twinkling stars */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block">
          <TwinklingStars count={20} color="var(--accent-primary)" secondaryColor="var(--accent-secondary)" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p
            className="flex items-center justify-center gap-2"
            style={{ color: 'var(--text-muted)' }}
          >
            © {new Date().getFullYear()} SAKURAIN 技术工作室
            <Heart className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            用代码构建未来
          </p>
        </div>
      </footer>

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
