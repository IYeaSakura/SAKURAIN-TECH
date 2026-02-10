import { memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

interface Tag {
  name: string;
  count: number;
}

interface BlogTagCloudProps {
  tags: Tag[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

// 标签分类 - 基于常见技术标签分类
const TAG_CATEGORIES: Record<string, string> = {
  // 前端
  'React': 'frontend',
  'Vue': 'frontend',
  'TypeScript': 'frontend',
  'JavaScript': 'frontend',
  'Next.js': 'frontend',
  'Vite': 'frontend',
  'Tailwind': 'frontend',
  'CSS': 'frontend',
  'HTML': 'frontend',
  'WebGL': 'frontend',
  'Three.js': 'frontend',
  // 后端
  'Node.js': 'backend',
  'Python': 'backend',
  'FastAPI': 'backend',
  'Go': 'backend',
  'Java': 'backend',
  'PHP': 'backend',
  // 数据库
  'MySQL': 'database',
  'Redis': 'database',
  'MongoDB': 'database',
  'PostgreSQL': 'database',
  // DevOps
  'Docker': 'devops',
  'Kubernetes': 'devops',
  'Nginx': 'devops',
  'Linux': 'devops',
  'Git': 'devops',
  'CI/CD': 'devops',
  // AI
  'PyTorch': 'ai',
  'TensorFlow': 'ai',
  'AI': 'ai',
  '机器学习': 'ai',
  '深度学习': 'ai',
  'OpenCV': 'ai',
  // 云服务
  'AWS': 'cloud',
  'Azure': 'cloud',
  'GCP': 'cloud',
  'Cloudflare': 'cloud',
  'Vercel': 'cloud',
  '边缘计算': 'cloud',
  'Serverless': 'cloud',
  // 安全
  '安全': 'security',
  'API安全': 'security',
  'OAuth': 'security',
  'JWT': 'security',
  'HTTPS': 'security',
  // 算法
  '算法': 'algorithm',
  'MCTS': 'algorithm',
  '博弈算法': 'algorithm',
  '优化': 'algorithm',
};

const CATEGORY_COLORS: Record<string, { color: string; label: string }> = {
  frontend: { color: '#61DAFB', label: '前端' },
  backend: { color: '#00D4AA', label: '后端' },
  database: { color: '#F59E0B', label: '数据库' },
  devops: { color: '#8B5CF6', label: 'DevOps' },
  ai: { color: '#FF6B6B', label: 'AI/ML' },
  cloud: { color: '#EC4899', label: '云服务' },
  security: { color: '#EF4444', label: '安全' },
  algorithm: { color: '#10B981', label: '算法' },
  default: { color: '#9CA3AF', label: '其他' },
};

// 预定义的颜色池，用于无分类标签
const COLOR_POOL = [
  '#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fbbf24',
  '#fb923c', '#f87171', '#38bdf8', '#a3e635', '#c084fc',
  '#f472b6', '#22d3ee', '#818cf8', '#fb7185', '#4ade80',
];

export const BlogTagCloud = memo(function BlogTagCloud({ tags, selectedTag, onSelectTag }: BlogTagCloudProps) {
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  if (tags.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
        暂无标签
      </div>
    );
  }

  // 打乱标签顺序
  const shuffledTags = useMemo(() => {
    const array = [...tags];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }, [tags]);

  const maxCount = Math.max(...tags.map(tag => tag.count));
  const minCount = Math.min(...tags.map(tag => tag.count));

  const getFontSize = (count: number) => {
    if (maxCount === minCount) return 'text-base';
    const ratio = (count - minCount) / (maxCount - minCount);
    if (ratio >= 0.8) return 'text-2xl';
    if (ratio >= 0.6) return 'text-xl';
    if (ratio >= 0.4) return 'text-lg';
    if (ratio >= 0.2) return 'text-base';
    return 'text-sm';
  };

  const getOpacity = (count: number) => {
    if (maxCount === minCount) return 0.85;
    const ratio = (count - minCount) / (maxCount - minCount);
    return 0.4 + ratio * 0.6;
  };

  const getTagCategory = (tagName: string): string => {
    return TAG_CATEGORIES[tagName] || 'default';
  };

  const getTagColor = (tagName: string, index: number): string => {
    const category = getTagCategory(tagName);
    if (category !== 'default') {
      return CATEGORY_COLORS[category].color;
    }
    // 无分类标签使用颜色池
    return COLOR_POOL[index % COLOR_POOL.length];
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

  // 收集所有使用的分类
  const usedCategories = useMemo(() => {
    const categories = new Set<string>();
    tags.forEach(tag => {
      const cat = getTagCategory(tag.name);
      if (cat !== 'default') {
        categories.add(cat);
      }
    });
    return Array.from(categories);
  }, [tags]);

  return (
    <div className="relative">
      {/* 类别图例 */}
      {usedCategories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {usedCategories.map((key) => {
            const { label, color } = CATEGORY_COLORS[key];
            return (
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
            );
          })}
        </div>
      )}

      {/* 词云 */}
      <div
        className="relative min-h-[320px] p-6 rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--bg-card), var(--bg-secondary))',
          border: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-[0.08] dark:opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, var(--accent-primary), transparent)' }} />
          <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, var(--accent-secondary), transparent)' }} />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" style={{ background: 'radial-gradient(circle, var(--accent-tertiary), transparent)' }} />
        </div>

        {/* 标签词汇 */}
        <div className="relative flex flex-wrap justify-center items-center gap-3">
          {shuffledTags.map((tag, index) => {
            const isSelected = tag.name === selectedTag;
            const isHovered = hoveredTag === tag.name;
            const color = getTagColor(tag.name, index);
            const offset = getRandomOffset(index);
            const fontSize = getFontSize(tag.count);
            const opacity = getOpacity(tag.count);

            return (
              <motion.span
                key={tag.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.02, 
                  type: 'spring', 
                  stiffness: 100 
                }}
                whileHover={{ 
                  scale: 1.15, 
                  zIndex: 10, 
                  textShadow: `0 0 20px ${color}` 
                }}
                onMouseEnter={() => setHoveredTag(tag.name)}
                onMouseLeave={() => setHoveredTag(null)}
                onClick={() => onSelectTag(isSelected ? null : tag.name)}
                className={`inline-block px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-300 font-medium ${fontSize} ${
                  isSelected ? 'ring-2 ring-offset-2' : ''
                }`}
                style={{
                  color: isHovered || isSelected ? color : `${color}DD`,
                  opacity: isSelected ? 1 : opacity,
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                  textShadow: isHovered || isSelected ? `0 0 30px ${color}50` : 'none',
                  '--tw-ring-color': isSelected ? color : undefined,
                } as React.CSSProperties}
              >
                {tag.name}
                {(isHovered || isSelected) && (
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs whitespace-nowrap z-20"
                    style={{ 
                      background: 'rgba(0,0,0,0.8)', 
                      color: color, 
                      border: `1px solid ${color}40` 
                    }}
                  >
                    {tag.count} 篇文章
                  </motion.span>
                )}
              </motion.span>
            );
          })}
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>
          悬停查看文章数 · 点击筛选
        </div>
      </div>
    </div>
  );
});

BlogTagCloud.displayName = 'BlogTagCloud';
