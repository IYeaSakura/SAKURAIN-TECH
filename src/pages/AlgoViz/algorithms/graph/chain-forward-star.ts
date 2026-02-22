/**
 * Chain Forward Star (链式前向星)
 * Time Complexity: Storage O(V+E), Traversal O(V+E)
 * Space Complexity: O(V+E)
 * 
 * A static array simulation of adjacency list with excellent cache locality.
 * Widely used in competitive programming for large-scale graphs.
 */

import type { AlgorithmDefinition } from '../../types';

export const chainForwardStarDefinition: AlgorithmDefinition = {
  id: 'chain-forward-star',
  name: '链式前向星 (Chain Forward Star)',
  category: 'graph',
  timeComplexity: '存储 O(V+E), 遍历 O(V+E)',
  spaceComplexity: 'O(V+E)',
  description: '使用静态数组模拟邻接表，具有优秀的缓存局部性。竞赛优化常用，适合大规模图。通过head数组和next指针实现链式结构。',
  code: `class ChainForwardStar {
  constructor(nodeCount, maxEdges, directed = false) {
    this.n = nodeCount;
    this.directed = directed;
    this.edgeCount = 0;
    
    // head[i] = first edge index from node i (-1 means no edge)
    this.head = new Array(nodeCount).fill(-1);
    
    // Edge arrays
    this.to = new Array(maxEdges);     // target node
    this.weight = new Array(maxEdges); // edge weight
    this.next = new Array(maxEdges);   // next edge index in chain
  }
  
  // Add edge: O(1)
  addEdge(from, to, weight = 1) {
    // Add forward edge
    this.to[this.edgeCount] = to;
    this.weight[this.edgeCount] = weight;
    this.next[this.edgeCount] = this.head[from];
    this.head[from] = this.edgeCount;
    this.edgeCount++;
    
    // Add reverse edge for undirected graph
    if (!this.directed) {
      this.to[this.edgeCount] = from;
      this.weight[this.edgeCount] = weight;
      this.next[this.edgeCount] = this.head[to];
      this.head[to] = this.edgeCount;
      this.edgeCount++;
    }
  }
  
  // Iterate all edges from a node: O(degree)
  * getEdgesFrom(node) {
    for (let e = this.head[node]; e !== -1; e = this.next[e]) {
      yield {
        to: this.to[e],
        weight: this.weight[e],
        edgeIndex: e
      };
    }
  }
  
  // Get all neighbors as array
  getNeighbors(node) {
    const neighbors = [];
    for (let e = this.head[node]; e !== -1; e = this.next[e]) {
      neighbors.push({ to: this.to[e], weight: this.weight[e] });
    }
    return neighbors;
  }
  
  // Get all edges
  getAllEdges() {
    const edges = [];
    const visited = new Set();
    
    for (let from = 0; from < this.n; from++) {
      for (let e = this.head[from]; e !== -1; e = this.next[e]) {
        const to = this.to[e];
        const key = this.directed ? 
          \`\${from}-\${to}\` : 
          \`\${Math.min(from, to)}-\${Math.max(from, to)}\`;
        
        if (!visited.has(key)) {
          visited.add(key);
          edges.push({ from, to, weight: this.weight[e] });
        }
      }
    }
    return edges;
  }
  
  // Check if edge exists: O(degree)
  hasEdge(from, to) {
    for (let e = this.head[from]; e !== -1; e = this.next[e]) {
      if (this.to[e] === to) return true;
    }
    return false;
  }
}

// Usage example:
// const graph = new ChainForwardStar(n, m * 2);
// graph.addEdge(0, 1, 10);
// for (const edge of graph.getEdgesFrom(0)) {
//   console.log(edge.to, edge.weight);
// }`,
  supportedViews: ['graph'],
  parameters: [
    { name: 'nodes', type: 'number', default: 8, min: 3, max: 15 },
    { name: 'edgeDensity', type: 'number', default: 0.4, min: 0.1, max: 0.8 }
  ]
};
