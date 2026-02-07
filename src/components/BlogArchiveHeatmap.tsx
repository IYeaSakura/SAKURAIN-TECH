import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import type { ArchiveData } from '@/hooks/useBlogArchive';

interface BlogArchiveHeatmapProps {
  data: ArchiveData;
  onSelectMonth?: (yearMonth: string) => void;
  selectedMonth?: string | null;
}

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function getMaxPostCount(data: ArchiveData): number {
  const counts = Object.values(data).map(posts => posts.length);
  return Math.max(...counts, 0);
}

function getCellColor(count: number, maxCount: number): string {
  if (count === 0) return 'var(--bg-secondary)';
  if (maxCount === 0) return 'var(--accent-primary)';
  
  const intensity = count / maxCount;
  const colors = [
    'rgba(96, 165, 250, 0.1)',
    'rgba(96, 165, 250, 0.3)',
    'rgba(96, 165, 250, 0.5)',
    'rgba(96, 165, 250, 0.7)',
    'rgba(96, 165, 250, 0.9)',
  ];
  
  const index = Math.min(Math.floor(intensity * colors.length), colors.length - 1);
  return colors[index];
}

export const BlogArchiveHeatmap = memo(function BlogArchiveHeatmap({ data, onSelectMonth, selectedMonth }: BlogArchiveHeatmapProps) {
  const [years, setYears] = useState<number[]>([]);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  useEffect(() => {
    const yearSet = new Set<number>();
    Object.keys(data).forEach(yearMonth => {
      const year = parseInt(yearMonth.split('-')[0]);
      yearSet.add(year);
    });
    setYears(Array.from(yearSet).sort((a, b) => b - a));
  }, [data]);

  const maxCount = getMaxPostCount(data);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          文章归档
        </h3>
        <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
      </div>

      {years.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
          暂无归档数据
        </div>
      ) : (
        <div className="space-y-6">
          {years.map(year => (
            <div key={year} className="flex items-start gap-4">
              <div className="w-16 text-right font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                {year}
              </div>
              <div className="flex-1 grid grid-cols-12 gap-2">
                {MONTHS.map((month, index) => {
                  const monthNum = String(index + 1).padStart(2, '0');
                  const yearMonth = `${year}-${monthNum}`;
                  const posts = data[yearMonth] || [];
                  const count = posts.length;
                  const isSelected = selectedMonth === yearMonth;
                  const isHovered = hoveredCell === yearMonth;
                  void month;

                  return (
                    <motion.button
                      key={yearMonth}
                      onClick={() => onSelectMonth?.(yearMonth)}
                      onMouseEnter={() => setHoveredCell(yearMonth)}
                      onMouseLeave={() => setHoveredCell(null)}
                      disabled={count === 0}
                      className="aspect-square rounded-lg relative group"
                      style={{
                        background: getCellColor(count, maxCount),
                        border: isSelected ? '2px solid var(--accent-primary)' : 'none',
                        cursor: count > 0 ? 'pointer' : 'not-allowed',
                      }}
                      whileHover={count > 0 ? { scale: 1.05 } : {}}
                      whileTap={count > 0 ? { scale: 0.95 } : {}}
                    >
                      {(isHovered || isSelected) && count > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap z-10"
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          }}
                        >
                          <div className="font-bold">{year}年{index + 1}月</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {count} 篇文章
                          </div>
                        </motion.div>
                      )}

                      {count > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                            {count}
                          </span>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

BlogArchiveHeatmap.displayName = 'BlogArchiveHeatmap';
