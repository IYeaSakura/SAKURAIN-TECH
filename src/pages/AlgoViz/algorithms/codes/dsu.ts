/**
 * 并查集 (Disjoint Set Union - DSU)
 * 带路径压缩和按秩合并优化
 * 
 * 时间复杂度: 近似 O(α(V))，其中 α 是阿克曼函数的反函数
 * 空间复杂度: O(V)
 */

import type { AlgorithmDefinition } from '../../types';

export const dsuDefinition: AlgorithmDefinition = {
  id: 'dsu',
  name: '并查集 (DSU)',
  category: 'graph',
  timeComplexity: '近似 O(α(V))',
  spaceComplexity: 'O(V)',
  description: '维护一组不相交的集合，支持合并(Union)和查找(Find)操作。使用路径压缩和按秩合并优化达到接近常数的查询效率。常用于连通性问题、最小生成树(Kruskal)等。',
  code: `class DSU {
  // 父指针数组
  parent: number[];
  // 秩(树的高度)数组
  rank: number[];
  
  constructor(n: number) {
    this.parent = new Array(n);
    this.rank = new Array(n).fill(0);
    // 初始时每个元素自成一个集合
    for (let i = 0; i < n; i++) {
      this.parent[i] = i;
    }
  }
  
  // 查找：带路径压缩优化
  find(x: number): number {
    if (this.parent[x] !== x) {
      // 递归查找，同时压缩路径
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }
  
  // 合并：按秩合并优化
  union(x: number, y: number): boolean {
    const rootX = this.find(x);
    const rootY = this.find(y);
    
    // 已在同一集合
    if (rootX === rootY) return false;
    
    // 将秩较小的树合并到秩较大的树下
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      // 秩相等时，任选其一作为根，并将其秩+1
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }
    return true;
  }
  
  // 判断是否在同一集合
  isConnected(x: number, y: number): boolean {
    return this.find(x) === this.find(y);
  }
}`,
  supportedViews: ['graph'],
  parameters: [
    { name: 'nodeCount', type: 'number', default: 10, min: 5, max: 15 },
    { name: 'unionCount', type: 'number', default: 6, min: 3, max: 12 }
  ]
};
