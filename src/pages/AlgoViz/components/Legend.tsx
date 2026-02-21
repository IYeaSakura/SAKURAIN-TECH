/**
 * 算法可视化平台 - 图例组件
 */

import React from 'react';
import type { AlgorithmCategory } from '../types';

interface LegendProps {
  category: AlgorithmCategory;
}

interface LegendItem {
  color: string;
  label: string;
  type?: 'color' | 'indicator' | 'line';
}

export const Legend: React.FC<LegendProps> = ({ category }) => {
  const getLegendItems = (): LegendItem[] => {
    switch (category) {
      case 'sorting':
        return [
          { color: '#3b82f6', label: '比较中', type: 'color' },
          { color: '#f59e0b', label: '交换中', type: 'color' },
          { color: '#8b5cf6', label: '基准值', type: 'color' },
          { color: '#10b981', label: '已排序', type: 'color' },
        ];
      
      case 'graph':
        return [
          { color: '#3b82f6', label: '队列中', type: 'color' },
          { color: '#f59e0b', label: '处理中 / DFS栈', type: 'color' },
          { color: '#10b981', label: '已完成', type: 'color' },
          { color: '#ef4444', label: '入度 > 0', type: 'indicator' },
          { color: '#f59e0b', label: '当前遍历边', type: 'line' },
        ];
      
      case 'tree':
        return [
          { color: '#3b82f6', label: '当前节点', type: 'color' },
          { color: '#f59e0b', label: '访问中', type: 'color' },
          { color: '#10b981', label: '已访问', type: 'color' },
          { color: '#8b5cf6', label: '目标节点', type: 'color' },
        ];
      
      case 'dp':
        return [
          { color: '#3b82f6', label: '当前计算单元', type: 'color' },
          { color: '#10b981', label: '已计算', type: 'color' },
          { color: '#f59e0b', label: '依赖单元', type: 'color' },
          { color: '#ef4444', label: '最优路径', type: 'indicator' },
        ];
      
      default:
        return [];
    }
  };

  const items = getLegendItems();

  if (items.length === 0) return null;

  return (
    <div className="legend-panel">
      <h4 className="legend-title">图例</h4>
      <div className="legend-items">
        {items.map((item, index) => (
          <div key={index} className="legend-item">
            {item.type === 'color' && (
              <span 
                className="legend-color" 
                style={{ backgroundColor: item.color }}
              />
            )}
            {item.type === 'indicator' && (
              <span 
                className="legend-indicator" 
                style={{ backgroundColor: item.color }}
              />
            )}
            {item.type === 'line' && (
              <span 
                className="legend-line" 
                style={{ backgroundColor: item.color }}
              />
            )}
            <span className="legend-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legend;
