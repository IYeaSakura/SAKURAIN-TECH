/**
 * Dijkstra最短路径算法
 * 时间复杂度: O((V + E) log V)
 * 空间复杂度: O(V)
 */

import type { AlgorithmDefinition } from '../../types';

export const dijkstraDefinition: AlgorithmDefinition = {
  id: 'dijkstra',
  name: 'Dijkstra最短路径',
  category: 'graph',
  timeComplexity: 'O((V + E) log V)',
  spaceComplexity: 'O(V)',
  description: '单源最短路径算法，使用优先队列。要求边权非负。',
  code: `function dijkstra(graph, start) {
  const dist = new Map();
  const prev = new Map();
  const pq = new PriorityQueue();
  
  for (const node of graph.keys()) {
    dist.set(node, node === start ? 0 : Infinity);
    pq.enqueue(node, dist.get(node));
  }
  
  while (!pq.isEmpty()) {
    const u = pq.dequeue();
    
    for (const [v, weight] of graph.get(u) || []) {
      const alt = dist.get(u) + weight;
      if (alt < dist.get(v)) {
        dist.set(v, alt);
        prev.set(v, u);
        pq.updatePriority(v, alt);
      }
    }
  }
  
  return { dist, prev };
}`,
  supportedViews: ['graph']
};
