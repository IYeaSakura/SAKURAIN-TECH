/**
 * 强连通分量 (Kosaraju算法)
 * 时间复杂度: O(V + E)
 * 空间复杂度: O(V)
 */

import type { AlgorithmDefinition } from '../../types';

export const sccDefinition: AlgorithmDefinition = {
  id: 'scc',
  name: '强连通分量 (Kosaraju)',
  category: 'graph',
  timeComplexity: 'O(V + E)',
  spaceComplexity: 'O(V)',
  description: '使用两遍DFS找出有向图中的所有强连通分量。第一遍确定完成顺序，第二遍在反向图上找SCC。',
  code: `function kosarajuSCC(graph) {
  const visited = new Set();
  const finishOrder = [];
  const components = [];
  
  // 第一遍DFS：确定完成顺序
  function dfs1(node) {
    visited.add(node);
    for (const neighbor of graph.get(node) || []) {
      if (!visited.has(neighbor)) {
        dfs1(neighbor);
      }
    }
    finishOrder.push(node);
  }
  
  // 第二遍DFS：在反向图上找SCC
  function dfs2(node, component) {
    visited.add(node);
    component.push(node);
    for (const neighbor of reverseGraph.get(node) || []) {
      if (!visited.has(neighbor)) {
        dfs2(neighbor, component);
      }
    }
  }
  
  // 执行第一遍DFS
  for (const node of graph.keys()) {
    if (!visited.has(node)) dfs1(node);
  }
  
  // 执行第二遍DFS
  visited.clear();
  for (let i = finishOrder.length - 1; i >= 0; i--) {
    const node = finishOrder[i];
    if (!visited.has(node)) {
      const component = [];
      dfs2(node, component);
      components.push(component);
    }
  }
  
  return components;
}`,
  supportedViews: ['graph'],
  parameters: [
    { name: 'sccCount', type: 'number', default: 3, min: 2, max: 5 },
    { name: 'nodesPerSCC', type: 'number', default: 3, min: 2, max: 5 }
  ]
};
