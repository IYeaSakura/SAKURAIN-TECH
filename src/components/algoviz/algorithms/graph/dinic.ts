/**
 * Dinic's Maximum Flow Algorithm
 * Uses layered graph + multi-path augmentation
 * 
 * Time Complexity: O(V²E) general, O(E√V) for bipartite matching
 * Space Complexity: O(V + E)
 * 
 * Standard algorithm for maximum flow problems.
 */

import type { AlgorithmDefinition } from '../../types';

export const dinicDefinition: AlgorithmDefinition = {
  id: 'dinic',
  name: 'Dinic 最大流',
  category: 'graph',
  timeComplexity: 'O(V²E)',
  spaceComplexity: 'O(V + E)',
  description: '使用分层图+多路增广的最大流算法。通过BFS构建层次图，DFS寻找增广路径。适用于标准最大流问题和二分图匹配。',
  code: `class DinicMaxFlow {
  constructor(nodeCount) {
    this.n = nodeCount;
    this.adj = Array.from({ length: nodeCount }, () => []);
    this.level = new Array(nodeCount).fill(-1);
    this.iterator = new Array(nodeCount).fill(0);
  }
  
  // Add directed edge with capacity
  addEdge(from, to, capacity) {
    const forward = { to, capacity, rev: this.adj[to].length };
    const backward = { to: from, capacity: 0, rev: this.adj[from].length };
    this.adj[from].push(forward);
    this.adj[to].push(backward);
  }
  
  // BFS to build level graph
  buildLevelGraph(source, sink) {
    this.level.fill(-1);
    const queue = [source];
    this.level[source] = 0;
    
    while (queue.length > 0) {
      const u = queue.shift();
      for (const edge of this.adj[u]) {
        if (edge.capacity > 0 && this.level[edge.to] < 0) {
          this.level[edge.to] = this.level[u] + 1;
          queue.push(edge.to);
        }
      }
    }
    return this.level[sink] >= 0;
  }
  
  // DFS to find augmenting paths
  findAugmentingPath(u, sink, flow) {
    if (u === sink) return flow;
    
    for (let i = this.iterator[u]; i < this.adj[u].length; i++) {
      this.iterator[u] = i;
      const edge = this.adj[u][i];
      
      if (edge.capacity > 0 && this.level[edge.to] === this.level[u] + 1) {
        const minFlow = Math.min(flow, edge.capacity);
        const pushed = this.findAugmentingPath(edge.to, sink, minFlow);
        
        if (pushed > 0) {
          edge.capacity -= pushed;
          this.adj[edge.to][edge.rev].capacity += pushed;
          return pushed;
        }
      }
    }
    return 0;
  }
  
  // Main algorithm
  maxFlow(source, sink) {
    let totalFlow = 0;
    
    while (this.buildLevelGraph(source, sink)) {
      this.iterator.fill(0);
      
      let pushed;
      while ((pushed = this.findAugmentingPath(source, sink, Infinity)) > 0) {
        totalFlow += pushed;
      }
    }
    
    return totalFlow;
  }
  
  // Get flow on each edge
  getFlowEdges() {
    const edges = [];
    for (let from = 0; from < this.n; from++) {
      for (const edge of this.adj[from]) {
        if (edge.capacity === 0 && edge.rev >= 0) {
          // This edge has flow (original capacity was used)
          const reverseEdge = this.adj[edge.to][edge.rev];
          edges.push({
            from,
            to: edge.to,
            flow: reverseEdge.capacity
          });
        }
      }
    }
    return edges;
  }
}

// Usage:
// const dinic = new DinicMaxFlow(n);
// dinic.addEdge(0, 1, 10);
// dinic.addEdge(1, 2, 5);
// const maxFlow = dinic.maxFlow(source, sink);`,
  supportedViews: ['graph'],
  parameters: [
    { name: 'nodes', type: 'number', default: 6, min: 4, max: 10 },
    { name: 'edgeDensity', type: 'number', default: 0.5, min: 0.3, max: 0.8 }
  ]
};
