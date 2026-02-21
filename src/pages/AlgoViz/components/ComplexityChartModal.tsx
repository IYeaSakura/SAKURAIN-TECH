/**
 * 复杂度图表弹窗组件
 * 显示算法的时间复杂度和空间复杂度图表
 * 包含最好情况、平均情况、最坏情况
 */

import React, { useMemo, useState } from 'react';
import { X, BarChart3, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ComplexityChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  algorithmName: string;
  timeComplexity: string;
  spaceComplexity: string;
}

// 解析复杂度表达式
const parseComplexity = (complexity: string): { type: string; exponent?: number } => {
  const normalized = complexity.toLowerCase().replace(/\s/g, '');
  
  if (normalized.includes('logn')) return { type: 'log', exponent: 1 };
  if (normalized.includes('n^2') || normalized.includes('n²')) return { type: 'polynomial', exponent: 2 };
  if (normalized.includes('n^3') || normalized.includes('n³')) return { type: 'polynomial', exponent: 3 };
  if (normalized.includes('2^n') || normalized.includes('2ⁿ')) return { type: 'exponential', exponent: 1 };
  if (normalized.includes('nlogn')) return { type: 'nlogn', exponent: 1 };
  if (normalized.includes('n')) return { type: 'linear', exponent: 1 };
  
  return { type: 'constant' };
};

// 根据类型获取复杂度字符串表示（使用上标）
const getComplexityString = (type: string, exponent?: number): string => {
  switch (type) {
    case 'constant': return 'O(1)';
    case 'log': return 'O(log n)';
    case 'linear': return 'O(n)';
    case 'nlogn': return 'O(n log n)';
    case 'polynomial': 
      if (exponent === 2) return 'O(n²)';
      if (exponent === 3) return 'O(n³)';
      return `O(n${String.fromCharCode(0x2070 + (exponent || 2))})`;
    case 'exponential': return 'O(2ⁿ)';
    default: return 'O(?)';
  }
};

// 计算归一化值 (0-100)
const calculateNormalizedValue = (n: number, complexityType: string, exponent?: number): number => {
  const maxN = 10000;
  
  switch (complexityType) {
    case 'constant':
      return 5;
    case 'log':
      return (Math.log2(n + 1) / Math.log2(maxN + 1)) * 80 + 5;
    case 'linear':
      return (n / maxN) * 90 + 5;
    case 'nlogn':
      const maxNLogN = maxN * Math.log2(maxN);
      return Math.min(((n * Math.log2(Math.max(n, 2))) / maxNLogN) * 90 + 5, 100);
    case 'polynomial':
      const exp = exponent || 2;
      const normalized = Math.pow(n / maxN, exp);
      return Math.min(normalized * 90 + 5, 100);
    case 'exponential':
      if (n < 100) return (n / 100) * 30 + 5;
      return Math.min(30 + Math.log2(n) * 5, 95);
    default:
      return (n / maxN) * 90 + 5;
  }
};

// 获取最好和最坏情况的复杂度
const getComplexityScenarios = (complexityType: string, exponent?: number) => {
  switch (complexityType) {
    case 'constant':
      return { 
        best: { type: 'constant', exp: undefined, label: 'O(1)' },
        worst: { type: 'constant', exp: undefined, label: 'O(1)' }
      };
    case 'log':
      return { 
        best: { type: 'constant', exp: undefined, label: 'O(1)' },
        worst: { type: 'log', exp: 1, label: 'O(log n)' }
      };
    case 'linear':
      return { 
        best: { type: 'linear', exp: 1, label: 'O(n)' },
        worst: { type: 'linear', exp: 1, label: 'O(n)' }
      };
    case 'nlogn':
      return { 
        best: { type: 'linear', exp: 1, label: 'O(n)' },
        worst: { type: 'nlogn', exp: 1, label: 'O(n log n)' }
      };
    case 'polynomial':
      const exp = exponent || 2;
      return { 
        best: { type: 'linear', exp: 1, label: 'O(n)' },
        worst: { type: 'polynomial', exp, label: `O(n^${exp})` }
      };
    case 'exponential':
      return { 
        best: { type: 'polynomial', exp: 2, label: 'O(n²)' },
        worst: { type: 'exponential', exp: 1, label: 'O(2ⁿ)' }
      };
    default:
      return { 
        best: { type: complexityType, exp: exponent, label: getComplexityString(complexityType, exponent) },
        worst: { type: complexityType, exp: exponent, label: getComplexityString(complexityType, exponent) }
      };
  }
};

// 生成图表数据点
const generateChartData = (
  complexityType: string,
  exponent?: number,
  maxN: number = 10000,
  points: number = 100
) => {
  const scenarios = getComplexityScenarios(complexityType, exponent);
  
  const generatePoints = (type: string, exp?: number) => {
    const data: { n: number; value: number }[] = [];
    for (let i = 0; i <= points; i++) {
      const ratio = Math.pow(i / points, 0.7);
      const n = Math.round(ratio * maxN);
      const value = calculateNormalizedValue(Math.max(n, 1), type, exp);
      data.push({ n, value });
    }
    return data;
  };
  
  return {
    best: generatePoints(scenarios.best.type, scenarios.best.exp),
    average: generatePoints(complexityType, exponent),
    worst: generatePoints(scenarios.worst.type, scenarios.worst.exp),
    bestLabel: scenarios.best.label,
    worstLabel: scenarios.worst.label,
    averageLabel: getComplexityString(complexityType, exponent)
  };
};

// 复杂度信息提示组件
const ComplexityTooltip: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="complexity-tooltip-wrapper">
      <Info 
        size={16} 
        className="complexity-info-icon"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      />
      {showTooltip && (
        <div className="complexity-tooltip complexity-tooltip-detailed">
          <div className="tooltip-section">
            <div className="tooltip-title">什么是最好情况？</div>
            <div className="tooltip-desc">输入数据已经处于最优状态，算法执行最少操作即可完成。</div>
          </div>
          <div className="tooltip-section">
            <div className="tooltip-title">什么是最坏情况？</div>
            <div className="tooltip-desc">输入数据处于最不利状态，算法需要执行最多操作才能完成。</div>
          </div>
        </div>
      )}
    </div>
  );
};

// SVG 图表组件
const ComplexityChart: React.FC<{
  data: { 
    best: { n: number; value: number }[]; 
    average: { n: number; value: number }[]; 
    worst: { n: number; value: number }[];
    bestLabel: string;
    worstLabel: string;
    averageLabel: string;
  };
  title: string;
  yLabel: string;
}> = ({ data, title, yLabel }) => {
  const width = 500;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 45, left: 55 };
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const maxN = 10000;
  const maxValue = 100;
  
  const scaleX = (n: number) => (n / maxN) * chartWidth + padding.left;
  const scaleY = (value: number) => height - padding.bottom - (value / maxValue) * chartHeight;
  
  const generatePath = (points: { n: number; value: number }[]) => {
    return points.map((d, i) => {
      const x = scaleX(d.n);
      const y = scaleY(d.value);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };
  
  const xTicks = [0, 2500, 5000, 7500, 10000];

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h4 className="chart-title">{title}</h4>
        <ComplexityTooltip />
      </div>
      <div className="chart-labels">
        <span className="label-best">最好: {data.bestLabel}</span>
        <span className="label-average">平均: {data.averageLabel}</span>
        <span className="label-worst">最坏: {data.worstLabel}</span>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="complexity-chart-svg">
        <rect x={padding.left} y={padding.top} width={chartWidth} height={chartHeight} fill="rgba(0,0,0,0.02)" rx={4} />
        
        {/* 网格线 */}
        {[0, 25, 50, 75, 100].map((v, i) => (
          <line key={`h-${i}`} x1={padding.left} y1={scaleY(v)} x2={width - padding.right} y2={scaleY(v)} stroke="#e5e7eb" strokeWidth={1} strokeDasharray={v === 0 ? undefined : "4,4"} />
        ))}
        {xTicks.map((n, i) => (
          <line key={`v-${i}`} x1={scaleX(n)} y1={padding.top} x2={scaleX(n)} y2={height - padding.bottom} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4,4" />
        ))}
        
        {/* 最好情况 - 绿色 */}
        <path d={generatePath(data.best)} fill="none" stroke="#10b981" strokeWidth={2} strokeDasharray="5,5" />
        
        {/* 平均情况 - 蓝色 */}
        <path d={generatePath(data.average)} fill="none" stroke="#3b82f6" strokeWidth={2.5} />
        
        {/* 最坏情况 - 红色 */}
        <path d={generatePath(data.worst)} fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="5,5" />
        
        {/* 数据点 */}
        {data.average.filter((_, i) => i % 20 === 0 || i === data.average.length - 1).map((d, i) => (
          <circle key={i} cx={scaleX(d.n)} cy={scaleY(d.value)} r={3} fill="white" stroke="#3b82f6" strokeWidth={2} />
        ))}
        
        {/* 坐标轴 */}
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#374151" strokeWidth={2} />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#374151" strokeWidth={2} />
        
        {/* X轴标签 */}
        <text x={width / 2} y={height - 8} textAnchor="middle" fill="#6b7280" fontSize={11} fontWeight={500}>数据规模 N</text>
        {xTicks.map((n, i) => (
          <text key={`lx-${i}`} x={scaleX(n)} y={height - padding.bottom + 18} textAnchor="middle" fill="#6b7280" fontSize={10}>{n.toLocaleString()}</text>
        ))}
        
        {/* Y轴标签 */}
        <text x={12} y={height / 2} textAnchor="middle" fill="#6b7280" fontSize={11} fontWeight={500} transform={`rotate(-90, 12, ${height / 2})`}>{yLabel} (归一化)</text>
        {[0, 25, 50, 75, 100].map((v, i) => (
          <text key={`ly-${i}`} x={padding.left - 8} y={scaleY(v) + 4} textAnchor="end" fill="#6b7280" fontSize={10}>{v}%</text>
        ))}
      </svg>
    </div>
  );
};

export const ComplexityChartModal: React.FC<ComplexityChartModalProps> = ({
  isOpen,
  onClose,
  algorithmName,
  timeComplexity,
  spaceComplexity
}) => {
  const timeComplexityParsed = useMemo(() => parseComplexity(timeComplexity), [timeComplexity]);
  const spaceComplexityParsed = useMemo(() => parseComplexity(spaceComplexity), [spaceComplexity]);
  
  const timeData = useMemo(() => generateChartData(timeComplexityParsed.type, timeComplexityParsed.exponent), [timeComplexityParsed]);
  const spaceData = useMemo(() => generateChartData(spaceComplexityParsed.type, spaceComplexityParsed.exponent), [spaceComplexityParsed]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="modal-content chart-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
            {/* 头部 */}
            <div className="modal-header">
              <div className="modal-title"><BarChart3 size={20} /><span>{algorithmName} - 复杂度分析</span></div>
              <button className="modal-close" onClick={onClose}><X size={20} /></button>
            </div>

            {/* 复杂度信息 */}
            <div className="complexity-info">
              <div className="complexity-badge-large time">
                <span className="badge-label">时间复杂度</span>
                <span className="badge-value">{timeComplexity}</span>
              </div>
              <div className="complexity-badge-large space">
                <span className="badge-label">空间复杂度</span>
                <span className="badge-value">{spaceComplexity}</span>
              </div>
            </div>

            {/* 图表 */}
            <div className="charts-container">
              <ComplexityChart 
                data={timeData} 
                title="时间复杂度曲线" 
                yLabel="时间" 
              />
              <ComplexityChart 
                data={spaceData} 
                title="空间复杂度曲线" 
                yLabel="空间" 
              />
            </div>

            {/* 图例 */}
            <div className="chart-legend">
              <div className="legend-item"><span className="legend-line" style={{ background: '#10b981', borderStyle: 'dashed' }}></span><span>最好情况</span></div>
              <div className="legend-item"><span className="legend-line" style={{ background: '#3b82f6' }}></span><span>平均情况</span></div>
              <div className="legend-item"><span className="legend-line" style={{ background: '#ef4444', borderStyle: 'dashed' }}></span><span>最坏情况</span></div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ComplexityChartModal;
