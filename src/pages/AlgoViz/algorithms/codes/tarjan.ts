/**
 * Tarjan 强连通分量算法
 * 基于 DFS + Low-Link 值计算
 * 
 * 时间复杂度: O(V + E)
 * 空间复杂度: O(V)
 */

import type { AlgorithmDefinition } from '../../types';

export const tarjanDefinition: AlgorithmDefinition = {
  id: 'tarjan',
  name: '强连通分量 (Tarjan)',
  category: 'graph',
  timeComplexity: 'O(V + E)',
  spaceComplexity: 'O(V)',
  description: '使用单次DFS找出有向图中所有强连通分量(SCC)。通过维护dfn(发现时间)和low(能到达的最小dfn)数组，在low[u]==dfn[u]时找到一个新的SCC。',
  code: `function tarjanSCC(graph) {
  const n = graph.size;
  const dfn = new Array(n).fill(0);  // 发现时间
  const low = new Array(n).fill(0);  // 能到达的最小dfn
  const inStack = new Array(n).fill(false);
  const stack = [];
  const components = [];
  let timestamp = 0;
  
  function dfs(u) {
    // 初始化dfn和low
    dfn[u] = low[u] = ++timestamp;
    stack.push(u);
    inStack[u] = true;
    
    // 遍历邻居
    for (const v of graph.get(u) || []) {
      if (!dfn[v]) {
        // v未被访问，继续DFS
        dfs(v);
        // 回溯时更新low[u]
        low[u] = Math.min(low[u], low[v]);
      } else if (inStack[v]) {
        // v在栈中，说明是回边
        low[u] = Math.min(low[u], dfn[v]);
      }
    }
    
    // 找到SCC的根节点
    if (low[u] === dfn[u]) {
      const component = [];
      let v;
      do {
        v = stack.pop();
        inStack[v] = false;
        component.push(v);
      } while (v !== u);
      components.push(component);
    }
  }
  
  // 对每个未访问的节点执行DFS
  for (let i = 0; i < n; i++) {
    if (!dfn[i]) dfs(i);
  }
  
  return components;
}`,
  supportedViews: ['graph'],
  parameters: [
    { name: 'sccCount', type: 'number', default: 3, min: 2, max: 5 },
    { name: 'nodesPerSCC', type: 'number', default: 3, min: 2, max: 5 }
  ]
};
