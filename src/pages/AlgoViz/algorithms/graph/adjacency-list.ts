/**
 * Adjacency List (邻接表)
 * Time Complexity: Storage O(V+E), Traversal O(V+E)
 * Space Complexity: O(V+E)
 * 
 * An array of linked lists/vectors where each index stores neighbors of that node.
 * Best for sparse graphs and most graph algorithms.
 */

import type { AlgorithmDefinition } from '../../types';

export const adjacencyListDefinition: AlgorithmDefinition = {
  id: 'adjacency-list',
  name: '邻接表 (Adjacency List)',
  category: 'graph',
  timeComplexity: '存储 O(V+E), 遍历 O(V+E)',
  spaceComplexity: 'O(V+E)',
  description: '使用数组+链表/向量存储图的邻接关系。每个节点维护一个邻居列表。适合稀疏图，是绝大多数图算法的基础数据结构。',
  code: `class AdjacencyList {
  constructor(nodeCount, directed = false) {
    this.n = nodeCount;
    this.directed = directed;
    // Array of neighbor lists
    this.adj = Array.from({ length: n }, () => []);
  }
  
  // Add edge: O(1)
  addEdge(from, to, weight = 1) {
    this.adj[from].push({ to, weight });
    if (!this.directed) {
      this.adj[to].push({ to: from, weight });
    }
  }
  
  // Remove edge: O(degree)
  removeEdge(from, to) {
    const idx = this.adj[from].findIndex(e => e.to === to);
    if (idx !== -1) {
      this.adj[from].splice(idx, 1);
    }
    if (!this.directed) {
      const idx2 = this.adj[to].findIndex(e => e.to === from);
      if (idx2 !== -1) {
        this.adj[to].splice(idx2, 1);
      }
    }
  }
  
  // Check if edge exists: O(degree)
  hasEdge(from, to) {
    return this.adj[from].some(e => e.to === to);
  }
  
  // Get edge weight: O(degree)
  getWeight(from, to) {
    const edge = this.adj[from].find(e => e.to === to);
    return edge ? edge.weight : Infinity;
  }
  
  // Get all neighbors: O(1) to get reference
  getNeighbors(node) {
    return this.adj[node];
  }
  
  // Get all edges: O(E)
  getAllEdges() {
    const edges = [];
    const visited = new Set();
    
    for (let from = 0; from < this.n; from++) {
      for (const { to, weight } of this.adj[from]) {
        const key = this.directed ? 
          \`\${from}-\${to}\` : 
          \`\${Math.min(from, to)}-\${Math.max(from, to)}\`;
        
        if (!visited.has(key)) {
          visited.add(key);
          edges.push({ from, to, weight });
        }
      }
    }
    return edges;
  }
  
  // Get node degree: O(1)
  getDegree(node) {
    return this.adj[node].length;
  }
}`,
  supportedViews: ['graph'],
  parameters: [
    { name: 'nodes', type: 'number', default: 8, min: 3, max: 15 },
    { name: 'edgeDensity', type: 'number', default: 0.4, min: 0.1, max: 0.8 }
  ]
};
