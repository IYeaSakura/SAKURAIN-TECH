/**
 * 算法可视化平台 - 矩阵可视化组件
 * 用于 Floyd-Warshall 等需要展示矩阵的算法
 */

import React from 'react';
import { motion } from 'framer-motion';

interface MatrixVisualizerProps {
  dist: number[][];
  size: number;
  currentK?: number;
  currentI?: number;
  currentJ?: number;
  updated?: boolean;
  completed?: boolean;
  nodeLabels?: string[];
}

export const MatrixVisualizer: React.FC<MatrixVisualizerProps> = ({
  dist,
  size,
  currentK = -1,
  currentI = -1,
  currentJ = -1,
  updated = false,
  completed = false,
  nodeLabels
}) => {
  const labels = nodeLabels || Array.from({ length: size }, (_, i) => String(i));
  
  const formatValue = (val: number): string => {
    if (val === Infinity || val === Number.POSITIVE_INFINITY) return '∞';
    return String(val);
  };

  const getCellClass = (row: number, col: number): string => {
    const baseClass = 'matrix-cell';
    
    // 对角线
    if (row === col) {
      return `${baseClass} diagonal`;
    }
    
    // 当前中转点所在的行和列（高亮）
    if (currentK >= 0 && (row === currentK || col === currentK)) {
      return `${baseClass} k-highlight`;
    }
    
    // 当前正在更新的单元格
    if (currentI === row && currentJ === col) {
      if (updated) {
        return `${baseClass} updated`;
      }
      return `${baseClass} checking`;
    }
    
    // 完成的单元格
    if (completed) {
      return `${baseClass} completed`;
    }
    
    return baseClass;
  };

  return (
    <div className="matrix-visualizer">
      {/* 中转点指示器 */}
      <div className="matrix-header">
        {currentK >= 0 && !completed && (
          <motion.div 
            className="k-indicator"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            key={currentK}
          >
            <span className="k-label">当前中转点 k = {currentK}</span>
            <span className="k-desc">考虑经过节点 {currentK} 是否能缩短距离</span>
          </motion.div>
        )}
        {completed && (
          <motion.div 
            className="k-indicator completed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="k-label">算法完成</span>
            <span className="k-desc">所有节点对之间的最短距离已计算完毕</span>
          </motion.div>
        )}
      </div>

      {/* 矩阵表格 */}
      <div className="matrix-container">
        <table className="distance-matrix">
          <thead>
            <tr>
              <th className="corner-cell">dist</th>
              {labels.map((label, i) => (
                <th 
                  key={`col-${i}`} 
                  className={`col-header ${currentK === i ? 'k-col' : ''}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dist.slice(0, size).map((row, i) => (
              <tr key={`row-${i}`}>
                <th 
                  className={`row-header ${currentK === i ? 'k-row' : ''}`}
                >
                  {labels[i]}
                </th>
                {row.slice(0, size).map((val, j) => (
                  <motion.td
                    key={`cell-${i}-${j}`}
                    className={getCellClass(i, j)}
                    initial={false}
                    animate={{
                      scale: currentI === i && currentJ === j ? 1.05 : 1,
                      backgroundColor: updated && currentI === i && currentJ === j 
                        ? '#10b981' 
                        : currentI === i && currentJ === j 
                          ? '#f59e0b'
                          : undefined
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="cell-value">{formatValue(val)}</span>
                    {currentI === i && currentJ === j && (
                      <motion.div
                        className="cell-indicator"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      />
                    )}
                  </motion.td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 图例 */}
      <div className="matrix-legend">
        <div className="legend-item">
          <div className="legend-color diagonal" />
          <span>对角线 (自身到自身)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color k-highlight" />
          <span>中转点所在行列</span>
        </div>
        <div className="legend-item">
          <div className="legend-color checking" />
          <span>正在检查</span>
        </div>
        <div className="legend-item">
          <div className="legend-color updated" />
          <span>已更新距离</span>
        </div>
      </div>
    </div>
  );
};

export default MatrixVisualizer;
