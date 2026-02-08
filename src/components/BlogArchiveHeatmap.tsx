import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import type { ArchiveList } from '@/hooks/useBlogArchive';

interface BlogArchiveHeatmapProps {
  data: ArchiveList;
  onSelectMonth?: (yearMonth: string) => void;
  selectedMonth?: string | null;
}

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function getDaysInMonth(year: number, month: number): number {
  if (month === 1) {
    return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28;
  }
  return DAYS_IN_MONTH[month];
}

export const BlogArchiveHeatmap = memo(function BlogArchiveHeatmap({ data, onSelectMonth, selectedMonth }: BlogArchiveHeatmapProps) {
  const [years, setYears] = useState<number[]>([]);
  const [postsByDate, setPostsByDate] = useState<Record<string, number>>({});
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  useEffect(() => {
    if (!data.months || data.months.length === 0) {
      setYears([]);
      setPostsByDate({});
      return;
    }

    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const yearSet = new Set<number>();
    const dateCount: Record<string, number> = {};

    data.months.forEach(yearMonth => {
      const [year, month] = yearMonth.split('-').map(Number);
      const monthDate = new Date(year, month - 1, 1);
      
      if (monthDate >= oneYearAgo && monthDate <= now) {
        yearSet.add(year);
      }
    });

    if (data.postsByDate) {
      Object.entries(data.postsByDate).forEach(([date, count]) => {
        const [year, month, day] = date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        
        if (dateObj >= oneYearAgo && dateObj <= now) {
          dateCount[date] = count;
        }
      });
    }

    setYears(Array.from(yearSet).sort((a, b) => b - a));
    setPostsByDate(dateCount);
  }, [data]);

  const getLevel = (count: number) => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 6) return 3;
    return 4;
  };

  const getLevelColor = (level: number) => {
    const colors = [
      'var(--bg-secondary)',
      'rgba(96, 165, 250, 0.3)',
      'rgba(96, 165, 250, 0.5)',
      'rgba(96, 165, 250, 0.7)',
      'rgba(96, 165, 250, 1)',
    ];
    return colors[level];
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          文章发布热力图
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
          <div key={year} className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-12 text-right font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                {year}
              </div>
              <div className="flex-1 flex items-center gap-1">
                {MONTHS.map((month, monthIndex) => (
                  <div key={month} className="text-xs text-center flex-1" style={{ color: 'var(--text-muted)' }}>
                    {monthIndex % 2 === 0 ? month : ''}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-12 text-right font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                日
              </div>
              <div className="flex-1 grid grid-cols-12 gap-1">
                {MONTHS.map((month, monthIndex) => {
                  const daysInMonth = getDaysInMonth(year, monthIndex);
                  const monthNum = String(monthIndex + 1).padStart(2, '0');
                  
                  return (
                    <div key={month} className="flex flex-col gap-0.5">
                      {Array.from({ length: daysInMonth }, (_, dayIndex) => {
                        const dayNum = String(dayIndex + 1).padStart(2, '0');
                        const dateKey = `${year}-${monthNum}-${dayNum}`;
                        const count = postsByDate[dateKey] || 0;
                        const level = getLevel(count);
                        const yearMonth = `${year}-${monthNum}`;
                        const isSelected = selectedMonth === yearMonth;
                        const isHovered = hoveredCell === dateKey;

                        return (
                          <motion.button
                            key={dateKey}
                            onClick={() => onSelectMonth?.(yearMonth)}
                            onMouseEnter={() => setHoveredCell(dateKey)}
                            onMouseLeave={() => setHoveredCell(null)}
                            disabled={count === 0}
                            className="w-3 h-3 rounded-sm relative"
                            style={{
                              background: getLevelColor(level),
                              border: isSelected ? '1px solid var(--accent-primary)' : 'none',
                              cursor: count > 0 ? 'pointer' : 'not-allowed',
                            }}
                            whileHover={count > 0 ? { scale: 1.3 } : {}}
                            whileTap={count > 0 ? { scale: 0.9 } : {}}
                          >
                            {(isHovered || isSelected) && count > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap z-10"
                                style={{
                                  background: 'var(--bg-card)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-primary)',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                }}
                              >
                                {year}年{monthIndex + 1}月{dayIndex + 1}日 · {count}篇文章
                              </motion.div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

          <div className="flex items-center justify-end gap-2 mt-4">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>少</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className="w-3 h-3 rounded-sm"
                style={{ background: getLevelColor(level) }}
              />
            ))}
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>多</span>
          </div>
        </div>
      )}
    </div>
  );
});

BlogArchiveHeatmap.displayName = 'BlogArchiveHeatmap';
