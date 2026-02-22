/**
 * Minimum Cost Maximum Flow (MCMF)
 * Uses SPFA for shortest path augmentation
 * 
 * Time Complexity: O(F · E log V) where F is the max flow
 * Space Complexity: O(V + E)
 * 
 * Finds the maximum flow with minimum total cost.
 * Used in network scheduling with costs.
 */

import type { AlgorithmDefinition } from '../../types';

export const mcmfDefinition: AlgorithmDefinition = {
  id: 'mcmf',
  name: '最小费用最大流 (MCMF)',
  category: 'graph',
  timeComplexity: 'O(F · E log V)',
  spaceComplexity: 'O(V + E)',
  description: '在保证最大流的前提下，寻找总费用最小的流方案。使用SPFA寻找最短增广路径。适用于带成本的网络调度、运输问题等。',
  code: `class MinCostMaxFlow {
  constructor(nodeCount) {
    this.n = nodeCount;
    this.adj = Array.from({ length: nodeCount }, () => []);
  }
  
  // Add directed edge with capacity and cost
  addEdge(from, to, capacity, cost) {
    const forward = { 
      to, 
      capacity, 
      cost,
      rev: this.adj[to].length 
    };
    const backward = { 
      to: from, 
      capacity: 0, 
      cost: -cost,
      rev: this.adj[from].length 
    };
    this.adj[from].push(forward);
    this.adj[to].push(backward);
  }
  
  // SPFA to find shortest path (minimum cost path)
  spfa(source, sink, dist, parent, parentEdge) {
    dist.fill(Infinity);
    const inQueue = new Array(this.n).fill(false);
    const queue = [source];
    dist[source] = 0;
    inQueue[source] = true;
    
    while (queue.length > 0) {
      const u = queue.shift();
      inQueue[u] = false;
      
      for (let i = 0; i < this.adj[u].length; i++) {
        const edge = this.adj[u][i];
        if (edge.capacity > 0 && dist[u] + edge.cost < dist[edge.to]) {
          dist[edge.to] = dist[u] + edge.cost;
          parent[edge.to] = u;
          parentEdge[edge.to] = i;
          
          if (!inQueue[edge.to]) {
            queue.push(edge.to);
            inQueue[edge.to] = true;
          }
        }
      }
    }
    return dist[sink] !== Infinity;
  }
  
  // Main algorithm
  minCostMaxFlow(source, sink) {
    let totalFlow = 0;
    let totalCost = 0;
    const dist = new Array(this.n);
    const parent = new Array(this.n);
    const parentEdge = new Array(this.n);
    
    while (this.spfa(source, sink, dist, parent, parentEdge)) {
      // Find minimum capacity along the path
      let pathFlow = Infinity;
      for (let v = sink; v !== source; v = parent[v]) {
        const u = parent[v];
        const edge = this.adj[u][parentEdge[v]];
        pathFlow = Math.min(pathFlow, edge.capacity);
      }
      
      // Update flow and cost
      totalFlow += pathFlow;
      totalCost += pathFlow * dist[sink];
      
      // Update residual capacities
      for (let v = sink; v !== source; v = parent[v]) {
        const u = parent[v];
        const edge = this.adj[u][parentEdge[v]];
        edge.capacity -= pathFlow;
        this.adj[v][edge.rev].capacity += pathFlow;
      }
    }
    
    return { flow: totalFlow, cost: totalCost };
  }
  
  // Get flow on each edge with cost
  getFlowEdges() {
    const edges = [];
    for (let from = 0; from < this.n; from++) {
      for (const edge of this.adj[from]) {
        const reverseEdge = this.adj[edge.to][edge.rev];
        if (reverseEdge.capacity > 0 && edge.cost < 0) {
          // Original edge has flow
          edges.push({
            from,
            to: edge.to,
            flow: reverseEdge.capacity,
            cost: -edge.cost
          });
        }
      }
    }
    return edges;
  }
}

// Usage:
// const mcmf = new MinCostMaxFlow(n);
// mcmf.addEdge(0, 1, 10, 2);  // capacity=10, cost=2
// mcmf.addEdge(1, 2, 5, 3);
// const result = mcmf.minCostMaxFlow(source, sink);
// console.log(\`Max Flow: \${result.flow}, Min Cost: \${result.cost}\`);`,
  supportedViews: ['graph'],
  parameters: [
    { name: 'nodes', type: 'number', default: 6, min: 4, max: 10 },
    { name: 'edgeDensity', type: 'number', default: 0.5, min: 0.3, max: 0.8 }
  ]
};
