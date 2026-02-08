"use client"

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Calendar } from 'lucide-react';

interface GitHubHeatmapProps {
  username: string;
  year?: number;
}

export function GitHubHeatmap({ username, year = new Date().getFullYear() }: GitHubHeatmapProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 使用 ghchart.rshah.org 服务生成贡献图
  // 颜色格式: 409ba5 是蓝绿色
  const chartUrl = `https://ghchart.rshah.org/409ba5/${username}`;
  const githubProfileUrl = `https://github.com/${username}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full p-6 rounded-2xl"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Github className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              GitHub 贡献热力图
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {year} 年 · @{username}
            </p>
          </div>
        </div>

        <a
          href={githubProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          <Github className="w-4 h-4" />
          查看主页
        </a>
      </div>

      {/* 贡献图 */}
      <div
        className="relative rounded-xl overflow-hidden p-4 flex items-center justify-center"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          minHeight: '160px',
        }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
              />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>加载中...</p>
            </div>
          </div>
        )}

        {error ? (
          <div className="text-center">
            <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>无法加载贡献图</p>
            <a
              href={githubProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:underline"
              style={{ color: 'var(--accent-primary)' }}
            >
              访问 GitHub 主页查看
            </a>
          </div>
        ) : (
          <img
            src={chartUrl}
            alt={`${username}'s GitHub Contribution Chart`}
            className="w-full max-w-full h-auto"
            style={{
              opacity: loading ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        )}
      </div>

      {/* 图例说明 */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>最近一年的贡献记录</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>少</span>
          <div className="flex gap-1">
            {['var(--bg-secondary)', '#8ecdd6', '#5fb3bf', '#409ba5', '#2d7a8a'].map((color, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-sm"
                style={{ background: color }}
              />
            ))}
          </div>
          <span>多</span>
        </div>
      </div>
    </motion.div>
  );
}
