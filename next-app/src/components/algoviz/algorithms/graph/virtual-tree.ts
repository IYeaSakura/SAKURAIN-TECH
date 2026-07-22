/**
 * Virtual Tree (虚树)
 * Build: O(K log K), where K is number of key nodes
 * 
 * Compresses tree to only include key nodes and their LCAs.
 * Used for multiple queries on tree DP.
 */

import type { AlgorithmDefinition } from '../../types';

export const virtualTreeDefinition: AlgorithmDefinition = {
  id: 'virtual-tree',
  name: '虚树 (Virtual Tree)',
  category: 'tree',
  timeComplexity: 'O(K log K)',
  spaceComplexity: 'O(K)',
  description: '将树压缩为只包含关键节点及其LCA的虚树。用于多组询问的树形DP优化，将O(V)的DP优化为O(K)。',
  code: `class VirtualTree {
  constructor(adj) {
    this.n = adj.length;
    this.adj = adj;
    
    // Precompute LCA
    this.LOG = Math.ceil(Math.log2(this.n)) + 1;
    this.parent = Array.from({ length: this.n }, () => new Array(this.LOG).fill(-1));
    this.depth = new Array(this.n).fill(0);
    this.dfs(0, -1, 0);
    this.buildSparseTable();
    
    // DFS order for sorting
    this.dfsOrder = new Array(this.n).fill(0);
    this.dfsTime = 0;
    this.computeDfsOrder(0, -1);
  }
  
  dfs(node, par, d) {
    this.parent[node][0] = par;
    this.depth[node] = d;
    for (const child of this.adj[node]) {
      if (child !== par) {
        this.dfs(child, node, d + 1);
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
  
  computeDfsOrder(node, par) {
    this.dfsOrder[node] = this.dfsTime++;
    for (const child of this.adj[node]) {
      if (child !== par) {
        this.computeDfsOrder(child, node);
      }
    }
  }
  
  lca(u, v) {
    if (this.depth[u] < this.depth[v]) [u, v] = [v, u];
    const diff = this.depth[u] - this.depth[v];
    for (let j = 0; j < this.LOG; j++) {
      if ((diff >> j) & 1) u = this.parent[u][j];
    }
    if (u === v) return u;
    for (let j = this.LOG - 1; j >= 0; j--) {
      if (this.parent[u][j] !== -1 && this.parent[u][j] !== this.parent[v][j]) {
        u = this.parent[u][j];
        v = this.parent[v][j];
      }
    }
    return this.parent[u][0];
  }
  
  // Build virtual tree from key nodes
  buildVirtualTree(keyNodes) {
    if (keyNodes.length === 0) return { nodes: [], edges: [], adj: new Map() };
    
    // Sort by DFS order
    keyNodes.sort((a, b) => this.dfsOrder[a] - this.dfsOrder[b]);
    
    // Add LCAs
    const allNodes = new Set(keyNodes);
    const stack = [];
    
    for (const node of keyNodes) {
      if (stack.length === 0) {
        stack.push(node);
        continue;
      }
      
      let l = this.lca(node, stack[stack.length - 1]);
      
      while (stack.length > 1 && this.depth[l] < this.depth[stack[stack.length - 2]]) {
        allNodes.add(stack[stack.length - 1]);
        stack.pop();
      }
      
      if (stack.length > 0 && this.depth[l] < this.depth[stack[stack.length - 1]]) {
        allNodes.add(stack[stack.length - 1]);
        stack.pop();
      }
      
      if (stack.length === 0 || stack[stack.length - 1] !== l) {
        allNodes.add(l);
        stack.push(l);
      }
      
      stack.push(node);
    }
    
    // Add remaining nodes in stack
    while (stack.length > 0) {
      allNodes.add(stack.pop());
    }
    
    // Build virtual tree edges
    const virtualNodes = Array.from(allNodes);
    const edges = [];
    const virtualAdj = new Map();
    virtualNodes.forEach(n => virtualAdj.set(n, []));
    
    // Sort nodes by depth to build edges
    virtualNodes.sort((a, b) => this.depth[b] - this.depth[a]);
    
    for (const node of virtualNodes) {
      // Find parent in virtual tree (nearest ancestor in allNodes)
      let p = this.parent[node][0];
      while (p !== -1 && !allNodes.has(p)) {
        for (let j = this.LOG - 1; j >= 0; j--) {
          if (this.parent[p][j] !== -1 && !allNodes.has(this.parent[p][j])) {
            p = this.parent[p][j];
          }
        }
        if (!allNodes.has(p)) p = this.parent[p][0];
      }
      
      if (p !== -1) {
        edges.push({ from: p, to: node });
        virtualAdj.get(p).push(node);
      }
    }
    
    return {
      nodes: virtualNodes,
      edges,
      adj: virtualAdj,
      keyNodes: new Set(keyNodes)
    };
  }
}

// Usage example:
// const adj = [[1, 2], [0, 3, 4], [0], [1], [1, 5], [4]];
// const vt = new VirtualTree(adj);
// const keyNodes = [3, 4, 5];
// const virtualTree = vt.buildVirtualTree(keyNodes);
// console.log('Virtual tree nodes:', virtualTree.nodes);
// console.log('Virtual tree edges:', virtualTree.edges);`,
  supportedViews: ['tree'],
  parameters: [
    { name: 'nodes', type: 'number', default: 10, min: 5, max: 15 },
    { name: 'keyNodeRatio', type: 'number', default: 0.4, min: 0.2, max: 0.8 }
  ]
};
