/**
 * Prim最小生成树算法
 * 类Dijkstra的生长方式
 * 时间复杂度: O((V + E) log V)
 * 空间复杂度: O(V)
 */

import type { AlgorithmDefinition } from '../../types';

export const primDefinition: AlgorithmDefinition = {
  id: 'prim',
  name: 'Prim MST',
  category: 'graph',
  timeComplexity: 'O((V + E) log V)',
  spaceComplexity: 'O(V)',
  description: '从任意起点开始，逐步扩展生成树。每次选择连接已选顶点集和未选顶点集的最小权重边。',
  code: `function prim(graph, start = 0) {
  const n = graph.nodeCount;
  const inMST = new Array(n).fill(false);
  const key = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  
  // 优先队列: (权重, 顶点)
  const pq = new PriorityQueue();
  key[start] = 0;
  pq.enqueue(start, 0);
  
  const mst = [];
  let totalWeight = 0;
  
  while (!pq.isEmpty() && mst.length < n - 1) {
    const u = pq.dequeue();
    
    if (inMST[u]) continue;
    inMST[u] = true;
    
    if (parent[u] !== -1) {
      mst.push({ u: parent[u], v: u, weight: key[u] });
      totalWeight += key[u];
    }
    
    // 更新邻居
    for (const [v, weight] of graph.getNeighbors(u)) {
      if (!inMST[v] && weight < key[v]) {
        key[v] = weight;
        parent[v] = u;
        pq.enqueue(v, key[v]);
      }
    }
  }
  
  return { mst, totalWeight };
}

class PriorityQueue {
  constructor() {
    this.heap = [];
  }
  
  enqueue(node, priority) {
    this.heap.push({ node, priority });
    this.heapifyUp(this.heap.length - 1);
  }
  
  dequeue() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.heapifyDown(0);
    }
    return min.node;
  }
  
  heapifyUp(idx) {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[parent].priority <= this.heap[idx].priority) break;
      [this.heap[parent], this.heap[idx]] = [this.heap[idx], this.heap[parent]];
      idx = parent;
    }
  }
  
  heapifyDown(idx) {
    while (true) {
      let min = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      
      if (left < this.heap.length && this.heap[left].priority < this.heap[min].priority) {
        min = left;
      }
      if (right < this.heap.length && this.heap[right].priority < this.heap[min].priority) {
        min = right;
      }
      if (min === idx) break;
      
      [this.heap[idx], this.heap[min]] = [this.heap[min], this.heap[idx]];
      idx = min;
    }
  }
  
  isEmpty() {
    return this.heap.length === 0;
  }
}`,
  supportedViews: ['graph'],
  parameters: [
    { name: 'nodes', type: 'number', default: 8, min: 4, max: 12 },
    { name: 'startNode', type: 'number', default: 0, min: 0, max: 11 }
  ]
};
