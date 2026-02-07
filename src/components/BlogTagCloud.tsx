import { memo } from 'react';
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
    if (maxCount === minCount) return 'text-base';
    const ratio = (count - minCount) / (maxCount - minCount);
    if (ratio < 0.2) return 'text-xs';
    if (ratio < 0.4) return 'text-sm';
    if (ratio < 0.6) return 'text-base';
    if (ratio < 0.8) return 'text-lg';
    return 'text-xl';
  };

  const getTagOpacity = (count: number) => {
    if (maxCount === minCount) return 0.8;
    const ratio = (count - minCount) / (maxCount - minCount);
    return 0.4 + ratio * 0.6;
  };

  const getTagPadding = (count: number) => {
    if (maxCount === minCount) return 'px-4 py-2';
    const ratio = (count - minCount) / (maxCount - minCount);
    if (ratio < 0.33) return 'px-3 py-1.5';
    if (ratio < 0.66) return 'px-4 py-2';
    return 'px-5 py-2.5';
  };

  const getTagGlow = (count: number) => {
    if (maxCount === minCount) return 'none';
    const ratio = (count - minCount) / (maxCount - minCount);
    if (ratio < 0.5) return 'none';
    const intensity = Math.round(ratio * 30);
    return `0 0 ${intensity}px var(--accent-primary)40`;
  };

  return (
    <div className="flex flex-wrap gap-3 p-6">
      {tags.map((tag) => (
        <motion.button
          key={tag.name}
          onClick={() => onSelectTag(tag.name === selectedTag ? null : tag.name)}
          className={`${getTagPadding(tag.count)} rounded-full font-medium transition-all duration-200`}
          style={{
            background: tag.name === selectedTag 
              ? 'linear-gradient(135deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 80%, var(--accent-secondary)))'
              : 'var(--bg-secondary)',
            color: tag.name === selectedTag ? 'white' : 'var(--accent-primary)',
            border: tag.name !== selectedTag 
              ? '1px solid var(--border-subtle)'
              : 'none',
            opacity: tag.name === selectedTag ? 1 : getTagOpacity(tag.count),
            boxShadow: tag.name === selectedTag 
              ? '0 4px 15px var(--accent-glow)'
              : getTagGlow(tag.count),
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className={getTagSize(tag.count)}>{tag.name}</span>
          <span className="ml-1 text-xs opacity-70">({tag.count})</span>
        </motion.button>
      ))}
    </div>
  );
});
