/**
 * 算法可视化平台 - 图可视化组件
 * 用于图算法（拓扑排序、SCC、最短路等）的可视化
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { GraphNode, GraphEdge, GraphState } from '../types';

interface GraphVisualizerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  state: GraphState;
  width?: number;
  height?: number;
  showWeights?: boolean;
  sccColors?: string[];
}

const DEFAULT_SCC_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316'  // orange
];

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  nodes,
  edges,
  state,
  width = 800,
  height = 500,
  showWeights = false,
  sccColors = DEFAULT_SCC_COLORS
}) => {
  const {
    highlightedEdges = new Set(),
    highlightedNodes: _highlightedNodes = new Set(),
    queue = [],
    stack = []
  } = state;

  // 计算边的路径 - 使用贝塞尔曲线避免穿过节点
  const edgePaths = useMemo(() => {
    return edges.map(edge => {
      const from = nodes.find(n => n.id === edge.from);
      const to = nodes.find(n => n.id === edge.to);
      if (!from || !to) return null;

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      
      // 留出节点半径的空间
      const offset = 28;
      const startX = from.x + (dx / len) * offset;
      const startY = from.y + (dy / len) * offset;
      const endX = to.x - (dx / len) * offset;
      const endY = to.y - (dy / len) * offset;
      
      // 计算控制点创建贝塞尔曲线，避免直线穿过其他节点
      // 根据边的方向和长度计算控制点
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      
      // 检查是否有节点在这条边附近
      const nodesOnPath = nodes.filter(n => {
        if (n.id === from.id || n.id === to.id) return false;
        // 计算点到线段的距离
        const dist = Math.abs((endY - startY) * n.x - (endX - startX) * n.y + endX * startY - endY * startX) / len;
        // 检查点是否在线段的投影范围内
        const dot = (n.x - startX) * (endX - startX) + (n.y - startY) * (endY - startY);
        return dist < 40 && dot > 0 && dot < len * len;
      });
      
      let path: string;
      if (nodesOnPath.length > 0 && len > 100) {
        // 如果有节点在路径上，使用弧形曲线绕开
        const curveOffset = 60; // 弧形偏移量
        // 根据边的方向决定偏移方向
        const perpX = -(dy / len) * curveOffset;
        const perpY = (dx / len) * curveOffset;
        const cpX = midX + perpX;
        const cpY = midY + perpY;
        path = `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`;
      } else {
        // 否则使用直线
        path = `M ${startX} ${startY} L ${endX} ${endY}`;
      }

      return {
        ...edge,
        startX,
        startY,
        endX,
        endY,
        path,
        key: `${edge.from}-${edge.to}`
      };
    }).filter(Boolean);
  }, [nodes, edges]);

  const getNodeColor = (node: GraphNode): { fill: string; stroke: string } => {
    // SCC组件颜色（优先）
    if (node.component !== undefined && node.component >= 0) {
      const color = sccColors[node.component % sccColors.length];
      return { fill: color, stroke: color };
    }
    
    // 拓扑排序状态颜色（优先级：processing > visited > inQueue > default）
    if (node.isProcessing) {
      return { fill: '#f59e0b', stroke: '#f59e0b' };
    }
    if (node.visited) {
      return { fill: '#10b981', stroke: '#10b981' };
    }
    if (node.isInQueue || node.inQueue) {
      return { fill: '#3b82f6', stroke: '#3b82f6' };
    }
    
    // 默认
    return { 
      fill: 'var(--bg-secondary)', 
      stroke: 'var(--border-color)' 
    };
  };

  return (
    <div className="graph-visualizer">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          {/* 箭头标记 */}
          <marker
            id="arrow-default"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="var(--text-secondary)"
              opacity="0.4"
            />
          </marker>
          
          <marker
            id="arrow-active"
            markerWidth="12"
            markerHeight="8"
            refX="10"
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 12 4, 0 8" fill="#f59e0b" />
          </marker>
          
          <marker
            id="arrow-visited"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
          </marker>

          {/* 滤镜 */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 边 */}
        {edgePaths.map((edge, idx) => {
          if (!edge) return null;
          
          const isHighlighted = highlightedEdges.has(edge.key);
          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);
          const isVisited = fromNode?.visited && toNode?.visited;
          
          return (
            <g key={edge.key}>
              <motion.path
                d={edge.path}
                stroke={isHighlighted ? '#f59e0b' : isVisited ? '#10b981' : 'var(--text-secondary)'}
                strokeWidth={isHighlighted ? 4 : 2}
                strokeOpacity={isHighlighted ? 1 : isVisited ? 0.6 : 0.3}
                markerEnd={isHighlighted ? 'url(#arrow-active)' : isVisited ? 'url(#arrow-visited)' : 'url(#arrow-default)'}
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.02 }}
              />
              
              {/* 权重标签 */}
              {showWeights && edge.weight !== undefined && (
                <text
                  x={(edge.startX + edge.endX) / 2}
                  y={(edge.startY + edge.endY) / 2 - 5}
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  fontSize={12}
                  fontWeight="600"
                  className="weight-label"
                >
                  {edge.weight}
                </text>
              )}
            </g>
          );
        })}

        {/* 节点 */}
        {nodes.map((node) => {
          const { fill, stroke } = getNodeColor(node);
          // highlightedNodes.has(node.id);
          const inQueue = queue.includes(node.id);
          const inStack = stack.includes(node.id);
          
          return (
            <g key={node.id}>
              {/* 外圈发光效果 */}
              {(node.isProcessing || node.inStack) && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={32}
                  fill="none"
                  stroke={fill}
                  strokeWidth={2}
                  opacity={0.3}
                  filter="url(#glow)"
                />
              )}
              
              {/* 节点圆形 */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={28}
                fill={fill}
                stroke={stroke}
                strokeWidth={3}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
              
              {/* 节点ID */}
              <text
                x={node.x}
                y={node.y - 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={node.component !== undefined && node.component >= 0 || node.isProcessing || node.visited || node.inQueue || node.inStack ? 'white' : 'var(--text-primary)'}
                fontWeight="bold"
                fontSize={14}
              >
                {node.id}
              </text>
              
              {/* 入度显示（仅在tempInDegree有值时显示） */}
              {node.tempInDegree !== undefined && (
                <text
                  x={node.x}
                  y={node.y + 12}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={node.component !== undefined && node.component >= 0 || node.isProcessing || node.visited || node.inQueue || node.inStack ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)'}
                  fontSize={10}
                >
                  in:{node.tempInDegree}
                </text>
              )}
              
              {/* 队列/栈标记 */}
              {(inQueue || inStack) && (
                <text
                  x={node.x}
                  y={node.y - 35}
                  textAnchor="middle"
                  fill={inQueue ? '#3b82f6' : '#f59e0b'}
                  fontSize={10}
                  fontWeight="bold"
                >
                  {inQueue ? 'Q' : 'S'}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default GraphVisualizer;
