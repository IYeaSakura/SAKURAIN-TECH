/**
 * 新主页 - 个人门户
 * 
 * 设计理念：
 * - 不对称布局，视觉张力
 * - ASCII艺术字效果
 * - 个人编程技术爱好堆叠面积图
 * - 使用子页相同Footer
 * 
 * @author SAKURAIN
 */
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  ArrowDown,
  BookOpen,
  Heart,
  Rss,
  Globe,
  Briefcase,
  User,
  Code2,
  Terminal,
  Cpu,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import {
  ScrollProgress,
  SecurityProtection,
  TwinklingStars,
  AmbientGlow,
} from '@/components/effects';
import { GradientText } from '@/components/effects/TextEffects';
import { Navigation } from '@/components/sections/Navigation';
import { Footer } from '@/components/sections/Footer';
import { useTheme, useNavigation } from '@/hooks';
import { usePrefersReducedMotion } from '@/lib/performance';
import type { SiteData } from '@/types';

const clipPathRounded = (r: number) => 
  `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

// 3D ASCII艺术字组件 - 带动态渐变效果
const AsciiLogo3D = () => {
  const asciiLines = [
    "  ███████╗ █████╗ ██╗  ██╗██╗   ██╗██████╗  █████╗ ██╗███╗   ██╗  ",
    "  ██╔════╝██╔══██╗██║ ██╔╝██║   ██║██╔══██╗██╔══██╗██║████╗  ██║  ",
    "  ███████╗███████║█████╔╝ ██║   ██║██████╔╝███████║██║██╔██╗ ██║  ",
    "  ╚════██║██╔══██║██╔═██╗ ██║   ██║██╔══██╗██╔══██║██║██║╚██╗██║  ",
    "  ███████║██║  ██║██║  ██╗╚██████╔╝██║  ██║██║  ██║██║██║ ╚████║  ",
    "  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝  ",
  ];

  return (
    <div className="font-mono whitespace-pre select-none">
      {asciiLines.map((line, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
          className="text-[6px] sm:text-[8px] lg:text-[10px] leading-[1.1]"
          style={{
            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary), var(--accent-tertiary), var(--accent-primary))',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 30px var(--accent-glow)',
            filter: 'drop-shadow(0 0 10px var(--accent-primary))',
          }}
        >
          {line}
        </motion.div>
      ))}
    </div>
  );
};

// 小型ASCII装饰
const AsciiDecoration = ({ className = '' }: { className?: string }) => (
  <div className={`font-mono text-xs opacity-30 select-none ${className}`} style={{ color: 'var(--accent-secondary)' }}>
    {'<>'}{'_'.repeat(20)}{'<>'}
  </div>
);

// 视差容器组件
const ParallaxContainer = ({ children, speed = 0.5 }: { children: React.ReactNode; speed?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -100 * speed]);
  const prefersReducedMotion = usePrefersReducedMotion();
  
  if (prefersReducedMotion) {
    return <div ref={ref}>{children}</div>;
  }
  
  return (
    <motion.div ref={ref} style={{ y }}>
      {children}
    </motion.div>
  );
};

// 技术演进数据类型
interface TechEvolutionData {
  title: string;
  subtitle: string;
  description: string;
  periods: string[];
  categories: {
    key: string;
    label: string;
    color: string;
    description?: string;
  }[];
  data: Record<string, number | string>[];
  milestones: {
    period: string;
    label: string;
    color: string;
  }[];
  tooltips: Record<string, Record<string, {
    main: string[];
    learning: string[];
  }>>;
}

// 生成平滑贝塞尔曲线路径
const smoothPath = (points: { x: number; y: number }[]) => {
  if (points.length < 2) return '';
  
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cp1x = prev.x + (curr.x - prev.x) * 0.3;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) * 0.7;
    const cp2y = curr.y;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }
  
  return path;
};

// 技术爱好堆叠面积图 - 从JSON配置加载
const TechStackChart = () => {
  const [techData, setTechData] = useState<TechEvolutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredData, setHoveredData] = useState<{
    period: string;
    periodIndex: number;
    category: string;
    categoryKey: string;
    value: number;
    x: number;
    y: number;
    color: string;
    tooltip: { main: string[]; learning: string[] } | null;
  } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetch(`/data/tech-evolution.json?v=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then((data: TechEvolutionData) => {
        setTechData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load tech evolution data:', err);
        setLoading(false);
      });
  }, []);

  const chartHeight = 340;
  const chartWidth = 800;
  const padding = { top: 30, right: 40, bottom: 60, left: 60 };
  const innerHeight = chartHeight - padding.top - padding.bottom;
  
  // 边距刻度：左右各0.5刻度，让第一个和最后一个数据点完整显示
  const edgeTicks = 0.5;
  
  // 计算绘图区域宽度（包含边距刻度）
  const getPlotWidth = (dataLength: number) => {
    const tickCount = dataLength + 1; // 实际刻度数量
    const totalTicks = tickCount - 1 + edgeTicks * 2; // 包含边距的总刻度数
    const plotWidth = chartWidth - padding.left - padding.right;
    return { tickCount, totalTicks, plotWidth };
  };

  // 生成堆叠面积路径 - 数据点显示在刻度区间之间，带左右边距，并延伸到边距区域
  const generateAreaPath = (data: Record<string, number | string>[], categories: { key: string }[], dataIndex: number) => {
    const categoryKeys = categories.map(c => c.key);
    const { totalTicks, plotWidth } = getPlotWidth(data.length);
    
    // 计算上边界点 - 包含延伸到左右边距的点
    const topPoints = [] as { x: number; y: number }[];
    
    // 左边界延伸点（使用第一个数据点的值）
    const firstData = data[0];
    let firstCumulative = 0;
    for (let j = 0; j <= dataIndex; j++) {
      firstCumulative += firstData[categoryKeys[j]] as number;
    }
    topPoints.push({
      x: padding.left, // 最左侧
      y: padding.top + innerHeight - (firstCumulative / 100) * innerHeight
    });
    
    // 中间数据点
    data.forEach((d, i) => {
      let cumulative = 0;
      for (let j = 0; j <= dataIndex; j++) {
        cumulative += d[categoryKeys[j]] as number;
      }
      const tickPos = (edgeTicks + i + 0.5) / totalTicks;
      const x = padding.left + tickPos * plotWidth;
      const y = padding.top + innerHeight - (cumulative / 100) * innerHeight;
      topPoints.push({ x, y });
    });
    
    // 右边界延伸点（使用最后一个数据点的值）
    const lastData = data[data.length - 1];
    let lastCumulative = 0;
    for (let j = 0; j <= dataIndex; j++) {
      lastCumulative += lastData[categoryKeys[j]] as number;
    }
    topPoints.push({
      x: chartWidth - padding.right, // 最右侧
      y: padding.top + innerHeight - (lastCumulative / 100) * innerHeight
    });

    // 计算下边界点（反向）
    const bottomPoints = [] as { x: number; y: number }[];
    
    // 右边界延伸点
    let lastBottomCumulative = 0;
    for (let j = 0; j < dataIndex; j++) {
      lastBottomCumulative += lastData[categoryKeys[j]] as number;
    }
    bottomPoints.push({
      x: chartWidth - padding.right,
      y: padding.top + innerHeight - (lastBottomCumulative / 100) * innerHeight
    });
    
    // 中间数据点（反向）
    for (let i = data.length - 1; i >= 0; i--) {
      const d = data[i];
      let cumulative = 0;
      for (let j = 0; j < dataIndex; j++) {
        cumulative += d[categoryKeys[j]] as number;
      }
      const tickPos = (edgeTicks + i + 0.5) / totalTicks;
      const x = padding.left + tickPos * plotWidth;
      const y = padding.top + innerHeight - (cumulative / 100) * innerHeight;
      bottomPoints.push({ x, y });
    }
    
    // 左边界延伸点
    let firstBottomCumulative = 0;
    for (let j = 0; j < dataIndex; j++) {
      firstBottomCumulative += firstData[categoryKeys[j]] as number;
    }
    bottomPoints.push({
      x: padding.left,
      y: padding.top + innerHeight - (firstBottomCumulative / 100) * innerHeight
    });

    // 构建平滑曲线路径
    const topPath = smoothPath(topPoints);
    const bottomPath = smoothPath(bottomPoints);
    
    if (!topPath || !bottomPath) return '';
    
    return `${topPath} L ${bottomPoints[0].x} ${bottomPoints[0].y} ${bottomPath.replace(/^M[^C]+/, '')} Z`;
  };

  // 处理鼠标移动 - 基于刻度区间计算（带左右边距）
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!techData) return;
    
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    const x = svgP.x;
    const y = svgP.y;
    
    // 检查是否在图表区域内
    if (x < padding.left || x > chartWidth - padding.right || 
        y < padding.top || y > chartHeight - padding.bottom) {
      setHoveredData(null);
      return;
    }
    
    // 计算最近的时间段索引 - 基于刻度区间（带边距）
    const { totalTicks, plotWidth } = getPlotWidth(techData.data.length);
    const relativeX = x - padding.left;
    const tickWidth = plotWidth / totalTicks;
    const tickIndex = relativeX / tickWidth - edgeTicks;
    
    // 找到对应的区间索引（数据点索引）
    let periodIndex = Math.floor(tickIndex);
    // 限制范围
    periodIndex = Math.max(0, Math.min(periodIndex, techData.data.length - 1));
    
    const periodData = techData.data[periodIndex];
    // 数据点显示在区间中点
    const periodX = padding.left + ((edgeTicks + periodIndex + 0.5) / totalTicks) * plotWidth;
    const periodKey = periodData.period as string;
    
    // 计算鼠标位置的Y值对应的分类
    const relativeY = chartHeight - padding.bottom - y;
    const percentageAtY = (relativeY / innerHeight) * 100;
    
    let cumulative = 0;
    let hoveredCategory = null;
    let categoryValue = 0;
    
    for (const cat of techData.categories) {
      const value = periodData[cat.key] as number;
      if (percentageAtY >= cumulative && percentageAtY < cumulative + value) {
        hoveredCategory = cat;
        categoryValue = value;
        break;
      }
      cumulative += value;
    }
    
    setMousePos({ x: e.clientX, y: e.clientY });
    
    if (hoveredCategory) {
      // 获取当前时间段中该类别的技术栈
      const periodTooltips = techData.tooltips?.[periodKey] || {};
      const categoryTooltip = periodTooltips[hoveredCategory.key] || { main: [], learning: [] };
      
      setHoveredData({
        period: periodKey,
        periodIndex: periodIndex,
        category: hoveredCategory.label,
        categoryKey: hoveredCategory.key,
        value: categoryValue,
        x: periodX,
        y: y,
        color: hoveredCategory.color,
        tooltip: categoryTooltip,
      });
    } else {
      setHoveredData(null);
    }
  };

  // 生成渐变ID
  const getGradientId = (key: string) => `gradient-${key}`;

  if (loading || !techData) {
    return (
      <div className="w-full h-[340px] flex items-center justify-center">
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          加载技术演进数据...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto relative">
      <div className="min-w-[700px]">
        <svg 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          className="w-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredData(null)}
        >
          <defs>
            {/* 为每个分类定义渐变 */}
            {techData.categories.map((cat) => (
              <linearGradient key={cat.key} id={getGradientId(cat.key)} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={cat.color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={cat.color} stopOpacity="0.5" />
              </linearGradient>
            ))}
            
            {/* 发光滤镜 */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 背景网格 */}
          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={padding.top + innerHeight - (tick / 100) * innerHeight}
                x2={chartWidth - padding.right}
                y2={padding.top + innerHeight - (tick / 100) * innerHeight}
                stroke="var(--border-subtle)"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.3"
              />
              <text
                x={padding.left - 12}
                y={padding.top + innerHeight - (tick / 100) * innerHeight + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--text-muted)"
                fontFamily="monospace"
              >
                {tick}%
              </text>
            </g>
          ))}

          {/* Y轴标题 */}
          <text
            x={20}
            y={padding.top - 10}
            fontSize="11"
            fill="var(--text-muted)"
            fontFamily="monospace"
          >
            技术占比
          </text>

          {/* 面积图 */}
          {techData.categories.map((cat, index) => (
            <motion.path
              key={cat.key}
              d={generateAreaPath(techData.data, techData.categories, index)}
              fill={`url(#${getGradientId(cat.key)})`}
              stroke={cat.color}
              strokeWidth="1.5"
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
              style={{ transformOrigin: 'bottom' }}
            />
          ))}

          {/* 悬浮时间段高亮区域 - 高亮两个刻度线之间的区间（带边距）*/}
          {hoveredData && (
            <g>
              {/* 计算时间段区域 - 基于刻度区间 */}
              {(() => {
                const { totalTicks, plotWidth } = getPlotWidth(techData.data.length);
                const tickWidth = plotWidth / totalTicks;
                // 数据点i位于刻度(edgeTicks+i)和刻度(edgeTicks+i+1)之间
                const regionStart = padding.left + (edgeTicks + hoveredData.periodIndex) * tickWidth;
                const regionEnd = padding.left + (edgeTicks + hoveredData.periodIndex + 1) * tickWidth;
                
                return (
                  <>
                    {/* 时间段背景高亮 */}
                    <rect
                      x={regionStart}
                      y={padding.top}
                      width={regionEnd - regionStart}
                      height={innerHeight}
                      fill="var(--accent-primary)"
                      opacity="0.08"
                    />
                    {/* 时间段左边界（虚线）- 对应左刻度线 */}
                    <line
                      x1={regionStart}
                      y1={padding.top}
                      x2={regionStart}
                      y2={chartHeight - padding.bottom}
                      stroke="var(--accent-primary)"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      opacity="0.5"
                    />
                    {/* 时间段右边界（虚线）- 对应右刻度线 */}
                    <line
                      x1={regionEnd}
                      y1={padding.top}
                      x2={regionEnd}
                      y2={chartHeight - padding.bottom}
                      stroke="var(--accent-primary)"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      opacity="0.5"
                    />
                  </>
                );
              })()}
            </g>
          )}

          {/* X轴 */}
          <line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={chartWidth - padding.right}
            y2={chartHeight - padding.bottom}
            stroke="var(--text-muted)"
            strokeWidth="1.5"
            opacity="0.5"
          />

          {/* X轴刻度线 - 实际刻度点（带边距）*/}
          {(() => {
            const { tickCount, totalTicks, plotWidth } = getPlotWidth(techData.data.length);
            return Array.from({ length: tickCount }, (_, i) => {
              // 实际刻度位置（加上左边距）
              const tickPos = (edgeTicks + i) / totalTicks;
              const x = padding.left + tickPos * plotWidth;
              // 刻度0=2016.5, 刻度1=2017.0, 刻度2=2017.5, 刻度3=2018.0...
              const isYearStart = i % 2 === 1; // 奇数索引是整数年份（2017.0, 2018.0...）
              const year = 2016 + Math.floor((i + 1) / 2);
              
              return (
                <g key={`tick-${i}`}>
                  {/* 刻度线 */}
                  <line
                    x1={x}
                    y1={chartHeight - padding.bottom}
                    x2={x}
                    y2={chartHeight - padding.bottom + (isYearStart ? 10 : 6)}
                    stroke="var(--text-muted)"
                    strokeWidth={isYearStart ? 2 : 1}
                    opacity={0.5}
                  />
                  
                  {/* 年份标签 - 只在整数年份刻度显示 */}
                  {isYearStart && (
                    <text
                      x={x}
                      y={chartHeight - padding.bottom + 22}
                      textAnchor="middle"
                      fontSize="12"
                      fill={hoveredData?.period?.startsWith(String(year)) ? 'var(--accent-primary)' : 'var(--text-muted)'}
                      fontFamily="monospace"
                      fontWeight={hoveredData?.period?.startsWith(String(year)) ? 'bold' : 'normal'}
                    >
                      {year}
                    </text>
                  )}
                </g>
              );
            });
          })()}
          
          {/* 半年标签 - 已移除显示 */}
        </svg>

        {/* 图例 */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {techData.categories.map((cat) => (
            <motion.div 
              key={cat.key} 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all hover:scale-105"
              style={{ 
                background: hoveredData?.categoryKey === cat.key 
                  ? `${cat.color}30` 
                  : 'var(--bg-secondary)',
                border: `1px solid ${hoveredData?.categoryKey === cat.key ? cat.color : 'var(--border-subtle)'}`,
              }}
              whileHover={{ y: -2 }}
              title={cat.description}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}80` }}
              />
              <span 
                className="text-sm font-medium" 
                style={{ 
                  color: hoveredData?.categoryKey === cat.key ? cat.color : 'var(--text-muted)'
                }}
              >
                {cat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 悬浮提示框 - 使用 Portal 渲染到 body，避免被父容器裁剪 */}
      {hoveredData && hoveredData.tooltip && createPortal(
        <motion.div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: Math.min(mousePos.x + 15, window.innerWidth - 250),
            top: mousePos.y - 10,
          }}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
        >
          <div 
            className="px-4 py-3 rounded-xl shadow-xl backdrop-blur-md"
            style={{
              background: 'var(--bg-card)',
              border: `2px solid ${hoveredData.color}40`,
              boxShadow: `0 8px 32px ${hoveredData.color}30`,
              minWidth: '200px',
              maxWidth: '280px',
            }}
          >
            {/* 时间段标题 */}
            <div 
              className="flex items-center gap-2 text-xs font-mono mb-3 pb-2 border-b"
              style={{ 
                color: 'var(--text-muted)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <span style={{ color: hoveredData.color }}>{'>'}</span>
              <span>{hoveredData.period}</span>
              <span className="ml-auto px-2 py-0.5 rounded text-xs" style={{ background: `${hoveredData.color}20`, color: hoveredData.color }}>
                {hoveredData.value}%
              </span>
            </div>
            
            {/* 类别名称 */}
            <div className="text-sm font-bold mb-2" style={{ color: hoveredData.color }}>
              {hoveredData.category}
            </div>
            
            {/* 该类别的技术栈 */}
            {hoveredData.tooltip.main.length > 0 && (
              <div className="mb-3">
                <div className="text-xs mb-1.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                  [主力] 技术栈
                </div>
                <div className="flex flex-wrap gap-1">
                  {hoveredData.tooltip.main.map((tech) => (
                    <span
                      key={tech}
                      className="text-xs px-2 py-1 rounded-md font-medium"
                      style={{
                        background: `${hoveredData.color}25`,
                        color: hoveredData.color,
                        border: `1px solid ${hoveredData.color}40`,
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* 该类别的在学技术 */}
            {hoveredData.tooltip.learning.length > 0 && (
              <div>
                <div className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  [探索] 学习中
                </div>
                <div className="flex flex-wrap gap-1">
                  {hoveredData.tooltip.learning.map((tech) => (
                    <span
                      key={tech}
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 小箭头 */}
          <div 
            className="absolute w-3 h-3 -left-1.5 top-4 rotate-45"
            style={{
              background: 'var(--bg-card)',
              borderLeft: `2px solid ${hoveredData.color}40`,
              borderBottom: `2px solid ${hoveredData.color}40`,
            }}
          />
        </motion.div>,
        document.body
      )}
    </div>
  );
};

// Hero 区域 - 非对称布局：左侧LOGO+ASCII艺术，右侧探索卡片
const HeroSection = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { navigateTo } = useNavigation();
  
  // 主要导航项
  const mainNavs = [
    { 
      title: '阅读博客', 
      desc: '技术文章与思考',
      href: '/blog', 
      icon: BookOpen,
      color: '#3b82f6',
      gradient: 'from-blue-500/20 to-cyan-500/20',
    },
    { 
      title: '关于我', 
      desc: '了解更多',
      href: '/about', 
      icon: User,
      color: '#10b981',
      gradient: 'from-emerald-500/20 to-teal-500/20',
    },
    { 
      title: '地球Online', 
      desc: '弹幕卫星留言',
      href: '/earth-online', 
      icon: Globe,
      highlight: true,
      color: '#8b5cf6',
      gradient: 'from-violet-500/20 to-purple-500/20',
    },
  ];
  
  // 次要导航
  const subNavs = [
    { title: '朋友圈', href: '/friends-circle', icon: MessageCircle },
    { title: '友链', href: '/friends', icon: Heart },
    { title: '工作室', href: '/studio', icon: Briefcase },
  ];
  
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* 背景视差层 */}
      {!prefersReducedMotion && (
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          style={{ y: y1, opacity }}
        >
          <div className="absolute top-20 right-[5%] w-[500px] h-[500px] rounded-full opacity-20"
            style={{ 
              background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
              filter: 'blur(60px)'
            }}
          />
        </motion.div>
      )}
      
      {/* 星星背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <TwinklingStars count={30} color="var(--accent-primary)" shootingStars={true} />
      </div>
      
      {/* 主内容区域 */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="w-full max-w-6xl mx-auto px-6 lg:px-12 pt-24 pb-12">
          
          {/* 上方：LOGO + ASCII艺术 - 居中 */}
          <motion.div 
            className="flex flex-col items-center mb-12"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* LOGO */}
            <motion.div 
              className="relative mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
                    filter: 'blur(30px)',
                  }}
                  animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.15, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.img
                  src="/image/logo.webp"
                  alt="SAKURAIN"
                  className="relative w-20 h-20 md:w-28 md:h-28 object-contain"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  style={{ filter: 'drop-shadow(0 0 20px var(--accent-glow))' }}
                />
              </div>
            </motion.div>
            
            {/* ASCII艺术 */}
            <AsciiLogo3D />
          </motion.div>
          
          {/* 中间区域：左右分栏 */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* 左侧：标题和简介 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* 标签 */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: 'var(--accent-primary)',
                }}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="font-mono">~/welcome</span>
              </div>
              
              {/* 标题 */}
              <h1 className="text-4xl md:text-5xl font-bold leading-[1.1] mb-6">
                <span className="block" style={{ color: 'var(--text-primary)' }}>
                  代码即艺术
                </span>
                <span className="block mt-2">
                  <GradientText animate={true}>创造即思考</GradientText>
                </span>
              </h1>
              
              {/* 分隔线 */}
              <div className="w-16 h-0.5 mb-6" 
                style={{ background: 'linear-gradient(90deg, var(--accent-primary), transparent)' }}
              />
              
              {/* 简介 */}
              <p className="text-base md:text-lg leading-relaxed mb-8 max-w-lg"
                style={{ color: 'var(--text-muted)' }}
              >
                从2016年初一开始编程之旅，历经Web开发、算法竞赛、AI研究到博弈算法。
                这里记录着我的技术演进与创作历程。
              </p>
              
              {/* 次要导航 */}
              <motion.div 
                className="flex flex-wrap gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {subNavs.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => navigateTo(item.href)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all hover:scale-105 cursor-pointer"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </button>
                ))}
              </motion.div>
            </motion.div>
            
            {/* 右侧：导航卡片 - 垂直堆叠 */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {mainNavs.map((nav, index) => (
                <motion.div
                  key={nav.title}
                  onClick={() => navigateTo(nav.href)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                  whileHover={{ x: 8, scale: 1.01 }}
                  className={`group relative p-5 rounded-xl cursor-pointer transition-all duration-300 ${
                    nav.highlight ? 'ring-1 ring-violet-500/50' : ''
                  }`}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${nav.highlight ? nav.color : 'var(--border-subtle)'}`,
                  }}
                >
                  {/* 悬停渐变背景 */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${nav.color}08, transparent)`,
                    }}
                  />
                  
                  <div className="relative flex items-center gap-4">
                    {/* 图标 */}
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: `${nav.color}15` }}
                    >
                      <nav.icon className="w-6 h-6" style={{ color: nav.color }} />
                    </div>
                    
                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                          {nav.title}
                        </h3>
                        {nav.highlight && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: `${nav.color}20`, color: nav.color }}
                          >
                            <Sparkles className="w-3 h-3" />
                            推荐
                          </span>
                        )}
                      </div>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {nav.desc}
                      </p>
                    </div>
                    
                    {/* 箭头 */}
                    <ArrowRight 
                      className="w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:translate-x-1"
                      style={{ color: nav.color, opacity: 0.6 }}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* 移动端导航卡片 - 垂直堆叠 */}
      <motion.div 
        className="lg:hidden relative z-10 px-6 pb-8 -mt-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <div className="space-y-3 max-w-md mx-auto">
          {mainNavs.map((nav, index) => (
            <motion.div
              key={nav.title}
              onClick={() => navigateTo(nav.href)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
              whileTap={{ scale: 0.98 }}
              className={`group p-4 rounded-xl cursor-pointer ${
                nav.highlight ? 'ring-1 ring-violet-500/50' : ''
              }`}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${nav.highlight ? nav.color : 'var(--border-subtle)'}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${nav.color}15` }}
                >
                  <nav.icon className="w-5 h-5" style={{ color: nav.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                      {nav.title}
                    </h3>
                    {nav.highlight && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{ background: `${nav.color}20`, color: nav.color }}
                      >
                        推荐
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {nav.desc}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4" style={{ color: nav.color, opacity: 0.5 }} />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* 滚动提示 */}
      <motion.div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.6 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 cursor-pointer font-mono text-xs"
          onClick={() => document.getElementById('journey')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span style={{ color: 'var(--text-muted)' }}>
            {'>'} scroll_down()
          </span>
          <ArrowDown className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
        </motion.div>
      </motion.div>
    </section>
  );
};

// 技术演进面积图区域
const JourneySection = () => {
  const [techData, setTechData] = useState<TechEvolutionData | null>(null);

  useEffect(() => {
    fetch(`/data/tech-evolution.json?v=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then((data: TechEvolutionData) => {
        setTechData(data);
      })
      .catch(console.error);
  }, []);

  return (
    <section id="journey" className="relative py-32 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* 区域标题 */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <AsciiDecoration className="mb-4 mx-auto" />
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <GradientText animate={true}>{techData?.title || '技术演进'}</GradientText>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            {techData?.description || '从初一开始的编程之旅，技术栈随时间不断演化。'}
          </p>
        </motion.div>
        
        {/* 时间线标记 */}
        <motion.div
          className="flex flex-wrap justify-center gap-6 mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          {(techData?.milestones || [
            { period: '2016下', label: 'Web入门', color: '#ec4899' },
            { period: '2019下', label: '算法竞赛', color: '#f59e0b' },
            { period: '2022上', label: 'AI转型', color: '#8b5cf6' },
            { period: '2024下', label: '博弈算法', color: '#3b82f6' },
          ]).map((item) => (
            <div key={item.period} className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: `${item.color}15`, border: `1px solid ${item.color}30` }}>
              <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
              <span className="font-mono text-sm font-bold" style={{ color: item.color }}>{'>'} {item.period}</span>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
            </div>
          ))}
        </motion.div>
        
        {/* 图表容器 */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div 
            className="p-8 rounded-2xl"
            style={{
              background: 'var(--bg-card)',
              border: '2px solid var(--border-subtle)',
              clipPath: clipPathRounded(16),
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Cpu className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              <h3 className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                tech_stack_evolution.py
              </h3>
            </div>
            
            <TechStackChart />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// 快速链接区域 - 简化为补充导航
const QuickLinksSection = () => {
  const { navigateTo } = useNavigation();
  const links = [
    {
      title: '朋友圈',
      desc: '日常与灵感',
      icon: Rss,
      href: '/friends-circle',
      color: '#10b981',
    },
    {
      title: '友链',
      desc: '朋友们的网站',
      icon: Heart,
      href: '/friends',
      color: '#f59e0b',
    },
    {
      title: '工作室',
      desc: '服务与合作',
      icon: Briefcase,
      href: '/studio',
      color: '#ec4899',
    },
    {
      title: '文档',
      desc: '技术文档',
      icon: Code2,
      href: '/docs',
      color: '#06b6d4',
    },
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <AmbientGlow color="var(--accent-secondary)" opacity={0.08} position="bottom-left" size={500} />
      </div>
      
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <ParallaxContainer speed={0.3}>
          <div className="text-center mb-12">
            <AsciiDecoration className="mb-4 mx-auto" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <GradientText animate={true}>更多探索</GradientText>
            </h2>
            <p className="text-lg font-mono" style={{ color: 'var(--text-muted)' }}>
              {'>'} ls ./other
            </p>
          </div>
        </ParallaxContainer>
        
        {/* 网格 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {links.map((card, index) => (
            <motion.div 
              key={card.title}
              onClick={() => navigateTo(card.href)}
              className="group block cursor-pointer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div 
                className="relative p-5 rounded-xl overflow-hidden transition-all duration-300 h-full"
                style={{
                  background: 'var(--bg-card)',
                  border: `2px solid var(--border-subtle)`,
                }}
              >
                {/* 背景渐变 */}
                <div 
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${card.color} 0%, transparent 100%)`,
                    opacity: 0.05,
                  }}
                />
                
                {/* 内容 */}
                <div className="relative z-10">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                    style={{ background: `${card.color}15` }}
                  >
                    <card.icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  
                  <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {card.title}
                  </h3>
                  
                  <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    {card.desc}
                  </p>
                </div>
                
                {/* 悬停边框 */}
                <div 
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    border: `2px solid ${card.color}`,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 主应用组件
function App() {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { theme, isTransitioning, toggleTheme } = useTheme();

  useEffect(() => {
    fetch(`/data/site-data.json?v=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then((data: SiteData) => {
        setSiteData(data);
        setDataLoaded(true);
      })
      .catch(error => {
        console.error('Failed to load site data:', error);
        setDataLoaded(true);
      });
  }, []);

  if (!dataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center font-mono">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--text-muted)' }}>{'>'} loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <SecurityProtection />
      <ScrollProgress />
      
      {siteData && (
        <Navigation
          data={siteData.navigation}
          theme={theme}
          onThemeToggle={toggleTheme}
          isThemeTransitioning={isTransitioning}
        />
      )}
      
      <main>
        <HeroSection />
        <JourneySection />
        <QuickLinksSection />
      </main>
      
      {/* 使用子页相同的Footer */}
      {siteData && <Footer data={siteData.footer} />}
    </div>
  );
}

export default App;
