/**
 * Hopcroft-Karp Algorithm for Maximum Bipartite Matching
 * Uses BFS layering + DFS multi-path augmentation
 * 
 * Time Complexity: O(E√V)
 * Space Complexity: O(V + E)
 * 
 * Faster than Hungarian for unweighted maximum matching.
 * Ideal for large-scale bipartite graphs.
 */

import type { AlgorithmDefinition } from '../../types';

export const hopcroftKarpDefinition: AlgorithmDefinition = {
  id: 'hopcroft-karp',
  name: 'Hopcroft-Karp 匹配',
  category: 'graph',
  timeComplexity: 'O(E√V)',
  spaceComplexity: 'O(V + E)',
  description: '匈牙利算法的优化版本，使用BFS分层+DFS多路增广。时间复杂度O(E√V)，适合大规模二分图的最大匹配问题。',
  code: `class HopcroftKarp {
  constructor(leftSize, rightSize) {
    this.n = leftSize;
    this.m = rightSize;
    this.adj = Array.from({ length: leftSize }, () => []);
    this.matchX = new Array(leftSize).fill(-1);  // matchX[i] = j
    this.matchY = new Array(rightSize).fill(-1);  // matchY[j] = i
    this.dist = new Array(leftSize).fill(0);
  }
  
  // Add edge from left to right
  addEdge(u, v) {
    this.adj[u].push(v);
  }
  
  // BFS to build layered graph
  bfs() {
    const queue = [];
    
    for (let u = 0; u < this.n; u++) {
      if (this.matchX[u] === -1) {
        this.dist[u] = 0;
        queue.push(u);
      } else {
        this.dist[u] = Infinity;
      }
    }
    
    this.dist[this.n] = Infinity;  // Dummy node
    
    while (queue.length > 0) {
      const u = queue.shift();
      
      if (this.dist[u] < this.dist[this.n]) {
        for (const v of this.adj[u]) {
          const u2 = this.matchY[v];
          if (u2 === -1) {
            this.dist[this.n] = this.dist[u] + 1;
          } else if (this.dist[u2] === Infinity) {
            this.dist[u2] = this.dist[u] + 1;
            queue.push(u2);
          }
        }
      }
    }
    
    return this.dist[this.n] !== Infinity;
  }
  
  // DFS to find augmenting path
  dfs(u) {
    if (u === this.n) return true;
    
    for (const v of this.adj[u]) {
      const u2 = this.matchY[v];
      if (u2 === -1 || (this.dist[u2] === this.dist[u] + 1 && this.dfs(u2))) {
        this.matchX[u] = v;
        this.matchY[v] = u;
        return true;
      }
    }
    
    this.dist[u] = Infinity;
    return false;
  }
  
  // Main algorithm
  maxMatching() {
    let matching = 0;
    
    while (this.bfs()) {
      for (let u = 0; u < this.n; u++) {
        if (this.matchX[u] === -1 && this.dfs(u)) {
          matching++;
        }
      }
    }
    
    // Build result
    const matches = [];
    for (let u = 0; u < this.n; u++) {
      if (this.matchX[u] !== -1) {
        matches.push({ left: u, right: this.matchX[u] });
      }
    }
    
    return { matching, matches, matchX: [...this.matchX], matchY: [...this.matchY] };
  }
}

// Usage:
// const hk = new HopcroftKarp(n, m);
// hk.addEdge(0, 1);
// hk.addEdge(0, 2);
// hk.addEdge(1, 2);
// const result = hk.maxMatching();
// console.log('Maximum matching:', result.matching);
// console.log('Matches:', result.matches);`,
  supportedViews: ['graph'],
  parameters: [
    { name: 'leftSize', type: 'number', default: 5, min: 3, max: 8 },
    { name: 'rightSize', type: 'number', default: 5, min: 3, max: 8 },
    { name: 'edgeDensity', type: 'number', default: 0.5, min: 0.2, max: 0.8 }
  ]
};
