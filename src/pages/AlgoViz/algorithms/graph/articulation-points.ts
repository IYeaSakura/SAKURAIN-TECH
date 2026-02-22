/**
 * Articulation Points and Bridges (割点与割边)
 * Based on DFS + Low-Link values (Tarjan's algorithm)
 * 
 * Time Complexity: O(V + E)
 * Space Complexity: O(V)
 * 
 * An articulation point (cut vertex) is a node whose removal disconnects the graph.
 * A bridge (cut edge) is an edge whose removal disconnects the graph.
 */

import type { AlgorithmDefinition } from '../../types';

export const articulationPointsDefinition: AlgorithmDefinition = {
  id: 'articulation-points',
  name: '割点与割边 (Articulation Points & Bridges)',
  category: 'graph',
  timeComplexity: 'O(V + E)',
  spaceComplexity: 'O(V)',
  description: '使用DFS和Low-Link值找出图中的割点（删除后图不连通的节点）和割边（删除后图不连通的边）。常用于网络脆弱性分析、关键节点识别。',
  code: `function findArticulationPointsAndBridges(graph) {
  const n = graph.nodeCount;
  const dfn = new Array(n).fill(0);   // Discovery time
  const low = new Array(n).fill(0);   // Lowest reachable discovery time
  const visited = new Array(n).fill(false);
  const parent = new Array(n).fill(-1);
  
  const articulationPoints = new Set();
  const bridges = [];
  let timer = 0;
  
  function dfs(u) {
    visited[u] = true;
    dfn[u] = low[u] = ++timer;
    let children = 0;
    
    for (const { to: v, weight } of graph.getNeighbors(u)) {
      if (!visited[v]) {
        children++;
        parent[v] = u;
        dfs(v);
        
        // Update low value
        low[u] = Math.min(low[u], low[v]);
        
        // Check if u is an articulation point
        // Case 1: u is root and has multiple children
        if (parent[u] === -1 && children > 1) {
          articulationPoints.add(u);
        }
        // Case 2: u is not root and low[v] >= dfn[u]
        if (parent[u] !== -1 && low[v] >= dfn[u]) {
          articulationPoints.add(u);
        }
        
        // Check if (u, v) is a bridge
        if (low[v] > dfn[u]) {
          bridges.push({ from: u, to: v, weight });
        }
      } else if (v !== parent[u]) {
        // Back edge: update low value
        low[u] = Math.min(low[u], dfn[v]);
      }
    }
  }
  
  // Run DFS from each unvisited node (for disconnected graphs)
  for (let i = 0; i < n; i++) {
    if (!visited[i]) {
      dfs(i);
    }
  }
  
  return {
    articulationPoints: Array.from(articulationPoints),
    bridges
  };
}

// Example usage:
// const result = findArticulationPointsAndBridges(graph);
// console.log('Articulation Points:', result.articulationPoints);
// console.log('Bridges:', result.bridges);`,
  supportedViews: ['graph'],
  parameters: [
    { name: 'nodes', type: 'number', default: 8, min: 4, max: 12 },
    { name: 'edgeDensity', type: 'number', default: 0.4, min: 0.2, max: 0.7 }
  ]
};
