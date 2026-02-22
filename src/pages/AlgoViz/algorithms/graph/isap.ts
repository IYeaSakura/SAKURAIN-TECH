/**
 * ISAP (Improved Shortest Augmenting Path) Maximum Flow Algorithm
 * Uses gap optimization + allowed arc
 * 
 * Time Complexity: O(V²E)
 * Space Complexity: O(V + E)
 * 
 * An improved version of Dinic with gap optimization.
 * Better performance on dense graphs.
 */

import type { AlgorithmDefinition } from '../../types';

export const isapDefinition: AlgorithmDefinition = {
  id: 'isap',
  name: 'ISAP 最大流',
  category: 'graph',
  timeComplexity: 'O(V²E)',
  spaceComplexity: 'O(V + E)',
  description: 'Dinic算法的改进版本，使用间隙优化和允许弧优化。相比Dinic只需一次BFS构建层次图，后续通过DFS自动调整层次。适合稠密图的最大流问题。',
  code: `class ISAPMaxFlow {
  constructor(nodeCount) {
    this.n = nodeCount;
    this.adj = Array.from({ length: nodeCount }, () => []);
    this.level = new Array(nodeCount).fill(0);
    this.gap = new Array(nodeCount + 1).fill(0);
    this.iterator = new Array(nodeCount).fill(0);
  }
  
  // Add directed edge with capacity
  addEdge(from, to, capacity) {
    const forward = { to, capacity, rev: this.adj[to].length };
    const backward = { to: from, capacity: 0, rev: this.adj[from].length };
    this.adj[from].push(forward);
    this.adj[to].push(backward);
  }
  
  // BFS to initialize levels (from sink)
  initLevels(sink) {
    this.level.fill(-1);
    this.gap.fill(0);
    
    const queue = [sink];
    this.level[sink] = 0;
    this.gap[0] = 1;
    
    while (queue.length > 0) {
      const u = queue.shift();
      for (const edge of this.adj[u]) {
        const reverseEdge = this.adj[edge.to].find(e => e.to === u);
        if (reverseEdge && reverseEdge.capacity > 0 && this.level[edge.to] < 0) {
          this.level[edge.to] = this.level[u] + 1;
          this.gap[this.level[edge.to]]++;
          queue.push(edge.to);
        }
      }
    }
  }
  
  // DFS to find augmenting path
  augment(u, source, sink, flow) {
    if (u === sink) return flow;
    
    let pushed = 0;
    for (let i = this.iterator[u]; i < this.adj[u].length; i++) {
      this.iterator[u] = i;
      const edge = this.adj[u][i];
      
      if (edge.capacity > 0 && this.level[edge.to] === this.level[u] - 1) {
        const minFlow = Math.min(flow - pushed, edge.capacity);
        const ret = this.augment(edge.to, source, sink, minFlow);
        
        if (ret > 0) {
          edge.capacity -= ret;
          this.adj[edge.to][edge.rev].capacity += ret;
          pushed += ret;
          if (pushed === flow) return pushed;
        }
      }
    }
    
    // Gap optimization
    this.gap[this.level[u]]--;
    if (this.gap[this.level[u]] === 0 && this.level[source] < this.n) {
      // Gap found, no more augmenting paths
      this.level[source] = this.n;
    }
    
    // Relabel
    let minLevel = this.n;
    for (const edge of this.adj[u]) {
      if (edge.capacity > 0) {
        minLevel = Math.min(minLevel, this.level[edge.to]);
      }
    }
    this.level[u] = minLevel + 1;
    this.gap[this.level[u]]++;
    this.iterator[u] = 0;
    
    return pushed;
  }
  
  // Main algorithm
  maxFlow(source, sink) {
    this.initLevels(sink);
    let totalFlow = 0;
    
    while (this.level[source] < this.n) {
      this.iterator.fill(0);
      totalFlow += this.augment(source, source, sink, Infinity);
    }
    
    return totalFlow;
  }
}

// Usage:
// const isap = new ISAPMaxFlow(n);
// isap.addEdge(0, 1, 10);
// const maxFlow = isap.maxFlow(source, sink);`,
  supportedViews: ['graph'],
  parameters: [
    { name: 'nodes', type: 'number', default: 6, min: 4, max: 10 },
    { name: 'edgeDensity', type: 'number', default: 0.5, min: 0.3, max: 0.8 }
  ]
};
