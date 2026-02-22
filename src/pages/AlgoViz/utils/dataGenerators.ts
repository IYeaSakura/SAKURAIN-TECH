/**
 * 算法可视化平台 - 数据生成器模块
 * 智能生成适合教学演示的数据，保证复杂度适中且有教学价值
 */

import type { GraphNode, GraphEdge, GraphData, SortingData } from '../types';

// ============ 排序数据生成器 ============

export interface SortingGeneratorOptions {
  size?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: 'random' | 'nearly-sorted' | 'reversed' | 'few-unique';
}

export function generateSortingData(options: SortingGeneratorOptions = {}): SortingData {
  const {
    size = 15,
    minValue = 10,
    maxValue = 100,
    pattern = 'random'
  } = options;

  const array: number[] = [];

  switch (pattern) {
    case 'random':
      // 完全随机
      for (let i = 0; i < size; i++) {
        array.push(minValue + Math.floor(Math.random() * (maxValue - minValue)));
      }
      break;

    case 'nearly-sorted':
      // 接近有序（70%有序，30%随机）- 适合演示优化算法
      for (let i = 0; i < size; i++) {
        if (Math.random() < 0.7) {
          array.push(minValue + Math.floor((i / size) * (maxValue - minValue)));
        } else {
          array.push(minValue + Math.floor(Math.random() * (maxValue - minValue)));
        }
      }
      break;

    case 'reversed':
      // 完全逆序 - 适合演示最坏情况
      for (let i = 0; i < size; i++) {
        array.push(maxValue - Math.floor((i / size) * (maxValue - minValue)));
      }
      break;

    case 'few-unique':
      // 少数几个不同值 - 适合演示稳定性
      const uniqueValues = [30, 50, 70, 90];
      for (let i = 0; i < size; i++) {
        array.push(uniqueValues[Math.floor(Math.random() * uniqueValues.length)]);
      }
      break;
  }

  return {
    array,
    comparing: [],
    swapping: [],
    sorted: []
  };
}

// ============ 图数据生成器 ============

export interface DAGGeneratorOptions {
  nodeCount?: number;
  layerCount?: number;
  edgeDensity?: number; // 0-1，边的密度
  pattern?: 'random' | 'linear' | 'diamond' | 'hourglass' | 'butterfly';
}

export function generateDAG(options: DAGGeneratorOptions = {}): GraphData {
  const {
    nodeCount = 10,
    layerCount = 4,
    edgeDensity = 0.4,
    pattern = 'random'
  } = options;

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const width = 800;
  const height = 500;
  const padding = 80;

  const nodesPerLayer = Math.ceil(nodeCount / layerCount);
  const layerWidth = (width - 2 * padding) / (layerCount - 1 || 1);

  // 创建节点并分配层
  let nodeId = 0;
  for (let layer = 0; layer < layerCount && nodeId < nodeCount; layer++) {
    const count = Math.min(nodesPerLayer, nodeCount - nodeId);
    const layerHeight = height - 2 * padding;
    const spacing = count > 1 ? layerHeight / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      nodes.push({
        id: nodeId,
        x: padding + layer * layerWidth,
        y: count > 1 ? padding + i * spacing : height / 2,
        inDegree: 0,
        tempInDegree: 0,
        layer,
        visited: false,
        isProcessing: false,
        inQueue: false
      });
      nodeId++;
    }
  }

  // 创建边（确保DAG）
  const adj = new Map<number, Set<number>>();
  nodes.forEach(n => adj.set(n.id, new Set()));

  // 根据模式创建边
  switch (pattern) {
    case 'linear':
      // 线性链：每个节点只连接到下一层的一个节点
      createLinearEdges(nodes, edges, adj, nodesPerLayer, layerCount);
      break;
    case 'diamond':
      // 菱形：从窄到宽再到窄
      createDiamondEdges(nodes, edges, adj, nodesPerLayer, layerCount, edgeDensity);
      break;
    case 'hourglass':
      // 沙漏形：中间窄两端宽
      createHourglassEdges(nodes, edges, adj, nodesPerLayer, layerCount, edgeDensity);
      break;
    case 'butterfly':
      // 蝴蝶形：展示多个并行路径
      createButterflyEdges(nodes, edges, adj, nodesPerLayer, layerCount, edgeDensity);
      break;
    default:
      // 随机模式（使用网格布局确保整齐）
      createRandomEdges(nodes, edges, adj, nodesPerLayer, layerCount, edgeDensity, nodeCount);
  }

  // 计算入度
  edges.forEach(e => {
    nodes[e.to].inDegree!++;
    nodes[e.to].tempInDegree = nodes[e.to].inDegree;
  });

  return { nodes, edges, directed: true, weighted: false };
}

// 线性边
function createLinearEdges(nodes: GraphNode[], edges: GraphEdge[], adj: Map<number, Set<number>>, nodesPerLayer: number, layerCount: number) {
  for (let layer = 0; layer < layerCount - 1; layer++) {
    const start = layer * nodesPerLayer;
    const end = Math.min(start + nodesPerLayer, nodes.length);
    const nextStart = (layer + 1) * nodesPerLayer;
    const nextEnd = Math.min(nextStart + nodesPerLayer, nodes.length);
    
    // 每个节点连接到下一层对应位置的节点
    for (let i = start; i < end && i - start < nextEnd - nextStart; i++) {
      const target = nextStart + (i - start);
      if (target < nodes.length && !adj.get(i)!.has(target)) {
        adj.get(i)!.add(target);
        edges.push({ from: i, to: target });
      }
    }
  }
}

// 菱形边
function createDiamondEdges(nodes: GraphNode[], edges: GraphEdge[], adj: Map<number, Set<number>>, nodesPerLayer: number, layerCount: number, edgeDensity: number) {
  const midLayer = Math.floor(layerCount / 2);
  
  for (let layer = 0; layer < layerCount - 1; layer++) {
    const start = layer * nodesPerLayer;
    const end = Math.min(start + nodesPerLayer, nodes.length);
    const nextStart = (layer + 1) * nodesPerLayer;
    const nextEnd = Math.min(nextStart + nodesPerLayer, nodes.length);
    
    // 前一半层：向外扩散
    // 后一半层：向内收缩
    for (let i = start; i < end; i++) {
      const offset = i - start;
      // 主要连接到对应位置的节点
      const primaryTarget = nextStart + Math.min(offset, nextEnd - nextStart - 1);
      if (primaryTarget < nodes.length && !adj.get(i)!.has(primaryTarget)) {
        adj.get(i)!.add(primaryTarget);
        edges.push({ from: i, to: primaryTarget });
      }
      
      // 可能连接到相邻节点
      if (Math.random() < edgeDensity) {
        const neighborTarget = primaryTarget + (layer < midLayer ? 1 : -1);
        if (neighborTarget >= nextStart && neighborTarget < nextEnd && !adj.get(i)!.has(neighborTarget)) {
          adj.get(i)!.add(neighborTarget);
          edges.push({ from: i, to: neighborTarget });
        }
      }
    }
  }
}

// 沙漏形边
function createHourglassEdges(nodes: GraphNode[], edges: GraphEdge[], adj: Map<number, Set<number>>, nodesPerLayer: number, layerCount: number, _edgeDensity: number) {
  const midLayer = Math.floor(layerCount / 2);
  
  for (let layer = 0; layer < layerCount - 1; layer++) {
    const start = layer * nodesPerLayer;
    const end = Math.min(start + nodesPerLayer, nodes.length);
    const nextStart = (layer + 1) * nodesPerLayer;
    // const nextEnd = Math.min(nextStart + nodesPerLayer, nodes.length); // 未使用
    
    for (let i = start; i < end; i++) {
      const offset = i - start;
      
      // 中间层节点多，边缘层节点少
      const layerSize = layer < midLayer ? 
        Math.max(1, nodesPerLayer - layer) : 
        Math.max(1, nodesPerLayer - (layerCount - 1 - layer));
      
      if (offset < layerSize) {
        // 计算目标位置
        const ratio = offset / Math.max(1, layerSize - 1);
        const nextLayerSize = layer + 1 < midLayer ?
          Math.max(1, nodesPerLayer - (layer + 1)) :
          Math.max(1, nodesPerLayer - (layerCount - 2 - layer));
        const targetOffset = Math.floor(ratio * Math.max(1, nextLayerSize - 1));
        const target = nextStart + targetOffset;
        
        if (target < nodes.length && !adj.get(i)!.has(target)) {
          adj.get(i)!.add(target);
          edges.push({ from: i, to: target });
        }
      }
    }
  }
}

// 蝴蝶形边
function createButterflyEdges(nodes: GraphNode[], edges: GraphEdge[], adj: Map<number, Set<number>>, nodesPerLayer: number, layerCount: number, edgeDensity: number) {
  const midLayer = Math.floor(layerCount / 2);
  
  for (let layer = 0; layer < layerCount - 1; layer++) {
    const start = layer * nodesPerLayer;
    const end = Math.min(start + nodesPerLayer, nodes.length);
    const nextStart = (layer + 1) * nodesPerLayer;
    const nextEnd = Math.min(nextStart + nodesPerLayer, nodes.length);
    
    for (let i = start; i < end; i++) {
      const offset = i - start;
      const layerSize = end - start;
      const nextLayerSize = nextEnd - nextStart;
      
      // 连接到下一层的对应位置
      const targetOffset = Math.floor((offset / Math.max(1, layerSize - 1)) * Math.max(1, nextLayerSize - 1));
      const target = nextStart + targetOffset;
      
      if (target < nodes.length && !adj.get(i)!.has(target)) {
        adj.get(i)!.add(target);
        edges.push({ from: i, to: target });
      }
      
      // 在蝴蝶中间交叉连接
      if (layer === midLayer - 1 || layer === midLayer) {
        const crossTarget = nextStart + nextLayerSize - 1 - targetOffset;
        if (crossTarget !== target && crossTarget < nodes.length && !adj.get(i)!.has(crossTarget)) {
          adj.get(i)!.add(crossTarget);
          edges.push({ from: i, to: crossTarget });
        }
      }
      
      // 随机额外边
      if (Math.random() < edgeDensity * 0.5) {
        const randomTarget = nextStart + Math.floor(Math.random() * nextLayerSize);
        if (randomTarget < nodes.length && !adj.get(i)!.has(randomTarget)) {
          adj.get(i)!.add(randomTarget);
          edges.push({ from: i, to: randomTarget });
        }
      }
    }
  }
}

// 网格位置类型
interface GridPosition {
  col: number;
  row: number;
  x: number;
  y: number;
}

// 创建网格布局 - 确保节点整齐不重叠
function createGridLayout(nodeCount: number, width: number, height: number, padding: number): GridPosition[] {
  // 根据节点数确定网格大小（优先横向延伸，从左到右流向）
  let cols: number, rows: number;
  if (nodeCount <= 6) {
    cols = 3; rows = 2;
  } else if (nodeCount <= 8) {
    cols = 4; rows = 2;
  } else if (nodeCount <= 9) {
    cols = 3; rows = 3;
  } else if (nodeCount <= 12) {
    cols = 4; rows = 3;
  } else if (nodeCount <= 15) {
    cols = 5; rows = 3;
  } else if (nodeCount <= 16) {
    cols = 4; rows = 4;
  } else {
    cols = 5; rows = 4;
  }
  
  // 生成所有网格位置
  const available: GridPosition[] = [];
  const cellWidth = (width - 2 * padding) / (cols - 1 || 1);
  const cellHeight = (height - 2 * padding) / (rows - 1 || 1);
  
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      available.push({
        col: c,
        row: r,
        x: cols === 1 ? width / 2 : padding + c * cellWidth,
        y: rows === 1 ? height / 2 : padding + r * cellHeight
      });
    }
  }
  
  // 随机打乱并选取前nodeCount个位置
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  
  return available.slice(0, nodeCount);
}

// 完全随机边（使用网格布局确保整齐）
function createRandomEdges(nodes: GraphNode[], edges: GraphEdge[], adj: Map<number, Set<number>>, _nodesPerLayer: number, _layerCount: number, edgeDensity: number, nodeCount: number) {
  const width = 800;
  const height = 500;
  const padding = 80;
  
  // 使用网格布局 - 确保节点整齐不重叠
  const gridPositions = createGridLayout(nodeCount, width, height, padding);
  
  // 按列排序（从左到右）确保DAG性质
  gridPositions.sort((a, b) => {
    if (a.col !== b.col) return a.col - b.col;
    return a.row - b.row;
  });
  
  // 分配位置给节点（带小幅随机扰动使布局更自然）
  nodes.forEach((node, i) => {
    const pos = gridPositions[i];
    // 小幅随机扰动（最大±20px）让布局更自然
    const jitterX = (Math.random() - 0.5) * 40;
    const jitterY = (Math.random() - 0.5) * 40;
    node.x = pos.x + jitterX;
    node.y = pos.y + jitterY;
    node.layer = pos.col; // 使用列作为层，确保从左到右流向
  });

  // 按x坐标排序节点（确保DAG）
  const sortedNodes = [...nodes].sort((a, b) => a.x - b.x);

  // 随机生成边（只从左边的节点指向右边的节点，确保无环）
  const minEdges = Math.max(nodeCount - 1, Math.floor(nodeCount * 0.8));
  const maxEdges = Math.floor(nodeCount * 1.8);
  const targetEdgeCount = Math.floor(minEdges + (maxEdges - minEdges) * edgeDensity);
  
  // 首先确保每个节点（除了最后一个）至少有一条出边 - 优先连接相邻或近邻节点
  for (let i = 0; i < sortedNodes.length - 1; i++) {
    const fromNode = sortedNodes[i];
    // 优先选择相邻的节点（跳跃1-3个节点）
    const maxJump = Math.min(3, sortedNodes.length - i - 1);
    const jump = 1 + Math.floor(Math.random() * maxJump);
    const target = sortedNodes[i + jump];
    
    if (!adj.get(fromNode.id)!.has(target.id)) {
      adj.get(fromNode.id)!.add(target.id);
      edges.push({ from: fromNode.id, to: target.id });
    }
  }
  
  // 添加额外的随机边（优先连接距离较近的节点，避免过长的跨越边）
  let attempts = 0;
  while (edges.length < targetEdgeCount && attempts < 1000) {
    const fromIdx = Math.floor(Math.random() * (sortedNodes.length - 1));
    // 限制跳跃距离，优先连接相邻或近邻节点
    const maxJump = Math.min(3, sortedNodes.length - fromIdx - 1);
    if (maxJump < 1) {
      attempts++;
      continue;
    }
    const jump = 1 + Math.floor(Math.random() * maxJump);
    const toIdx = fromIdx + jump;
    
    const fromNode = sortedNodes[fromIdx];
    const toNode = sortedNodes[toIdx];
    
    if (!adj.get(fromNode.id)!.has(toNode.id)) {
      adj.get(fromNode.id)!.add(toNode.id);
      edges.push({ from: fromNode.id, to: toNode.id });
    }
    attempts++;
  }
}


export interface SCCGeneratorOptions {
  sccCount?: number;
  minNodesPerSCC?: number;
  maxNodesPerSCC?: number;
}

export function generateSCCGraph(options: SCCGeneratorOptions = {}): GraphData {
  const {
    sccCount = 3,
    minNodesPerSCC = 3,
    maxNodesPerSCC = 4
  } = options;

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const width = 800;
  const height = 500;

  // 生成每个SCC的大小
  const sccSizes: number[] = [];
  for (let i = 0; i < sccCount; i++) {
    sccSizes.push(minNodesPerSCC + Math.floor(Math.random() * (maxNodesPerSCC - minNodesPerSCC + 1)));
  }

  // 创建节点
  let nodeId = 0;
  for (let sccIdx = 0; sccIdx < sccCount; sccIdx++) {
    const size = sccSizes[sccIdx];
    const centerX = (width / (sccCount + 1)) * (sccIdx + 1);
    const centerY = height / 2;
    const radius = 100;

    for (let i = 0; i < size; i++) {
      const angle = (i / size) * 2 * Math.PI - Math.PI / 2;
      nodes.push({
        id: nodeId,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        visited: false,
        inStack: false,
        component: -1,
        layer: sccIdx
      });
      nodeId++;
    }
  }

  // 添加SCC内部边（强连通）
  let startIdx = 0;
  for (let sccIdx = 0; sccIdx < sccCount; sccIdx++) {
    const size = sccSizes[sccIdx];

    // 基础环
    for (let i = 0; i < size; i++) {
      const from = startIdx + i;
      const to = startIdx + ((i + 1) % size);
      edges.push({ from, to });
    }

    // 额外边确保强连通
    if (size > 2) {
      for (let i = 0; i < size - 2; i++) {
        const from = startIdx + i;
        const to = startIdx + i + 2;
        edges.push({ from, to });
      }
    }

    startIdx += size;
  }

  // 添加SCC之间的边（单向，从编号小到大）
  startIdx = 0;
  for (let sccIdx = 0; sccIdx < sccCount - 1; sccIdx++) {
    const fromSize = sccSizes[sccIdx];
    const toStart = startIdx + fromSize;

    // 每个SCC至少一条边到下一个SCC
    const from = startIdx + Math.floor(Math.random() * fromSize);
    const to = toStart + Math.floor(Math.random() * sccSizes[sccIdx + 1]);
    edges.push({ from, to });

    // 可能再添加一条
    if (Math.random() < 0.5) {
      const from2 = startIdx + Math.floor(Math.random() * fromSize);
      const to2 = toStart + Math.floor(Math.random() * sccSizes[sccIdx + 1]);
      if (from2 !== from || to2 !== to) {
        edges.push({ from: from2, to: to2 });
      }
    }

    startIdx += fromSize;
  }

  return { nodes, edges, directed: true, weighted: false };
}

export interface GraphGeneratorOptions {
  nodeCount?: number;
  edgeCount?: number;
  directed?: boolean;
  weighted?: boolean;
  minWeight?: number;
  maxWeight?: number;
  connected?: boolean;
}

export function generateRandomGraph(options: GraphGeneratorOptions = {}): GraphData {
  const {
    nodeCount = 8,
    edgeCount = 12,
    directed = false,
    weighted = false,
    minWeight = 1,
    maxWeight = 10,
    connected = true
  } = options;

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const width = 800;
  const height = 500;

  // 在圆形区域内随机分布节点
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 80;

  for (let i = 0; i < nodeCount; i++) {
    const angle = (i / nodeCount) * 2 * Math.PI;
    const r = radius * (0.5 + Math.random() * 0.5);
    nodes.push({
      id: i,
      x: centerX + Math.cos(angle) * r,
      y: centerY + Math.sin(angle) * r,
      visited: false
    });
  }

  // 确保连通性（生成树）
  if (connected) {
    for (let i = 1; i < nodeCount; i++) {
      const parent = Math.floor(Math.random() * i);
      edges.push({
        from: parent,
        to: i,
        weight: weighted ? minWeight + Math.floor(Math.random() * (maxWeight - minWeight + 1)) : undefined
      });
    }
  }

  // 添加额外边
  const existingEdges = new Set(edges.map(e => `${e.from}-${e.to}`));
  let attempts = 0;
  while (edges.length < edgeCount && attempts < 1000) {
    const from = Math.floor(Math.random() * nodeCount);
    const to = Math.floor(Math.random() * nodeCount);
    
    if (from !== to) {
      const key1 = `${from}-${to}`;
      const key2 = `${to}-${from}`;
      
      if (!existingEdges.has(key1) && !existingEdges.has(key2)) {
        edges.push({
          from,
          to,
          weight: weighted ? minWeight + Math.floor(Math.random() * (maxWeight - minWeight + 1)) : undefined
        });
        existingEdges.add(key1);
        if (!directed) existingEdges.add(key2);
      }
    }
    attempts++;
  }

  return { nodes, edges, directed, weighted };
}

// ============ 树数据生成器 ============

export interface TreeGeneratorOptions {
  maxDepth?: number;
  maxChildren?: number;
  type?: 'binary' | 'n-ary';
}

export function generateRandomTree(options: TreeGeneratorOptions = {}) {
  const { maxDepth = 4, maxChildren = 2, type = 'binary' } = options;
  
  // 简化的树生成器
  const nodes: any[] = [];
  const edges: any[] = [];
  
  let nodeId = 0;
  const queue: { id: number; depth: number }[] = [{ id: 0, depth: 0 }];
  
  nodes.push({ id: 0, value: Math.floor(Math.random() * 100), depth: 0 });
  
  while (queue.length > 0 && nodes.length < 20) {
    const { id: parentId, depth } = queue.shift()!;
    
    if (depth >= maxDepth) continue;
    
    const childrenCount = type === 'binary' 
      ? Math.floor(Math.random() * 3) // 0-2 children for binary
      : 1 + Math.floor(Math.random() * maxChildren);
    
    for (let i = 0; i < childrenCount; i++) {
      if (nodes.length >= 20) break;
      
      nodeId++;
      nodes.push({
        id: nodeId,
        value: Math.floor(Math.random() * 100),
        depth: depth + 1
      });
      
      edges.push({ from: parentId, to: nodeId });
      queue.push({ id: nodeId, depth: depth + 1 });
    }
  }
  
  return { nodes, edges };
}
