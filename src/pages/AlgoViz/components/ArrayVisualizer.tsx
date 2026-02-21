/**
 * 算法可视化平台 - 数组可视化组件
 * 用于排序算法等需要数组展示的算法
 */

import React, { useMemo } from 'react';
import type { SortingData } from '../types';

interface ArrayVisualizerProps {
  data: SortingData;
  maxValue?: number;
  showValues?: boolean;
  barWidth?: number;
  barGap?: number;
}

// 颜色映射 - 使用具体颜色值避免SVG解析问题
const COLORS = {
  default: '#3b82f6',  // 蓝色
  comparing: '#ef4444', // 红色
  swapping: '#f59e0b',  // 橙色
  sorted: '#10b981',    // 绿色
  pivot: '#8b5cf6'      // 紫色
};

export const ArrayVisualizer: React.FC<ArrayVisualizerProps> = ({
  data,
  maxValue,
  showValues = true,
  barWidth = 40,
  barGap = 8
}) => {
  const { array, comparing, swapping, sorted, pivot } = data;
  
  const computedMaxValue = useMemo(() => {
    return maxValue || Math.max(...array, 100);
  }, [array, maxValue]);

  const totalWidth = array.length * (barWidth + barGap) - barGap;

  // 获取柱子颜色 - 直接返回颜色值，无过渡
  const getBarColor = (index: number): string => {
    if (sorted.includes(index)) return COLORS.sorted;
    if (pivot === index) return COLORS.pivot;
    if (swapping.includes(index)) return COLORS.swapping;
    if (comparing.includes(index)) return COLORS.comparing;
    return COLORS.default;
  };

  return (
    <div className="array-visualizer">
      <svg 
        width={totalWidth + 40} 
        height={400} 
        viewBox={`0 0 ${totalWidth + 40} 400`}
      >
        <g transform="translate(20, 20)">
          {array.map((value, index) => {
            const height = (value / computedMaxValue) * 300;
            const x = index * (barWidth + barGap);
            const y = 350 - height;
            const fillColor = getBarColor(index);
            const isComparing = comparing.includes(index);
            
            return (
              <g key={index}>
                {/* 柱子 - 使用普通rect，无动画过渡，避免闪烁 */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height}
                  fill={fillColor}
                  rx={4}
                  style={{ 
                    transition: 'fill 0.1s ease-out', // 仅使用CSS过渡，时间很短
                    transformOrigin: 'bottom'
                  }}
                />
                
                {/* 数值标签 */}
                {showValues && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 10}
                    textAnchor="middle"
                    fill="#374151"
                    fontSize={14}
                    fontWeight="600"
                  >
                    {value}
                  </text>
                )}
                
                {/* 索引标签 */}
                <text
                  x={x + barWidth / 2}
                  y={370}
                  textAnchor="middle"
                  fill="#6b7280"
                  fontSize={12}
                >
                  {index}
                </text>
                
                {/* 状态指示器 - 比较时显示红点 */}
                {isComparing && (
                  <circle
                    cx={x + barWidth / 2}
                    cy={y - 25}
                    r={4}
                    fill={COLORS.comparing}
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default ArrayVisualizer;
