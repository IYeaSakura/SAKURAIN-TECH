/**
 * 深度优先搜索 (DFS)
 * 时间复杂度: O(V + E)
 * 空间复杂度: O(V)
 */

import type { AlgorithmDefinition } from '../../types';

export const dfsDefinition: AlgorithmDefinition = {
  id: 'dfs',
  name: '深度优先搜索 (DFS)',
  category: 'graph',
  timeComplexity: 'O(V + E)',
  spaceComplexity: 'O(V)',
  description: '沿分支深入探索，适合连通性检测、拓扑排序。使用栈或递归实现。',
  code: `function dfs(graph, start) {
  const visited = new Set();
  const result = [];
  
  function explore(node) {
    visited.add(node);
    result.push(node);
    
    for (const neighbor of graph.get(node) || []) {
      if (!visited.has(neighbor)) {
        explore(neighbor);
      }
    }
  }
  
  explore(start);
  return result;
}`,
  supportedViews: ['graph', 'tree']
};
