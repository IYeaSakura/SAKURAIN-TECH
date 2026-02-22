/**
 * Heavy-Light Decomposition (HLD)
 * Query: O(log² V)
 * 
 * Decomposes tree into heavy paths for efficient path queries.
 * Uses DFS order to convert tree paths to array ranges.
 */

import type { AlgorithmDefinition } from '../../types';

export const hldDefinition: AlgorithmDefinition = {
  id: 'hld',
  name: '树链剖分 (HLD)',
  category: 'tree',
  timeComplexity: '查询 O(log² V)',
  spaceComplexity: 'O(V)',
  description: '将树分解为重链，使得任意路径最多经过O(log V)条重链。通过DFS序将树上路径转化为数组区间，支持路径修改/查询。适用于树上路径问题。',
  code: `class HeavyLightDecomposition {
  constructor(adj, values = null) {
    this.n = adj.length;
    this.adj = adj;
    
    // Node properties
    this.parent = new Array(this.n).fill(-1);
    this.depth = new Array(this.n).fill(0);
    this.size = new Array(this.n).fill(0);      // Subtree size
    this.heavy = new Array(this.n).fill(-1);    // Heavy child
    
    // HLD properties
    this.head = new Array(this.n).fill(0);      // Head of heavy path
    this.pos = new Array(this.n).fill(0);       // Position in base array
    this.values = values || new Array(this.n).fill(0);
    
    // Base array for segment tree
    this.baseArray = new Array(this.n).fill(0);
    this.currentPos = 0;
    
    // First DFS: compute size and heavy child
    this.dfs(0, -1);
    
    // Second DFS: decompose into paths
    this.decompose(0, 0);
    
    // Build segment tree on base array
    this.segTree = new SegmentTree(this.baseArray);
  }
  
  dfs(node, par) {
    this.parent[node] = par;
    this.size[node] = 1;
    let maxSubtree = 0;
    
    for (const child of this.adj[node]) {
      if (child !== par) {
        this.depth[child] = this.depth[node] + 1;
        this.dfs(child, node);
        this.size[node] += this.size[child];
        
        if (this.size[child] > maxSubtree) {
          maxSubtree = this.size[child];
          this.heavy[node] = child;
        }
      }
    }
  }
  
  decompose(node, head) {
    this.head[node] = head;
    this.pos[node] = this.currentPos;
    this.baseArray[this.currentPos] = this.values[node];
    this.currentPos++;
    
    // Decompose heavy child first (same head)
    if (this.heavy[node] !== -1) {
      this.decompose(this.heavy[node], head);
    }
    
    // Decompose light children (new head)
    for (const child of this.adj[node]) {
      if (child !== this.parent[node] && child !== this.heavy[node]) {
        this.decompose(child, child);
      }
    }
  }
  
  // Query on path from u to v
  queryPath(u, v) {
    let result = 0;
    
    while (this.head[u] !== this.head[v]) {
      if (this.depth[this.head[u]] > this.depth[this.head[v]]) {
        [u, v] = [v, u];
      }
      
      // Query on current heavy path
      const currentHead = this.head[v];
      result = Math.max(result, this.segTree.query(this.pos[currentHead], this.pos[v]));
      v = this.parent[currentHead];
    }
    
    // Same heavy path
    if (this.depth[u] > this.depth[v]) {
      [u, v] = [v, u];
    }
    result = Math.max(result, this.segTree.query(this.pos[u], this.pos[v]));
    
    return result;
  }
  
  // Update value on path from u to v
  updatePath(u, v, value) {
    while (this.head[u] !== this.head[v]) {
      if (this.depth[this.head[u]] > this.depth[this.head[v]]) {
        [u, v] = [v, u];
      }
      
      const currentHead = this.head[v];
      this.segTree.update(this.pos[currentHead], this.pos[v], value);
      v = this.parent[currentHead];
    }
    
    if (this.depth[u] > this.depth[v]) {
      [u, v] = [v, u];
    }
    this.segTree.update(this.pos[u], this.pos[v], value);
  }
  
  // LCA using HLD
  lca(u, v) {
    while (this.head[u] !== this.head[v]) {
      if (this.depth[this.head[u]] > this.depth[this.head[v]]) {
        [u, v] = [v, u];
      }
      v = this.parent[this.head[v]];
    }
    return this.depth[u] < this.depth[v] ? u : v;
  }
}

// Simple segment tree for range max query
class SegmentTree {
  constructor(arr) {
    this.n = arr.length;
    this.tree = new Array(4 * this.n).fill(0);
    this.build(arr, 0, 0, this.n - 1);
  }
  
  build(arr, node, l, r) {
    if (l === r) {
      this.tree[node] = arr[l];
      return;
    }
    const mid = Math.floor((l + r) / 2);
    this.build(arr, 2 * node + 1, l, mid);
    this.build(arr, 2 * node + 2, mid + 1, r);
    this.tree[node] = Math.max(this.tree[2 * node + 1], this.tree[2 * node + 2]);
  }
  
  query(l, r) {
    return this.queryHelper(0, 0, this.n - 1, l, r);
  }
  
  queryHelper(node, nl, nr, ql, qr) {
    if (ql > nr || qr < nl) return 0;
    if (ql <= nl && nr <= qr) return this.tree[node];
    const mid = Math.floor((nl + nr) / 2);
    return Math.max(
      this.queryHelper(2 * node + 1, nl, mid, ql, qr),
      this.queryHelper(2 * node + 2, mid + 1, nr, ql, qr)
    );
  }
  
  update(l, r, value) {
    // Simplified: point update
    this.updateHelper(0, 0, this.n - 1, l, value);
  }
  
  updateHelper(node, nl, nr, idx, value) {
    if (nl === nr) {
      this.tree[node] = value;
      return;
    }
    const mid = Math.floor((nl + nr) / 2);
    if (idx <= mid) {
      this.updateHelper(2 * node + 1, nl, mid, idx, value);
    } else {
      this.updateHelper(2 * node + 2, mid + 1, nr, idx, value);
    }
    this.tree[node] = Math.max(this.tree[2 * node + 1], this.tree[2 * node + 2]);
  }
}`,
  supportedViews: ['tree'],
  parameters: [
    { name: 'nodes', type: 'number', default: 10, min: 5, max: 15 }
  ]
};
