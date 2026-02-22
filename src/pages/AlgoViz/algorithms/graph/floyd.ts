/**
 * Floyd-Warshall (弗洛伊德) 多源最短路径算法
 * 时间复杂度: O(V³)
 * 空间复杂度: O(V²)
 * 
 * 动态规划思想：
 * - dp[k][i][j] 表示只使用前k个节点作为中转点时，i到j的最短距离
 * - 可以优化为二维：dist[i][j] 表示当前迭代中i到j的最短距离
 * - 状态转移：dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])
 */

import type { AlgorithmDefinition } from '../../types';

export const floydDefinition: AlgorithmDefinition = {
  id: 'floyd',
  name: 'Floyd-Warshall (弗洛伊德)',
  category: 'graph',
  timeComplexity: 'O(V³)',
  spaceComplexity: 'O(V²)',
  description: '计算图中所有节点对之间的最短路径。使用动态规划，通过逐步考虑每个节点作为中转点来更新最短距离矩阵。',
  code: `function floydWarshall(graph) {
  const n = graph.length;
  
  // 初始化距离矩阵
  const dist = Array.from({ length: n }, (_, i) => 
    Array.from({ length: n }, (_, j) => 
      i === j ? 0 : (graph[i][j] ?? Infinity)
    )
  );
  
  // 中转点k的迭代
  for (let k = 0; k < n; k++) {
    // 遍历所有节点对(i, j)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        // 状态转移：考虑经过k是否能缩短i到j的距离
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
  }
  
  return dist;
}`,
  supportedViews: ['matrix', 'graph'],
  parameters: [
    { name: 'nodes', type: 'number', default: 6, min: 3, max: 8 },
    { name: 'density', type: 'number', default: 0.5, min: 0.3, max: 0.8 }
  ]
};
