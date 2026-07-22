/**
 * 网格迷宫可视化组件
 * 用于BFS/DFS等寻路算法的网格地图展示
 *
 * 颜色说明：
 * - 黑色: 墙壁（障碍物）
 * - 白色: 未访问的路径
 * - 蓝色: 已访问的路径
 * - 黄色: 当前步骤正在访问的路径
 * - 红色: 正在回溯的路径（DFS专用）
 * - 绿色: 最终找到的路径
 * - 红色 S: 起点
 * - 紫色 G: 终点
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { GridMapData, GridCell } from '../utils/gridMapGenerator';

interface GridMazeVisualizerProps {
  gridData: GridMapData;
  visitedCells?: Set<string>; // 已访问的格子 key: "x,y"
  currentCell?: { x: number; y: number } | null; // 当前正在访问的格子
  backtrackingCell?: { x: number; y: number } | null; // 正在回溯的格子（DFS用红色标识）
  pathCells?: Set<string>; // 最终路径上的格子
  showAnimation?: boolean;
  isReviewMode?: boolean; // 是否为复盘模式
  reviewStep?: number; // 复盘步骤
}

export const GridMazeVisualizer: React.FC<GridMazeVisualizerProps> = ({
  gridData,
  visitedCells = new Set(),
  currentCell = null,
  backtrackingCell = null,
  pathCells = new Set(),
  showAnimation = true,
  isReviewMode = false,
  reviewStep = 0
}) => {
  const { rows, cols, cells } = gridData;

  // 计算格子大小以适应容器（支持更大的迷宫）
  const containerWidth = 800;
  const containerHeight = 550;
  const cellSize = Math.min(
    (containerWidth - 40) / cols,
    (containerHeight - 40) / rows,
    28 // 最大格子大小（减小以适应更大的迷宫）
  );

  const getCellColor = (cell: GridCell, x: number, y: number): string => {
    const key = `${x},${y}`;

    // 起点和终点
    if (cell.isStart) return '#ef4444'; // 红色起点
    if (cell.isGoal) return '#a855f7'; // 紫色终点

    // 墙壁
    if (cell.isObstacle) return '#1f2937'; // 深灰/黑色

    // 最终路径（最高优先级）
    if (pathCells.has(key)) return '#22c55e'; // 绿色

    // 正在回溯的格子（红色）
    if (backtrackingCell && backtrackingCell.x === x && backtrackingCell.y === y) {
      return '#dc2626'; // 深红色
    }

    // 当前正在访问的格子
    if (currentCell && currentCell.x === x && currentCell.y === y) {
      return '#eab308'; // 黄色
    }

    // 已访问的格子
    if (visitedCells.has(key)) return '#3b82f6'; // 蓝色

    // 未访问的路径
    return '#f3f4f6'; // 白色/浅灰
  };

  const getCellBorder = (cell: GridCell, x: number, y: number): string => {
    const key = `${x},${y}`;

    if (cell.isObstacle) return '1px solid #374151';
    if (pathCells.has(key)) return '2px solid #16a34a';
    if (backtrackingCell && backtrackingCell.x === x && backtrackingCell.y === y) {
      return '2px solid #991b1b';
    }
    if (currentCell && currentCell.x === x && currentCell.y === y) {
      return '2px solid #ca8a04';
    }
    if (visitedCells.has(key)) return '1px solid #2563eb';
    return '1px solid #d1d5db';
  };

  return (
    <div className="grid-maze-container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      padding: '20px',
      position: 'relative'
    }}>
      <div
        className="grid-maze"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          gap: '1px',
          backgroundColor: '#e5e7eb',
          padding: '4px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        {cells.map((row, y) =>
          row.map((cell, x) => {
            const key = `${x},${y}`;
            const isCurrent = currentCell && currentCell.x === x && currentCell.y === y;
            const isBacktracking = backtrackingCell && backtrackingCell.x === x && backtrackingCell.y === y;

            return (
              <motion.div
                key={key}
                className="grid-cell"
                initial={showAnimation && !isReviewMode ? { scale: 0.8, opacity: 0 } : false}
                animate={{
                  scale: isCurrent || isBacktracking ? 1.15 : 1,
                  opacity: 1,
                  backgroundColor: getCellColor(cell, x, y),
                  border: getCellBorder(cell, x, y)
                }}
                transition={{
                  duration: isReviewMode ? 0 : 0.2,
                  ease: 'easeOut'
                }}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${cellSize * 0.5}px`,
                  fontWeight: 'bold',
                  cursor: cell.isObstacle ? 'not-allowed' : 'default'
                }}
              >
                {/* 起点和终点标记 */}
                {cell.isStart && (
                  <span style={{ color: 'white', fontSize: `${cellSize * 0.6}px` }}>S</span>
                )}
                {cell.isGoal && (
                  <span style={{ color: 'white', fontSize: `${cellSize * 0.6}px` }}>G</span>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* 复盘模式指示器 */}
      {isReviewMode && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(59, 130, 246, 0.9)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          复盘模式 - 步骤 {reviewStep}
        </div>
      )}
    </div>
  );
};

export default GridMazeVisualizer;
