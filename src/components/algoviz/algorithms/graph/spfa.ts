/**
 * SPFA (Shortest Path Faster Algorithm)
 * Bellman-Ford 的队列优化版本
 * 
 * 时间复杂度: 平均 O(kE)，最坏 O(VE)，其中 k 通常很小
 * 空间复杂度: O(V)
 * 
 * 特点:
 * - 使用队列优化，避免不必要的松弛
 * - 支持负权边
 * - 使用 cnt 数组检测负权环
 */

import type { AlgorithmDefinition } from '../../types';

export const spfaDefinition: AlgorithmDefinition = {
  id: 'spfa',
  name: 'SPFA 最短路径',
  category: 'graph',
  timeComplexity: '平均 O(kE)',
  spaceComplexity: 'O(V)',
  description: 'Bellman-Ford的队列优化版本。使用队列只处理距离发生变化的节点，平均情况下效率更高。支持负权边和负权环检测。',
  code: `function spfa(graph, start) {
  const n = graph.nodes.length;
  const dist = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  const inQueue = new Array(n).fill(false);
  const cnt = new Array(n).fill(0);  // 记录入队次数，用于检测负权环
  
  // 初始化起点
  dist[start] = 0;
  
  const queue = [start];
  inQueue[start] = true;
  cnt[start] = 1;
  
  while (queue.length > 0) {
    const u = queue.shift();
    inQueue[u] = false;
    
    // 遍历 u 的所有邻居
    for (const edge of graph.adj[u]) {
      const { to, weight } = edge;
      
      // 松弛操作
      if (dist[u] + weight < dist[to]) {
        dist[to] = dist[u] + weight;
        parent[to] = u;
        
        // 如果 to 不在队列中，加入队列
        if (!inQueue[to]) {
          queue.push(to);
          inQueue[to] = true;
          cnt[to]++;
          
          // 如果入队次数超过 n-1，存在负权环
          if (cnt[to] >= n) {
            return { hasNegativeCycle: true };
          }
        }
      }
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
