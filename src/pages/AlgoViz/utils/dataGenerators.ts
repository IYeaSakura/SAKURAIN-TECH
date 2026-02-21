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
}

export function generateDAG(options: DAGGeneratorOptions = {}): GraphData {
  const {
    nodeCount = 10,
    layerCount = 4,
    edgeDensity = 0.4
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

  for (let i = 0; i < nodeCount; i++) {
    const currentLayer = nodes[i].layer!;
    const nextLayerStart = (currentLayer + 1) * nodesPerLayer;

    // 确保不是最后一层的节点有出边
    if (nextLayerStart < nodeCount) {
      const targetCount = Math.min(nodesPerLayer, nodeCount - nextLayerStart);
      const target = nextLayerStart + Math.floor(Math.random() * targetCount);
      
      if (!adj.get(i)!.has(target)) {
        adj.get(i)!.add(target);
        edges.push({ from: i, to: target });
      }
    }

    // 根据密度添加额外边
    for (let j = i + 1; j < nodeCount; j++) {
      if (nodes[j].layer! > currentLayer && Math.random() < edgeDensity) {
        if (!adj.get(i)!.has(j)) {
          adj.get(i)!.add(j);
          edges.push({ from: i, to: j });
        }
      }
    }
  }

  // 计算入度
  edges.forEach(e => {
    nodes[e.to].inDegree!++;
    nodes[e.to].tempInDegree = nodes[e.to].inDegree;
  });

  return { nodes, edges, directed: true, weighted: false };
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
  
  while (queue.length > 0 && nodeId < 20) {
    const current = queue.shift()!;
    
    if (current.depth < maxDepth) {
      const childCount = Math.floor(Math.random() * maxChildren) + (type === 'binary' ? 0 : 1);
      
      for (let i = 0; i < childCount && nodeId < 20; i++) {
        nodeId++;
        nodes.push({ id: nodeId, value: Math.floor(Math.random() * 100), depth: current.depth + 1 });
        edges.push({ from: current.id, to: nodeId });
        queue.push({ id: nodeId, depth: current.depth + 1 });
      }
    }
  }
  
  return { nodes, edges };
}

// ============ DP数据生成器 ============

export interface KnapsackGeneratorOptions {
  itemCount?: number;
  minWeight?: number;
  maxWeight?: number;
  minValue?: number;
  maxValue?: number;
  capacityRatio?: number; // 容量与总重量的比例
}

export function generateKnapsackData(options: KnapsackGeneratorOptions = {}) {
  const {
    itemCount = 6,
    minWeight = 1,
    maxWeight = 10,
    minValue = 10,
    maxValue = 100,
    capacityRatio = 0.5
  } = options;

  const weights: number[] = [];
  const values: number[] = [];
  let totalWeight = 0;

  for (let i = 0; i < itemCount; i++) {
    const w = minWeight + Math.floor(Math.random() * (maxWeight - minWeight + 1));
    const v = minValue + Math.floor(Math.random() * (maxValue - minValue + 1));
    weights.push(w);
    values.push(v);
    totalWeight += w;
  }

  const capacity = Math.floor(totalWeight * capacityRatio);

  return { weights, values, capacity };
}

export interface LCSGeneratorOptions {
  length1?: number;
  length2?: number;
  alphabet?: string;
  similarity?: number; // 0-1，相似度
}

export function generateLCSData(options: LCSGeneratorOptions = {}) {
  const {
    length1 = 8,
    length2 = 8,
    alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    similarity = 0.4
  } = options;

  // 生成公共子序列
  const lcsLength = Math.floor(Math.min(length1, length2) * similarity);
  let commonSubseq = '';
  for (let i = 0; i < lcsLength; i++) {
    commonSubseq += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  // 构建str1
  let str1 = '';
  let commonIdx = 0;
  for (let i = 0; i < length1; i++) {
    if (commonIdx < lcsLength && Math.random() < 0.5) {
      str1 += commonSubseq[commonIdx++];
    } else {
      str1 += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }

  // 构建str2
  let str2 = '';
  commonIdx = 0;
  for (let i = 0; i < length2; i++) {
    if (commonIdx < lcsLength && Math.random() < 0.5) {
      str2 += commonSubseq[commonIdx++];
    } else {
      str2 += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }

  return { str1, str2 };
}
