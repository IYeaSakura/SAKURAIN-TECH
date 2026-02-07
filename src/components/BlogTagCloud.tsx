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
    if (ratio < 0.33) return 'text-sm';
    if (ratio < 0.66) return 'text-base';
    return 'text-lg';
  };

  const getTagOpacity = (count: number) => {
    if (maxCount === minCount) return 0.8;
    const ratio = (count - minCount) / (maxCount - minCount);
    return 0.5 + ratio * 0.5;
  };

  return (
    <div className="flex flex-wrap gap-3 p-6">
      {tags.map((tag) => (
        <motion.button
          key={tag.name}
          onClick={() => onSelectTag(tag.name === selectedTag ? null : tag.name)}
          className="px-4 py-2 rounded-full font-medium transition-all duration-200 hover:scale-105"
          style={{
            background: tag.name === selectedTag ? 'var(--accent-primary)' : 'var(--bg-secondary)',
            color: tag.name === selectedTag ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            opacity: tag.name === selectedTag ? 1 : getTagOpacity(tag.count),
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
