/**
 * 开发日志页面
 * 
 * 展示项目的开发历程、更新记录和版本变更
 * 
 * @author SAKURAIN
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitCommit,
  Calendar,
  Tag,
  ChevronRight,
  Sparkles,
  Code2,
  Bug,
  Zap,
  Palette,
  Server,
  Shield,
  Layout,
  Database,
  Cpu
} from 'lucide-react';
import { Footer } from '@/components/sections/Footer';
import { SectionTitle } from '@/components/atoms';
import { GridBackground, AmbientGlow } from '@/components/effects';

// 日志条目类型
interface LogEntry {
  id: string;
  version: string;
  date: string;
  title: string;
  description: string;
  changes: {
    type: 'feature' | 'fix' | 'improve' | 'refactor' | 'docs';
    content: string;
  }[];
  tags: string[];
}

// 变更类型配置
const changeTypeConfig = {
  feature: { label: '新功能', icon: Sparkles, color: '#10B981' },
  fix: { label: '修复', icon: Bug, color: '#EF4444' },
  improve: { label: '优化', icon: Zap, color: '#F59E0B' },
  refactor: { label: '重构', icon: Code2, color: '#8B5CF6' },
  docs: { label: '文档', icon: Layout, color: '#3B82F6' },
};

// 标签图标映射
const tagIconMap: Record<string, React.ReactNode> = {
  'UI': <Palette className="w-3 h-3" />,
  '性能': <Zap className="w-3 h-3" />,
  '安全': <Shield className="w-3 h-3" />,
  '后端': <Server className="w-3 h-3" />,
  '前端': <Layout className="w-3 h-3" />,
  '数据库': <Database className="w-3 h-3" />,
  '算法': <Cpu className="w-3 h-3" />,
};

// 开发日志数据
const devLogs: LogEntry[] = [
  {
    id: '1',
    version: 'v2.5.0',
    date: '2026-02-28',
    title: '算法可视化平台上线',
    description: '全新的算法可视化平台，支持排序、图论、动态规划等多种算法的交互式演示。',
    changes: [
      { type: 'feature', content: '新增算法可视化平台，支持20+种经典算法' },
      { type: 'feature', content: '支持代码与动画逐帧同步展示' },
      { type: 'feature', content: '新增内存使用可视化功能' },
      { type: 'improve', content: '优化页面加载性能，首屏加载时间减少40%' },
    ],
    tags: ['算法', '前端', 'UI'],
  },
  {
    id: '2',
    version: 'v2.4.0',
    date: '2026-02-20',
    title: 'API安全系统升级',
    description: '在腾讯云EdgeOne上实现HMAC-SHA256认证系统，增强API安全性。',
    changes: [
      { type: 'feature', content: '实现基于时间戳的HMAC-SHA256签名认证' },
      { type: 'feature', content: '新增Nonce防重放机制' },
      { type: 'improve', content: '优化边缘函数性能，认证延迟<20ms' },
      { type: 'fix', content: '修复KV绑定机制的异构性问题' },
    ],
    tags: ['安全', '后端', '性能'],
  },
  {
    id: '3',
    version: 'v2.3.0',
    date: '2026-02-10',
    title: '博客系统重构',
    description: '全面重构博客系统，新增标签云、归档功能和评论系统。',
    changes: [
      { type: 'feature', content: '新增博客标签云功能' },
      { type: 'feature', content: '新增文章归档时间线' },
      { type: 'feature', content: '集成评论系统，支持Markdown' },
      { type: 'improve', content: '优化文章渲染性能' },
    ],
    tags: ['前端', 'UI', '数据库'],
  },
  {
    id: '4',
    version: 'v2.2.0',
    date: '2026-01-25',
    title: '地球Online功能',
    description: '新增3D地球展示页面，集成Cesium globe效果。',
    changes: [
      { type: 'feature', content: '新增3D地球可视化页面' },
      { type: 'feature', content: '集成弹幕卫星效果' },
      { type: 'improve', content: '优化3D渲染性能' },
    ],
    tags: ['前端', 'UI', '性能'],
  },
  {
    id: '5',
    version: 'v2.1.0',
    date: '2026-01-15',
    title: '友链与朋友圈',
    description: '新增友链页面和朋友圈RSS聚合功能。',
    changes: [
      { type: 'feature', content: '新增友链展示页面' },
      { type: 'feature', content: '新增朋友圈RSS聚合' },
      { type: 'feature', content: '支持RSS自动刷新' },
    ],
    tags: ['前端', '后端'],
  },
  {
    id: '6',
    version: 'v2.0.0',
    date: '2026-01-01',
    title: '全新主页设计',
    description: '采用Minecraft风格重新设计主页，新增像素风UI组件。',
    changes: [
      { type: 'feature', content: '全新Minecraft风格主页' },
      { type: 'feature', content: '新增像素风按钮和卡片组件' },
      { type: 'feature', content: '新增主题切换动画' },
      { type: 'refactor', content: '重构全局样式系统' },
    ],
    tags: ['UI', '前端', '重构'],
  },
];

// 日志卡片组件
const LogCard = ({ log, index }: { log: LogEntry; index: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative"
    >
      {/* 时间线连接线 */}
      {index !== devLogs.length - 1 && (
        <div
          className="absolute left-6 top-16 w-0.5 h-[calc(100%+2rem)]"
          style={{ background: 'var(--border-subtle)' }}
        />
      )}

      <div className="flex gap-4">
        {/* 时间线节点 */}
        <motion.div
          className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'var(--bg-card)',
            border: '2px solid var(--accent-primary)',
            boxShadow: '0 0 20px var(--accent-glow)',
          }}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <GitCommit className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
        </motion.div>

        {/* 内容卡片 */}
        <div className="flex-1">
          <motion.div
            className="mc-panel p-5 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ y: -2 }}
            style={{
              borderColor: isExpanded ? 'var(--accent-primary)' : undefined,
            }}
          >
            {/* 头部信息 */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span
                className="px-2 py-1 rounded font-primary text-xs font-bold"
                style={{
                  background: 'var(--accent-primary)',
                  color: 'white',
                }}
              >
                {log.version}
              </span>
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Calendar className="w-3 h-3" />
                <span>{log.date}</span>
              </div>
              <div className="flex gap-1 ml-auto">
                {log.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                    style={{
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {tagIconMap[tag]}
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 标题和描述 */}
            <h3
              className="font-primary text-lg font-bold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {log.title}
            </h3>
            <p
              className="text-sm mb-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              {log.description}
            </p>

            {/* 展开/收起指示器 */}
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {log.changes.length} 项变更
              </span>
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </motion.div>
            </div>

            {/* 变更列表 */}
            <motion.div
              initial={false}
              animate={{
                height: isExpanded ? 'auto' : 0,
                opacity: isExpanded ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 space-y-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                {log.changes.map((change, idx) => {
                  const config = changeTypeConfig[change.type];
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -10 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          background: `${config.color}20`,
                          color: config.color,
                        }}
                      >
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {change.content}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

// 统计卡片组件
const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Code2; color: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    whileHover={{ y: -4 }}
    className="mc-panel p-4 text-center"
  >
    <div
      className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center"
      style={{ background: `${color}20` }}
    >
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div className="font-primary text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
      {value}
    </div>
    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
      {label}
    </div>
  </motion.div>
);

export default function DevLogPage() {
  const [totalCommits] = useState(156);
  const [totalFeatures] = useState(48);
  const [totalFixes] = useState(92);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <GridBackground />
      
      {/* 背景光效 */}
      <AmbientGlow position="top-left" color="var(--accent-primary)" size={400} opacity={0.1} />
      <AmbientGlow position="bottom-right" color="var(--accent-secondary)" size={300} opacity={0.08} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* 页面标题 */}
        <SectionTitle
          title="开发日志"
          subtitle="记录项目的每一次迭代与成长"
        />

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard label="版本发布" value={devLogs.length.toString()} icon={Tag} color="#8B5CF6" />
          <StatCard label="代码提交" value={totalCommits.toString()} icon={GitCommit} color="#10B981" />
          <StatCard label="新功能" value={totalFeatures.toString()} icon={Sparkles} color="#F59E0B" />
          <StatCard label="问题修复" value={totalFixes.toString()} icon={Bug} color="#EF4444" />
        </div>

        {/* 时间线 */}
        <div className="space-y-6">
          {devLogs.map((log, index) => (
            <LogCard key={log.id} log={log} index={index} />
          ))}
        </div>

        {/* 底部提示 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12 p-6 mc-panel"
          style={{ borderStyle: 'dashed' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            更多历史记录请查看
            <a
              href="https://github.com/your-repo/commits"
              target="_blank"
              rel="noopener noreferrer"
              className="mx-1"
              style={{ color: 'var(--accent-primary)' }}
            >
              GitHub提交历史
            </a>
          </p>
        </motion.div>
      </div>

      <Footer
        data={{
          copyright: '© 2026 SAKURAIN',
          slogan: '更专业，更可靠，更高效',
          links: [
            { label: '首页', href: '/' },
            { label: '博客', href: '/blog' },
            { label: '算法可视化', href: '/algo-viz' },
            { label: '关于', href: '/about' },
          ],
        }}
      />
    </div>
  );
}
