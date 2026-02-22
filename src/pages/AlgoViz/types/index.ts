/**
 * 算法可视化平台 - 类型定义模块
 * 所有类型定义集中管理，便于独立项目使用
 */

// ============ 基础类型 ============
export type AlgorithmCategory = 'sorting' | 'graph' | 'tree' | 'dp' | 'ml';

export type AlgorithmId = 
  | 'bubble' | 'selection' | 'insertion' | 'shell' | 'quick' | 'merge' | 'heap'
  | 'counting' | 'radix' | 'bucket' | 'timsort'
  | 'bfs' | 'dfs' | 'dijkstra' | 'astar'
  | 'topo' | 'scc' | 'kosaraju' | 'tarjan'
  | 'knapsack' | 'lcs' | 'lis'
  | 'bst' | 'avl' | 'rb-tree'
  | 'perceptron' | 'kmeans' | 'gradient' | 'neuralnet';

// ============ 算法定义 ============
export interface AlgorithmDefinition {
  id: AlgorithmId;
  name: string;
  description: string;
  category: AlgorithmCategory;
  timeComplexity: string;
  spaceComplexity: string;
  code: string;
  codeLanguage?: string;
  supportedViews: ViewType[];
  parameters?: AlgorithmParameter[];
}

export interface AlgorithmParameter {
  name: string;
  type: 'number' | 'boolean' | 'select';
  default: any;
  min?: number;
  max?: number;
  options?: { label: string; value: any }[];
}

// ============ 可视化类型 ============
export type ViewType = 'array' | 'graph' | 'tree' | 'grid' | 'matrix' | 'canvas-2d' | 'canvas-3d';

export interface VisualizationConfig {
  width: number;
  height: number;
  padding: number;
  nodeRadius: number;
  colors: ColorScheme;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
}

// ============ 执行状态 ============
export interface ExecutionState {
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  currentStep: number;
  totalSteps: number;
  currentLine: number;
  message: string;
  variables: VariableState[];
}

export interface VariableState {
  name: string;
  value: any;
  type: 'primitive' | 'array' | 'object';
  highlight?: boolean;
}

// ============ 排序算法数据 ============
export interface SortingData {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  pivot?: number;
}

export interface SortingState {
  data: SortingData;
  stats: {
    comparisons: number;
    swaps: number;
  };
}

// ============ 图算法数据 ============
export interface GraphNode {
  id: number;
  x: number;
  y: number;
  label?: string;
  // 算法状态
  visited?: boolean;
  inStack?: boolean;
  inQueue?: boolean;
  isProcessing?: boolean;
  isInQueue?: boolean;
  // 拓扑排序
  inDegree?: number;
  tempInDegree?: number;
  // SCC
  component?: number;
  finishTime?: number;
  // 最短路
  distance?: number;
  parent?: number | null;
  // 布局
  layer?: number;
}

export interface GraphEdge {
  from: number;
  to: number;
  weight?: number;
  // 状态
  highlighted?: boolean;
  visited?: boolean;
  isReverse?: boolean; // 用于SCC反向图
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed: boolean;
  weighted: boolean;
}

export interface GraphState {
  highlightedEdges: Set<string>;
  highlightedNodes: Set<number>;
  phase?: string;
  queue?: number[];
  stack?: number[];
  currentNode?: number;
  result?: number[]; // 拓扑排序结果
}

// ============ 树算法数据 ============
export interface TreeNode {
  id: number;
  value: any;
  x?: number;
  y?: number;
  parent?: number | null;
  children: number[];
  // 状态
  visited?: boolean;
  highlighted?: boolean;
  // BST/AVL
  height?: number;
  balance?: number;
  // 遍历
  inOrder?: number;
  preOrder?: number;
  postOrder?: number;
}

export interface TreeData {
  nodes: Map<number, TreeNode>;
  root: number | null;
}

// ============ 动态规划数据 ============
export interface DPTable {
  table: number[][];
  currentCell?: [number, number];
  highlightedCells?: [number, number][];
  path?: [number, number][];
}

export interface DPLCSData {
  str1: string;
  str2: string;
  dp: DPTable;
  lcs: string;
}

export interface DPKnapsackData {
  weights: number[];
  values: number[];
  capacity: number;
  dp: DPTable;
  selectedItems: number[];
}

// ============ 内存状态 ============
export interface MemoryCell {
  name: string;
  value: any;
  type: 'primitive' | 'array' | 'reference' | 'temp';
  address?: string;
  isHighlighted?: boolean;
  description?: string;
}

export interface MemoryState {
  // 主数组
  mainArray?: {
    name: string;
    data: number[];
    indices?: number[];
  };
  // 辅助数组/临时数组
  auxiliaryArrays?: {
    name: string;
    data: any[];
    description?: string;
  }[];
  // 变量
  variables: MemoryCell[];
  // 栈帧（用于递归算法）
  callStack?: {
    functionName: string;
    parameters: MemoryCell[];
    localVariables: MemoryCell[];
  }[];
  // 内存使用统计
  stats?: {
    totalBytes: number;
    arrayBytes: number;
    variableBytes: number;
    auxiliaryBytes: number;
  };
}

// ============ 步骤记录 ============
export interface AlgorithmStep {
  id: number;
  lineNumber: number;
  description: string;
  data: any;
  variables: VariableState[];
  highlights: {
    nodes?: number[];
    edges?: string[];
    arrayIndices?: number[];
    tableCells?: [number, number][];
  };
  // 排序算法专用状态
  sortingState?: {
    comparing: number[];
    swapping: number[];
    sorted: number[];
    pivot?: number;
  };
  // 内存状态快照
  memory?: MemoryState;
}

// ============ 导出配置 ============
export interface ExportConfig {
  format: 'json' | 'markdown' | 'pdf';
  includeSteps: boolean;
  includeCode: boolean;
  includeVisualization: boolean;
}

// ============ 主题配置 ============
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  colors: ColorScheme;
  fontFamily: string;
  fontSize: number;
  borderRadius: number;
  animationSpeed: number;
}
