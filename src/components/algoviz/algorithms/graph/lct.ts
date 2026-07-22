/**
 * Link-Cut Tree (LCT)
 * Uses Splay tree to maintain preferred paths
 * 
 * Time Complexity: Amortized O(log V) per operation
 * Space Complexity: O(V)
 * 
 * Supports dynamic tree operations: link, cut, path queries.
 * Used for dynamic connectivity and dynamic MST.
 */

import type { AlgorithmDefinition } from '../../types';

export const lctDefinition: AlgorithmDefinition = {
  id: 'lct',
  name: 'Link-Cut Tree (LCT)',
  category: 'tree',
  timeComplexity: '均摊 O(log V)',
  spaceComplexity: 'O(V)',
  description: '使用Splay树维护偏爱路径的动态树数据结构。支持link、cut、路径查询等操作，均摊复杂度O(log V)。适用于动态连通性、动态MST等问题。',
  code: `class LinkCutTree {
  constructor(n) {
    this.n = n;
    this.nodes = Array.from({ length: n }, (_, i) => ({
      val: 0,
      sum: 0,
      rev: false,
      fa: -1,
      ch: [-1, -1]  // [left, right children]
    }));
  }
  
  // Check if x is root of its auxiliary tree
  isRoot(x) {
    const fa = this.nodes[x].fa;
    return fa === -1 || (this.nodes[fa].ch[0] !== x && this.nodes[fa].ch[1] !== x);
  }
  
  // Push down reverse tag
  pushDown(x) {
    if (this.nodes[x].rev) {
      this.nodes[x].rev = false;
      const [l, r] = this.nodes[x].ch;
      if (l !== -1) {
        [this.nodes[l].ch[0], this.nodes[l].ch[1]] = [this.nodes[l].ch[1], this.nodes[l].ch[0]];
        this.nodes[l].rev = !this.nodes[l].rev;
      }
      if (r !== -1) {
        [this.nodes[r].ch[0], this.nodes[r].ch[1]] = [this.nodes[r].ch[1], this.nodes[r].ch[0]];
        this.nodes[r].rev = !this.nodes[r].rev;
      }
    }
  }
  
  // Update sum from children
  pushUp(x) {
    const [l, r] = this.nodes[x].ch;
    this.nodes[x].sum = this.nodes[x].val;
    if (l !== -1) this.nodes[x].sum += this.nodes[l].sum;
    if (r !== -1) this.nodes[x].sum += this.nodes[r].sum;
  }
  
  // Rotate x
  rotate(x) {
    const y = this.nodes[x].fa;
    const z = this.nodes[y].fa;
    const k = this.nodes[y].ch[1] === x;
    
    if (!this.isRoot(y)) {
      this.nodes[z].ch[this.nodes[z].ch[1] === y] = x;
    }
    this.nodes[x].fa = z;
    
    const w = this.nodes[x].ch[k ^ 1];
    this.nodes[y].ch[k] = w;
    if (w !== -1) this.nodes[w].fa = y;
    
    this.nodes[x].ch[k ^ 1] = y;
    this.nodes[y].fa = x;
    
    this.pushUp(y);
    this.pushUp(x);
  }
  
  // Splay x to root of its auxiliary tree
  splay(x) {
    const stack = [x];
    for (let y = x; !this.isRoot(y); y = this.nodes[y].fa) {
      stack.push(this.nodes[y].fa);
    }
    while (stack.length > 0) {
      this.pushDown(stack.pop());
    }
    
    while (!this.isRoot(x)) {
      const y = this.nodes[x].fa;
      const z = this.nodes[y].fa;
      
      if (!this.isRoot(y)) {
        if ((this.nodes[y].ch[1] === x) === (this.nodes[z].ch[1] === y)) {
          this.rotate(y);
        } else {
          this.rotate(x);
        }
      }
      this.rotate(x);
    }
  }
  
  // Make x the root of the represented tree
  makeRoot(x) {
    this.access(x);
    this.splay(x);
    [this.nodes[x].ch[0], this.nodes[x].ch[1]] = [this.nodes[x].ch[1], this.nodes[x].ch[0]];
    this.nodes[x].rev = !this.nodes[x].rev;
  }
  
  // Find root of represented tree containing x
  findRoot(x) {
    this.access(x);
    this.splay(x);
    while (this.nodes[x].ch[0] !== -1) {
      this.pushDown(x);
      x = this.nodes[x].ch[0];
    }
    this.splay(x);
    return x;
  }
  
  // Create path from root to x
  access(x) {
    let last = -1;
    while (x !== -1) {
      this.splay(x);
      this.nodes[x].ch[1] = last;
      this.pushUp(x);
      last = x;
      x = this.nodes[x].fa;
    }
  }
  
  // Get path from x to y (y becomes root, x is in splay)
  split(x, y) {
    this.makeRoot(x);
    this.access(y);
    this.splay(y);
  }
  
  // Link x and y (add edge)
  link(x, y) {
    this.makeRoot(x);
    if (this.findRoot(y) !== x) {
      this.nodes[x].fa = y;
    }
  }
  
  // Cut edge between x and y
  cut(x, y) {
    this.split(x, y);
    if (this.nodes[y].ch[0] === x && this.nodes[x].ch[1] === -1) {
      this.nodes[y].ch[0] = -1;
      this.nodes[x].fa = -1;
      this.pushUp(y);
    }
  }
  
  // Check if x and y are connected
  connected(x, y) {
    return this.findRoot(x) === this.findRoot(y);
  }
  
  // Query path sum from x to y
  query(x, y) {
    this.split(x, y);
    return this.nodes[y].sum;
  }
  
  // Update value at node x
  update(x, val) {
    this.splay(x);
    this.nodes[x].val = val;
    this.pushUp(x);
  }
}

// Usage:
// const lct = new LinkCutTree(n);
// lct.link(0, 1);  // Add edge
// lct.cut(0, 1);   // Remove edge
// lct.connected(0, 1);  // Check connectivity
// lct.query(0, 1);  // Path query`,
  supportedViews: ['tree'],
  parameters: [
    { name: 'nodes', type: 'number', default: 8, min: 4, max: 12 }
  ]
};
