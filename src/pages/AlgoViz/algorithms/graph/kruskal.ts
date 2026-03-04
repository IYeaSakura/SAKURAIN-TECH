/**
 * Kruskal 算法可视化
 * 最小生成树 - 贪心策略
 * 
 * @author OpenClaw Auto-Dev
 */

import type { GraphAlgorithm, GraphEdge, GraphNode } from "../../types";

export interface KruskalState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  mstEdges: GraphEdge[];
  currentEdge?: GraphEdge;
  ufParent: number[];
  totalWeight: number;
  phase: "sort" | "process" | "complete";
  message: string;
}

export const kruskalAlgorithm: GraphAlgorithm<KruskalState> = {
  name: "Kruskal",
  description: "最小生成树 - 按边权排序，不形成环则选取",
  category: "graph",

  getInitialState(nodes, edges) {
    const n = nodes.length;
    return {
      nodes: nodes.map((n) => ({ ...n, highlighted: false })),
      edges: edges.map((e) => ({ ...e, highlighted: false, inMST: false })),
      mstEdges: [],
      ufParent: Array(n)
        .fill(0)
        .map((_, i) => i),
      totalWeight: 0,
      phase: "sort",
      message: "准备开始 Kruskal 算法，首先按边权排序",
    };
  },

  *execute(state) {
    const { nodes, edges, ufParent } = state;
    const n = nodes.length;

    yield {
      ...state,
      phase: "sort",
      message: "按边权从小到大排序...",
    };

    const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);

    yield {
      ...state,
      edges: sortedEdges.map((e, i) => ({ ...e, highlighted: i < 3 })),
      phase: "process",
      message: `排序完成，开始处理 ${sortedEdges.length} 条边`,
    };

    const find = (x: number): number => {
      if (ufParent[x] !== x) {
        ufParent[x] = find(ufParent[x]);
      }
      return ufParent[x];
    };

    const union = (x: number, y: number) => {
      const px = find(x),
        py = find(y);
      if (px !== py) {
        ufParent[px] = py;
      }
    };

    const mstEdges: GraphEdge[] = [];
    let totalWeight = 0;

    for (
      let i = 0;
      i < sortedEdges.length && mstEdges.length < n - 1;
      i++
    ) {
      const edge = sortedEdges[i];
      const u = nodes.findIndex((n) => n.id === edge.source);
      const v = nodes.findIndex((n) => n.id === edge.target);

      yield {
        ...state,
        currentEdge: edge,
        edges: sortedEdges.map((e, idx) => ({
          ...e,
          highlighted: idx === i,
          inMST: e.inMST || mstEdges.some((me) => me.id === e.id),
        })),
        mstEdges,
        totalWeight,
        message: `检查边 ${edge.source}-${edge.target} (权重: ${edge.weight})`,
      };

      if (find(u) !== find(v)) {
        union(u, v);
        mstEdges.push(edge);
        totalWeight += edge.weight;

        yield {
          ...state,
          currentEdge: edge,
          edges: sortedEdges.map((e) => ({
            ...e,
            highlighted: false,
            inMST: mstEdges.some((me) => me.id === e.id),
          })),
          mstEdges: [...mstEdges],
          ufParent: [...ufParent],
          totalWeight,
          message: `✓ 选取边 ${edge.source}-${edge.target}，当前 MST 权重: ${totalWeight}`,
        };
      } else {
        yield {
          ...state,
          edges: sortedEdges.map((e, idx) => ({
            ...e,
            highlighted: false,
            inMST: mstEdges.some((me) => me.id === e.id),
          })),
          mstEdges,
          message: `✗ 边 ${edge.source}-${edge.target} 会形成环，跳过`,
        };
      }
    }

    yield {
      ...state,
      currentEdge: undefined,
      edges: sortedEdges.map((e) => ({
        ...e,
        inMST: mstEdges.some((me) => me.id === e.id),
      })),
      mstEdges,
      totalWeight,
      phase: "complete",
      message: `✅ Kruskal 完成！MST 包含 ${mstEdges.length} 条边，总权重: ${totalWeight}`,
    };
  },

  getCode(): string {
    return `// Kruskal 算法 - 最小生成树
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
  union(x: number, y: number): boolean {
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
}`;
  },
};
