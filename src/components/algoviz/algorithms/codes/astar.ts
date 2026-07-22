/**
 * A* (A-Star) 最短路径算法
 * 基于Dijkstra + 启发式函数
 * 时间复杂度: O((V + E) log V)
 * 空间复杂度: O(V)
 */

import type { AlgorithmDefinition } from '../../types';

export const astarDefinition: AlgorithmDefinition = {
  id: 'astar',
  name: 'A* (A-Star) 寻路',
  category: 'graph',
  timeComplexity: 'O((V + E) log V)',
  spaceComplexity: 'O(V)',
  description: '启发式搜索算法，结合Dijkstra和启发式函数f(n)=g(n)+h(n)。适用于网格地图寻路，支持曼哈顿距离和欧几里得距离两种启发函数。可视化展示openSet、closedSet和f/g/h值的计算过程。',
  code: `function astar(grid, start, goal, heuristic = 'manhattan') {
  // 初始化openSet（优先队列）和closedSet
  const openSet = new PriorityQueue();
  const closedSet = new Set();
  
  // g: 从起点到当前节点的实际代价
  // h: 从当前节点到终点的估计代价（启发函数）
  // f: g + h
  const gScore = new Map();
  const hScore = new Map();
  const fScore = new Map();
  const cameFrom = new Map(); // 记录路径
  
  // 初始化起点
  gScore.set(start, 0);
  hScore.set(start, heuristic(start, goal));
  fScore.set(start, hScore.get(start));
  openSet.enqueue(start, fScore.get(start));
  
  while (!openSet.isEmpty()) {
    // 取出f值最小的节点
    const current = openSet.dequeue();
    
    // 到达目标
    if (current === goal) {
      return reconstructPath(cameFrom, current);
    }
    
    closedSet.add(current);
    
    // 遍历邻居
    for (const neighbor of getNeighbors(grid, current)) {
      if (closedSet.has(neighbor)) continue; // 已在关闭集合
      if (grid.isObstacle(neighbor)) continue; // 障碍物
      
      const tentativeG = gScore.get(current) + dist(current, neighbor);
      
      if (!openSet.contains(neighbor)) {
        // 发现新节点
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeG);
        hScore.set(neighbor, heuristic(neighbor, goal));
        fScore.set(neighbor, tentativeG + hScore.get(neighbor));
        openSet.enqueue(neighbor, fScore.get(neighbor));
      } else if (tentativeG < gScore.get(neighbor)) {
        // 找到更好的路径
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeG);
        fScore.set(neighbor, tentativeG + hScore.get(neighbor));
        openSet.updatePriority(neighbor, fScore.get(neighbor));
      }
    }
  }
  
  return null; // 无路径
}

// 启发式函数：曼哈顿距离（适合四方向移动）
function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// 启发式函数：欧几里得距离（适合八方向移动）
function euclidean(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

// 获取邻居节点（四方向或八方向）
function getNeighbors(grid, node) {
  const neighbors = [];
  const directions = [
    { x: 0, y: -1 }, // 上
    { x: 0, y: 1 },  // 下
    { x: -1, y: 0 }, // 左
    { x: 1, y: 0 }   // 右
  ];
  
  for (const dir of directions) {
    const nx = node.x + dir.x;
    const ny = node.y + dir.y;
    if (grid.isValid(nx, ny)) {
      neighbors.push({ x: nx, y: ny });
    }
  }
  return neighbors;
}

// 重建路径
function reconstructPath(cameFrom, current) {
  const path = [current];
  while (cameFrom.has(current)) {
    current = cameFrom.get(current);
    path.unshift(current);
  }
  return path;
}

// 最小优先队列
class PriorityQueue {
  constructor() {
    this.heap = [];
    this.nodeSet = new Set();
  }
  
  enqueue(node, priority) {
    this.heap.push({ node, priority });
    this.nodeSet.add(nodeKey(node));
    this.bubbleUp(this.heap.length - 1);
  }
  
  dequeue() {
    if (this.isEmpty()) return null;
    const min = this.heap[0];
    const end = this.heap.pop();
    this.nodeSet.delete(nodeKey(min.node));
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return min.node;
  }
  
  contains(node) {
    return this.nodeSet.has(nodeKey(node));
  }
  
  updatePriority(node, newPriority) {
    const index = this.heap.findIndex(item => 
      item.node.x === node.x && item.node.y === node.y
    );
    if (index !== -1) {
      this.heap[index].priority = newPriority;
      this.bubbleUp(index);
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
}

function nodeKey(node) {
  return \`\${node.x},\${node.y}\`;
}`,
  supportedViews: ['grid'],
  parameters: [
    { name: 'gridSize', type: 'number', default: 15, min: 5, max: 30 },
    { name: 'obstacleRate', type: 'number', default: 0.3, min: 0.1, max: 0.5 },
    { 
      name: 'heuristic', 
      type: 'select', 
      default: 'manhattan',
      options: [
        { label: '曼哈顿距离', value: 'manhattan' },
        { label: '欧几里得距离', value: 'euclidean' }
      ]
    }
  ]
};
