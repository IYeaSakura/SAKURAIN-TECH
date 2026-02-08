import { memo, useMemo } from 'react';
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

const COLOR_PALETTES = [
  {
    primary: '#60a5fa',
    secondary: '#3b82f6',
    gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
  },
  {
    primary: '#a78bfa',
    secondary: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
  },
  {
    primary: '#f472b6',
    secondary: '#ec4899',
    gradient: 'linear-gradient(135deg, #f472b6, #ec4899)',
  },
  {
    primary: '#34d399',
    secondary: '#10b981',
    gradient: 'linear-gradient(135deg, #34d399, #10b981)',
  },
  {
    primary: '#fbbf24',
    secondary: '#f59e0b',
    gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
  },
  {
    primary: '#fb923c',
    secondary: '#f97316',
    gradient: 'linear-gradient(135deg, #fb923c, #f97316)',
  },
  {
    primary: '#f87171',
    secondary: '#ef4444',
    gradient: 'linear-gradient(135deg, #f87171, #ef4444)',
  },
  {
    primary: '#38bdf8',
    secondary: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
  },
];

export const BlogTagCloud = memo(function BlogTagCloud({ tags, selectedTag, onSelectTag }: BlogTagCloudProps) {
  if (tags.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
        暂无标签
      </div>
    );
  }

  const maxCount = Math.max(...tags.map(tag => tag.count));
  const minCount = Math.min(...tags.map(tag => tag.count));

  const getTagSize = (count: number) => {
    if (maxCount === minCount) return 16;
    const ratio = (count - minCount) / (maxCount - minCount);
    return 16 + ratio * 24;
  };

  const getTagWeight = (count: number) => {
    if (maxCount === minCount) return 500;
    const ratio = (count - minCount) / (maxCount - minCount);
    return 500 + ratio * 400;
  };

  const getTagPalette = (index: number) => {
    return COLOR_PALETTES[index % COLOR_PALETTES.length];
  };

  const getTagOpacity = (count: number) => {
    if (maxCount === minCount) return 0.85;
    const ratio = (count - minCount) / (maxCount - minCount);
    return 0.6 + ratio * 0.4;
  };

  const getTagGlow = (count: number, palette: any) => {
    if (selectedTag) return `0 0 30px ${palette.primary}40`;
    
    const ratio = (count - minCount) / (maxCount - minCount);
    const intensity = Math.round(ratio * 25);
    return `0 0 ${intensity}px ${palette.primary}30`;
  };

  const getTagShadow = (count: number, palette: any) => {
    if (selectedTag) return `0 4px 15px ${palette.primary}50`;
    
    const ratio = (count - minCount) / (maxCount - minCount);
    const intensity = Math.round(ratio * 10);
    return `0 2px ${intensity}px ${palette.primary}20`;
  };

  const sortedTags = useMemo(() => {
    return [...tags].sort((a, b) => b.count - a.count);
  }, [tags]);

  return (
    <div className="relative p-8">
      <div 
        className="flex flex-wrap justify-center items-center gap-3 max-w-4xl mx-auto"
        style={{
          minHeight: '320px',
        }}
      >
        {sortedTags.map((tag, index) => {
          const isSelected = tag.name === selectedTag;
          const size = getTagSize(tag.count);
          const weight = getTagWeight(tag.count);
          const palette = getTagPalette(index);
          const opacity = getTagOpacity(tag.count);
          const glow = getTagGlow(tag.count, palette);
          const shadow = getTagShadow(tag.count, palette);
          
          return (
            <motion.button
              key={tag.name}
              onClick={() => onSelectTag(isSelected ? null : tag.name)}
              className="relative font-medium transition-all duration-300 cursor-pointer"
              style={{
                fontSize: `${size}px`,
                fontWeight: weight,
                color: isSelected ? 'white' : palette.primary,
                opacity: isSelected ? 1 : opacity,
                padding: `${10 + (size - 16) / 2}px ${14 + (size - 16) / 2}px`,
                background: isSelected
                  ? palette.gradient
                  : 'transparent',
                border: isSelected ? 'none' : `1px solid ${palette.primary}30`,
                borderRadius: '9999px',
                boxShadow: `${glow}, ${shadow}`,
                backdropFilter: isSelected ? 'blur(10px)' : 'none',
              }}
              initial={{ 
                scale: 0,
                opacity: 0,
                y: 20,
              }}
              animate={{ 
                scale: 1,
                opacity: 1,
                y: 0,
              }}
              transition={{ 
                duration: 0.6,
                delay: index * 0.06,
                type: 'spring',
                stiffness: 80,
                damping: 20,
              }}
              whileHover={{ 
                scale: 1.08,
                boxShadow: `0 0 35px ${palette.primary}50, 0 4px 20px ${palette.primary}40`,
                transition: { duration: 0.3 },
              }}
              whileTap={{ 
                scale: 0.96,
                transition: { duration: 0.15 },
              }}
            >
              <span className="relative z-10">{tag.name}</span>
              {!isSelected && (
                <motion.span
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 rounded-full"
                  style={{
                    background: palette.gradient,
                  }}
                  initial={{ width: 0 }}
                  whileHover={{ width: '80%' }}
                  transition={{ duration: 0.3 }}
                />
              )}
              {tag.count > 1 && (
                <motion.span
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: palette.gradient,
                    color: 'white',
                    boxShadow: `0 2px 8px ${palette.primary}50`,
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    duration: 0.4,
                    delay: index * 0.06 + 0.3,
                  }}
                >
                  {tag.count}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});
