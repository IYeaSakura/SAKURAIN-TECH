/**
 * Lowest Common Ancestor (LCA) - Binary Lifting
 * Preprocess: O(V log V), Query: O(log V)
 * 
 * Uses binary lifting to answer LCA queries efficiently.
 * Each node stores ancestors at powers of 2.
 */

import type { AlgorithmDefinition } from '../../types';

export const lcaDefinition: AlgorithmDefinition = {
  id: 'lca',
  name: '最近公共祖先 (LCA)',
  category: 'tree',
  timeComplexity: '预处理 O(V log V), 查询 O(log V)',
  spaceComplexity: 'O(V log V)',
  description: '使用倍增法快速回答树上两节点的最近公共祖先查询。预处理O(V log V)，单次查询O(log V)。适用于树上路径查询、公共祖先问题。',
  code: `class LCA {
  constructor(root, adj) {
    this.n = adj.length;
    this.adj = adj;
    this.LOG = Math.ceil(Math.log2(this.n)) + 1;
    
    // parent[i][j] = 2^j-th ancestor of node i
    this.parent = Array.from({ length: this.n }, () => 
      new Array(this.LOG).fill(-1)
    );
    this.depth = new Array(this.n).fill(0);
    
    // DFS to compute depth and immediate parent
    this.dfs(root, -1, 0);
    
    // Build sparse table
    this.buildSparseTable();
  }
  
  dfs(node, par, d) {
    this.parent[node][0] = par;
    this.depth[node] = d;
    
    for (const neighbor of this.adj[node]) {
      if (neighbor !== par) {
        this.dfs(neighbor, node, d + 1);
      }
    }
  }
  
  buildSparseTable() {
    for (let j = 1; j < this.LOG; j++) {
      for (let i = 0; i < this.n; i++) {
        if (this.parent[i][j - 1] !== -1) {
          this.parent[i][j] = this.parent[this.parent[i][j - 1]][j - 1];
        }
      }
    }
  }
  
  // Find LCA of u and v
  lca(u, v) {
    // Ensure u is deeper
    if (this.depth[u] < this.depth[v]) {
      [u, v] = [v, u];
    }
    
    // Lift u to same depth as v
    const diff = this.depth[u] - this.depth[v];
    for (let j = 0; j < this.LOG; j++) {
      if ((diff >> j) & 1) {
        u = this.parent[u][j];
      }
    }
    
    if (u === v) return u;
    
    // Lift both nodes together
    for (let j = this.LOG - 1; j >= 0; j--) {
      if (this.parent[u][j] !== -1 && this.parent[u][j] !== this.parent[v][j]) {
        u = this.parent[u][j];
        v = this.parent[v][j];
      }
    }
    
    return this.parent[u][0];
  }
  
  // Get distance between u and v
  distance(u, v) {
    const lca = this.lca(u, v);
    return this.depth[u] + this.depth[v] - 2 * this.depth[lca];
  }
  
  // Get k-th ancestor of node u
  kthAncestor(u, k) {
    if (k > this.depth[u]) return -1;
    
    for (let j = 0; j < this.LOG; j++) {
      if ((k >> j) & 1) {
        u = this.parent[u][j];
        if (u === -1) return -1;
      }
    }
    return u;
  }
}

// Usage:
// const adj = [[1, 2], [0, 3, 4], [0], [1], [1]];  // Tree adjacency list
// const lca = new LCA(0, adj);  // Root at node 0
// console.log(lca.lca(3, 4));   // Output: 1
// console.log(lca.distance(3, 4));  // Output: 2`,
  supportedViews: ['tree'],
  parameters: [
    { name: 'nodes', type: 'number', default: 10, min: 5, max: 15 }
  ]
};
