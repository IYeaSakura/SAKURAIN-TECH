/**
 * Dijkstra最短路径算法 - 完整实现
 * 使用优先队列（最小堆）实现
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
  description: '单源最短路径算法，使用优先队列（最小堆）。适用于带权有向图，要求边权非负。可视化展示距离数组更新、优先队列状态和最短路径构建过程。',
  code: `function dijkstra(graph, start) {
  // 初始化距离数组和前驱节点数组
  const dist = new Map();
  const prev = new Map();
  const pq = new PriorityQueue(); // 最小优先队列
  
  // 初始化：所有节点距离为无穷大，起点距离为0
  for (const node of graph.nodes) {
    const d = node.id === start ? 0 : Infinity;
    dist.set(node.id, d);
    prev.set(node.id, null);
    if (d === 0) pq.enqueue(node.id, d);
  }
  
  while (!pq.isEmpty()) {
    // 取出距离最小的节点
    const u = pq.dequeue();
    const uDist = dist.get(u);
    
    // 遍历所有邻居
    for (const edge of graph.getEdgesFrom(u)) {
      const v = edge.to;
      const weight = edge.weight;
      const alt = uDist + weight;
      
      // 松弛操作：找到更短的路径
      if (alt < dist.get(v)) {
        dist.set(v, alt);
        prev.set(v, u);
        pq.updatePriority(v, alt);
      }
    }
  }
  
  return { dist, prev };
}

// 最小优先队列实现
class PriorityQueue {
  constructor() {
    this.heap = [];
  }
  
  enqueue(node, priority) {
    this.heap.push({ node, priority });
    this.bubbleUp(this.heap.length - 1);
  }
  
  dequeue() {
    if (this.isEmpty()) return null;
    const min = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return min.node;
  }
  
  updatePriority(node, newPriority) {
    const index = this.heap.findIndex(item => item.node === node);
    if (index !== -1) {
      const oldPriority = this.heap[index].priority;
      this.heap[index].priority = newPriority;
      if (newPriority < oldPriority) {
        this.bubbleUp(index);
      } else {
        this.sinkDown(index);
      }
    }
  }
  
  bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.heap[parent].priority <= this.heap[index].priority) break;
      [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
      index = parent;
    }
  }
  
  sinkDown(index) {
    const len = this.heap.length;
    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      
      if (left < len && this.heap[left].priority < this.heap[smallest].priority) {
        smallest = left;
      }
      if (right < len && this.heap[right].priority < this.heap[smallest].priority) {
        smallest = right;
      }
      
      if (smallest === index) break;
      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
  
  isEmpty() {
    return this.heap.length === 0;
  }
}`,
  supportedViews: ['graph'],
  parameters: [
    { name: 'nodes', type: 'number', default: 8, min: 3, max: 15 },
    { name: 'edgeDensity', type: 'number', default: 0.4, min: 0.1, max: 0.8 }
  ]
};
