/**
 * 广度优先搜索 (BFS)
 * 时间复杂度: O(V + E)
 * 空间复杂度: O(V)
 */

import type { AlgorithmDefinition } from '../../types';

export const bfsDefinition: AlgorithmDefinition = {
  id: 'bfs',
  name: '广度优先搜索 (BFS)',
  category: 'graph',
  timeComplexity: 'O(V + E)',
  spaceComplexity: 'O(V)',
  description: '按层级遍历图，适合求无权图的最短路径。使用队列实现。',
  code: `function bfs(graph, start) {
  const visited = new Set();
  const queue = [start];
  const result = [];
  
  visited.add(start);
  
  while (queue.length > 0) {
    const node = queue.shift();
    result.push(node);
    
    for (const neighbor of graph.get(node) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  
  return result;
}`,
  supportedViews: ['graph', 'tree']
};
