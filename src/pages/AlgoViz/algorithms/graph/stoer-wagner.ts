/**
 * Stoer-Wagner Global Minimum Cut Algorithm
 * Uses maximum adjacency search + contraction
 * 
 * Time Complexity: O(V³) or O(VE + V² log V) with Fibonacci heap
 * Space Complexity: O(V²)
 * 
 * Finds the minimum cut in an undirected weighted graph.
 * Used for network reliability and graph partitioning.
 */

import type { AlgorithmDefinition } from '../../types';

export const stoerWagnerDefinition: AlgorithmDefinition = {
  id: 'stoer-wagner',
  name: '全局最小割 (Stoer-Wagner)',
  category: 'graph',
  timeComplexity: 'O(V³)',
  spaceComplexity: 'O(V²)',
  description: '使用最大邻接搜索+收缩策略找到无向加权图的全局最小割。适用于网络可靠性分析、图分割等问题。基于"最小割要么是某次收缩的割，要么在收缩后的图中"的原理。',
  code: `function stoerWagner(graph) {
  const n = graph.length;
  let minCut = Infinity;
  let bestCut = { weight: Infinity, partition: null };
  
  // Working copy of the graph
  let weights = graph.map(row => [...row]);
  
  // Vertices still in the contracted graph
  let vertices = Array.from({ length: n }, (_, i) => [i]);
  
  // Merge history for reconstruction
  const mergeHistory = [];
  
  for (let phase = 0; phase < n - 1; phase++) {
    // Maximum adjacency search
    const inSet = new Array(n).fill(false);
    const weightToSet = new Array(n).fill(0);
    
    let prev = -1;
    let last = -1;
    
    for (let i = 0; i < n - phase; i++) {
      // Find vertex with maximum weight to current set
      let maxWeight = -1;
      let maxVertex = -1;
      
      for (let v = 0; v < n; v++) {
        if (!inSet[v] && weightToSet[v] > maxWeight) {
          maxWeight = weightToSet[v];
          maxVertex = v;
        }
      }
      
      // Add to set
      inSet[maxVertex] = true;
      prev = last;
      last = maxVertex;
      
      // Update weights
      for (let v = 0; v < n; v++) {
        if (!inSet[v]) {
          weightToSet[v] += weights[maxVertex][v];
        }
      }
    }
    
    // Phase cut weight is the weight to the last added vertex
    const phaseCut = weightToSet[last];
    
    // Update minimum cut
    if (phaseCut < minCut) {
      minCut = phaseCut;
      bestCut = {
        weight: phaseCut,
        partition: vertices[last].slice()
      };
    }
    
    // Record merge
    mergeHistory.push({
      merged: vertices[prev],
      into: vertices[last],
      cutWeight: phaseCut
    });
    
    // Contract last and prev
    for (let v = 0; v < n; v++) {
      if (v !== prev && v !== last) {
        weights[last][v] += weights[prev][v];
        weights[v][last] += weights[prev][v];
      }
    }
    
    // Merge vertex sets
    vertices[last] = vertices[last].concat(vertices[prev]);
    vertices[prev] = [];
  }
  
  return {
    minCut,
    partition: bestCut.partition,
    mergeHistory
  };
}

// Alternative implementation with adjacency list
class StoerWagner {
  constructor(n) {
    this.n = n;
    this.weights = Array.from({ length: n }, () => new Array(n).fill(0));
    this.vertices = Array.from({ length: n }, (_, i) => [i]);
    this.active = new Array(n).fill(true);
  }
  
  addEdge(u, v, weight) {
    this.weights[u][v] += weight;
    this.weights[v][u] += weight;
  }
  
  // Maximum adjacency search from start vertex
  maxAdjSearch(start) {
    const inSet = new Set([start]);
    const added = [start];
    const weightToSet = new Array(this.n).fill(0);
    
    // Initialize weights
    for (let v = 0; v < this.n; v++) {
      if (this.active[v] && v !== start) {
        weightToSet[v] = this.weights[start][v];
      }
    }
    
    while (added.length < this.countActive()) {
      let maxWeight = -1;
      let maxVertex = -1;
      
      for (let v = 0; v < this.n; v++) {
        if (this.active[v] && !inSet.has(v) && weightToSet[v] > maxWeight) {
          maxWeight = weightToSet[v];
          maxVertex = v;
        }
      }
      
      inSet.add(maxVertex);
      added.push(maxVertex);
      
      // Update weights
      for (let v = 0; v < this.n; v++) {
        if (this.active[v] && !inSet.has(v)) {
          weightToSet[v] += this.weights[maxVertex][v];
        }
      }
    }
    
    return {
      order: added,
      last: added[added.length - 1],
      secondLast: added[added.length - 2],
      cutWeight: weightToSet[added[added.length - 1]]
    };
  }
  
  countActive() {
    return this.active.filter(x => x).length;
  }
  
  // Contract two vertices
  contract(u, v) {
    // Merge edges
    for (let i = 0; i < this.n; i++) {
      if (this.active[i] && i !== u && i !== v) {
        this.weights[u][i] += this.weights[v][i];
        this.weights[i][u] += this.weights[v][i];
        this.weights[v][i] = 0;
        this.weights[i][v] = 0;
      }
    }
    
    // Merge vertex sets
    this.vertices[u] = this.vertices[u].concat(this.vertices[v]);
    this.vertices[v] = [];
    this.active[v] = false;
  }
  
  // Main algorithm
  findMinCut() {
    let minCut = Infinity;
    let bestPartition = null;
    
    while (this.countActive() > 1) {
      // Find a starting vertex
      let start = -1;
      for (let i = 0; i < this.n; i++) {
        if (this.active[i]) {
          start = i;
          break;
        }
      }
      
      const result = this.maxAdjSearch(start);
      
      if (result.cutWeight < minCut) {
        minCut = result.cutWeight;
        bestPartition = this.vertices[result.last].slice();
      }
      
      // Contract last two vertices
      this.contract(result.secondLast, result.last);
    }
    
    return {
      minCut,
      partition: bestPartition
    };
  }
}

// Usage:
// const sw = new StoerWagner(n);
// sw.addEdge(0, 1, 3);
// sw.addEdge(1, 2, 4);
// const result = sw.findMinCut();
// console.log('Minimum cut:', result.minCut);
// console.log('Partition:', result.partition);`,
  supportedViews: ['graph'],
  parameters: [
    { name: 'nodes', type: 'number', default: 6, min: 4, max: 10 },
    { name: 'edgeDensity', type: 'number', default: 0.5, min: 0.3, max: 0.8 }
  ]
};
