/**
 * 图数据导入解析器
 * 支持格式：
 * 1. 边列表: "0->1, 0->2, 1->3, 2->3"
 * 2. JSON: {"nodes": 4, "edges": [[0,1], [0,2], [1,3], [2,3]]}
 * 3. 简单格式: "4 nodes: 0-1, 0-2, 1-3, 2-3"
 */

import type { GraphData, GraphNode, GraphEdge } from '../types';

export interface ParsedGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  error?: string;
}

/**
 * 解析图数据字符串
 */
export function parseGraphData(input: string, width = 800, height = 500): ParsedGraphData {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { nodes: [], edges: [], error: '请输入图数据' };
  }

  // 尝试 JSON 格式
  if (trimmed.startsWith('{')) {
    return parseJSONFormat(trimmed, width, height);
  }

  // 尝试边列表格式 (0->1, 0->2)
  if (trimmed.includes('->') || trimmed.includes('-')) {
    return parseEdgeListFormat(trimmed, width, height);
  }

  return { nodes: [], edges: [], error: '无法识别的格式，请使用边列表格式(0->1,1->2)或JSON格式' };
}

/**
 * 解析 JSON 格式
 */
function parseJSONFormat(input: string, width: number, height: number): ParsedGraphData {
  try {
    const data = JSON.parse(input);
    
    if (!data.edges || !Array.isArray(data.edges)) {
      return { nodes: [], edges: [], error: 'JSON格式错误：缺少edges数组' };
    }

    const nodeCount = data.nodes || Math.max(...data.edges.flat()) + 1;
    
    if (nodeCount > 20) {
      return { nodes: [], edges: [], error: '节点数过多（最多20个）' };
    }

    // 检测环
    const hasCycle = detectCycle(data.edges, nodeCount);
    if (hasCycle) {
      return { nodes: [], edges: [], error: '图中存在环，无法进行拓扑排序' };
    }

    // 创建节点和边
    const { nodes, edges } = createGraphFromEdges(data.edges, nodeCount, width, height);
    
    return { nodes, edges };
  } catch (e) {
    return { nodes: [], edges: [], error: 'JSON解析错误：' + (e as Error).message };
  }
}

/**
 * 解析边列表格式
 */
function parseEdgeListFormat(input: string, width: number, height: number): ParsedGraphData {
  // 提取节点数（如果指定了）
  const nodeCountMatch = input.match(/(\d+)\s*nodes?[:\s]/i);
  let nodeCount = 0;
  
  // 解析边
  const edges: [number, number][] = [];
  const edgeStrings = input.split(/[,，;；]/);
  
  for (const edgeStr of edgeStrings) {
    const trimmed = edgeStr.trim();
    if (!trimmed) continue;
    
    // 匹配 0->1 或 0-1 格式
    const match = trimmed.match(/(\d+)\s*(->|-)\s*(\d+)/);
    if (match) {
      const from = parseInt(match[1]);
      const to = parseInt(match[3]);
      
      if (isNaN(from) || isNaN(to)) {
        return { nodes: [], edges: [], error: `无效的边格式: ${trimmed}` };
      }
      
      if (from === to) {
        return { nodes: [], edges: [], error: `不允许自环: ${from}->${to}` };
      }
      
      edges.push([from, to]);
      nodeCount = Math.max(nodeCount, from + 1, to + 1);
    }
  }
  
  if (edges.length === 0) {
    return { nodes: [], edges: [], error: '未找到有效的边' };
  }
  
  // 使用指定的节点数或推断的节点数
  if (nodeCountMatch) {
    nodeCount = Math.max(nodeCount, parseInt(nodeCountMatch[1]));
  }
  
  if (nodeCount > 20) {
    return { nodes: [], edges: [], error: '节点数过多（最多20个）' };
  }
  
  // 检测环
  const hasCycle = detectCycle(edges, nodeCount);
  if (hasCycle) {
    return { nodes: [], edges: [], error: '图中存在环，无法进行拓扑排序' };
  }
  
  // 创建节点和边
  const { nodes, edges: graphEdges } = createGraphFromEdges(edges, nodeCount, width, height);
  
  return { nodes, edges: graphEdges };
}

/**
 * 检测图中是否存在环（使用DFS）
 */
function detectCycle(edges: [number, number][], nodeCount: number): boolean {
  // 构建邻接表
  const adj: number[][] = Array.from({ length: nodeCount }, () => []);
  edges.forEach(([from, to]) => {
    if (from < nodeCount && to < nodeCount) {
      adj[from].push(to);
    }
  });
  
  const visited = new Array(nodeCount).fill(false);
  const recStack = new Array(nodeCount).fill(false);
  
  function dfs(node: number): boolean {
    visited[node] = true;
    recStack[node] = true;
    
    for (const neighbor of adj[node]) {
      if (!visited[neighbor]) {
        if (dfs(neighbor)) return true;
      } else if (recStack[neighbor]) {
        return true;
      }
    }
    
    recStack[node] = false;
    return false;
  }
  
  for (let i = 0; i < nodeCount; i++) {
    if (!visited[i]) {
      if (dfs(i)) return true;
    }
  }
  
  return false;
}

/**
 * 根据边创建图数据（自动分层布局）
 */
function createGraphFromEdges(
  edges: [number, number][], 
  nodeCount: number, 
  width: number, 
  height: number
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const padding = 80;
  
  // 计算每个节点的层级（拓扑分层）
  const layers = calculateLayers(edges, nodeCount);
  const maxLayer = Math.max(...layers);
  
  // 创建节点
  const nodes: GraphNode[] = [];
  const layerWidth = maxLayer > 0 ? (width - 2 * padding) / maxLayer : width - 2 * padding;
  
  // 统计每层节点数
  const layerCounts: number[] = [];
  layers.forEach((layer) => {
    if (!layerCounts[layer]) layerCounts[layer] = 0;
    layerCounts[layer]++;
  });
  
  // 记录每层当前已放置的节点数
  const layerCurrent: number[] = new Array(maxLayer + 1).fill(0);
  
  for (let i = 0; i < nodeCount; i++) {
    const layer = layers[i];
    const count = layerCounts[layer];
    const index = layerCurrent[layer]++;
    
    // 在层内均匀分布
    const layerHeight = height - 2 * padding;
    const spacing = count > 1 ? layerHeight / (count - 1) : 0;
    
    nodes.push({
      id: i,
      x: padding + layer * layerWidth,
      y: count > 1 ? padding + index * spacing : height / 2,
      layer,
      inDegree: 0,
      tempInDegree: 0,
      visited: false,
      isProcessing: false,
      inQueue: false
    });
  }
  
  // 创建边
  const graphEdges: GraphEdge[] = edges.map(([from, to]) => ({
    from,
    to
  }));
  
  // 计算入度
  graphEdges.forEach(e => {
    if (e.to < nodes.length) {
      nodes[e.to].inDegree!++;
      nodes[e.to].tempInDegree = nodes[e.to].inDegree;
    }
  });
  
  return { nodes, edges: graphEdges };
}

/**
 * 计算每个节点的层级（拓扑分层）
 */
function calculateLayers(edges: [number, number][], nodeCount: number): number[] {
  // 使用BFS计算层级
  const layers = new Array(nodeCount).fill(-1);
  const inDegree = new Array(nodeCount).fill(0);
  
  // 计算入度
  edges.forEach(([, to]) => {
    if (to < nodeCount) inDegree[to]++;
  });
  
  // 找到所有入度为0的节点（源点），设为第0层
  const queue: number[] = [];
  for (let i = 0; i < nodeCount; i++) {
    if (inDegree[i] === 0) {
      layers[i] = 0;
      queue.push(i);
    }
  }
  
  // BFS遍历
  while (queue.length > 0) {
    const u = queue.shift()!;
    
    // 找到所有从u出发的边
    edges.forEach(([from, to]) => {
      if (from === u && to < nodeCount) {
        // 更新目标节点的层级
        if (layers[to] < layers[u] + 1) {
          layers[to] = layers[u] + 1;
          queue.push(to);
        }
      }
    });
  }
  
  // 处理未访问到的节点（可能有环，但前面已检测）
  for (let i = 0; i < nodeCount; i++) {
    if (layers[i] === -1) layers[i] = 0;
  }
  
  return layers;
}

/**
 * 验证并格式化图数据
 */
export function validateGraphData(data: GraphData): { valid: boolean; error?: string } {
  if (!data.nodes || data.nodes.length === 0) {
    return { valid: false, error: '图中没有节点' };
  }
  
  if (data.nodes.length > 20) {
    return { valid: false, error: '节点数过多（最多20个）' };
  }
  
  if (!data.edges || data.edges.length === 0) {
    return { valid: false, error: '图中没有边' };
  }
  
  // 检查边是否有效
  const nodeIds = new Set(data.nodes.map(n => n.id));
  for (const edge of data.edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      return { valid: false, error: `边 ${edge.from}->${edge.to} 引用了不存在的节点` };
    }
  }
  
  return { valid: true };
}
