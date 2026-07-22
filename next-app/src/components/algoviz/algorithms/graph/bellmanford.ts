/**
 * Bellman-Ford 最短路径算法
 * 时间复杂度: O(VE)
 * 空间复杂度: O(V)
 * 
 * 特点:
 * - 支持负权边
 * - 可检测负权环
 * - 进行 V-1 轮松弛操作
 */

import type { AlgorithmDefinition } from '../../types';

export const bellmanFordDefinition: AlgorithmDefinition = {
  id: 'bellmanford',
  name: 'Bellman-Ford 最短路径',
  category: 'graph',
  timeComplexity: 'O(VE)',
  spaceComplexity: 'O(V)',
  description: '单源最短路径算法，支持负权边，可检测负权环。通过V-1轮松弛操作逐步优化距离估计。',
  code: `function bellmanFord(graph, start) {
  const n = graph.nodes.length;
  const dist = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  
  // 初始化起点
  dist[start] = 0;
  
  // 进行 V-1 轮松弛
  for (let i = 0; i < n - 1; i++) {
    let updated = false;
    
    // 遍历所有边进行松弛
    for (const edge of graph.edges) {
      const { from, to, weight } = edge;
      
      if (dist[from] !== Infinity && 
          dist[from] + weight < dist[to]) {
        dist[to] = dist[from] + weight;
        parent[to] = from;
        updated = true;
      }
    }
    
    // 如果本轮没有更新，提前结束
    if (!updated) break;
  }
  
  // 检测负权环
  for (const edge of graph.edges) {
    const { from, to, weight } = edge;
    
    if (dist[from] !== Infinity && 
        dist[from] + weight < dist[to]) {
      return { hasNegativeCycle: true };
    }
  }
  
  return { dist, parent, hasNegativeCycle: false };
}`,
  supportedViews: ['graph'],
  parameters: [
    { name: 'nodes', type: 'number', default: 6, min: 3, max: 10 },
    { name: 'allowNegative', type: 'boolean', default: true }
  ]
};
