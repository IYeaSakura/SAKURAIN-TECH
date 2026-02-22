/**
 * Adjacency Matrix (邻接矩阵)
 * Time Complexity: Storage O(V²), Query O(1)
 * Space Complexity: O(V²)
 * 
 * A 2D array representation where matrix[i][j] stores the edge weight from node i to node j.
 * Best for dense graphs and algorithms like Floyd-Warshall.
 */

import type { AlgorithmDefinition } from '../../types';

export const adjacencyMatrixDefinition: AlgorithmDefinition = {
  id: 'adjacency-matrix',
  name: '邻接矩阵 (Adjacency Matrix)',
  category: 'graph',
  timeComplexity: '存储 O(V²), 查询 O(1)',
  spaceComplexity: 'O(V²)',
  description: '使用二维数组存储图的边权信息。matrix[i][j]表示从节点i到节点j的边权重。适合稠密图和需要快速查询边权的场景，如Floyd算法。',
  code: `class AdjacencyMatrix {
  constructor(nodeCount, directed = false) {
    this.n = nodeCount;
    this.directed = directed;
    // Initialize matrix with Infinity (no edge)
    this.matrix = Array.from({ length: n }, () => 
      new Array(n).fill(Infinity)
    );
    // Diagonal elements are 0 (distance to self)
    for (let i = 0; i < n; i++) {
      this.matrix[i][i] = 0;
    }
  }
  
  // Add edge: O(1)
  addEdge(from, to, weight = 1) {
    this.matrix[from][to] = weight;
    if (!this.directed) {
      this.matrix[to][from] = weight;
    }
  }
  
  // Remove edge: O(1)
  removeEdge(from, to) {
    this.matrix[from][to] = Infinity;
    if (!this.directed) {
      this.matrix[to][from] = Infinity;
    }
  }
  
  // Check if edge exists: O(1)
  hasEdge(from, to) {
    return this.matrix[from][to] !== Infinity;
  }
  
  // Get edge weight: O(1)
  getWeight(from, to) {
    return this.matrix[from][to];
  }
  
  // Get all neighbors: O(V)
  getNeighbors(node) {
    const neighbors = [];
    for (let i = 0; i < this.n; i++) {
      if (this.matrix[node][i] !== Infinity && node !== i) {
        neighbors.push({ to: i, weight: this.matrix[node][i] });
      }
    }
    return neighbors;
  }
  
  // Get all edges: O(V²)
  getAllEdges() {
    const edges = [];
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        if (this.matrix[i][j] !== Infinity && i !== j) {
          if (this.directed || i < j) {
            edges.push({ from: i, to: j, weight: this.matrix[i][j] });
          }
        }
      }
    }
    return edges;
  }
}`,
  supportedViews: ['matrix', 'graph'],
  parameters: [
    { name: 'nodes', type: 'number', default: 6, min: 3, max: 10 },
    { name: 'density', type: 'number', default: 0.5, min: 0.2, max: 0.9 }
  ]
};
