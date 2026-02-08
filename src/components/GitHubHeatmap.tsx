"use client"

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface ContributionData {
  date: string;
  count: number;
  level: number;
}

interface GitHubHeatmapProps {
  username: string;
  year?: number;
}

export function GitHubHeatmap({ username, year = new Date().getFullYear() }: GitHubHeatmapProps) {
  const [contributions, setContributions] = useState<ContributionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`https://github-contributions-api.vercel.app/api/${username}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch contributions');
        }

        const data = await response.json();
        
        const contributionsData: ContributionData[] = data.contributions.map((item: any) => ({
          date: item.date,
          count: item.count,
          level: Math.min(4, Math.ceil(item.count / 5)),
        }));

        setContributions(contributionsData);
      } catch (err) {
        console.error('Error fetching GitHub contributions:', err);
        setError('无法加载贡献数据');
      } finally {
        setLoading(false);
      }
    };

    fetchContributions();
  }, [username]);

  const getLevelColor = (level: number) => {
    const colors = [
      'var(--bg-secondary)',
      '#0e4429',
      '#006d32',
      '#26a641',
      '#39d353',
    ];
    return colors[level] || colors[0];
  };

  const getWeeks = () => {
    const weeks: ContributionData[][] = [];
    let currentWeek: ContributionData[] = [];

    contributions.forEach((contribution, index) => {
      const date = new Date(contribution.date);
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentWeek.push(contribution);

      if (index === contributions.length - 1) {
        weeks.push(currentWeek);
      }
    });

    return weeks;
  };

  const weeks = getWeeks();

  if (loading) {
    return (
      <div className="w-full p-6 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
            />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>加载贡献数据...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-center h-48">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const totalContributions = contributions.reduce((sum, c) => sum + c.count, 0);
  const activeDays = contributions.filter(c => c.count > 0).length;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full p-6 rounded-2xl"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold mb-1">GitHub 贡献热力图</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {year} 年 · {username}
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="font-bold" style={{ color: 'var(--accent-primary)' }}>
              {totalContributions.toLocaleString()}
            </span>
            <span className="ml-1" style={{ color: 'var(--text-muted)' }}>次提交</span>
          </div>
          <div>
            <span className="font-bold" style={{ color: 'var(--accent-secondary)' }}>
              {activeDays}
            </span>
            <span className="ml-1" style={{ color: 'var(--text-muted)' }}>活跃天</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const contribution = week[dayIndex];
                
                if (!contribution) {
                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className="w-3 h-3 rounded-sm"
                      style={{ background: 'var(--bg-secondary)' }}
                    />
                  );
                }

                return (
                  <motion.div
                    key={`${weekIndex}-${dayIndex}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: (weekIndex * 7 + dayIndex) * 0.001,
                      duration: 0.3,
                    }}
                    className="w-3 h-3 rounded-sm cursor-pointer hover:scale-125 transition-transform"
                    style={{
                      background: getLevelColor(contribution.level),
                    }}
                    title={`${contribution.date}: ${contribution.count} 次提交`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end mt-4 gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>少</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="w-3 h-3 rounded-sm"
            style={{ background: getLevelColor(level) }}
          />
        ))}
        <span>多</span>
      </div>
    </motion.div>
  );
}
