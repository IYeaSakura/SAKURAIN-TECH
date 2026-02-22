/**
 * Kruskal最小生成树算法
 * 基于边排序 + 并查集
 * 时间复杂度: O(E log E)
 * 空间复杂度: O(V + E)
 */

import type { AlgorithmDefinition } from '../../types';

export const kruskalDefinition: AlgorithmDefinition = {
  id: 'kruskal',
  name: 'Kruskal MST',
  category: 'graph',
  timeComplexity: 'O(E log E)',
  spaceComplexity: 'O(V + E)',
  description: '基于边权重的贪心算法。将所有边按权重排序，使用并查集避免环，逐步构建最小生成树。',
  code: `function kruskal(graph) {
  const edges = graph.getAllEdges();
  const n = graph.nodeCount;
  
  // 按权重升序排序所有边
  edges.sort((a, b) => a.weight - b.weight);
  
  const uf = new UnionFind(n);
  const mst = [];
  let totalWeight = 0;
  
  for (const edge of edges) {
    const { u, v, weight } = edge;
    
    // 检查是否会形成环
    if (!uf.connected(u, v)) {
      uf.union(u, v);
      mst.push(edge);
      totalWeight += weight;
      
      if (mst.length === n - 1) break;
    }
  }
  
  return { mst, totalWeight };
}

class UnionFind {
  constructor(n) {
    this.parent = Array.from({length: n}, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }
  
  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }
  
  union(x, y) {
    const px = this.find(x), py = this.find(y);
    if (px === py) return false;
    
    if (this.rank[px] < this.rank[py]) {
      this.parent[px] = py;
    } else if (this.rank[px] > this.rank[py]) {
      this.parent[py] = px;
    } else {
      this.parent[py] = px;
      this.rank[px]++;
    }
    return true;
  }
  
  connected(x, y) {
    return this.find(x) === this.find(y);
  }
}`,
  supportedViews: ['graph'],
  parameters: [
    { name: 'nodes', type: 'number', default: 8, min: 4, max: 12 },
    { name: 'edgeDensity', type: 'number', default: 0.5, min: 0.3, max: 0.8 }
  ]
};
