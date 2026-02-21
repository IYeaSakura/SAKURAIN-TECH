/**
 * 拓扑排序 (Kahn算法)
 * 时间复杂度: O(V + E)
 * 空间复杂度: O(V)
 */

import type { AlgorithmDefinition } from '../../types';

export const topoSortDefinition: AlgorithmDefinition = {
  id: 'topo',
  name: '拓扑排序 (Kahn)',
  category: 'graph',
  timeComplexity: 'O(V + E)',
  spaceComplexity: 'O(V)',
  description: '对有向无环图(DAG)进行线性排序，使得对于每条边(u,v)，u在v之前。常用于任务调度、依赖解析。',
  code: `function topologicalSort(graph) {
  const inDegree = new Map();
  const result = [];
  const queue = [];
  
  // 计算每个节点的入度
  for (const [u, neighbors] of graph) {
    if (!inDegree.has(u)) inDegree.set(u, 0);
    for (const v of neighbors) {
      inDegree.set(v, (inDegree.get(v) || 0) + 1);
    }
  }
  
  // 将所有入度为0的节点加入队列
  for (const [node, degree] of inDegree) {
    if (degree === 0) queue.push(node);
  }
  
  while (queue.length > 0) {
    const u = queue.shift();
    result.push(u);
    
    // 减少邻居的入度
    for (const v of graph.get(u) || []) {
      inDegree.set(v, inDegree.get(v) - 1);
      if (inDegree.get(v) === 0) {
        queue.push(v);
      }
    }
  }
  
  return result;
}`,
  supportedViews: ['graph'],
  parameters: [
    { name: 'nodes', type: 'number', default: 8, min: 3, max: 15 },
    { name: 'layers', type: 'number', default: 4, min: 2, max: 6 }
  ]
};
