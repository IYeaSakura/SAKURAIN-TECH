/**
 * Kruskal 算法可视化
 * 最小生成树 - 贪心策略
 * 
 * @author OpenClaw Auto-Dev
 */

import type { AlgorithmDefinition } from '../../types';

export const kruskalDefinition: AlgorithmDefinition = {
  id: 'kruskal',
  name: 'Kruskal',
  category: 'graph',
  timeComplexity: 'O(E log E)',
  spaceComplexity: 'O(V)',
  description: '最小生成树 - 按边权排序，不形成环则选取',
  code: `// Kruskal 算法 - 最小生成树
class UnionFind {
  parent: number[];
  constructor(n: number) {
    this.parent = Array(n).fill(0).map((_, i) => i);
  }
  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }
  union(x: number, y: boolean): boolean {
    const px = this.find(x), py = this.find(y);
    if (px === py) return false;
    this.parent[px] = py;
    return true;
  }
}

function kruskal(edges: Edge[], n: number): Edge[] {
  edges.sort((a, b) => a.w - b.w);
  const uf = new UnionFind(n);
  const mst: Edge[] = [];
  for (const e of edges) {
    if (uf.union(e.u, e.v)) {
      mst.push(e);
      if (mst.length === n - 1) break;
    }
  }
  return mst;
}`,
  supportedViews: ['graph']
};

export default kruskalDefinition;
