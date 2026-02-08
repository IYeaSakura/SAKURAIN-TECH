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
    if (maxCount === minCount) return 14;
    const ratio = (count - minCount) / (maxCount - minCount);
    return 14 + ratio * 20;
  };

  const getTagWeight = (count: number) => {
    if (maxCount === minCount) return 500;
    const ratio = (count - minCount) / (maxCount - minCount);
    return 500 + ratio * 400;
  };

  const getTagColor = (_count: number, index: number) => {
    if (selectedTag) return 'var(--accent-primary)';
    
    const colors = [
      'var(--accent-primary)',
      'var(--accent-secondary)',
      'var(--accent-tertiary)',
      '#60a5fa',
      '#8b5cf6',
      '#ec4899',
      '#f59e0b',
      '#10b981',
      '#3b82f6',
      '#ef4444',
    ];
    
    return colors[index % colors.length];
  };

  const getTagOpacity = (count: number) => {
    if (maxCount === minCount) return 1;
    const ratio = (count - minCount) / (maxCount - minCount);
    return 0.5 + ratio * 0.5;
  };

  const getTagGlow = (count: number, _index: number) => {
    if (selectedTag) return '0 0 20px var(--accent-glow)';
    
    const ratio = (count - minCount) / (maxCount - minCount);
    const intensity = Math.round(ratio * 20);
    return `0 0 ${intensity}px var(--accent-primary)20`;
  };

  const sortedTags = useMemo(() => {
    return [...tags].sort((a, b) => b.count - a.count);
  }, [tags]);

  return (
    <div className="relative p-8">
      <div 
        className="flex flex-wrap justify-center items-center gap-4 max-w-4xl mx-auto"
        style={{
          minHeight: '300px',
        }}
      >
        {sortedTags.map((tag, index) => {
          const isSelected = tag.name === selectedTag;
          const size = getTagSize(tag.count);
          const weight = getTagWeight(tag.count);
          const color = getTagColor(tag.count, index);
          const opacity = getTagOpacity(tag.count);
          const glow = getTagGlow(tag.count, index);
          
          return (
            <motion.button
              key={tag.name}
              onClick={() => onSelectTag(isSelected ? null : tag.name)}
              className="relative rounded-full font-medium transition-all duration-300 cursor-pointer"
              style={{
                fontSize: `${size}px`,
                fontWeight: weight,
                color: isSelected ? 'white' : color,
                opacity: isSelected ? 1 : opacity,
                padding: `${8 + (size - 14) / 2}px ${12 + (size - 14) / 2}px`,
                background: isSelected
                  ? 'linear-gradient(135deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 80%, var(--accent-secondary)))'
                  : 'transparent',
                border: isSelected ? 'none' : '1px solid transparent',
                boxShadow: glow,
              }}
              initial={{ 
                scale: 0,
                opacity: 0,
              }}
              animate={{ 
                scale: 1,
                opacity: 1,
              }}
              transition={{ 
                duration: 0.5,
                delay: index * 0.05,
                type: 'spring',
                stiffness: 100,
                damping: 15,
              }}
              whileHover={{ 
                scale: 1.1,
                transition: { duration: 0.2 },
              }}
              whileTap={{ 
                scale: 0.95,
                transition: { duration: 0.1 },
              }}
            >
              <span className="relative z-10">{tag.name}</span>
              {!isSelected && (
                <motion.span
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 rounded-full"
                  style={{
                    background: color,
                  }}
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});
