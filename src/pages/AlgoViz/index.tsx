/**
 * 算法可视化平台 - 主入口
 * 
 * 高度模块化设计：
 * - types/: 类型定义
 * - algorithms/: 算法定义和代码
 * - components/: 可视化组件
 * - hooks/: 自定义hooks
 * - utils/: 工具函数（数据生成器等）
 * 
 * 特性：
 * - 左右分栏布局：左侧大画布，右侧控制面板
 * - 代码与动画逐帧同步
 * - 高度可交互：播放、暂停、单步、调速
 * - 智能数据生成器
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Zap, Binary, GitBranch, Network, Grid3X3, Brain, FileCode, BarChart3,
  Play, Pause, RotateCcw, SkipBack, SkipForward, Shuffle, BookOpen,
  Maximize2, Minimize2, Upload, Check, X
} from 'lucide-react';
import { Footer } from '@/components/sections/Footer';
import { CommentSection } from '@/pages/Blog/components/CommentSection';

// 导入模块
import { ALL_ALGORITHMS, getAlgorithmsByCategory, getCodeTemplates } from './algorithms';
import { useAlgorithmRunner } from './hooks/useAlgorithmRunner';
import { generateSortingData, generateDAG, generateSCCGraph, generateWeightedGraph, generateNegativeWeightGraph, generateTeachingGraph, generateRandomGraph } from './utils/dataGenerators';
import { generateGridMap, type GridMapData } from './utils/gridMapGenerator';
import { parseGraphData, validateGraphData } from './utils/graphDataParser';

// 导入组件
import {
  ArrayVisualizer,
  GraphVisualizer,
  CodePanel,
  Legend,
  CodeTemplateModal,
  ComplexityChartModal,
  MemoryVisualizer
} from './components';

// 导入类型
import type { 
  AlgorithmDefinition, 
  AlgorithmCategory, 
  SortingData, 
  GraphData, 
  GraphState,
  AlgorithmStep,
  MemoryState,
  MemoryCell,
  GraphNode,
  GraphEdge
} from './types';

import './algo-visualizer.css';

// 深拷贝节点数组辅助函数
const cloneNodes = (nodes: GraphNode[]): GraphNode[] => {
  return nodes.map(n => ({ ...n }));
};

// 分类配置
const CATEGORIES: { id: AlgorithmCategory; name: string; icon: React.ReactNode }[] = [
  { id: 'sorting', name: '排序算法', icon: <Binary size={24} /> },
  { id: 'graph', name: '图算法', icon: <GitBranch size={24} /> },
  { id: 'tree', name: '树算法', icon: <Network size={24} /> },
  { id: 'dp', name: '动态规划', icon: <Grid3X3 size={24} /> },
  { id: 'ml', name: '机器学习', icon: <Brain size={24} /> }
];

// ============ 算法游乐场组件 ============
interface AlgorithmPlaygroundProps {
  currentAlgo: AlgorithmDefinition;
  onAlgorithmChange: (algo: AlgorithmDefinition) => void;
}

const AlgorithmPlayground: React.FC<AlgorithmPlaygroundProps> = ({ currentAlgo, onAlgorithmChange }) => {
  
  // 执行器 - 默认速度200ms
  const runner = useAlgorithmRunner({ initialSpeed: 200 });
  
  // 数据状态
  const [sortingData, setSortingData] = useState<SortingData>({ array: [], comparing: [], swapping: [], sorted: [] });
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [], directed: true, weighted: false });
  const [graphState, setGraphState] = useState<GraphState>({ highlightedEdges: new Set(), highlightedNodes: new Set() });
  
  // 数组大小状态（用于排序算法）
  const [arraySize, setArraySize] = useState<number>(12);
  
  // 弹窗状态
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  
  // 全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playgroundRef = useRef<HTMLDivElement>(null);
  
  // 数组导入弹窗状态
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  
  // 图导入弹窗状态
  const [isGraphImportModalOpen, setIsGraphImportModalOpen] = useState(false);
  const [graphImportInput, setGraphImportInput] = useState('');
  const [graphImportError, setGraphImportError] = useState<string | null>(null);
  
  // 拓扑排序图形模式
  const [dagPattern, setDagPattern] = useState<'random' | 'linear' | 'diamond' | 'hourglass' | 'butterfly'>('random');
  
  // Negative weight graph pattern
  const [negativeGraphPattern, setNegativeGraphPattern] = useState<'random' | 'simple' | 'negative-cycle' | 'complex'>('simple');
  
  // Floyd-Warshall matrix state
  const [_matrixData, setMatrixData] = useState<{
    dist: number[][];
    next: number[][];
    size: number;
    currentK: number;
    currentI: number;
    currentJ: number;
    updated: boolean;
    completed: boolean;
  }>({
    dist: [],
    next: [],
    size: 0,
    currentK: -1,
    currentI: -1,
    currentJ: -1,
    updated: false,
    completed: false
  });
  
  // BFS/DFS start node
  const [startNode, setStartNode] = useState<number>(0);
  
  // Grid map state (for A* and other grid-based pathfinding algorithms)
  const [_gridMapData, setGridMapData] = useState<GridMapData | null>(null);
  const [_gridPattern, _setGridPattern] = useState<'random' | 'maze' | 'rooms' | 'corridors'>('random');
  const [_gridSize, _setGridSize] = useState<number>(15);
  const [_obstacleRate, _setObstacleRate] = useState<number>(0.3);
  const [_heuristicType, _setHeuristicType] = useState<'manhattan' | 'euclidean'>('manhattan');

  // Refs用于控制执行流程
  const isPausedRef = useRef<boolean>(false);
  const shouldStopRef = useRef<boolean>(false);
  const speedRef = useRef<number>(runner.speed);
  const initialArrayRef = useRef<number[]>([]); // 保存初始数组

  // 同步速度到 ref（这样可以在异步函数中获取最新值）
  useEffect(() => {
    speedRef.current = runner.speed;
  }, [runner.speed]);

  // 同步暂停状态到 ref
  useEffect(() => {
    isPausedRef.current = runner.isPaused;
  }, [runner.isPaused]);

  // 获取当前分类的算法
  const categoryAlgorithms = getAlgorithmsByCategory(currentAlgo.category);

  // 从步骤数据恢复排序状态
  const restoreSortingStateFromStep = useCallback((step: AlgorithmStep | null) => {
    if (!step) return;
    
    const data = step.data;
    if (data && data.array) {
      setSortingData({
        array: data.array,
        comparing: step.sortingState?.comparing || step.highlights?.arrayIndices || [],
        swapping: step.sortingState?.swapping || [],
        sorted: step.sortingState?.sorted || []
      });
    }
  }, []);

  // 从步骤数据恢复图状态
  const restoreGraphStateFromStep = useCallback((step: AlgorithmStep | null) => {
    if (!step) return;
    
    const data = step.data;
    if (data && data.nodes) {
      // 深拷贝节点数据确保状态不会被覆盖
      const restoredNodes = data.nodes.map((n: any) => ({ ...n }));
      
      // 恢复节点和边数据
      setGraphData(prev => ({
        ...prev,
        nodes: restoredNodes,
        edges: data.edges || prev.edges,
        directed: true,
        weighted: false
      }));
      
      // 恢复图状态（高亮等）
      const highlightedNodes = new Set<number>(step.highlights?.nodes || []);
      const highlightedEdges = new Set<string>(step.highlights?.edges || []);
      
      // 从变量中恢复队列和当前节点
      const queueVar = step.variables.find(v => v.name === 'queue');
      const queue = queueVar ? 
        queueVar.value.toString().replace(/[\[\]]/g, '').split(',').filter((s: string) => s.trim()).map(Number).filter((n: number) => !isNaN(n)) : 
        [];
      
      // 尝试从内存状态恢复栈（用于DFS等算法）
      const stackVar = step.variables.find(v => v.name === 'stack');
      const stack = stackVar ? 
        stackVar.value.toString().replace(/[\[\]]/g, '').split(',').filter((s: string) => s.trim()).map(Number).filter((n: number) => !isNaN(n)) : 
        [];
      
      const uVar = step.variables.find(v => v.name === 'u');
      const currentNode = uVar && uVar.value !== undefined && uVar.value !== '' ? Number(uVar.value) : undefined;
      
      setGraphState(prev => ({
        ...prev,
        highlightedEdges,
        highlightedNodes,
        queue,
        stack,
        currentNode: isNaN(currentNode as number) ? undefined : currentNode,
        phase: step.description.includes('完成') ? 'completed' : 'running'
      }));
    }
  }, []);

  // 步骤变化时恢复状态（复盘模式）
  useEffect(() => {
    if (runner.isReviewMode && runner.currentStep) {
      if (currentAlgo.category === 'sorting') {
        restoreSortingStateFromStep(runner.currentStep);
      } else if (currentAlgo.category === 'graph') {
        restoreGraphStateFromStep(runner.currentStep);
      }
    }
  }, [runner.currentStep, runner.isReviewMode, restoreSortingStateFromStep, restoreGraphStateFromStep, currentAlgo.category]);

  // 生成数据
  const generateData = useCallback(() => {
    // 停止当前运行
    shouldStopRef.current = true;
    runner.stop();
    initialArrayRef.current = []; // 清空初始数组引用
    
    if (currentAlgo.category === 'sorting') {
      const data = generateSortingData({ 
        size: arraySize, 
        pattern: 'random',
        minValue: 10,
        maxValue: 99
      });
      setSortingData(data);
    } else if (currentAlgo.id === 'topo') {
      const data = generateDAG({ 
        nodeCount: 10, 
        layerCount: 4, 
        edgeDensity: 0.4,
        pattern: dagPattern 
      });
      setGraphData(data);
    } else if (currentAlgo.id === 'scc') {
      const data = generateSCCGraph({ sccCount: 3, minNodesPerSCC: 3, maxNodesPerSCC: 4 });
      setGraphData(data);
    } else if (currentAlgo.id === 'kruskal' || currentAlgo.id === 'prim') {
      // 为MST算法生成带权无向图
      const data = generateWeightedGraph({ 
        nodeCount: 8, 
        edgeDensity: 0.5,
        minWeight: 1,
        maxWeight: 20
      });
      setGraphData(data);
    } else if (currentAlgo.id === 'bfs' || currentAlgo.id === 'dfs') {
      // 为BFS/DFS生成一个连通的无向图
      const data = generateRandomGraph({ 
        nodeCount: 8, 
        edgeCount: 12, 
        directed: false,
        connected: true 
      });
      setGraphData(data);
      // 随机选择起始节点
      const randomStart = Math.floor(Math.random() * data.nodes.length);
      setStartNode(randomStart);
    } else if (currentAlgo.id === 'floyd') {
      const data = generateWeightedGraph({ nodeCount: 6, edgeDensity: 0.5 });
      setGraphData(data);
      // 初始化距离矩阵
      const n = data.nodes.length;
      const dist: number[][] = Array.from({ length: n }, (_, i) => 
        Array.from({ length: n }, (_, j) => i === j ? 0 : Infinity)
      );
      // 填充已知边权重
      data.edges.forEach(edge => {
        if (edge.weight !== undefined) {
          dist[edge.from][edge.to] = edge.weight;
        }
      });
      setMatrixData({
        dist,
        next: Array.from({ length: n }, () => Array(n).fill(-1)),
        size: n,
        currentK: -1,
        currentI: -1,
        currentJ: -1,
        updated: false,
        completed: false
      });
    } else if (currentAlgo.id === 'bellmanford' || currentAlgo.id === 'spfa') {
      // 为Bellman-Ford/SPFA生成带负权边的图
      if (negativeGraphPattern === 'random') {
        const data = generateNegativeWeightGraph({
          nodeCount: 6,
          edgeCount: 10,
          minWeight: -8,
          maxWeight: 10,
          negativeRatio: 0.3,
          ensureNegativeCycle: false,
          pattern: 'random'
        });
        setGraphData(data);
      } else {
        const data = generateTeachingGraph(negativeGraphPattern);
        setGraphData(data);
      }
    } else if (currentAlgo.id === 'dijkstra') {
      // 生成带权图用于Dijkstra
      const data = generateWeightedGraph({ nodeCount: 8, edgeDensity: 0.5, positiveOnly: true });
      setGraphData(data);
    } else if (currentAlgo.id === 'astar') {
      // Generate grid map for A*
      const data = generateGridMap({ 
        rows: _gridSize, 
        cols: _gridSize, 
        obstacleRate: _obstacleRate,
        pattern: _gridPattern,
        ensurePath: true
      });
      setGridMapData(data);
      setGraphData(data.graphData);
    }
    
    setGraphState({ highlightedEdges: new Set(), highlightedNodes: new Set() });
  }, [currentAlgo.id, currentAlgo.category, arraySize, runner, _gridSize, _obstacleRate, _gridPattern]);

  // 初始化数据 - 只执行一次
  useEffect(() => {
    generateData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 切换算法时重新生成数据
  useEffect(() => {
    generateData();
  }, [currentAlgo.id]);

  // 校验并导入数组
  const handleImportArray = useCallback(() => {
    setImportError(null);
    
    if (!importInput.trim()) {
      setImportError('请输入数组内容');
      return;
    }
    
    // 支持格式: [1,2,3] 或 1,2,3
    let processed = importInput.trim();
    
    // 如果包含方括号，提取内容
    if (processed.startsWith('[') && processed.endsWith(']')) {
      processed = processed.slice(1, -1);
    }
    
    // 分割并解析数字
    const parts = processed.split(/[,，]/);
    const numbers: number[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (part === '') continue;
      
      const num = Number(part);
      if (isNaN(num)) {
        setImportError(`第 ${i + 1} 个元素 "${part}" 不是有效的数字`);
        return;
      }
      
      // 限制数值范围
      if (num < 1 || num > 999) {
        setImportError(`数值 ${num} 超出范围 (1-999)`);
        return;
      }
      
      numbers.push(num);
    }
    
    if (numbers.length < 2) {
      setImportError('数组至少需要包含 2 个元素');
      return;
    }
    
    if (numbers.length > 100) {
      setImportError('数组最多包含 100 个元素');
      return;
    }
    
    // 应用导入的数组
    setSortingData({
      array: numbers,
      comparing: [],
      swapping: [],
      sorted: []
    });
    setArraySize(numbers.length);
    initialArrayRef.current = numbers;
    setImportInput('');
    setIsImportModalOpen(false);
    runner.clearSteps();
  }, [importInput, runner]);

  // 处理图数据导入
  const handleGraphImport = useCallback(() => {
    setGraphImportError(null);
    
    if (!graphImportInput.trim()) {
      setGraphImportError('请输入图数据');
      return;
    }
    
    const result = parseGraphData(graphImportInput);
    
    if (result.error) {
      setGraphImportError(result.error);
      return;
    }
    
    const validation = validateGraphData({ 
      nodes: result.nodes, 
      edges: result.edges, 
      directed: true, 
      weighted: false 
    });
    
    if (!validation.valid) {
      setGraphImportError(validation.error || '图数据无效');
      return;
    }
    
    // 应用导入的图数据
    setGraphData({
      nodes: result.nodes,
      edges: result.edges,
      directed: true,
      weighted: false
    });
    setGraphImportInput('');
    setIsGraphImportModalOpen(false);
    runner.clearSteps();
  }, [graphImportInput, runner]);

  // 等待函数（支持暂停）- 修复版
  const waitWithPause = useCallback(async (ms: number): Promise<boolean> => {
    let elapsed = 0;
    const checkInterval = 20; // 每20ms检查一次
    
    while (elapsed < ms) {
      if (shouldStopRef.current) return false;
      
      // 如果暂停了，等待直到恢复
      if (isPausedRef.current) {
        await new Promise(r => setTimeout(r, checkInterval));
        continue; // 暂停时不增加 elapsed，时间不会流逝
      }
      
      const waitTime = Math.min(checkInterval, ms - elapsed);
      await new Promise(r => setTimeout(r, waitTime));
      elapsed += waitTime;
    }
    
    return !shouldStopRef.current;
  }, []);

  // 构建内存状态
  const buildMemoryState = (
    arr: number[],
    variables: Array<{ name: string; value: any; type?: 'primitive' | 'array' | 'reference' | 'temp' }>,
    options?: {
      auxiliaryArrays?: Array<{ name: string; data: any[]; description?: string }>;
      callStack?: Array<{ functionName: string; parameters: any[]; localVariables: any[] }>;
    }
  ): MemoryState => {
    const varCells: MemoryCell[] = variables.map(v => ({
      name: v.name,
      value: v.value,
      type: v.type || 'primitive',
      isHighlighted: false
    }));
    
    const arrayBytes = arr.length * 8;
    const variableBytes = varCells.length * 8;
    const auxiliaryBytes = options?.auxiliaryArrays?.reduce((sum, a) => sum + a.data.length * 8, 0) || 0;
    
    return {
      mainArray: {
        name: 'arr',
        data: [...arr],
        indices: []
      },
      auxiliaryArrays: options?.auxiliaryArrays,
      variables: varCells,
      callStack: options?.callStack,
      stats: {
        totalBytes: arrayBytes + variableBytes + auxiliaryBytes,
        arrayBytes,
        variableBytes,
        auxiliaryBytes
      }
    };
  };

  // 构建图算法的内存状态
  const buildGraphMemoryState = (
    nodes: GraphNode[],
    edges: GraphEdge[],
    variables: Array<{ name: string; value: any; type?: 'primitive' | 'array' | 'reference' | 'temp' }>,
    options?: {
      adjacencyList?: Map<number, number[]>;
      inDegree?: Map<number, number>;
      queue?: number[];
      result?: number[] | string[];
    }
  ): MemoryState => {
    const varCells: MemoryCell[] = variables.map(v => ({
      name: v.name,
      value: v.value,
      type: v.type || 'primitive',
      isHighlighted: false
    }));

    const auxiliaryArrays: { name: string; data: any[]; description?: string }[] = [];
    
    // 添加邻接表
    if (options?.adjacencyList) {
      const adjData: string[] = [];
      options.adjacencyList.forEach((neighbors, nodeId) => {
        adjData.push(`${nodeId}→[${neighbors.join(', ')}]`);
      });
      auxiliaryArrays.push({
        name: '邻接表',
        data: adjData,
        description: '图的邻接表表示'
      });
    }
    
    // 添加入度数组
    if (options?.inDegree) {
      const inDegreeData: string[] = [];
      options.inDegree.forEach((deg, nodeId) => {
        inDegreeData.push(`节点${nodeId}:${deg}`);
      });
      auxiliaryArrays.push({
        name: '入度表',
        data: inDegreeData,
        description: '每个节点的入度'
      });
    }
    
    // 添加队列
    if (options?.queue !== undefined) {
      auxiliaryArrays.push({
        name: '队列',
        data: options.queue,
        description: '待处理的节点'
      });
    }
    
    // 添加结果
    if (options?.result !== undefined) {
      auxiliaryArrays.push({
        name: '结果序列',
        data: options.result,
        description: '拓扑排序结果'
      });
    }

    const nodeBytes = nodes.length * 16;
    const edgeBytes = edges.length * 8;
    const varBytes = varCells.length * 8;
    const auxBytes = auxiliaryArrays.reduce((sum, a) => sum + a.data.length * 8, 0);

    return {
      variables: varCells,
      auxiliaryArrays,
      callStack: [],
      stats: {
        totalBytes: nodeBytes + edgeBytes + varBytes + auxBytes,
        arrayBytes: nodeBytes,
        variableBytes: varBytes + auxBytes,
        auxiliaryBytes: edgeBytes
      }
    };
  };

  // 冒泡排序执行 - 修复速度和暂停问题
  const runBubbleSort = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;
    
    // 保存初始数组（用于重新播放）
    if (initialArrayRef.current.length === 0) {
      initialArrayRef.current = [...sortingData.array];
    }
    
    const arr = [...initialArrayRef.current];
    const n = arr.length;
    const sorted: number[] = [];
    
    runner.start();
    
    for (let i = 0; i < n - 1; i++) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }
      
      for (let j = 0; j < n - i - 1; j++) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }
        
        // 等待（支持暂停）- 使用 speedRef 获取最新速度
        const currentSpeed = speedRef.current;
        if (!(await waitWithPause(currentSpeed))) {
          runner.stop();
          return;
        }
        
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }
        
        // 高亮比较 - 红色
        setSortingData(prev => ({ ...prev, comparing: [j, j + 1], swapping: [] }));
        runner.recordStep({
          lineNumber: 5,
          description: `比较 arr[${j}]=${arr[j]} 和 arr[${j + 1}]=${arr[j + 1]}`,
          data: { array: [...arr] },
          variables: [{ name: 'i', value: i, type: 'primitive' as const }, { name: 'j', value: j, type: 'primitive' as const }],
          highlights: { arrayIndices: [j, j + 1] },
          sortingState: { comparing: [j, j + 1], swapping: [], sorted: [...sorted] },
          memory: buildMemoryState(arr, [
            { name: 'i', value: i, type: 'primitive' },
            { name: 'j', value: j, type: 'primitive' },
            { name: 'n', value: n, type: 'primitive' }
          ])
        });
        
        // 等待一小段时间显示比较状态
        if (!(await waitWithPause(currentSpeed * 0.3))) {
          runner.stop();
          return;
        }
        
        if (arr[j] > arr[j + 1]) {
          if (shouldStopRef.current) {
            runner.stop();
            return;
          }
          
          // 交换 - 橙色
          setSortingData(prev => ({ ...prev, comparing: [], swapping: [j, j + 1] }));
          runner.recordStep({
            lineNumber: 7,
            description: `${arr[j]} > ${arr[j + 1]}，执行交换`,
            data: { array: [...arr] },
            variables: [],
            highlights: { arrayIndices: [j, j + 1] },
            sortingState: { comparing: [], swapping: [j, j + 1], sorted: [...sorted] },
            memory: buildMemoryState(arr, [
              { name: 'i', value: i, type: 'primitive' },
              { name: 'j', value: j, type: 'primitive' },
              { name: 'n', value: n, type: 'primitive' }
            ])
          });
          
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          setSortingData(prev => ({ ...prev, array: [...arr], comparing: [], swapping: [j, j + 1] }));
          
          // 交换动画等待
          if (!(await waitWithPause(currentSpeed * 0.5))) {
            runner.stop();
            return;
          }
        }
        
        // 清除高亮，回到默认蓝色
        setSortingData(prev => ({ ...prev, comparing: [], swapping: [] }));
      }
      
      sorted.unshift(n - 1 - i);
      // 已排序 - 绿色
      setSortingData(prev => ({ ...prev, sorted: [...sorted] }));
    }
    
    // 最后一个元素也是已排序的
    sorted.unshift(0);
    setSortingData(prev => ({ ...prev, sorted, comparing: [], swapping: [] }));
    
    // 验证排序结果
    const isSorted = arr.every((val, idx) => idx === 0 || arr[idx - 1] <= val);
    
    runner.recordStep({
      lineNumber: 0,
      description: isSorted ? '排序完成！数组已正确排序' : '排序完成！',
      data: { array: [...arr] },
      variables: [],
      highlights: {},
      sortingState: { comparing: [], swapping: [], sorted: [...sorted] },
      memory: buildMemoryState(arr, [
        { name: 'n', value: n, type: 'primitive' }
      ])
    });
    
    runner.setCompleted();
  };

  // 选择排序执行
  const runSelectionSort = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;
    
    // 保存初始数组（用于重新播放）
    if (initialArrayRef.current.length === 0) {
      initialArrayRef.current = [...sortingData.array];
    }
    
    const arr = [...initialArrayRef.current];
    const n = arr.length;
    const sorted: number[] = [];
    
    runner.start();
    
    for (let i = 0; i < n - 1; i++) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }
      
      let minIdx = i;
      
      // 高亮当前位置（将要放置最小值的位置）- 紫色
      setSortingData(prev => ({ ...prev, comparing: [i], swapping: [] }));
      runner.recordStep({
        lineNumber: 4,
        description: `第 ${i + 1} 轮：寻找未排序部分的最小值`,
        data: { array: [...arr] },
        variables: [{ name: 'i', value: i, type: 'primitive' as const }],
        highlights: { arrayIndices: [i] },
        sortingState: { comparing: [i], swapping: [], sorted: [...sorted] },
        memory: buildMemoryState(arr, [
          { name: 'i', value: i, type: 'primitive' },
          { name: 'n', value: n, type: 'primitive' }
        ])
      });
      
      if (!(await waitWithPause(speedRef.current * 0.5))) {
        runner.stop();
        return;
      }
      
      // 在未排序部分寻找最小值
      for (let j = i + 1; j < n; j++) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }
        
        // 高亮比较 - 红色
        setSortingData(prev => ({ ...prev, comparing: [minIdx, j], swapping: [] }));
        runner.recordStep({
          lineNumber: 7,
          description: `比较 arr[${minIdx}]=${arr[minIdx]} 和 arr[${j}]=${arr[j]}`,
          data: { array: [...arr] },
          variables: [{ name: 'i', value: i, type: 'primitive' as const }, { name: 'j', value: j, type: 'primitive' as const }, { name: 'minIdx', value: minIdx, type: 'primitive' as const }],
          highlights: { arrayIndices: [minIdx, j] },
          sortingState: { comparing: [minIdx, j], swapping: [], sorted: [...sorted] },
          memory: buildMemoryState(arr, [
            { name: 'i', value: i, type: 'primitive' },
            { name: 'j', value: j, type: 'primitive' },
            { name: 'minIdx', value: minIdx, type: 'primitive' },
            { name: 'n', value: n, type: 'primitive' }
          ])
        });
        
        if (!(await waitWithPause(speedRef.current * 0.5))) {
          runner.stop();
          return;
        }
        
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
          
          // 找到新的最小值 - 橙色高亮
          setSortingData(prev => ({ ...prev, comparing: [minIdx], swapping: [] }));
          runner.recordStep({
            lineNumber: 8,
            description: `找到更小的值 arr[${minIdx}]=${arr[minIdx]}`,
            data: { array: [...arr] },
            variables: [{ name: 'minIdx', value: minIdx, type: 'primitive' as const }],
            highlights: { arrayIndices: [minIdx] },
            sortingState: { comparing: [minIdx], swapping: [], sorted: [...sorted] },
            memory: buildMemoryState(arr, [
              { name: 'i', value: i, type: 'primitive' },
              { name: 'j', value: j, type: 'primitive' },
              { name: 'minIdx', value: minIdx, type: 'primitive' },
              { name: 'n', value: n, type: 'primitive' }
            ])
          });
          
          if (!(await waitWithPause(speedRef.current * 0.3))) {
            runner.stop();
            return;
          }
        }
      }
      
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }
      
      // 如果需要交换
      if (minIdx !== i) {
        // 高亮交换 - 橙色
        setSortingData(prev => ({ ...prev, comparing: [], swapping: [i, minIdx] }));
        runner.recordStep({
          lineNumber: 12,
          description: `将最小值 ${arr[minIdx]} 交换到位置 ${i}`,
          data: { array: [...arr] },
          variables: [],
          highlights: { arrayIndices: [i, minIdx] },
          sortingState: { comparing: [], swapping: [i, minIdx], sorted: [...sorted] },
          memory: buildMemoryState(arr, [
            { name: 'i', value: i, type: 'primitive' },
            { name: 'minIdx', value: minIdx, type: 'primitive' },
            { name: 'n', value: n, type: 'primitive' }
          ])
        });
        
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        setSortingData(prev => ({ ...prev, array: [...arr], comparing: [], swapping: [i, minIdx] }));
        
        if (!(await waitWithPause(speedRef.current * 0.5))) {
          runner.stop();
          return;
        }
      } else {
        // 无需交换
        runner.recordStep({
          lineNumber: 12,
          description: `arr[${i}] 已是最小值，无需交换`,
          data: { array: [...arr] },
          variables: [],
          highlights: {},
          sortingState: { comparing: [], swapping: [], sorted: [...sorted] },
          memory: buildMemoryState(arr, [
            { name: 'i', value: i, type: 'primitive' },
            { name: 'n', value: n, type: 'primitive' }
          ])
        });
      }
      
      // 标记已排序
      sorted.push(i);
      setSortingData(prev => ({ ...prev, sorted: [...sorted], comparing: [], swapping: [] }));
    }
    
    // 最后一个元素也是已排序的
    sorted.push(n - 1);
    setSortingData(prev => ({ ...prev, sorted, comparing: [], swapping: [] }));
    
    // 验证排序结果
    const isSorted = arr.every((val, idx) => idx === 0 || arr[idx - 1] <= val);
    
    runner.recordStep({
      lineNumber: 0,
      description: isSorted ? '排序完成！数组已正确排序' : '排序完成！',
      data: { array: [...arr] },
      variables: [],
      highlights: {},
      sortingState: { comparing: [], swapping: [], sorted: [...sorted] },
      memory: buildMemoryState(arr, [
        { name: 'n', value: n, type: 'primitive' }
      ])
    });
    
    runner.setCompleted();
  };

  // 插入排序执行
  const runInsertionSort = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;
    
    if (initialArrayRef.current.length === 0) {
      initialArrayRef.current = [...sortingData.array];
    }
    
    const arr = [...initialArrayRef.current];
    const n = arr.length;
    
    runner.start();
    
    for (let i = 1; i < n; i++) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }
      
      const key = arr[i];
      let j = i - 1;
      
      // 高亮当前要插入的元素
      setSortingData(prev => ({ ...prev, comparing: [i], swapping: [] }));
      runner.recordStep({
        lineNumber: 4,
        description: `准备将 ${key} 插入到已排序部分`,
        data: { array: [...arr] },
        variables: [{ name: 'i', value: i, type: 'primitive' as const }, { name: 'key', value: key, type: 'primitive' as const }],
        highlights: { arrayIndices: [i] },
        sortingState: { comparing: [i], swapping: [], sorted: [] },
        memory: buildMemoryState(arr, [
          { name: 'i', value: i, type: 'primitive' },
          { name: 'key', value: key, type: 'temp' },
          { name: 'n', value: n, type: 'primitive' }
        ])
      });
      
      if (!(await waitWithPause(speedRef.current * 0.5))) {
        runner.stop();
        return;
      }
      
      // 向后移动元素
      while (j >= 0 && arr[j] > key) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }
        
        setSortingData(prev => ({ ...prev, comparing: [j, j + 1], swapping: [] }));
        runner.recordStep({
          lineNumber: 7,
          description: `${arr[j]} > ${key}，将 ${arr[j]} 向后移动`,
          data: { array: [...arr] },
          variables: [{ name: 'j', value: j, type: 'primitive' as const }],
          highlights: { arrayIndices: [j, j + 1] },
          sortingState: { comparing: [j, j + 1], swapping: [], sorted: [] },
          memory: buildMemoryState(arr, [
            { name: 'i', value: i, type: 'primitive' },
            { name: 'key', value: key, type: 'temp' },
            { name: 'j', value: j, type: 'primitive' }
          ])
        });
        
        arr[j + 1] = arr[j];
        setSortingData(prev => ({ ...prev, array: [...arr] }));
        
        if (!(await waitWithPause(speedRef.current * 0.5))) {
          runner.stop();
          return;
        }
        
        j--;
      }
      
      arr[j + 1] = key;
      setSortingData(prev => ({ ...prev, array: [...arr], comparing: [], swapping: [] }));
      
      runner.recordStep({
        lineNumber: 11,
        description: `将 ${key} 插入到位置 ${j + 1}`,
        data: { array: [...arr] },
        variables: [],
        highlights: { arrayIndices: [j + 1] },
        sortingState: { comparing: [], swapping: [], sorted: [] },
        memory: buildMemoryState(arr, [
          { name: 'i', value: i, type: 'primitive' },
          { name: 'key', value: key, type: 'temp' },
          { name: 'j', value: j, type: 'primitive' }
        ])
      });
    }
    
    // 标记全部已排序
    setSortingData(prev => ({ ...prev, sorted: Array.from({ length: n }, (_, i) => i) }));
    
    runner.recordStep({
      lineNumber: 0,
      description: '排序完成！数组已正确排序',
      data: { array: [...arr] },
      variables: [],
      highlights: {},
      sortingState: { comparing: [], swapping: [], sorted: Array.from({ length: n }, (_, i) => i) },
      memory: buildMemoryState(arr, [
        { name: 'n', value: n, type: 'primitive' }
      ])
    });
    
    runner.setCompleted();
  };

  // 归并排序执行
  const runMergeSort = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;
    
    if (initialArrayRef.current.length === 0) {
      initialArrayRef.current = [...sortingData.array];
    }
    
    const arr = [...initialArrayRef.current];
    const n = arr.length;
    
    runner.start();
    
    const mergeSort = async (left: number, right: number) => {
      if (left < right) {
        const mid = Math.floor((left + right) / 2);
        
        // 高亮分割点
        setSortingData(prev => ({ ...prev, comparing: [mid], swapping: [] }));
        runner.recordStep({
          lineNumber: 3,
          description: `分割数组: 左半部分 [${left}, ${mid}], 右半部分 [${mid + 1}, ${right}]`,
          data: { array: [...arr] },
          variables: [
            { name: 'left', value: left, type: 'primitive' as const },
            { name: 'mid', value: mid, type: 'primitive' as const },
            { name: 'right', value: right, type: 'primitive' as const }
          ],
          highlights: { arrayIndices: [mid] },
          sortingState: { comparing: [mid], swapping: [], sorted: [] },
          memory: buildMemoryState(arr, [
            { name: 'left', value: left, type: 'primitive' },
            { name: 'mid', value: mid, type: 'primitive' },
            { name: 'right', value: right, type: 'primitive' }
          ])
        });
        
        if (!(await waitWithPause(speedRef.current * 0.5))) {
          return false;
        }
        
        // 递归排序左半部分
        if (!(await mergeSort(left, mid))) return false;
        
        // 递归排序右半部分
        if (!(await mergeSort(mid + 1, right))) return false;
        
        // 合并两个有序数组
        if (!(await merge(left, mid, right))) return false;
      }
      return !shouldStopRef.current;
    };
    
    const merge = async (left: number, mid: number, right: number) => {
      // 创建临时数组
      const leftArr = arr.slice(left, mid + 1);
      const rightArr = arr.slice(mid + 1, right + 1);
      
      // 高亮合并范围
      const mergeIndices = Array.from({ length: right - left + 1 }, (_, i) => left + i);
      setSortingData(prev => ({ ...prev, comparing: mergeIndices, swapping: [] }));
      runner.recordStep({
        lineNumber: 7,
        description: `合并区间 [${left}, ${right}]，左数组: [${leftArr.join(', ')}], 右数组: [${rightArr.join(', ')}]`,
        data: { array: [...arr] },
        variables: [
          { name: 'left', value: left, type: 'primitive' as const },
          { name: 'mid', value: mid, type: 'primitive' as const },
          { name: 'right', value: right, type: 'primitive' as const }
        ],
        highlights: { arrayIndices: mergeIndices },
        sortingState: { comparing: mergeIndices, swapping: [], sorted: [] },
        memory: buildMemoryState(arr, [
          { name: 'left', value: left, type: 'primitive' },
          { name: 'mid', value: mid, type: 'primitive' },
          { name: 'right', value: right, type: 'primitive' }
        ], {
          auxiliaryArrays: [
            { name: 'leftArr', data: leftArr, description: '左半部分' },
            { name: 'rightArr', data: rightArr, description: '右半部分' }
          ]
        })
      });
      
      if (!(await waitWithPause(speedRef.current * 0.5))) {
        return false;
      }
      
      let i = 0, j = 0, k = left;
      
      // 合并两个有序数组
      while (i < leftArr.length && j < rightArr.length) {
        if (shouldStopRef.current) return false;
        
        // 高亮比较的元素
        setSortingData(prev => ({
          ...prev,
          comparing: [left + i, mid + 1 + j],
          swapping: []
        }));
        runner.recordStep({
          lineNumber: 11,
          description: `比较 ${leftArr[i]} 和 ${rightArr[j]}`,
          data: { array: [...arr] },
          variables: [
            { name: 'i', value: i, type: 'primitive' as const },
            { name: 'j', value: j, type: 'primitive' as const },
            { name: 'k', value: k, type: 'primitive' as const }
          ],
          highlights: { arrayIndices: [left + i, mid + 1 + j] },
          sortingState: { comparing: [left + i, mid + 1 + j], swapping: [], sorted: [] },
          memory: buildMemoryState(arr, [
            { name: 'left', value: left, type: 'primitive' },
            { name: 'mid', value: mid, type: 'primitive' },
            { name: 'right', value: right, type: 'primitive' },
            { name: 'i', value: i, type: 'primitive' },
            { name: 'j', value: j, type: 'primitive' },
            { name: 'k', value: k, type: 'primitive' }
          ], {
            auxiliaryArrays: [
              { name: 'leftArr', data: leftArr, description: '左半部分' },
              { name: 'rightArr', data: rightArr, description: '右半部分' }
            ]
          })
        });
        
        if (!(await waitWithPause(speedRef.current * 0.5))) {
          return false;
        }
        
        if (leftArr[i] <= rightArr[j]) {
          arr[k] = leftArr[i];
          setSortingData(prev => ({
            ...prev,
            array: [...arr],
            swapping: [k]
          }));
          runner.recordStep({
            lineNumber: 12,
            description: `${leftArr[i]} <= ${rightArr[j]}，将 ${leftArr[i]} 复制到位置 ${k}`,
            data: { array: [...arr] },
            variables: [],
            highlights: { arrayIndices: [k] },
            sortingState: { comparing: [], swapping: [k], sorted: [] },
            memory: buildMemoryState(arr, [
              { name: 'left', value: left, type: 'primitive' },
              { name: 'mid', value: mid, type: 'primitive' },
              { name: 'right', value: right, type: 'primitive' },
              { name: 'i', value: i, type: 'primitive' },
              { name: 'j', value: j, type: 'primitive' },
              { name: 'k', value: k, type: 'primitive' }
            ], {
              auxiliaryArrays: [
                { name: 'leftArr', data: leftArr, description: '左半部分' },
                { name: 'rightArr', data: rightArr, description: '右半部分' }
              ]
            })
          });
          i++;
        } else {
          arr[k] = rightArr[j];
          setSortingData(prev => ({
            ...prev,
            array: [...arr],
            swapping: [k]
          }));
          runner.recordStep({
            lineNumber: 14,
            description: `${rightArr[j]} < ${leftArr[i]}，将 ${rightArr[j]} 复制到位置 ${k}`,
            data: { array: [...arr] },
            variables: [],
            highlights: { arrayIndices: [k] },
            sortingState: { comparing: [], swapping: [k], sorted: [] },
            memory: buildMemoryState(arr, [
              { name: 'left', value: left, type: 'primitive' },
              { name: 'mid', value: mid, type: 'primitive' },
              { name: 'right', value: right, type: 'primitive' },
              { name: 'i', value: i, type: 'primitive' },
              { name: 'j', value: j, type: 'primitive' },
              { name: 'k', value: k, type: 'primitive' }
            ], {
              auxiliaryArrays: [
                { name: 'leftArr', data: leftArr, description: '左半部分' },
                { name: 'rightArr', data: rightArr, description: '右半部分' }
              ]
            })
          });
          j++;
        }
        k++;
        
        if (!(await waitWithPause(speedRef.current * 0.3))) {
          return false;
        }
      }
      
      // 复制左数组剩余元素
      while (i < leftArr.length) {
        if (shouldStopRef.current) return false;
        
        arr[k] = leftArr[i];
        setSortingData(prev => ({
          ...prev,
          array: [...arr],
          swapping: [k]
        }));
        runner.recordStep({
          lineNumber: 18,
          description: `复制左数组剩余元素 ${leftArr[i]} 到位置 ${k}`,
          data: { array: [...arr] },
          variables: [{ name: 'i', value: i, type: 'primitive' as const }, { name: 'k', value: k, type: 'primitive' as const }],
          highlights: { arrayIndices: [k] },
          sortingState: { comparing: [], swapping: [k], sorted: [] },
          memory: buildMemoryState(arr, [
            { name: 'left', value: left, type: 'primitive' },
            { name: 'mid', value: mid, type: 'primitive' },
            { name: 'right', value: right, type: 'primitive' },
            { name: 'i', value: i, type: 'primitive' },
            { name: 'k', value: k, type: 'primitive' }
          ], {
            auxiliaryArrays: [
              { name: 'leftArr', data: leftArr, description: '左半部分' },
              { name: 'rightArr', data: rightArr, description: '右半部分' }
            ]
          })
        });
        
        if (!(await waitWithPause(speedRef.current * 0.3))) {
          return false;
        }
        
        i++;
        k++;
      }
      
      // 复制右数组剩余元素
      while (j < rightArr.length) {
        if (shouldStopRef.current) return false;
        
        arr[k] = rightArr[j];
        setSortingData(prev => ({
          ...prev,
          array: [...arr],
          swapping: [k]
        }));
        runner.recordStep({
          lineNumber: 22,
          description: `复制右数组剩余元素 ${rightArr[j]} 到位置 ${k}`,
          data: { array: [...arr] },
          variables: [{ name: 'j', value: j, type: 'primitive' as const }, { name: 'k', value: k, type: 'primitive' as const }],
          highlights: { arrayIndices: [k] },
          sortingState: { comparing: [], swapping: [k], sorted: [] },
          memory: buildMemoryState(arr, [
            { name: 'left', value: left, type: 'primitive' },
            { name: 'mid', value: mid, type: 'primitive' },
            { name: 'right', value: right, type: 'primitive' },
            { name: 'j', value: j, type: 'primitive' },
            { name: 'k', value: k, type: 'primitive' }
          ], {
            auxiliaryArrays: [
              { name: 'leftArr', data: leftArr, description: '左半部分' },
              { name: 'rightArr', data: rightArr, description: '右半部分' }
            ]
          })
        });
        
        if (!(await waitWithPause(speedRef.current * 0.3))) {
          return false;
        }
        
        j++;
        k++;
      }
      
      // 合并完成，清除高亮
      setSortingData(prev => ({ ...prev, comparing: [], swapping: [] }));
      
      return !shouldStopRef.current;
    };
    
    await mergeSort(0, arr.length - 1);
    
    if (shouldStopRef.current) {
      runner.stop();
      return;
    }
    
    // 标记全部已排序
    setSortingData(prev => ({
      ...prev,
      sorted: Array.from({ length: n }, (_, i) => i),
      comparing: [],
      swapping: []
    }));
    
    // 验证排序结果
    const isSorted = arr.every((val, idx) => idx === 0 || arr[idx - 1] <= val);
    
    runner.recordStep({
      lineNumber: 0,
      description: isSorted ? '归并排序完成！数组已正确排序' : '归并排序完成！',
      data: { array: [...arr] },
      variables: [],
      highlights: {},
      sortingState: { comparing: [], swapping: [], sorted: Array.from({ length: n }, (_, i) => i) },
      memory: buildMemoryState(arr, [
        { name: 'n', value: n, type: 'primitive' }
      ])
    });
    
    runner.setCompleted();
  };

  // 希尔排序执行
  const runShellSort = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;

    if (initialArrayRef.current.length === 0) {
      initialArrayRef.current = [...sortingData.array];
    }

    const arr = [...initialArrayRef.current];
    const n = arr.length;

    runner.start();

    let gap = Math.floor(n / 2);
    while (gap > 0) {
      // 高亮当前的 gap 值
      setSortingData(prev => ({ ...prev, comparing: [], swapping: [] }));
      runner.recordStep({
        lineNumber: 4,
        description: `当前间隔 gap = ${gap}`,
        data: { array: [...arr] },
        variables: [{ name: 'gap', value: gap, type: 'primitive' as const }],
        highlights: {},
        sortingState: { comparing: [], swapping: [], sorted: [] },
        memory: buildMemoryState(arr, [
          { name: 'gap', value: gap, type: 'primitive' },
          { name: 'n', value: n, type: 'primitive' }
        ])
      });

      if (!(await waitWithPause(speedRef.current * 0.5))) {
        runner.stop();
        return;
      }

      // 对每个子数组进行插入排序
      for (let i = gap; i < n; i++) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }

        const temp = arr[i];

        // 高亮当前要插入的元素
        setSortingData(prev => ({ ...prev, comparing: [i], swapping: [] }));
        runner.recordStep({
          lineNumber: 6,
          description: `处理元素 arr[${i}] = ${temp}`,
          data: { array: [...arr] },
          variables: [{ name: 'i', value: i, type: 'primitive' as const }, { name: 'gap', value: gap, type: 'primitive' as const }],
          highlights: { arrayIndices: [i] },
          sortingState: { comparing: [i], swapping: [], sorted: [] },
          memory: buildMemoryState(arr, [
            { name: 'i', value: i, type: 'primitive' },
            { name: 'gap', value: gap, type: 'primitive' },
            { name: 'temp', value: temp, type: 'temp' },
            { name: 'n', value: n, type: 'primitive' }
          ])
        });

        if (!(await waitWithPause(speedRef.current * 0.5))) {
          runner.stop();
          return;
        }

        let j = i;
        while (j >= gap && arr[j - gap] > temp) {
          if (shouldStopRef.current) {
            runner.stop();
            return;
          }

          setSortingData(prev => ({ ...prev, comparing: [j - gap, j], swapping: [] }));
          runner.recordStep({
            lineNumber: 8,
            description: `${arr[j - gap]} > ${temp}，将 ${arr[j - gap]} 向后移动 gap=${gap} 位`,
            data: { array: [...arr] },
            variables: [{ name: 'j', value: j, type: 'primitive' as const }, { name: 'gap', value: gap, type: 'primitive' as const }],
            highlights: { arrayIndices: [j - gap, j] },
            sortingState: { comparing: [j - gap, j], swapping: [], sorted: [] },
            memory: buildMemoryState(arr, [
              { name: 'i', value: i, type: 'primitive' },
              { name: 'j', value: j, type: 'primitive' },
              { name: 'gap', value: gap, type: 'primitive' },
              { name: 'temp', value: temp, type: 'temp' },
              { name: 'n', value: n, type: 'primitive' }
            ])
          });

          arr[j] = arr[j - gap];
          setSortingData(prev => ({ ...prev, array: [...arr], comparing: [j], swapping: [] }));

          if (!(await waitWithPause(speedRef.current * 0.5))) {
            runner.stop();
            return;
          }

          j -= gap;
        }

        if (shouldStopRef.current) {
          runner.stop();
          return;
        }

        arr[j] = temp;
        setSortingData(prev => ({ ...prev, array: [...arr], comparing: [j], swapping: [] }));

        runner.recordStep({
          lineNumber: 10,
          description: `将 ${temp} 插入到位置 ${j}`,
          data: { array: [...arr] },
          variables: [{ name: 'j', value: j, type: 'primitive' as const }],
          highlights: { arrayIndices: [j] },
          sortingState: { comparing: [j], swapping: [], sorted: [] },
          memory: buildMemoryState(arr, [
            { name: 'i', value: i, type: 'primitive' },
            { name: 'j', value: j, type: 'primitive' },
            { name: 'gap', value: gap, type: 'primitive' },
            { name: 'temp', value: temp, type: 'temp' },
            { name: 'n', value: n, type: 'primitive' }
          ])
        });
      }

      gap = Math.floor(gap / 2);
    }

    // 标记全部已排序
    setSortingData(prev => ({ ...prev, sorted: Array.from({ length: n }, (_, i) => i) }));

    runner.recordStep({
      lineNumber: 0,
      description: '排序完成！数组已正确排序',
      data: { array: [...arr] },
      variables: [],
      highlights: {},
      sortingState: { comparing: [], swapping: [], sorted: Array.from({ length: n }, (_, i) => i) },
      memory: buildMemoryState(arr, [
        { name: 'n', value: n, type: 'primitive' }
      ])
    });

    runner.setCompleted();
  };

  // 桶排序执行
  const runBucketSort = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;
    
    if (initialArrayRef.current.length === 0) {
      initialArrayRef.current = [...sortingData.array];
    }
    
    const arr = [...initialArrayRef.current];
    const n = arr.length;
    
    runner.start();
    
    // 找出最大值和最小值
    const max = Math.max(...arr);
    const min = Math.min(...arr);
    
    runner.recordStep({
      lineNumber: 1,
      description: `找到最大值 ${max}，最小值 ${min}`,
      data: { array: [...arr] },
      variables: [{ name: 'max', value: max, type: 'primitive' as const }, { name: 'min', value: min, type: 'primitive' as const }],
      highlights: {},
      sortingState: { comparing: [], swapping: [], sorted: [] },
      memory: buildMemoryState(arr, [
        { name: 'max', value: max, type: 'primitive' },
        { name: 'min', value: min, type: 'primitive' },
        { name: 'n', value: n, type: 'primitive' }
      ])
    });
    
    if (!(await waitWithPause(speedRef.current * 0.5))) {
      runner.stop();
      return;
    }
    
    // 创建桶（这里用5个桶作为示例）
    const bucketCount = 5;
    const buckets: number[][] = Array.from({ length: bucketCount }, () => []);
    
    runner.recordStep({
      lineNumber: 2,
      description: `创建 ${bucketCount} 个空桶`,
      data: { array: [...arr] },
      variables: [{ name: 'bucketCount', value: bucketCount, type: 'primitive' as const }],
      highlights: {},
      sortingState: { comparing: [], swapping: [], sorted: [] },
      memory: buildMemoryState(arr, [
        { name: 'max', value: max, type: 'primitive' },
        { name: 'min', value: min, type: 'primitive' },
        { name: 'bucketCount', value: bucketCount, type: 'primitive' },
        { name: 'n', value: n, type: 'primitive' }
      ], {
        auxiliaryArrays: [
          { name: 'buckets', data: buckets, description: '桶数组' }
        ]
      })
    });
    
    if (!(await waitWithPause(speedRef.current * 0.5))) {
      runner.stop();
      return;
    }
    
    // 分配元素到桶
    for (let i = 0; i < n; i++) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }
      
      const bucketIndex = Math.floor((arr[i] - min) / (max - min + 1) * bucketCount);
      buckets[bucketIndex].push(arr[i]);
      
      // 高亮分配过程
      setSortingData(prev => ({ ...prev, comparing: [i], swapping: [] }));
      runner.recordStep({
        lineNumber: 5,
        description: `将 ${arr[i]} 分配到桶 ${bucketIndex}`,
        data: { array: [...arr] },
        variables: [{ name: 'i', value: i, type: 'primitive' as const }, { name: 'bucketIndex', value: bucketIndex, type: 'primitive' as const }],
        highlights: { arrayIndices: [i] },
        sortingState: { comparing: [i], swapping: [], sorted: [] },
        memory: buildMemoryState(arr, [
          { name: 'i', value: i, type: 'primitive' },
          { name: 'bucketIndex', value: bucketIndex, type: 'primitive' },
          { name: 'max', value: max, type: 'primitive' },
          { name: 'min', value: min, type: 'primitive' },
          { name: 'bucketCount', value: bucketCount, type: 'primitive' }
        ], {
          auxiliaryArrays: [
            { name: 'buckets', data: buckets, description: '桶数组' }
          ]
        })
      });
      
      if (!(await waitWithPause(speedRef.current * 0.5))) {
        runner.stop();
        return;
      }
    }
    
    // 对每个桶进行插入排序
    for (let i = 0; i < bucketCount; i++) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }
      
      if (buckets[i].length > 0) {
        runner.recordStep({
          lineNumber: 8,
          description: `对桶 ${i} 进行插入排序，元素: [${buckets[i].join(', ')}]`,
          data: { array: [...arr] },
          variables: [{ name: 'i', value: i, type: 'primitive' as const }],
          highlights: {},
          sortingState: { comparing: [], swapping: [], sorted: [] },
          memory: buildMemoryState(arr, [
            { name: 'i', value: i, type: 'primitive' },
            { name: 'bucketCount', value: bucketCount, type: 'primitive' }
          ], {
            auxiliaryArrays: [
              { name: 'buckets', data: buckets, description: '桶数组' }
            ]
          })
        });
        
        if (!(await waitWithPause(speedRef.current * 0.5))) {
          runner.stop();
          return;
        }
        
        await insertionSortBucket(buckets[i], i);
      }
    }
    
    // 合并桶
    let index = 0;
    for (let i = 0; i < bucketCount; i++) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }
      
      for (let j = 0; j < buckets[i].length; j++) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }
        
        arr[index] = buckets[i][j];
        
        // 高亮合并过程
        setSortingData(prev => ({ ...prev, array: [...arr], comparing: [index], swapping: [] }));
        runner.recordStep({
          lineNumber: 12,
          description: `从桶 ${i} 取出 ${buckets[i][j]} 放到位置 ${index}`,
          data: { array: [...arr] },
          variables: [{ name: 'index', value: index, type: 'primitive' as const }, { name: 'i', value: i, type: 'primitive' as const }],
          highlights: { arrayIndices: [index] },
          sortingState: { comparing: [index], swapping: [], sorted: [] },
          memory: buildMemoryState(arr, [
            { name: 'index', value: index, type: 'primitive' },
            { name: 'i', value: i, type: 'primitive' },
            { name: 'j', value: j, type: 'primitive' },
            { name: 'bucketCount', value: bucketCount, type: 'primitive' }
          ], {
            auxiliaryArrays: [
              { name: 'buckets', data: buckets, description: '桶数组' }
            ]
          })
        });
        
        if (!(await waitWithPause(speedRef.current * 0.5))) {
          runner.stop();
          return;
        }
        
        index++;
      }
    }
    
    // 标记全部已排序
    setSortingData(prev => ({ ...prev, sorted: Array.from({ length: n }, (_, i) => i), comparing: [], swapping: [] }));
    
    runner.recordStep({
      lineNumber: 0,
      description: '排序完成！数组已正确排序',
      data: { array: [...arr] },
      variables: [],
      highlights: {},
      sortingState: { comparing: [], swapping: [], sorted: Array.from({ length: n }, (_, i) => i) },
      memory: buildMemoryState(arr, [
        { name: 'n', value: n, type: 'primitive' }
      ])
    });
    
    runner.setCompleted();
    
    async function insertionSortBucket(bucket: number[], bucketIdx: number) {
      const m = bucket.length;
      for (let i = 1; i < m; i++) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }
        
        const key = bucket[i];
        let j = i - 1;
        
        runner.recordStep({
          lineNumber: 16,
          description: `桶 ${bucketIdx}: 准备将 ${key} 插入到正确位置`,
          data: { array: [...arr] },
          variables: [{ name: 'key', value: key, type: 'primitive' as const }],
          highlights: {},
          sortingState: { comparing: [], swapping: [], sorted: [] },
          memory: buildMemoryState(arr, [
            { name: 'key', value: key, type: 'temp' },
            { name: 'bucketIdx', value: bucketIdx, type: 'primitive' }
          ], {
            auxiliaryArrays: [
              { name: 'buckets', data: buckets, description: '桶数组' }
            ]
          })
        });
        
        if (!(await waitWithPause(speedRef.current * 0.3))) {
          runner.stop();
          return;
        }
        
        while (j >= 0 && bucket[j] > key) {
          if (shouldStopRef.current) {
            runner.stop();
            return;
          }
          
          bucket[j + 1] = bucket[j];
          
          runner.recordStep({
            lineNumber: 18,
            description: `桶 ${bucketIdx}: ${bucket[j]} > ${key}，向后移动`,
            data: { array: [...arr] },
            variables: [{ name: 'j', value: j, type: 'primitive' as const }],
            highlights: {},
            sortingState: { comparing: [], swapping: [], sorted: [] },
            memory: buildMemoryState(arr, [
              { name: 'key', value: key, type: 'temp' },
              { name: 'j', value: j, type: 'primitive' },
              { name: 'bucketIdx', value: bucketIdx, type: 'primitive' }
            ], {
              auxiliaryArrays: [
                { name: 'buckets', data: buckets, description: '桶数组' }
              ]
            })
          });
          
          if (!(await waitWithPause(speedRef.current * 0.3))) {
            runner.stop();
            return;
          }
          
          j--;
        }
        
        bucket[j + 1] = key;
        
        runner.recordStep({
          lineNumber: 20,
          description: `桶 ${bucketIdx}: 将 ${key} 插入到位置 ${j + 1}`,
          data: { array: [...arr] },
          variables: [],
          highlights: {},
          sortingState: { comparing: [], swapping: [], sorted: [] },
          memory: buildMemoryState(arr, [
            { name: 'key', value: key, type: 'temp' },
            { name: 'j', value: j, type: 'primitive' },
            { name: 'bucketIdx', value: bucketIdx, type: 'primitive' }
          ], {
            auxiliaryArrays: [
              { name: 'buckets', data: buckets, description: '桶数组' }
            ]
          })
        });
        
        if (!(await waitWithPause(speedRef.current * 0.3))) {
          runner.stop();
          return;
        }
      }
    }
  };

  // 快速排序执行
  const runQuickSort = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;
    
    if (initialArrayRef.current.length === 0) {
      initialArrayRef.current = [...sortingData.array];
    }
    
    const arr = [...initialArrayRef.current];
    const n = arr.length;
    const sorted: number[] = [];
    
    runner.start();
    
    // 分区函数
    const partition = async (left: number, right: number): Promise<number> => {
      const pivot = arr[right];
      let i = left - 1;
      
      // 高亮 pivot
      setSortingData(prev => ({ ...prev, comparing: [right], swapping: [] }));
      runner.recordStep({
        lineNumber: 4,
        description: `选择基准值 pivot = ${pivot}（位置 ${right}）`,
        data: { array: [...arr] },
        variables: [{ name: 'left', value: left, type: 'primitive' as const }, { name: 'right', value: right, type: 'primitive' as const }, { name: 'pivot', value: pivot, type: 'primitive' as const }],
        highlights: { arrayIndices: [right] },
        sortingState: { comparing: [right], swapping: [], sorted: [...sorted] },
        memory: buildMemoryState(arr, [
          { name: 'left', value: left, type: 'primitive' },
          { name: 'right', value: right, type: 'primitive' },
          { name: 'pivot', value: pivot, type: 'temp' },
          { name: 'i', value: i, type: 'primitive' }
        ], {
          callStack: [
            { functionName: 'quickSort', parameters: [{ name: 'left', value: left }, { name: 'right', value: right }], localVariables: [] },
            { functionName: 'partition', parameters: [{ name: 'left', value: left }, { name: 'right', value: right }], localVariables: [{ name: 'pivot', value: pivot }, { name: 'i', value: i }] }
          ]
        })
      });
      
      if (!(await waitWithPause(speedRef.current * 0.5))) {
        runner.stop();
        return -1;
      }
      
      for (let j = left; j < right; j++) {
        if (shouldStopRef.current) {
          runner.stop();
          return -1;
        }
        
        // 高亮比较的元素
        setSortingData(prev => ({ ...prev, comparing: [j, right], swapping: [] }));
        runner.recordStep({
          lineNumber: 8,
          description: `比较 arr[${j}]=${arr[j]} 和 pivot=${pivot}`,
          data: { array: [...arr] },
          variables: [{ name: 'j', value: j, type: 'primitive' as const }, { name: 'i', value: i, type: 'primitive' as const }],
          highlights: { arrayIndices: [j, right] },
          sortingState: { comparing: [j, right], swapping: [], sorted: [...sorted] },
          memory: buildMemoryState(arr, [
            { name: 'left', value: left, type: 'primitive' },
            { name: 'right', value: right, type: 'primitive' },
            { name: 'pivot', value: pivot, type: 'temp' },
            { name: 'i', value: i, type: 'primitive' },
            { name: 'j', value: j, type: 'primitive' }
          ], {
            callStack: [
              { functionName: 'quickSort', parameters: [{ name: 'left', value: left }, { name: 'right', value: right }], localVariables: [] },
              { functionName: 'partition', parameters: [{ name: 'left', value: left }, { name: 'right', value: right }], localVariables: [{ name: 'pivot', value: pivot }, { name: 'i', value: i }, { name: 'j', value: j }] }
            ]
          })
        });
        
        if (!(await waitWithPause(speedRef.current * 0.5))) {
          runner.stop();
          return -1;
        }
        
        if (arr[j] < pivot) {
          i++;
          
          if (i !== j) {
            // 高亮交换
            setSortingData(prev => ({ ...prev, comparing: [], swapping: [i, j] }));
            runner.recordStep({
              lineNumber: 10,
              description: `${arr[j]} < ${pivot}，交换 arr[${i}] 和 arr[${j}]`,
              data: { array: [...arr] },
              variables: [{ name: 'i', value: i, type: 'primitive' as const }],
              highlights: { arrayIndices: [i, j] },
              sortingState: { comparing: [], swapping: [i, j], sorted: [...sorted] },
              memory: buildMemoryState(arr, [
                { name: 'left', value: left, type: 'primitive' },
                { name: 'right', value: right, type: 'primitive' },
                { name: 'pivot', value: pivot, type: 'temp' },
                { name: 'i', value: i, type: 'primitive' },
                { name: 'j', value: j, type: 'primitive' }
              ], {
                callStack: [
                  { functionName: 'quickSort', parameters: [{ name: 'left', value: left }, { name: 'right', value: right }], localVariables: [] },
                  { functionName: 'partition', parameters: [{ name: 'left', value: left }, { name: 'right', value: right }], localVariables: [{ name: 'pivot', value: pivot }, { name: 'i', value: i }, { name: 'j', value: j }] }
                ]
              })
            });
            
            [arr[i], arr[j]] = [arr[j], arr[i]];
            setSortingData(prev => ({ ...prev, array: [...arr] }));
            
            if (!(await waitWithPause(speedRef.current * 0.5))) {
              runner.stop();
              return -1;
            }
          }
        }
      }
      
      if (shouldStopRef.current) {
        runner.stop();
        return -1;
      }
      
      // 将 pivot 放到正确位置
      const pivotIndex = i + 1;
      if (pivotIndex !== right) {
        setSortingData(prev => ({ ...prev, comparing: [], swapping: [pivotIndex, right] }));
        runner.recordStep({
          lineNumber: 14,
          description: `将 pivot ${pivot} 放到位置 ${pivotIndex}`,
          data: { array: [...arr] },
          variables: [],
          highlights: { arrayIndices: [pivotIndex, right] },
          sortingState: { comparing: [], swapping: [pivotIndex, right], sorted: [...sorted] },
          memory: buildMemoryState(arr, [
            { name: 'left', value: left, type: 'primitive' },
            { name: 'right', value: right, type: 'primitive' },
            { name: 'pivot', value: pivot, type: 'temp' },
            { name: 'pivotIndex', value: pivotIndex, type: 'primitive' }
          ], {
            callStack: [
              { functionName: 'quickSort', parameters: [{ name: 'left', value: left }, { name: 'right', value: right }], localVariables: [] },
              { functionName: 'partition', parameters: [{ name: 'left', value: left }, { name: 'right', value: right }], localVariables: [{ name: 'pivot', value: pivot }, { name: 'pivotIndex', value: pivotIndex }] }
            ]
          })
        });
        
        [arr[pivotIndex], arr[right]] = [arr[right], arr[pivotIndex]];
        setSortingData(prev => ({ ...prev, array: [...arr] }));
        
        if (!(await waitWithPause(speedRef.current * 0.5))) {
          runner.stop();
          return -1;
        }
      }
      
      // pivot 位置已确定，加入已排序
      sorted.push(pivotIndex);
      setSortingData(prev => ({ ...prev, sorted: [...sorted], comparing: [], swapping: [] }));
      
      runner.recordStep({
        lineNumber: 15,
        description: `pivot ${arr[pivotIndex]} 已归位`,
        data: { array: [...arr] },
        variables: [{ name: 'pivotIndex', value: pivotIndex, type: 'primitive' as const }],
        highlights: { arrayIndices: [pivotIndex] },
        sortingState: { comparing: [], swapping: [], sorted: [...sorted] },
        memory: buildMemoryState(arr, [
          { name: 'left', value: left, type: 'primitive' },
          { name: 'right', value: right, type: 'primitive' },
          { name: 'pivotIndex', value: pivotIndex, type: 'primitive' }
        ], {
          callStack: [
            { functionName: 'quickSort', parameters: [{ name: 'left', value: left }, { name: 'right', value: right }], localVariables: [] },
            { functionName: 'partition', parameters: [{ name: 'left', value: left }, { name: 'right', value: right }], localVariables: [{ name: 'pivotIndex', value: pivotIndex }] }
          ]
        })
      });
      
      return pivotIndex;
    };
    
    // 递归快速排序
    const quickSort = async (left: number, right: number) => {
      if (left < right) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }
        
        runner.recordStep({
          lineNumber: 2,
          description: `递归排序区间 [${left}, ${right}]`,
          data: { array: [...arr] },
          variables: [{ name: 'left', value: left, type: 'primitive' as const }, { name: 'right', value: right, type: 'primitive' as const }],
          highlights: {},
          sortingState: { comparing: [], swapping: [], sorted: [...sorted] },
          memory: buildMemoryState(arr, [
            { name: 'left', value: left, type: 'primitive' },
            { name: 'right', value: right, type: 'primitive' }
          ], {
            callStack: [
              { functionName: 'quickSort', parameters: [{ name: 'left', value: left }, { name: 'right', value: right }], localVariables: [] }
            ]
          })
        });
        
        const pivotIndex = await partition(left, right);
        if (pivotIndex === -1) return;
        
        await quickSort(left, pivotIndex - 1);
        await quickSort(pivotIndex + 1, right);
      }
    };
    
    await quickSort(0, n - 1);
    
    if (shouldStopRef.current) {
      runner.stop();
      return;
    }
    
    // 标记全部已排序
    setSortingData(prev => ({ ...prev, sorted: Array.from({ length: n }, (_, i) => i) }));
    
    // 验证排序结果
    const isSorted = arr.every((val, idx) => idx === 0 || arr[idx - 1] <= val);
    
    runner.recordStep({
      lineNumber: 0,
      description: isSorted ? '排序完成！数组已正确排序' : '排序完成！',
      data: { array: [...arr] },
      variables: [],
      highlights: {},
      sortingState: { comparing: [], swapping: [], sorted: Array.from({ length: n }, (_, i) => i) },
      memory: buildMemoryState(arr, [
        { name: 'n', value: n, type: 'primitive' }
      ])
    });
    
    runner.setCompleted();
  };

  // 堆排序执行
  const runHeapSort = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;

    if (initialArrayRef.current.length === 0) {
      initialArrayRef.current = [...sortingData.array];
    }

    const arr = [...initialArrayRef.current];
    const n = arr.length;
    const sorted: number[] = [];

    runner.start();

    // 建堆：从最后一个非叶子节点开始，向上调整
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }
      await heapify(n, i);
    }

    // 依次取出堆顶
    for (let i = n - 1; i > 0; i--) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }

      // 交换堆顶和末尾
      setSortingData(prev => ({ ...prev, comparing: [], swapping: [0, i] }));
      runner.recordStep({
        lineNumber: 10,
        description: `将堆顶元素 ${arr[0]} 交换到位置 ${i}`,
        data: { array: [...arr] },
        variables: [{ name: 'i', value: i, type: 'primitive' as const }],
        highlights: { arrayIndices: [0, i] },
        sortingState: { comparing: [], swapping: [0, i], sorted: [...sorted] },
        memory: buildMemoryState(arr, [
          { name: 'n', value: n, type: 'primitive' },
          { name: 'i', value: i, type: 'primitive' }
        ])
      });

      if (!(await waitWithPause(speedRef.current * 0.5))) {
        runner.stop();
        return;
      }

      [arr[0], arr[i]] = [arr[i], arr[0]];
      setSortingData(prev => ({ ...prev, array: [...arr] }));

      if (!(await waitWithPause(speedRef.current * 0.5))) {
        runner.stop();
        return;
      }

      // 标记已排序
      sorted.unshift(i);
      setSortingData(prev => ({ ...prev, sorted: [...sorted], comparing: [], swapping: [] }));

      // 调整堆
      await heapify(i, 0);
    }

    // 最后一个元素也是已排序的
    sorted.unshift(0);
    setSortingData(prev => ({ ...prev, sorted, comparing: [], swapping: [] }));

    runner.recordStep({
      lineNumber: 0,
      description: '排序完成！数组已正确排序',
      data: { array: [...arr] },
      variables: [],
      highlights: {},
      sortingState: { comparing: [], swapping: [], sorted: [...sorted] },
      memory: buildMemoryState(arr, [
        { name: 'n', value: n, type: 'primitive' }
      ])
    });

    runner.setCompleted();

    async function heapify(heapSize: number, root: number) {
      if (shouldStopRef.current) return;

      let largest = root;
      const left = 2 * root + 1;
      const right = 2 * root + 2;

      // 高亮当前调整的节点
      setSortingData(prev => ({ ...prev, comparing: [root] }));
      runner.recordStep({
        lineNumber: 18,
        description: `调整堆：从节点 ${root} 开始`,
        data: { array: [...arr] },
        variables: [{ name: 'root', value: root, type: 'primitive' as const }, { name: 'heapSize', value: heapSize, type: 'primitive' as const }],
        highlights: { arrayIndices: [root] },
        sortingState: { comparing: [root], swapping: [], sorted: [...sorted] },
        memory: buildMemoryState(arr, [
          { name: 'n', value: n, type: 'primitive' },
          { name: 'heapSize', value: heapSize, type: 'primitive' },
          { name: 'root', value: root, type: 'primitive' },
          { name: 'largest', value: root, type: 'primitive' },
          { name: 'left', value: 2 * root + 1, type: 'primitive' },
          { name: 'right', value: 2 * root + 2, type: 'primitive' }
        ])
      });

      if (!(await waitWithPause(speedRef.current * 0.3))) {
        return;
      }

      // 比较左子节点
      if (left < heapSize) {
        setSortingData(prev => ({ ...prev, comparing: [largest, left] }));
        runner.recordStep({
          lineNumber: 23,
          description: `比较父节点 arr[${largest}]=${arr[largest]} 和左子节点 arr[${left}]=${arr[left]}`,
          data: { array: [...arr] },
          variables: [{ name: 'largest', value: largest, type: 'primitive' as const }, { name: 'left', value: left, type: 'primitive' as const }],
          highlights: { arrayIndices: [largest, left] },
          sortingState: { comparing: [largest, left], swapping: [], sorted: [...sorted] },
          memory: buildMemoryState(arr, [
            { name: 'n', value: n, type: 'primitive' },
            { name: 'heapSize', value: heapSize, type: 'primitive' },
            { name: 'root', value: root, type: 'primitive' },
            { name: 'largest', value: largest, type: 'primitive' },
            { name: 'left', value: left, type: 'primitive' },
            { name: 'right', value: right, type: 'primitive' }
          ])
        });

        if (!(await waitWithPause(speedRef.current * 0.3))) {
          return;
        }

        if (arr[left] > arr[largest]) {
          largest = left;
        }
      }

      // 比较右子节点
      if (right < heapSize) {
        setSortingData(prev => ({ ...prev, comparing: [largest, right] }));
        runner.recordStep({
          lineNumber: 27,
          description: `比较当前最大值 arr[${largest}]=${arr[largest]} 和右子节点 arr[${right}]=${arr[right]}`,
          data: { array: [...arr] },
          variables: [{ name: 'largest', value: largest, type: 'primitive' as const }, { name: 'right', value: right, type: 'primitive' as const }],
          highlights: { arrayIndices: [largest, right] },
          sortingState: { comparing: [largest, right], swapping: [], sorted: [...sorted] },
          memory: buildMemoryState(arr, [
            { name: 'n', value: n, type: 'primitive' },
            { name: 'heapSize', value: heapSize, type: 'primitive' },
            { name: 'root', value: root, type: 'primitive' },
            { name: 'largest', value: largest, type: 'primitive' },
            { name: 'left', value: left, type: 'primitive' },
            { name: 'right', value: right, type: 'primitive' }
          ])
        });

        if (!(await waitWithPause(speedRef.current * 0.3))) {
          return;
        }

        if (arr[right] > arr[largest]) {
          largest = right;
        }
      }

      // 如果需要交换
      if (largest !== root) {
        setSortingData(prev => ({ ...prev, comparing: [], swapping: [root, largest] }));
        runner.recordStep({
          lineNumber: 31,
          description: `${arr[largest]} 大于父节点，交换位置`,
          data: { array: [...arr] },
          variables: [],
          highlights: { arrayIndices: [root, largest] },
          sortingState: { comparing: [], swapping: [root, largest], sorted: [...sorted] },
          memory: buildMemoryState(arr, [
            { name: 'n', value: n, type: 'primitive' },
            { name: 'heapSize', value: heapSize, type: 'primitive' },
            { name: 'root', value: root, type: 'primitive' },
            { name: 'largest', value: largest, type: 'primitive' },
            { name: 'left', value: left, type: 'primitive' },
            { name: 'right', value: right, type: 'primitive' }
          ])
        });

        if (!(await waitWithPause(speedRef.current * 0.3))) {
          return;
        }

        [arr[root], arr[largest]] = [arr[largest], arr[root]];
        setSortingData(prev => ({ ...prev, array: [...arr] }));

        if (!(await waitWithPause(speedRef.current * 0.3))) {
          return;
        }

        // 递归调整
        await heapify(heapSize, largest);
      }

      // 清除高亮
      setSortingData(prev => ({ ...prev, comparing: [], swapping: [] }));
    }
  };

  // 计数排序执行
  const runCountingSort = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;
    
    if (initialArrayRef.current.length === 0) {
      initialArrayRef.current = [...sortingData.array];
    }
    
    const arr = [...initialArrayRef.current];
    const n = arr.length;
    
    runner.start();
    
    // 找出最大值
    const max = Math.max(...arr);
    
    runner.recordStep({
      lineNumber: 1,
      description: `找出数组中的最大值 max = ${max}`,
      data: { array: [...arr] },
      variables: [{ name: 'max', value: max, type: 'primitive' as const }],
      highlights: {},
      sortingState: { comparing: [], swapping: [], sorted: [] },
      memory: buildMemoryState(arr, [
        { name: 'max', value: max, type: 'primitive' },
        { name: 'n', value: n, type: 'primitive' }
      ])
    });
    
    if (!(await waitWithPause(speedRef.current * 0.5))) {
      runner.stop();
      return;
    }
    
    // 创建计数数组
    const count = new Array(max + 1).fill(0);
    
    runner.recordStep({
      lineNumber: 2,
      description: `创建计数数组 count[0..${max}] 初始化为 0`,
      data: { array: [...arr] },
      variables: [{ name: 'max', value: max, type: 'primitive' as const }],
      highlights: {},
      sortingState: { comparing: [], swapping: [], sorted: [] },
      memory: buildMemoryState(arr, [
        { name: 'max', value: max, type: 'primitive' },
        { name: 'n', value: n, type: 'primitive' }
      ], {
        auxiliaryArrays: [
          { name: 'count', data: count, description: '计数数组' }
        ]
      })
    });
    
    if (!(await waitWithPause(speedRef.current * 0.5))) {
      runner.stop();
      return;
    }
    
    // 统计每个元素出现次数
    for (let i = 0; i < n; i++) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }
      
      count[arr[i]]++;
      
      // 高亮统计过程
      setSortingData(prev => ({ ...prev, comparing: [i], swapping: [] }));
      runner.recordStep({
        lineNumber: 5,
        description: `元素 ${arr[i]} 出现第 ${count[arr[i]]} 次，count[${arr[i]}] = ${count[arr[i]]}`,
        data: { array: [...arr] },
        variables: [{ name: 'i', value: i, type: 'primitive' as const }, { name: `count[${arr[i]}]`, value: count[arr[i]], type: 'primitive' as const }],
        highlights: { arrayIndices: [i] },
        sortingState: { comparing: [i], swapping: [], sorted: [] },
        memory: buildMemoryState(arr, [
          { name: 'max', value: max, type: 'primitive' },
          { name: 'n', value: n, type: 'primitive' },
          { name: 'i', value: i, type: 'primitive' }
        ], {
          auxiliaryArrays: [
            { name: 'count', data: [...count], description: '计数数组' }
          ]
        })
      });
      
      if (!(await waitWithPause(speedRef.current * 0.5))) {
        runner.stop();
        return;
      }
    }
    
    // 累加计数
    for (let i = 1; i <= max; i++) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }
      
      const prevCount = count[i];
      count[i] += count[i - 1];
      
      runner.recordStep({
        lineNumber: 9,
        description: `累加计数: count[${i}] = count[${i}] + count[${i - 1}] = ${prevCount} + ${count[i - 1] - prevCount} = ${count[i]}`,
        data: { array: [...arr] },
        variables: [{ name: 'i', value: i, type: 'primitive' as const }, { name: `count[${i}]`, value: count[i], type: 'primitive' as const }],
        highlights: {},
        sortingState: { comparing: [], swapping: [], sorted: [] },
        memory: buildMemoryState(arr, [
          { name: 'max', value: max, type: 'primitive' },
          { name: 'n', value: n, type: 'primitive' },
          { name: 'i', value: i, type: 'primitive' }
        ], {
          auxiliaryArrays: [
            { name: 'count', data: [...count], description: '计数数组' }
          ]
        })
      });
      
      if (!(await waitWithPause(speedRef.current * 0.5))) {
        runner.stop();
        return;
      }
    }
    
    // 构建输出数组（从后往前保持稳定）
    const output = new Array(n);
    const sorted: number[] = [];
    
    runner.recordStep({
      lineNumber: 12,
      description: '开始根据计数数组构建排序后的数组（从后往前保持稳定性）',
      data: { array: [...arr] },
      variables: [],
      highlights: {},
      sortingState: { comparing: [], swapping: [], sorted: [] },
      memory: buildMemoryState(arr, [
        { name: 'max', value: max, type: 'primitive' },
        { name: 'n', value: n, type: 'primitive' }
      ], {
        auxiliaryArrays: [
          { name: 'count', data: [...count], description: '计数数组' },
          { name: 'output', data: output, description: '输出数组' }
        ]
      })
    });
    
    if (!(await waitWithPause(speedRef.current * 0.5))) {
      runner.stop();
      return;
    }
    
    for (let i = n - 1; i >= 0; i--) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }
      
      const elem = arr[i];
      const pos = count[elem] - 1;
      output[pos] = elem;
      count[elem]--;
      sorted.push(pos);
      
      // 高亮当前元素和目标位置
      setSortingData(prev => ({ 
        ...prev, 
        comparing: [i], 
        swapping: [pos],
        array: output.map((val, idx) => val !== undefined ? val : prev.array[idx])
      }));
      
      runner.recordStep({
        lineNumber: 15,
        description: `将元素 ${elem} 放置到位置 ${pos}（第 ${count[elem] + 1} 个 ${elem}）`,
        data: { array: output.map((val, idx) => val !== undefined ? val : arr[idx]) },
        variables: [{ name: 'i', value: i, type: 'primitive' as const }, { name: 'pos', value: pos, type: 'primitive' as const }],
        highlights: { arrayIndices: [i, pos] },
        sortingState: { comparing: [i], swapping: [pos], sorted: [...sorted] },
        memory: buildMemoryState(arr, [
          { name: 'max', value: max, type: 'primitive' },
          { name: 'n', value: n, type: 'primitive' },
          { name: 'i', value: i, type: 'primitive' },
          { name: 'elem', value: elem, type: 'temp' },
          { name: 'pos', value: pos, type: 'primitive' }
        ], {
          auxiliaryArrays: [
            { name: 'count', data: [...count], description: '计数数组' },
            { name: 'output', data: [...output], description: '输出数组' }
          ]
        })
      });
      
      if (!(await waitWithPause(speedRef.current * 0.8))) {
        runner.stop();
        return;
      }
    }
    
    // 更新原数组为排序后的结果
    for (let i = 0; i < n; i++) {
      arr[i] = output[i];
    }
    
    // 标记全部已排序
    setSortingData(prev => ({ 
      ...prev, 
      array: [...arr], 
      comparing: [], 
      swapping: [],
      sorted: Array.from({ length: n }, (_, i) => i)
    }));
    
    runner.recordStep({
      lineNumber: 0,
      description: '排序完成！数组已正确排序',
      data: { array: [...arr] },
      variables: [],
      highlights: {},
      sortingState: { comparing: [], swapping: [], sorted: Array.from({ length: n }, (_, i) => i) },
      memory: buildMemoryState(arr, [
        { name: 'n', value: n, type: 'primitive' }
      ], {
        auxiliaryArrays: [
          { name: 'count', data: [...count], description: '计数数组' },
          { name: 'output', data: [...output], description: '输出数组' }
        ]
      })
    });
    
    runner.setCompleted();
  };

  // 基数排序执行
  const runRadixSort = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;
    
    if (initialArrayRef.current.length === 0) {
      initialArrayRef.current = [...sortingData.array];
    }
    
    const arr = [...initialArrayRef.current];
    const n = arr.length;
    
    runner.start();
    
    // 找出最大值，确定位数
    const max = Math.max(...arr);
    
    runner.recordStep({
      lineNumber: 1,
      description: `找到数组最大值 ${max}，开始按位排序`,
      data: { array: [...arr] },
      variables: [{ name: 'max', value: max, type: 'primitive' as const }],
      highlights: {},
      sortingState: { comparing: [], swapping: [], sorted: [] },
      memory: buildMemoryState(arr, [
        { name: 'max', value: max, type: 'primitive' },
        { name: 'n', value: n, type: 'primitive' }
      ])
    });
    
    if (!(await waitWithPause(speedRef.current * 0.5))) {
      runner.stop();
      return;
    }
    
    // 对每一位进行计数排序
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }
      
      const digitName = exp === 1 ? '个位' : exp === 10 ? '十位' : exp === 100 ? '百位' : `${exp}位`;
      
      runner.recordStep({
        lineNumber: 4,
        description: `开始按 ${digitName}（exp=${exp}）进行计数排序`,
        data: { array: [...arr] },
        variables: [{ name: 'exp', value: exp, type: 'primitive' as const }],
        highlights: {},
        sortingState: { comparing: [], swapping: [], sorted: [] },
        memory: buildMemoryState(arr, [
          { name: 'max', value: max, type: 'primitive' },
          { name: 'exp', value: exp, type: 'primitive' },
          { name: 'n', value: n, type: 'primitive' }
        ])
      });
      
      if (!(await waitWithPause(speedRef.current * 0.5))) {
        runner.stop();
        return;
      }
      
      await countingSortByDigit(exp);
    }
    
    // 标记全部已排序
    setSortingData(prev => ({ 
      ...prev, 
      sorted: Array.from({ length: n }, (_, i) => i),
      comparing: [],
      swapping: []
    }));
    
    runner.recordStep({
      lineNumber: 0,
      description: '排序完成！数组已正确排序',
      data: { array: [...arr] },
      variables: [],
      highlights: {},
      sortingState: { comparing: [], swapping: [], sorted: Array.from({ length: n }, (_, i) => i) },
      memory: buildMemoryState(arr, [
        { name: 'n', value: n, type: 'primitive' }
      ])
    });
    
    runner.setCompleted();
    
    async function countingSortByDigit(exp: number) {
      const digitName = exp === 1 ? '个位' : exp === 10 ? '十位' : exp === 100 ? '百位' : `${exp}位`;
      
      // 初始化10个桶（0-9）
      const buckets: number[][] = Array.from({ length: 10 }, () => []);
      const output: number[] = new Array(n);
      
      // 将元素分配到桶中
      for (let i = 0; i < n; i++) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }
        
        const digit = Math.floor(arr[i] / exp) % 10;
        buckets[digit].push(arr[i]);
        
        // 高亮当前处理的元素和其位数字
        setSortingData(prev => ({ ...prev, comparing: [i], swapping: [] }));
        const count = buckets.map(b => b.length);
        runner.recordStep({
          lineNumber: 8,
          description: `元素 ${arr[i]} 的 ${digitName} 是 ${digit}，放入桶[${digit}]`,
          data: { array: [...arr] },
          variables: [
            { name: 'i', value: i, type: 'primitive' as const },
            { name: 'digit', value: digit, type: 'primitive' as const }
          ],
          highlights: { arrayIndices: [i] },
          sortingState: { comparing: [i], swapping: [], sorted: [] },
          memory: buildMemoryState(arr, [
            { name: 'max', value: max, type: 'primitive' },
            { name: 'exp', value: exp, type: 'primitive' },
            { name: 'i', value: i, type: 'primitive' },
            { name: 'digit', value: digit, type: 'primitive' },
            { name: 'n', value: n, type: 'primitive' }
          ], {
            auxiliaryArrays: [
              { name: 'count', data: count, description: '桶计数（0-9）' },
              { name: 'output', data: output.filter(v => v !== undefined), description: '输出数组' }
            ]
          })
        });
        
        if (!(await waitWithPause(speedRef.current * 0.3))) {
          runner.stop();
          return;
        }
      }
      
      // 按顺序从桶中取出元素放回数组
      let idx = 0;
      for (let digit = 0; digit < 10; digit++) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }
        
        if (buckets[digit].length > 0) {
          const count = buckets.map(b => b.length);
          runner.recordStep({
            lineNumber: 12,
            description: `从桶[${digit}] 中取出 ${buckets[digit].length} 个元素`,
            data: { array: [...arr] },
            variables: [{ name: 'digit', value: digit, type: 'primitive' as const }],
            highlights: {},
            sortingState: { comparing: [], swapping: [], sorted: [] },
            memory: buildMemoryState(arr, [
              { name: 'max', value: max, type: 'primitive' },
              { name: 'exp', value: exp, type: 'primitive' },
              { name: 'digit', value: digit, type: 'primitive' },
              { name: 'idx', value: idx, type: 'primitive' },
              { name: 'n', value: n, type: 'primitive' }
            ], {
              auxiliaryArrays: [
                { name: 'count', data: count, description: '桶计数（0-9）' },
                { name: 'output', data: output.filter(v => v !== undefined), description: '输出数组' }
              ]
            })
          });
          
          for (const value of buckets[digit]) {
            if (shouldStopRef.current) {
              runner.stop();
              return;
            }
            
            output[idx] = value;
            
            // 高亮放置位置
            setSortingData(prev => ({ ...prev, swapping: [idx] }));
            const count = buckets.map(b => b.length);
            runner.recordStep({
              lineNumber: 13,
              description: `将 ${value} 放入位置 ${idx}`,
              data: { array: [...arr] },
              variables: [{ name: 'idx', value: idx, type: 'primitive' as const }],
              highlights: { arrayIndices: [idx] },
              sortingState: { comparing: [], swapping: [idx], sorted: [] },
              memory: buildMemoryState(arr, [
                { name: 'max', value: max, type: 'primitive' },
                { name: 'exp', value: exp, type: 'primitive' },
                { name: 'idx', value: idx, type: 'primitive' },
                { name: 'value', value: value, type: 'temp' },
                { name: 'n', value: n, type: 'primitive' }
              ], {
                auxiliaryArrays: [
                  { name: 'count', data: count, description: '桶计数（0-9）' },
                  { name: 'output', data: output.filter(v => v !== undefined), description: '输出数组' }
                ]
              })
            });
            
            idx++;
            
            if (!(await waitWithPause(speedRef.current * 0.2))) {
              runner.stop();
              return;
            }
          }
        }
      }
      
      // 将排序后的结果复制回原数组
      for (let i = 0; i < n; i++) {
        arr[i] = output[i];
      }
      
      setSortingData(prev => ({ ...prev, array: [...arr], comparing: [], swapping: [] }));
      
      const count = buckets.map(b => b.length);
      runner.recordStep({
        lineNumber: 16,
        description: `按 ${digitName} 排序完成，当前数组状态`,
        data: { array: [...arr] },
        variables: [],
        highlights: {},
        sortingState: { comparing: [], swapping: [], sorted: [] },
        memory: buildMemoryState(arr, [
          { name: 'max', value: max, type: 'primitive' },
          { name: 'exp', value: exp, type: 'primitive' },
          { name: 'n', value: n, type: 'primitive' }
        ], {
          auxiliaryArrays: [
            { name: 'count', data: count, description: '桶计数（0-9）' },
            { name: 'output', data: [...output], description: '输出数组' }
          ]
        })
      });
      
      if (!(await waitWithPause(speedRef.current * 0.5))) {
        runner.stop();
        return;
      }
    }
    
    runner.setCompleted();
  };

  // 拓扑排序 (Kahn算法) 执行
  const runTopologicalSort = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;

    runner.start();

    const nodes = [...graphData.nodes];
    const edges = [...graphData.edges];
    const n = nodes.length;

    // 构建邻接表
    const adj = new Map<number, number[]>();
    const inDegree = new Map<number, number>();
    
    nodes.forEach(node => {
      adj.set(node.id, []);
      inDegree.set(node.id, 0);
    });
    
    edges.forEach(edge => {
      adj.get(edge.from)!.push(edge.to);
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    });

    // 初始化节点入度显示
    nodes.forEach(node => {
      node.inDegree = inDegree.get(node.id) || 0;
      node.tempInDegree = node.inDegree;
      node.visited = false;
      node.inQueue = false;
    });

    // 初始化队列（所有入度为0的节点）
    const queue: number[] = [];
    nodes.forEach(node => {
      if ((inDegree.get(node.id) || 0) === 0) {
        queue.push(node.id);
        node.inQueue = true;
      }
    });

    const result: number[] = [];

    setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
    setGraphState({ highlightedEdges: new Set(), highlightedNodes: new Set(), queue: [...queue] });

    runner.recordStep({
      lineNumber: 1,
      description: `初始化完成。入度为0的节点: [${queue.join(', ')}]，加入队列`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [
        { name: 'queue', value: `[${queue.join(', ')}]`, type: 'array' },
        { name: 'result', value: '[]', type: 'array' }
      ],
      highlights: { nodes: queue, edges: [] },
      memory: buildGraphMemoryState(
        nodes,
        edges,
        [
          { name: 'n', value: n, type: 'primitive' },
          { name: 'queue.size', value: queue.length, type: 'primitive' }
        ],
        { adjacencyList: adj, inDegree, queue, result }
      )
    });

    if (!(await waitWithPause(speedRef.current))) {
      runner.stop();
      return;
    }

    while (queue.length > 0) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }

      // 取出队首节点
      const u = queue.shift()!;
      const nodeU = nodes.find(n => n.id === u)!;
      nodeU.inQueue = false;
      nodeU.visited = true;
      nodeU.isProcessing = true;
      result.push(u);

      setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
      setGraphState({ 
        highlightedEdges: new Set(), 
        highlightedNodes: new Set([u]),
        queue: [...queue],
        currentNode: u
      });

      runner.recordStep({
        lineNumber: 5,
        description: `取出节点 ${u}，加入结果序列。当前结果: [${result.join(' → ')}]`,
        data: { nodes: cloneNodes(nodes), edges },
        variables: [
          { name: 'u', value: u, type: 'primitive' },
          { name: 'queue', value: `[${queue.join(', ')}]`, type: 'array' },
          { name: 'result', value: `[${result.join(', ')}]`, type: 'array' }
        ],
        highlights: { nodes: [u], edges: [] },
        memory: buildGraphMemoryState(
          nodes,
          edges,
          [
            { name: 'u', value: u, type: 'primitive' },
            { name: 'queue.size', value: queue.length, type: 'primitive' },
            { name: 'result.size', value: result.length, type: 'primitive' }
          ],
          { adjacencyList: adj, inDegree, queue, result }
        )
      });

      if (!(await waitWithPause(speedRef.current))) {
        runner.stop();
        return;
      }

      // 处理所有邻居节点
      const neighbors = adj.get(u) || [];
      for (const v of neighbors) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }

        const nodeV = nodes.find(n => n.id === v)!;
        const oldDegree = inDegree.get(v) || 0;
        const newDegree = oldDegree - 1;
        inDegree.set(v, newDegree);
        nodeV.tempInDegree = newDegree;

        // 高亮当前处理的边
        const edgeKey = `${u}-${v}`;
        setGraphState(prev => ({
          ...prev,
          highlightedEdges: new Set([...prev.highlightedEdges, edgeKey]),
          highlightedNodes: new Set([u, v])
        }));

        runner.recordStep({
          lineNumber: 8,
          description: `节点 ${u} → ${v}: 将节点 ${v} 的入度从 ${oldDegree} 减为 ${newDegree}`,
          data: { nodes: cloneNodes(nodes), edges },
          variables: [
            { name: 'u', value: u, type: 'primitive' },
            { name: 'v', value: v, type: 'primitive' },
            { name: `inDegree[${v}]`, value: newDegree, type: 'primitive' }
          ],
          highlights: { nodes: [u, v], edges: [edgeKey] },
          memory: buildGraphMemoryState(
            nodes,
            edges,
            [
              { name: 'u', value: u, type: 'primitive' },
              { name: 'v', value: v, type: 'primitive' }
            ],
            { adjacencyList: adj, inDegree, queue, result }
          )
        });

        if (!(await waitWithPause(speedRef.current * 0.7))) {
          runner.stop();
          return;
        }

        // 如果入度变为0，加入队列
        if (newDegree === 0) {
          queue.push(v);
          nodeV.inQueue = true;
          nodeV.isProcessing = false;

          setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
          setGraphState(prev => ({ ...prev, queue: [...queue] }));

          runner.recordStep({
            lineNumber: 10,
            description: `节点 ${v} 的入度变为0，加入队列`,
            data: { nodes: cloneNodes(nodes), edges },
            variables: [
              { name: 'v', value: v, type: 'primitive' },
              { name: 'queue', value: `[${queue.join(', ')}]`, type: 'array' }
            ],
            highlights: { nodes: [v], edges: [] },
            memory: buildGraphMemoryState(
              nodes,
              edges,
              [
                { name: 'v', value: v, type: 'primitive' },
                { name: 'queue.size', value: queue.length, type: 'primitive' }
              ],
              { adjacencyList: adj, inDegree, queue, result }
            )
          });

          if (!(await waitWithPause(speedRef.current * 0.7))) {
            runner.stop();
            return;
          }
        }
      }

      // 取消当前节点的处理状态
      nodeU.isProcessing = false;
      setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
    }

    // 检查是否所有节点都被处理（检测环）
    if (result.length !== n) {
      runner.recordStep({
        lineNumber: 14,
        description: `错误：图中存在环，无法进行拓扑排序！已处理 ${result.length}/${n} 个节点`,
        data: { nodes: cloneNodes(nodes), edges },
        variables: [
          { name: 'result.size', value: result.length, type: 'primitive' },
          { name: 'n', value: n, type: 'primitive' }
        ],
        highlights: { nodes: [], edges: [] },
        memory: buildGraphMemoryState(
          nodes,
          edges,
          [
            { name: 'result.size', value: result.length, type: 'primitive' },
            { name: 'n', value: n, type: 'primitive' }
          ],
          { adjacencyList: adj, inDegree, queue: [], result }
        )
      });
    } else {
      setGraphState({ 
        highlightedEdges: new Set(), 
        highlightedNodes: new Set(),
        queue: [],
        currentNode: undefined,
        phase: 'completed'
      });

      runner.recordStep({
        lineNumber: 14,
        description: `拓扑排序完成！结果序列: [${result.join(' → ')}]`,
        data: { nodes: cloneNodes(nodes), edges },
        variables: [
          { name: 'result', value: `[${result.join(', ')}]`, type: 'array' }
        ],
        highlights: { nodes: result, edges: [] },
        memory: buildGraphMemoryState(
          nodes,
          edges,
          [{ name: 'result.size', value: result.length, type: 'primitive' }],
          { adjacencyList: adj, inDegree, queue: [], result }
        )
      });
    }

    runner.setCompleted();
  };

  // BFS (广度优先搜索) 执行
  const runBFS = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;
    
    runner.start();
    
    const nodes = [...graphData.nodes];
    const edges = [...graphData.edges];
    const n = nodes.length;
    
    // 构建邻接表
    const adj = new Map<number, number[]>();
    nodes.forEach(node => {
      adj.set(node.id, []);
    });
    
    edges.forEach(edge => {
      adj.get(edge.from)!.push(edge.to);
      if (!graphData.directed) {
        adj.get(edge.to)!.push(edge.from);
      }
    });
    
    // 初始化节点状态
    nodes.forEach(node => {
      node.visited = false;
      node.inQueue = false;
      node.isProcessing = false;
      node.distance = Infinity;
      node.parent = null;
    });
    
    // BFS队列，存储 [节点ID, 距离]
    const queue: number[] = [];
    const start = startNode % n;
    
    queue.push(start);
    nodes[start].inQueue = true;
    nodes[start].distance = 0;
    
    const visitOrder: number[] = [];
    
    setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
    setGraphState({ 
      highlightedEdges: new Set(), 
      highlightedNodes: new Set([start]),
      queue: [...queue],
      currentNode: start
    });
    
    runner.recordStep({
      lineNumber: 1,
      description: `初始化完成。起点: ${start}，加入队列`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [
        { name: 'start', value: start, type: 'primitive' },
        { name: 'queue', value: `[${queue.join(', ')}]`, type: 'array' },
        { name: 'visited', value: `[${start}]`, type: 'array' }
      ],
      highlights: { nodes: [start], edges: [] },
      memory: buildGraphMemoryState(
        nodes,
        edges,
        [
          { name: 'start', value: start, type: 'primitive' },
          { name: 'queue.size', value: queue.length, type: 'primitive' }
        ],
        { adjacencyList: adj, queue, result: visitOrder }
      )
    });
    
    if (!(await waitWithPause(speedRef.current))) {
      runner.stop();
      return;
    }
    
    while (queue.length > 0) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }
      
      // 取出队首节点
      const u = queue.shift()!;
      const nodeU = nodes.find(n => n.id === u)!;
      nodeU.inQueue = false;
      nodeU.visited = true;
      nodeU.isProcessing = true;
      visitOrder.push(u);
      
      setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
      setGraphState({ 
        highlightedEdges: new Set(), 
        highlightedNodes: new Set([u]),
        queue: [...queue],
        currentNode: u
      });
      
      runner.recordStep({
        lineNumber: 5,
        description: `取出节点 ${u} (距离: ${nodeU.distance})，标记为已访问。访问顺序: [${visitOrder.join(' → ')}]`,
        data: { nodes: cloneNodes(nodes), edges },
        variables: [
          { name: 'u', value: u, type: 'primitive' },
          { name: 'queue', value: `[${queue.join(', ')}]`, type: 'array' },
          { name: 'distance[u]', value: nodeU.distance, type: 'primitive' }
        ],
        highlights: { nodes: [u], edges: [] },
        memory: buildGraphMemoryState(
          nodes,
          edges,
          [
            { name: 'u', value: u, type: 'primitive' },
            { name: 'queue.size', value: queue.length, type: 'primitive' }
          ],
          { adjacencyList: adj, queue, result: visitOrder }
        )
      });
      
      if (!(await waitWithPause(speedRef.current))) {
        runner.stop();
        return;
      }
      
      // 处理所有邻居
      const neighbors = adj.get(u) || [];
      for (const v of neighbors) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }
        
        const nodeV = nodes.find(n => n.id === v)!;
        
        if (!nodeV.visited && !nodeV.inQueue) {
          // 发现新节点
          queue.push(v);
          nodeV.inQueue = true;
          nodeV.distance = (nodeU.distance || 0) + 1;
          nodeV.parent = u;
          
          // 高亮边 u -> v
          const edgeKey = graphData.directed ? `${u}-${v}` : `${Math.min(u, v)}-${Math.max(u, v)}`;
          setGraphState(prev => ({
            ...prev,
            highlightedEdges: new Set([...prev.highlightedEdges, edgeKey]),
            highlightedNodes: new Set([u, v]),
            queue: [...queue]
          }));
          
          runner.recordStep({
            lineNumber: 9,
            description: `发现节点 ${v}，距离 = ${nodeV.distance}，父节点 = ${u}，加入队列`,
            data: { nodes: cloneNodes(nodes), edges },
            variables: [
              { name: 'u', value: u, type: 'primitive' },
              { name: 'v', value: v, type: 'primitive' },
              { name: 'distance[v]', value: nodeV.distance, type: 'primitive' }
            ],
            highlights: { nodes: [u, v], edges: [edgeKey] },
            memory: buildGraphMemoryState(
              nodes,
              edges,
              [
                { name: 'u', value: u, type: 'primitive' },
                { name: 'v', value: v, type: 'primitive' },
                { name: 'queue.size', value: queue.length, type: 'primitive' }
              ],
              { adjacencyList: adj, queue, result: visitOrder }
            )
          });
          
          if (!(await waitWithPause(speedRef.current * 0.7))) {
            runner.stop();
            return;
          }
        } else {
          // 节点已访问或在队列中
          const edgeKey = graphData.directed ? `${u}-${v}` : `${Math.min(u, v)}-${Math.max(u, v)}`;
          setGraphState(prev => ({
            ...prev,
            highlightedEdges: new Set([...prev.highlightedEdges, edgeKey]),
            highlightedNodes: new Set([u, v])
          }));
          
          runner.recordStep({
            lineNumber: 11,
            description: `节点 ${v} 已${nodeV.visited ? '访问' : '在队列中'}，跳过`,
            data: { nodes: cloneNodes(nodes), edges },
            variables: [
              { name: 'u', value: u, type: 'primitive' },
              { name: 'v', value: v, type: 'primitive' }
            ],
            highlights: { nodes: [u, v], edges: [edgeKey] },
            memory: buildGraphMemoryState(
              nodes,
              edges,
              [
                { name: 'u', value: u, type: 'primitive' },
                { name: 'v', value: v, type: 'primitive' }
              ],
              { adjacencyList: adj, queue, result: visitOrder }
            )
          });
          
          if (!(await waitWithPause(speedRef.current * 0.5))) {
            runner.stop();
            return;
          }
        }
      }
      
      // 取消当前节点的处理状态
      nodeU.isProcessing = false;
      setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
    }
    
    // BFS完成
    setGraphState({ 
      highlightedEdges: new Set(), 
      highlightedNodes: new Set(),
      queue: [],
      currentNode: undefined,
      phase: 'completed'
    });
    
    runner.recordStep({
      lineNumber: 14,
      description: `BFS遍历完成！访问顺序: [${visitOrder.join(' → ')}]`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [
        { name: 'result', value: `[${visitOrder.join(', ')}]`, type: 'array' },
        { name: 'result.size', value: visitOrder.length, type: 'primitive' }
      ],
      highlights: { nodes: visitOrder, edges: [] },
      memory: buildGraphMemoryState(
        nodes,
        edges,
        [{ name: 'result.size', value: visitOrder.length, type: 'primitive' }],
        { adjacencyList: adj, queue: [], result: visitOrder }
      )
    });
    
    runner.setCompleted();
  };

  // DFS (深度优先搜索) 执行
  const runDFS = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;
    
    runner.start();
    
    const nodes = [...graphData.nodes];
    const edges = [...graphData.edges];
    const n = nodes.length;
    
    // 构建邻接表
    const adj = new Map<number, number[]>();
    nodes.forEach(node => {
      adj.set(node.id, []);
    });
    
    edges.forEach(edge => {
      adj.get(edge.from)!.push(edge.to);
      if (!graphData.directed) {
        adj.get(edge.to)!.push(edge.from);
      }
    });
    
    // 初始化节点状态
    nodes.forEach(node => {
      node.visited = false;
      node.inStack = false;
      node.isProcessing = false;
      node.parent = null;
    });
    
    // DFS栈，用于显式栈实现
    const stack: number[] = [];
    const start = startNode % n;
    
    stack.push(start);
    
    const visitOrder: number[] = [];
    
    setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
    setGraphState({ 
      highlightedEdges: new Set(), 
      highlightedNodes: new Set([start]),
      stack: [...stack],
      currentNode: start
    });
    
    runner.recordStep({
      lineNumber: 1,
      description: `初始化完成。起点: ${start}，压入栈`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [
        { name: 'start', value: start, type: 'primitive' },
        { name: 'stack', value: `[${stack.join(', ')}]`, type: 'array' }
      ],
      highlights: { nodes: [start], edges: [] },
      memory: buildGraphMemoryState(
        nodes,
        edges,
        [
          { name: 'start', value: start, type: 'primitive' },
          { name: 'stack.size', value: stack.length, type: 'primitive' }
        ],
        { adjacencyList: adj, queue: stack, result: visitOrder }
      )
    });
    
    if (!(await waitWithPause(speedRef.current))) {
      runner.stop();
      return;
    }
    
    while (stack.length > 0) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }
      
      // 查看栈顶（不弹出）
      const u = stack[stack.length - 1];
      const nodeU = nodes.find(n => n.id === u)!;
      
      // 如果节点未访问，标记为正在处理
      if (!nodeU.visited) {
        nodeU.visited = true;
        nodeU.inStack = true;
        nodeU.isProcessing = true;
        visitOrder.push(u);
        
        setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
        setGraphState({ 
          highlightedEdges: new Set(), 
          highlightedNodes: new Set([u]),
          stack: [...stack],
          currentNode: u
        });
        
        runner.recordStep({
          lineNumber: 5,
          description: `访问节点 ${u}，标记为已访问。访问顺序: [${visitOrder.join(' → ')}]`,
          data: { nodes: cloneNodes(nodes), edges },
          variables: [
            { name: 'u', value: u, type: 'primitive' },
            { name: 'stack', value: `[${stack.join(', ')}]`, type: 'array' }
          ],
          highlights: { nodes: [u], edges: [] },
          memory: buildGraphMemoryState(
            nodes,
            edges,
            [
              { name: 'u', value: u, type: 'primitive' },
              { name: 'stack.size', value: stack.length, type: 'primitive' }
            ],
            { adjacencyList: adj, queue: stack, result: visitOrder }
          )
        });
        
        if (!(await waitWithPause(speedRef.current))) {
          runner.stop();
          return;
        }
      }
      
      // 寻找未访问的邻居
      const neighbors = adj.get(u) || [];
      let foundUnvisited = false;
      
      for (const v of neighbors) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }
        
        const nodeV = nodes.find(n => n.id === v)!;
        
        if (!nodeV.visited) {
          // 发现未访问的邻居，压入栈
          foundUnvisited = true;
          stack.push(v);
          nodeV.parent = u;
          
          // 高亮边 u -> v
          const edgeKey = graphData.directed ? `${u}-${v}` : `${Math.min(u, v)}-${Math.max(u, v)}`;
          setGraphState(prev => ({
            ...prev,
            highlightedEdges: new Set([...prev.highlightedEdges, edgeKey]),
            highlightedNodes: new Set([u, v]),
            stack: [...stack]
          }));
          
          runner.recordStep({
            lineNumber: 9,
            description: `发现未访问的邻居 ${v}，压入栈。深度 +1`,
            data: { nodes: cloneNodes(nodes), edges },
            variables: [
              { name: 'u', value: u, type: 'primitive' },
              { name: 'v', value: v, type: 'primitive' },
              { name: 'stack.size', value: stack.length, type: 'primitive' }
            ],
            highlights: { nodes: [u, v], edges: [edgeKey] },
            memory: buildGraphMemoryState(
              nodes,
              edges,
              [
                { name: 'u', value: u, type: 'primitive' },
                { name: 'v', value: v, type: 'primitive' },
                { name: 'stack.size', value: stack.length, type: 'primitive' }
              ],
              { adjacencyList: adj, queue: stack, result: visitOrder }
            )
          });
          
          if (!(await waitWithPause(speedRef.current))) {
            runner.stop();
            return;
          }
          
          break;  // 处理完一个邻居后继续循环（深度优先）
        } else if (nodeV.inStack) {
          // 发现回边（当前DFS路径上的节点）
          const edgeKey = graphData.directed ? `${u}-${v}` : `${Math.min(u, v)}-${Math.max(u, v)}`;
          setGraphState(prev => ({
            ...prev,
            highlightedEdges: new Set([...prev.highlightedEdges, edgeKey]),
            highlightedNodes: new Set([u, v])
          }));
          
          runner.recordStep({
            lineNumber: 13,
            description: `节点 ${v} 在当前路径上（回边），跳过`,
            data: { nodes: cloneNodes(nodes), edges },
            variables: [
              { name: 'u', value: u, type: 'primitive' },
              { name: 'v', value: v, type: 'primitive' }
            ],
            highlights: { nodes: [u, v], edges: [edgeKey] },
            memory: buildGraphMemoryState(
              nodes,
              edges,
              [
                { name: 'u', value: u, type: 'primitive' },
                { name: 'v', value: v, type: 'primitive' }
              ],
              { adjacencyList: adj, queue: stack, result: visitOrder }
            )
          });
          
          if (!(await waitWithPause(speedRef.current * 0.5))) {
            runner.stop();
            return;
          }
        }
      }
      
      // 如果没有未访问的邻居，弹出栈（回溯）
      if (!foundUnvisited) {
        const popped = stack.pop()!;
        const poppedNode = nodes.find(n => n.id === popped)!;
        poppedNode.inStack = false;
        poppedNode.isProcessing = false;
        
        setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
        setGraphState(prev => ({
          ...prev,
          stack: [...stack],
          currentNode: stack.length > 0 ? stack[stack.length - 1] : undefined
        }));
        
        runner.recordStep({
          lineNumber: 17,
          description: stack.length > 0 
            ? `节点 ${popped} 无未访问邻居，弹出栈。回溯到节点 ${stack[stack.length - 1]}`
            : `节点 ${popped} 无未访问邻居，弹出栈。栈为空，遍历完成`,
          data: { nodes: cloneNodes(nodes), edges },
          variables: [
            { name: 'popped', value: popped, type: 'primitive' },
            { name: 'stack.size', value: stack.length, type: 'primitive' }
          ],
          highlights: { nodes: poppedNode.parent !== null && poppedNode.parent !== undefined ? [popped, poppedNode.parent] : [popped], edges: [] },
          memory: buildGraphMemoryState(
            nodes,
            edges,
            [
              { name: 'popped', value: popped, type: 'primitive' },
              { name: 'stack.size', value: stack.length, type: 'primitive' }
            ],
            { adjacencyList: adj, queue: stack, result: visitOrder }
          )
        });
        
        if (!(await waitWithPause(speedRef.current * 0.7))) {
          runner.stop();
          return;
        }
      }
    }
    
    // DFS完成
    setGraphState({ 
      highlightedEdges: new Set(), 
      highlightedNodes: new Set(),
      stack: [],
      currentNode: undefined,
      phase: 'completed'
    });
    
    runner.recordStep({
      lineNumber: 20,
      description: `DFS遍历完成！访问顺序: [${visitOrder.join(' → ')}]`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [
        { name: 'result', value: `[${visitOrder.join(', ')}]`, type: 'array' },
        { name: 'result.size', value: visitOrder.length, type: 'primitive' }
      ],
      highlights: { nodes: visitOrder, edges: [] },
      memory: buildGraphMemoryState(
        nodes,
        edges,
        [{ name: 'result.size', value: visitOrder.length, type: 'primitive' }],
        { adjacencyList: adj, queue: [], result: visitOrder }
      )
    });
    
    runner.setCompleted();
  };

  // Kruskal MST 执行
  const runKruskal = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;

    runner.start();

    const nodes = [...graphData.nodes];
    const edges = [...graphData.edges];
    const n = nodes.length;

    // 构建边列表（去重，因为是无向图）
    const edgeList: { from: number; to: number; weight: number }[] = [];
    const seen = new Set<string>();
    edges.forEach(e => {
      const key = e.from < e.to ? `${e.from}-${e.to}` : `${e.to}-${e.from}`;
      if (!seen.has(key)) {
        seen.add(key);
        edgeList.push({ from: e.from, to: e.to, weight: e.weight || 1 });
      }
    });

    // 按权重排序边
    edgeList.sort((a, b) => a.weight - b.weight);

    // 初始化并查集
    const parent: number[] = Array.from({ length: n }, (_, i) => i);
    const rank: number[] = new Array(n).fill(0);

    const find = (x: number): number => {
      if (parent[x] !== x) {
        parent[x] = find(parent[x]);
      }
      return parent[x];
    };

    const union = (x: number, y: number): boolean => {
      const px = find(x), py = find(y);
      if (px === py) return false;
      if (rank[px] < rank[py]) {
        parent[px] = py;
      } else if (rank[px] > rank[py]) {
        parent[py] = px;
      } else {
        parent[py] = px;
        rank[px]++;
      }
      return true;
    };

    const mstEdges: string[] = [];
    const mstNodes = new Set<number>();
    let totalWeight = 0;

    // 初始化状态
    setGraphData(prev => ({ ...prev, nodes: [...nodes], edges: [...edges] }));
    setGraphState({ 
      highlightedEdges: new Set(), 
      highlightedNodes: new Set(),
      phase: 'running'
    });

    runner.recordStep({
      lineNumber: 1,
      description: `初始化完成。共有 ${n} 个节点，${edgeList.length} 条边。准备按权重排序后依次处理。`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [
        { name: 'n', value: n, type: 'primitive' },
        { name: 'm', value: edgeList.length, type: 'primitive' },
        { name: 'totalWeight', value: 0, type: 'primitive' }
      ],
      highlights: { nodes: [], edges: [] },
      memory: buildGraphMemoryState(
        nodes,
        edges,
        [
          { name: 'n', value: n, type: 'primitive' },
          { name: 'edgeCount', value: edgeList.length, type: 'primitive' }
        ],
        { result: [] }
      )
    });

    if (!(await waitWithPause(speedRef.current))) {
      runner.stop();
      return;
    }

    // 遍历排序后的边
    for (let i = 0; i < edgeList.length; i++) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }

      const edge = edgeList[i];
      const edgeKey = edge.from < edge.to ? `${edge.from}-${edge.to}` : `${edge.to}-${edge.from}`;

      // 高亮当前考虑的边
      setGraphState(prev => ({
        ...prev,
        highlightedEdges: new Set([edgeKey]),
        highlightedNodes: new Set([edge.from, edge.to])
      }));

      const fromRoot = find(edge.from);
      const toRoot = find(edge.to);
      const willFormCycle = fromRoot === toRoot;

      runner.recordStep({
        lineNumber: 8,
        description: `考虑边 (${edge.from}-${edge.to})，权重=${edge.weight}。${willFormCycle ? '会形成环，跳过！' : '不会形成环，加入MST'}`,
        data: { nodes: cloneNodes(nodes), edges },
        variables: [
          { name: 'i', value: i, type: 'primitive' },
          { name: 'u', value: edge.from, type: 'primitive' },
          { name: 'v', value: edge.to, type: 'primitive' },
          { name: 'weight', value: edge.weight, type: 'primitive' },
          { name: 'totalWeight', value: totalWeight, type: 'primitive' }
        ],
        highlights: { nodes: [edge.from, edge.to], edges: [edgeKey] },
        memory: buildGraphMemoryState(
          nodes,
          edges,
          [
            { name: 'i', value: i, type: 'primitive' },
            { name: 'u', value: edge.from, type: 'primitive' },
            { name: 'v', value: edge.to, type: 'primitive' },
            { name: 'find(u)', value: fromRoot, type: 'primitive' },
            { name: 'find(v)', value: toRoot, type: 'primitive' }
          ],
          { result: mstEdges.map(e => `边${e}`) }
        )
      });

      if (!(await waitWithPause(speedRef.current))) {
        runner.stop();
        return;
      }

      if (!willFormCycle) {
        // 加入MST
        union(edge.from, edge.to);
        mstEdges.push(edgeKey);
        mstNodes.add(edge.from);
        mstNodes.add(edge.to);
        totalWeight += edge.weight;

        // 高亮MST边
        setGraphState(prev => ({
          ...prev,
          highlightedEdges: new Set(mstEdges),
          highlightedNodes: new Set(mstNodes)
        }));

        runner.recordStep({
          lineNumber: 10,
          description: `将边 (${edge.from}-${edge.to}) 加入MST。当前总权重: ${totalWeight}`,
          data: { nodes: cloneNodes(nodes), edges },
          variables: [
            { name: 'totalWeight', value: totalWeight, type: 'primitive' },
            { name: 'mstEdges', value: mstEdges.length, type: 'primitive' }
          ],
          highlights: { nodes: Array.from(mstNodes), edges: mstEdges },
          memory: buildGraphMemoryState(
            nodes,
            edges,
            [
              { name: 'totalWeight', value: totalWeight, type: 'primitive' },
              { name: 'mstSize', value: mstEdges.length, type: 'primitive' }
            ],
            { result: mstEdges.map(e => `边${e}`) }
          )
        });

        if (!(await waitWithPause(speedRef.current * 0.7))) {
          runner.stop();
          return;
        }

        // 检查是否完成
        if (mstEdges.length === n - 1) {
          break;
        }
      }
    }

    // 最终结果
    setGraphState({ 
      highlightedEdges: new Set(mstEdges), 
      highlightedNodes: new Set(mstNodes),
      phase: 'completed',
      totalWeight
    });

    runner.recordStep({
      lineNumber: 16,
      description: `Kruskal算法完成！MST包含 ${mstEdges.length} 条边，总权重: ${totalWeight}`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [
        { name: 'totalWeight', value: totalWeight, type: 'primitive' },
        { name: 'mstEdges', value: mstEdges.length, type: 'primitive' }
      ],
      highlights: { nodes: Array.from(mstNodes), edges: mstEdges },
      memory: buildGraphMemoryState(
        nodes,
        edges,
        [
          { name: 'totalWeight', value: totalWeight, type: 'primitive' },
          { name: 'mstSize', value: mstEdges.length, type: 'primitive' }
        ],
        { result: mstEdges.map(e => `边${e}(权重${edgeList.find(ed => {
          const ek = ed.from < ed.to ? `${ed.from}-${ed.to}` : `${ed.to}-${ed.from}`;
          return ek === e;
        })?.weight || '?'})`) }
      )
    });

    runner.setCompleted();
  };

  // Prim MST 执行
  const runPrim = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;

    runner.start();

    const nodes = [...graphData.nodes];
    const edges = [...graphData.edges];
    const n = nodes.length;

    // 构建邻接表
    const adj = new Map<number, { to: number; weight: number }[]>();
    nodes.forEach(node => adj.set(node.id, []));
    edges.forEach(edge => {
      adj.get(edge.from)!.push({ to: edge.to, weight: edge.weight || 1 });
      adj.get(edge.to)!.push({ to: edge.from, weight: edge.weight || 1 });
    });

    // Prim算法
    const inMST = new Array(n).fill(false);
    const key = new Array(n).fill(Infinity);
    const parent = new Array(n).fill(-1);

    // 从节点0开始
    const startNode = 0;
    key[startNode] = 0;

    // 优先队列实现
    type PQItem = { node: number; key: number };
    const pq: PQItem[] = [{ node: startNode, key: 0 }];

    const heapifyUp = (idx: number) => {
      while (idx > 0) {
        const p = Math.floor((idx - 1) / 2);
        if (pq[p].key <= pq[idx].key) break;
        [pq[p], pq[idx]] = [pq[idx], pq[p]];
        idx = p;
      }
    };

    const heapifyDown = (idx: number) => {
      while (true) {
        let min = idx;
        const left = 2 * idx + 1;
        const right = 2 * idx + 2;
        if (left < pq.length && pq[left].key < pq[min].key) min = left;
        if (right < pq.length && pq[right].key < pq[min].key) min = right;
        if (min === idx) break;
        [pq[idx], pq[min]] = [pq[min], pq[idx]];
        idx = min;
      }
    };

    const pqEnqueue = (node: number, k: number) => {
      pq.push({ node, key: k });
      heapifyUp(pq.length - 1);
    };

    const pqDequeue = (): number | null => {
      if (pq.length === 0) return null;
      const min = pq[0];
      const end = pq.pop()!;
      if (pq.length > 0) {
        pq[0] = end;
        heapifyDown(0);
      }
      return min.node;
    };

    const mstEdges: string[] = [];
    let totalWeight = 0;

    // 初始化显示
    setGraphData(prev => ({ ...prev, nodes: [...nodes], edges: [...edges] }));
    setGraphState({ 
      highlightedEdges: new Set(), 
      highlightedNodes: new Set([startNode]),
      currentNode: startNode,
      phase: 'running'
    });

    runner.recordStep({
      lineNumber: 1,
      description: `Prim算法初始化。从节点 ${startNode} 开始构建MST。`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [
        { name: 'start', value: startNode, type: 'primitive' },
        { name: 'n', value: n, type: 'primitive' }
      ],
      highlights: { nodes: [startNode], edges: [] },
      memory: buildGraphMemoryState(
        nodes,
        edges,
        [
          { name: 'start', value: startNode, type: 'primitive' },
          { name: 'n', value: n, type: 'primitive' }
        ],
        { result: [] }
      )
    });

    if (!(await waitWithPause(speedRef.current))) {
      runner.stop();
      return;
    }

    while (mstEdges.length < n - 1) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }

      const u = pqDequeue();
      if (u === null) break;
      if (inMST[u]) continue;

      inMST[u] = true;

      // 如果不是起始节点，添加边到MST
      if (parent[u] !== -1) {
        const edgeKey = parent[u] < u ? `${parent[u]}-${u}` : `${u}-${parent[u]}`;
        mstEdges.push(edgeKey);
        totalWeight += key[u];
      }

      // 高亮当前节点
      const currentMSTNodes = nodes.filter((_, i) => inMST[i]).map(n => n.id);
      setGraphState(prev => ({
        ...prev,
        highlightedEdges: new Set(mstEdges),
        highlightedNodes: new Set(currentMSTNodes),
        currentNode: u
      }));

      runner.recordStep({
        lineNumber: 8,
        description: `将节点 ${u} 加入MST${parent[u] !== -1 ? `，通过边 (${parent[u]}-${u})，权重=${key[u]}` : ''}。当前总权重: ${totalWeight}`,
        data: { nodes: cloneNodes(nodes), edges },
        variables: [
          { name: 'u', value: u, type: 'primitive' },
          { name: 'key[u]', value: key[u], type: 'primitive' },
          { name: 'totalWeight', value: totalWeight, type: 'primitive' }
        ],
        highlights: { nodes: currentMSTNodes, edges: mstEdges },
        memory: buildGraphMemoryState(
          nodes,
          edges,
          [
            { name: 'u', value: u, type: 'primitive' },
            { name: 'totalWeight', value: totalWeight, type: 'primitive' },
            { name: 'mstSize', value: mstEdges.length, type: 'primitive' }
          ],
          { result: mstEdges.map(e => `边${e}`) }
        )
      });

      if (!(await waitWithPause(speedRef.current))) {
        runner.stop();
        return;
      }

      // 更新邻居
      for (const { to: v, weight } of adj.get(u) || []) {
        if (!inMST[v] && weight < key[v]) {
          const oldKey = key[v];
          key[v] = weight;
          parent[v] = u;
          pqEnqueue(v, key[v]);

          // 高亮更新的边
          const updateEdgeKey = u < v ? `${u}-${v}` : `${v}-${u}`;
          setGraphState(prev => ({
            ...prev,
            highlightedEdges: new Set([...mstEdges, updateEdgeKey]),
            highlightedNodes: new Set([...currentMSTNodes, v])
          }));

          runner.recordStep({
            lineNumber: 15,
            description: `更新节点 ${v} 的最小连接边：从 ${oldKey === Infinity ? '∞' : oldKey} 变为 ${weight}（通过节点 ${u}）`,
            data: { nodes: cloneNodes(nodes), edges },
            variables: [
              { name: 'v', value: v, type: 'primitive' },
              { name: 'oldKey', value: oldKey === Infinity ? '∞' : oldKey, type: 'primitive' },
              { name: 'newKey', value: weight, type: 'primitive' },
              { name: 'parent[v]', value: u, type: 'primitive' }
            ],
            highlights: { nodes: [...currentMSTNodes, v], edges: [...mstEdges, updateEdgeKey] },
            memory: buildGraphMemoryState(
              nodes,
              edges,
              [
                { name: 'v', value: v, type: 'primitive' },
                { name: 'key[v]', value: weight, type: 'primitive' },
                { name: 'parent[v]', value: u, type: 'primitive' }
              ],
              { result: mstEdges.map(e => `边${e}`) }
            )
          });

          if (!(await waitWithPause(speedRef.current * 0.7))) {
            runner.stop();
            return;
          }
        }
      }
    }

    // 最终结果
    const finalMSTNodes = nodes.filter((_, i) => inMST[i]).map(n => n.id);
    setGraphState({ 
      highlightedEdges: new Set(mstEdges), 
      highlightedNodes: new Set(finalMSTNodes),
      phase: 'completed',
      totalWeight
    });

    runner.recordStep({
      lineNumber: 20,
      description: `Prim算法完成！MST包含 ${mstEdges.length} 条边，总权重: ${totalWeight}`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [
        { name: 'totalWeight', value: totalWeight, type: 'primitive' },
        { name: 'mstEdges', value: mstEdges.length, type: 'primitive' }
      ],
      highlights: { nodes: finalMSTNodes, edges: mstEdges },
      memory: buildGraphMemoryState(
        nodes,
        edges,
        [
          { name: 'totalWeight', value: totalWeight, type: 'primitive' },
          { name: 'mstSize', value: mstEdges.length, type: 'primitive' }
        ],
        { result: mstEdges.map(e => `边${e}`) }
      )
    });

    runner.setCompleted();
  };

  // Floyd-Warshall (弗洛伊德) 多源最短路径算法执行
  const runFloydWarshall = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;

    runner.start();

    const nodes = [...graphData.nodes];
    const edges = [...graphData.edges];
    const n = nodes.length;

    // 初始化距离矩阵
    const dist: number[][] = Array.from({ length: n }, (_, i) => 
      Array.from({ length: n }, (_, j) => i === j ? 0 : Infinity)
    );
    const next: number[][] = Array.from({ length: n }, () => Array(n).fill(-1));

    // 填充已知边权重
    edges.forEach(edge => {
      if (edge.weight !== undefined && edge.weight < dist[edge.from][edge.to]) {
        dist[edge.from][edge.to] = edge.weight;
        next[edge.from][edge.to] = edge.to;
      }
    });

    // 记录初始矩阵状态
    setMatrixData({
      dist: dist.map(row => [...row]),
      next: next.map(row => [...row]),
      size: n,
      currentK: -1,
      currentI: -1,
      currentJ: -1,
      updated: false,
      completed: false
    });

    runner.recordStep({
      lineNumber: 5,
      description: `初始化距离矩阵完成。对角线为0，已知边填充权重，其余为∞`,
      data: { 
        nodes: cloneNodes(nodes), 
        edges,
        matrix: dist.map(row => [...row]),
        size: n
      },
      variables: [
        { name: 'n', value: n, type: 'primitive' }
      ],
      highlights: { nodes: [], edges: [] },
      memory: buildGraphMemoryState(
        nodes,
        edges,
        [
          { name: 'n', value: n, type: 'primitive' }
        ],
        {}
      )
    });

    if (!(await waitWithPause(speedRef.current))) {
      runner.stop();
      return;
    }

    // Floyd-Warshall 核心三重循环
    for (let k = 0; k < n; k++) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }

      // 高亮当前中转点k
      setMatrixData(prev => ({ ...prev, currentK: k, currentI: -1, currentJ: -1, updated: false }));
      
      // 高亮节点k
      const nodeK = nodes.find(n => n.id === k);
      if (nodeK) nodeK.isProcessing = true;
      setGraphData(prev => ({ ...prev, nodes: [...nodes] }));

      runner.recordStep({
        lineNumber: 10,
        description: `开始第 ${k + 1} 轮迭代：以节点 ${k} 作为中转点`,
        data: { 
          nodes: cloneNodes(nodes), 
          edges,
          matrix: dist.map(row => [...row]),
          k,
          size: n
        },
        variables: [
          { name: 'k', value: k, type: 'primitive' }
        ],
        highlights: { nodes: [k], edges: [] },
        memory: buildGraphMemoryState(
          nodes,
          edges,
          [
            { name: 'k', value: k, type: 'primitive' },
            { name: 'n', value: n, type: 'primitive' }
          ],
          {}
        )
      });

      if (!(await waitWithPause(speedRef.current * 0.7))) {
        runner.stop();
        return;
      }

      for (let i = 0; i < n; i++) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }

        for (let j = 0; j < n; j++) {
          if (shouldStopRef.current) {
            runner.stop();
            return;
          }

          // 跳过对角线
          if (i === j) continue;

          setMatrixData(prev => ({ ...prev, currentI: i, currentJ: j, updated: false }));

          const oldDist = dist[i][j];
          const newDist = dist[i][k] + dist[k][j];
          const willUpdate = newDist < oldDist;

          runner.recordStep({
            lineNumber: 13,
            description: willUpdate 
              ? `检查 dist[${i}][${j}]：${oldDist === Infinity ? '∞' : oldDist} > ${dist[i][k]} + ${dist[k][j]} = ${newDist}，需要更新！`
              : `检查 dist[${i}][${j}]：${oldDist === Infinity ? '∞' : oldDist} ≤ ${dist[i][k] === Infinity ? '∞' : dist[i][k]} + ${dist[k][j] === Infinity ? '∞' : dist[k][j]}，无需更新`,
            data: { 
              nodes: cloneNodes(nodes), 
              edges,
              matrix: dist.map(row => [...row]),
              k, i, j,
              size: n,
              checking: true,
              willUpdate
            },
            variables: [
              { name: 'k', value: k, type: 'primitive' },
              { name: 'i', value: i, type: 'primitive' },
              { name: 'j', value: j, type: 'primitive' },
              { name: `dist[${i}][${j}]`, value: oldDist === Infinity ? '∞' : oldDist, type: 'primitive' },
              { name: `dist[${i}][${k}]+dist[${k}][${j}]`, value: newDist === Infinity ? '∞' : newDist, type: 'primitive' }
            ],
            highlights: { nodes: [i, k, j], edges: [] },
            memory: buildGraphMemoryState(
              nodes,
              edges,
              [
                { name: 'k', value: k, type: 'primitive' },
                { name: 'i', value: i, type: 'primitive' },
                { name: 'j', value: j, type: 'primitive' }
              ],
              {}
            )
          });

          if (!(await waitWithPause(speedRef.current * 0.3))) {
            runner.stop();
            return;
          }

          // 状态转移：如果经过k可以缩短i到j的距离
          if (newDist < oldDist) {
            dist[i][j] = newDist;
            next[i][j] = next[i][k];

            setMatrixData(prev => ({ 
              ...prev, 
              dist: dist.map(row => [...row]),
              next: next.map(row => [...row]),
              updated: true 
            }));

            runner.recordStep({
              lineNumber: 14,
              description: `更新 dist[${i}][${j}] = ${newDist}，路径经过节点 ${k}`,
              data: { 
                nodes: cloneNodes(nodes), 
                edges,
                matrix: dist.map(row => [...row]),
                k, i, j,
                size: n,
                checking: false,
                updated: true
              },
              variables: [
                { name: 'k', value: k, type: 'primitive' },
                { name: 'i', value: i, type: 'primitive' },
                { name: 'j', value: j, type: 'primitive' },
                { name: `dist[${i}][${j}]`, value: newDist, type: 'primitive' }
              ],
              highlights: { nodes: [i, j], edges: [] },
              memory: buildGraphMemoryState(
                nodes,
                edges,
                [
                  { name: 'k', value: k, type: 'primitive' },
                  { name: 'i', value: i, type: 'primitive' },
                  { name: 'j', value: j, type: 'primitive' },
                  { name: `dist[${i}][${j}]`, value: newDist, type: 'primitive' }
                ],
                {}
              )
            });

            if (!(await waitWithPause(speedRef.current * 0.4))) {
              runner.stop();
              return;
            }
          }
        }
      }

      // 取消节点k的处理状态
      if (nodeK) nodeK.isProcessing = false;
    }

    // 标记完成
    setMatrixData(prev => ({ ...prev, completed: true, currentK: -1, currentI: -1, currentJ: -1 }));

    runner.recordStep({
      lineNumber: 18,
      description: `Floyd-Warshall算法完成！所有节点对之间的最短距离已计算完毕`,
      data: { 
        nodes: cloneNodes(nodes), 
        edges,
        matrix: dist.map(row => [...row]),
        size: n,
        completed: true
      },
      variables: [],
      highlights: { nodes: nodes.map(n => n.id), edges: [] },
      memory: buildGraphMemoryState(
        nodes,
        edges,
        [{ name: 'n', value: n, type: 'primitive' }],
        {}
      )
    });

    runner.setCompleted();
  };

  // TimSort 执行
  const runTimSort = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;

    if (initialArrayRef.current.length === 0) {
      initialArrayRef.current = [...sortingData.array];
    }

    const arr = [...initialArrayRef.current];
    const n = arr.length;
    const RUN = 4; // 最小 run 大小（为了可视化效果，使用较小的值）

    runner.start();

    // 对每个 run 进行插入排序
    for (let i = 0; i < n; i += RUN) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }

      const runEnd = Math.min(i + RUN - 1, n - 1);

      // 高亮当前 run 的范围
      const runIndices = Array.from({ length: runEnd - i + 1 }, (_, idx) => i + idx);
      setSortingData(prev => ({ ...prev, comparing: runIndices, swapping: [] }));
      runner.recordStep({
        lineNumber: 5,
        description: `对 run [${i}..${runEnd}] 进行插入排序`,
        data: { array: [...arr] },
        variables: [{ name: 'i', value: i, type: 'primitive' as const }, { name: 'RUN', value: RUN, type: 'primitive' as const }],
        highlights: { arrayIndices: runIndices },
        sortingState: { comparing: runIndices, swapping: [], sorted: [] },
        memory: buildMemoryState(arr, [
          { name: 'i', value: i, type: 'primitive' },
          { name: 'RUN', value: RUN, type: 'primitive' },
          { name: 'runEnd', value: runEnd, type: 'primitive' },
          { name: 'n', value: n, type: 'primitive' }
        ])
      });

      if (!(await waitWithPause(speedRef.current * 0.5))) {
        runner.stop();
        return;
      }

      await insertionSortRun(i, runEnd);
    }

    // 归并排序合并 runs
    for (let size = RUN; size < n; size = 2 * size) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }

      // 高亮当前归并的 size
      setSortingData(prev => ({ ...prev, comparing: [], swapping: [] }));
      runner.recordStep({
        lineNumber: 10,
        description: `开始归并，当前 size = ${size}`,
        data: { array: [...arr] },
        variables: [{ name: 'size', value: size, type: 'primitive' as const }],
        highlights: {},
        sortingState: { comparing: [], swapping: [], sorted: [] },
        memory: buildMemoryState(arr, [
          { name: 'size', value: size, type: 'primitive' },
          { name: 'RUN', value: RUN, type: 'primitive' },
          { name: 'n', value: n, type: 'primitive' }
        ])
      });

      if (!(await waitWithPause(speedRef.current * 0.3))) {
        runner.stop();
        return;
      }

      for (let left = 0; left < n; left += 2 * size) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }

        const mid = left + size - 1;
        const right = Math.min(left + 2 * size - 1, n - 1);

        if (mid < right) {
          // 高亮要归并的两个 run
          const mergeIndices = Array.from({ length: right - left + 1 }, (_, idx) => left + idx);
          setSortingData(prev => ({ ...prev, comparing: mergeIndices, swapping: [] }));
          runner.recordStep({
            lineNumber: 12,
            description: `归并区间 [${left}..${mid}] 和 [${mid + 1}..${right}]`,
            data: { array: [...arr] },
            variables: [{ name: 'left', value: left, type: 'primitive' as const }, { name: 'mid', value: mid, type: 'primitive' as const }, { name: 'right', value: right, type: 'primitive' as const }],
            highlights: { arrayIndices: mergeIndices },
            sortingState: { comparing: mergeIndices, swapping: [], sorted: [] },
            memory: buildMemoryState(arr, [
              { name: 'left', value: left, type: 'primitive' },
              { name: 'mid', value: mid, type: 'primitive' },
              { name: 'right', value: right, type: 'primitive' },
              { name: 'size', value: size, type: 'primitive' },
              { name: 'n', value: n, type: 'primitive' }
            ])
          });

          if (!(await waitWithPause(speedRef.current * 0.3))) {
            runner.stop();
            return;
          }

          await merge(left, mid, right);
        }
      }
    }

    // 标记全部已排序
    setSortingData(prev => ({ ...prev, sorted: Array.from({ length: n }, (_, i) => i), comparing: [], swapping: [] }));

    // 验证排序结果
    const isSorted = arr.every((val, idx) => idx === 0 || arr[idx - 1] <= val);

    runner.recordStep({
      lineNumber: 0,
      description: isSorted ? '排序完成！数组已正确排序' : '排序完成！',
      data: { array: [...arr] },
      variables: [],
      highlights: {},
      sortingState: { comparing: [], swapping: [], sorted: Array.from({ length: n }, (_, i) => i) },
      memory: buildMemoryState(arr, [
        { name: 'n', value: n, type: 'primitive' }
      ])
    });

    runner.setCompleted();

    async function insertionSortRun(left: number, right: number) {
      for (let i = left + 1; i <= right; i++) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }

        const key = arr[i];
        let j = i - 1;

        // 高亮当前要插入的元素
        setSortingData(prev => ({ ...prev, comparing: [i], swapping: [] }));
        runner.recordStep({
          lineNumber: 19,
          description: `Run 内插入排序：准备将 ${key} 插入到正确位置`,
          data: { array: [...arr] },
          variables: [{ name: 'i', value: i, type: 'primitive' as const }, { name: 'key', value: key, type: 'primitive' as const }],
          highlights: { arrayIndices: [i] },
          sortingState: { comparing: [i], swapping: [], sorted: [] },
          memory: buildMemoryState(arr, [
            { name: 'left', value: left, type: 'primitive' },
            { name: 'right', value: right, type: 'primitive' },
            { name: 'i', value: i, type: 'primitive' },
            { name: 'key', value: key, type: 'temp' }
          ])
        });

        if (!(await waitWithPause(speedRef.current * 0.3))) {
          runner.stop();
          return;
        }

        // 向后移动元素
        while (j >= left && arr[j] > key) {
          if (shouldStopRef.current) {
            runner.stop();
            return;
          }

          setSortingData(prev => ({ ...prev, comparing: [j, j + 1], swapping: [] }));
          runner.recordStep({
            lineNumber: 23,
            description: `${arr[j]} > ${key}，将 ${arr[j]} 向后移动`,
            data: { array: [...arr] },
            variables: [{ name: 'j', value: j, type: 'primitive' as const }],
            highlights: { arrayIndices: [j, j + 1] },
            sortingState: { comparing: [j, j + 1], swapping: [], sorted: [] },
            memory: buildMemoryState(arr, [
              { name: 'left', value: left, type: 'primitive' },
              { name: 'right', value: right, type: 'primitive' },
              { name: 'i', value: i, type: 'primitive' },
              { name: 'key', value: key, type: 'temp' },
              { name: 'j', value: j, type: 'primitive' }
            ])
          });

          arr[j + 1] = arr[j];
          setSortingData(prev => ({ ...prev, array: [...arr] }));

          if (!(await waitWithPause(speedRef.current * 0.3))) {
            runner.stop();
            return;
          }

          j--;
        }

        arr[j + 1] = key;
        setSortingData(prev => ({ ...prev, array: [...arr], comparing: [j + 1], swapping: [] }));

        runner.recordStep({
          lineNumber: 27,
          description: `将 ${key} 插入到位置 ${j + 1}`,
          data: { array: [...arr] },
          variables: [],
          highlights: { arrayIndices: [j + 1] },
          sortingState: { comparing: [j + 1], swapping: [], sorted: [] },
          memory: buildMemoryState(arr, [
            { name: 'left', value: left, type: 'primitive' },
            { name: 'right', value: right, type: 'primitive' },
            { name: 'i', value: i, type: 'primitive' },
            { name: 'key', value: key, type: 'temp' },
            { name: 'j', value: j, type: 'primitive' }
          ])
        });

        if (!(await waitWithPause(speedRef.current * 0.3))) {
          runner.stop();
          return;
        }
      }
    }

    async function merge(left: number, mid: number, right: number) {
      const leftArr = arr.slice(left, mid + 1);
      const rightArr = arr.slice(mid + 1, right + 1);

      let i = 0, j = 0, k = left;

      while (i < leftArr.length && j < rightArr.length) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }

        // 高亮比较的元素
        setSortingData(prev => ({ ...prev, comparing: [left + i, mid + 1 + j], swapping: [] }));
        runner.recordStep({
          lineNumber: 35,
          description: `比较 ${leftArr[i]} 和 ${rightArr[j]}`,
          data: { array: [...arr] },
          variables: [{ name: 'i', value: i, type: 'primitive' as const }, { name: 'j', value: j, type: 'primitive' as const }, { name: 'k', value: k, type: 'primitive' as const }],
          highlights: { arrayIndices: [left + i, mid + 1 + j] },
          sortingState: { comparing: [left + i, mid + 1 + j], swapping: [], sorted: [] },
          memory: buildMemoryState(arr, [
            { name: 'left', value: left, type: 'primitive' },
            { name: 'mid', value: mid, type: 'primitive' },
            { name: 'right', value: right, type: 'primitive' },
            { name: 'i', value: i, type: 'primitive' },
            { name: 'j', value: j, type: 'primitive' },
            { name: 'k', value: k, type: 'primitive' }
          ], {
            auxiliaryArrays: [
              { name: 'leftArr', data: leftArr, description: '左半部分' },
              { name: 'rightArr', data: rightArr, description: '右半部分' }
            ]
          })
        });

        if (!(await waitWithPause(speedRef.current * 0.3))) {
          runner.stop();
          return;
        }

        if (leftArr[i] <= rightArr[j]) {
          arr[k] = leftArr[i];
          setSortingData(prev => ({ ...prev, array: [...arr], comparing: [k], swapping: [] }));
          runner.recordStep({
            lineNumber: 37,
            description: `${leftArr[i]} <= ${rightArr[j]}，将 ${leftArr[i]} 放到位置 ${k}`,
            data: { array: [...arr] },
            variables: [],
            highlights: { arrayIndices: [k] },
            sortingState: { comparing: [k], swapping: [], sorted: [] },
            memory: buildMemoryState(arr, [
              { name: 'left', value: left, type: 'primitive' },
              { name: 'mid', value: mid, type: 'primitive' },
              { name: 'right', value: right, type: 'primitive' },
              { name: 'i', value: i, type: 'primitive' },
              { name: 'j', value: j, type: 'primitive' },
              { name: 'k', value: k, type: 'primitive' }
            ], {
              auxiliaryArrays: [
                { name: 'leftArr', data: leftArr, description: '左半部分' },
                { name: 'rightArr', data: rightArr, description: '右半部分' }
              ]
            })
          });
          i++;
        } else {
          arr[k] = rightArr[j];
          setSortingData(prev => ({ ...prev, array: [...arr], comparing: [k], swapping: [] }));
          runner.recordStep({
            lineNumber: 40,
            description: `${rightArr[j]} < ${leftArr[i]}，将 ${rightArr[j]} 放到位置 ${k}`,
            data: { array: [...arr] },
            variables: [],
            highlights: { arrayIndices: [k] },
            sortingState: { comparing: [k], swapping: [], sorted: [] },
            memory: buildMemoryState(arr, [
              { name: 'left', value: left, type: 'primitive' },
              { name: 'mid', value: mid, type: 'primitive' },
              { name: 'right', value: right, type: 'primitive' },
              { name: 'i', value: i, type: 'primitive' },
              { name: 'j', value: j, type: 'primitive' },
              { name: 'k', value: k, type: 'primitive' }
            ], {
              auxiliaryArrays: [
                { name: 'leftArr', data: leftArr, description: '左半部分' },
                { name: 'rightArr', data: rightArr, description: '右半部分' }
              ]
            })
          });
          j++;
        }
        k++;

        if (!(await waitWithPause(speedRef.current * 0.3))) {
          runner.stop();
          return;
        }
      }

      // 复制剩余的左数组元素
      while (i < leftArr.length) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }

        arr[k] = leftArr[i];
        setSortingData(prev => ({ ...prev, array: [...arr], comparing: [k], swapping: [] }));
        runner.recordStep({
          lineNumber: 47,
          description: `复制剩余元素 ${leftArr[i]} 到位置 ${k}`,
          data: { array: [...arr] },
          variables: [],
          highlights: { arrayIndices: [k] },
          sortingState: { comparing: [k], swapping: [], sorted: [] },
          memory: buildMemoryState(arr, [
            { name: 'left', value: left, type: 'primitive' },
            { name: 'mid', value: mid, type: 'primitive' },
            { name: 'right', value: right, type: 'primitive' },
            { name: 'i', value: i, type: 'primitive' },
            { name: 'k', value: k, type: 'primitive' }
          ], {
            auxiliaryArrays: [
              { name: 'leftArr', data: leftArr, description: '左半部分' },
              { name: 'rightArr', data: rightArr, description: '右半部分' }
            ]
          })
        });
        i++;
        k++;

        if (!(await waitWithPause(speedRef.current * 0.2))) {
          runner.stop();
          return;
        }
      }

      // 复制剩余的右数组元素
      while (j < rightArr.length) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }

        arr[k] = rightArr[j];
        setSortingData(prev => ({ ...prev, array: [...arr], comparing: [k], swapping: [] }));
        runner.recordStep({
          lineNumber: 53,
          description: `复制剩余元素 ${rightArr[j]} 到位置 ${k}`,
          data: { array: [...arr] },
          variables: [],
          highlights: { arrayIndices: [k] },
          sortingState: { comparing: [k], swapping: [], sorted: [] },
          memory: buildMemoryState(arr, [
            { name: 'left', value: left, type: 'primitive' },
            { name: 'mid', value: mid, type: 'primitive' },
            { name: 'right', value: right, type: 'primitive' },
            { name: 'j', value: j, type: 'primitive' },
            { name: 'k', value: k, type: 'primitive' }
          ], {
            auxiliaryArrays: [
              { name: 'leftArr', data: leftArr, description: '左半部分' },
              { name: 'rightArr', data: rightArr, description: '右半部分' }
            ]
          })
        });
        j++;
        k++;

        if (!(await waitWithPause(speedRef.current * 0.2))) {
          runner.stop();
          return;
        }
      }
    }
  };

  // Tarjan 强连通分量算法执行
  const runTarjanSCC = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;

    runner.start();

    const nodes = [...graphData.nodes];
    const edges = [...graphData.edges];
    const n = nodes.length;

    // 初始化
    const dfn: number[] = new Array(n).fill(0);
    const low: number[] = new Array(n).fill(0);
    const inStack: boolean[] = new Array(n).fill(false);
    const stack: number[] = [];
    const components: number[][] = [];
    let timestamp = 0;
    let componentId = 0;

    // 构建邻接表
    const adj = new Map<number, number[]>();
    nodes.forEach(node => adj.set(node.id, []));
    edges.forEach(edge => adj.get(edge.from)!.push(edge.to));

    // 初始化节点状态
    nodes.forEach(node => {
      node.visited = false;
      node.inStack = false;
      node.component = -1;
    });

    setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
    setGraphState({ highlightedEdges: new Set(), highlightedNodes: new Set(), stack: [] });

    runner.recordStep({
      lineNumber: 1,
      description: `初始化完成。dfn数组: [${dfn.join(', ')}], low数组: [${low.join(', ')}]`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [
        { name: 'timestamp', value: timestamp, type: 'primitive' },
        { name: 'stack', value: '[]', type: 'array' }
      ],
      highlights: { nodes: [], edges: [] },
      memory: buildGraphMemoryState(
        nodes,
        edges,
        [
          { name: 'n', value: n, type: 'primitive' },
          { name: 'timestamp', value: timestamp, type: 'primitive' },
          { name: 'stack.size', value: 0, type: 'primitive' }
        ],
        { adjacencyList: adj }
      )
    });

    if (!(await waitWithPause(speedRef.current))) {
      runner.stop();
      return;
    }

    // DFS函数
    const dfs = async (u: number): Promise<boolean> => {
      if (shouldStopRef.current) return false;

      timestamp++;
      dfn[u] = timestamp;
      low[u] = timestamp;
      
      const nodeU = nodes.find(n => n.id === u)!;
      nodeU.visited = true;
      
      stack.push(u);
      inStack[u] = true;
      nodeU.inStack = true;

      setGraphData(prev => ({ ...prev, nodes: cloneNodes(nodes) }));
      setGraphState(prev => ({ ...prev, highlightedNodes: new Set([u]), stack: [...stack] }));

      runner.recordStep({
        lineNumber: 9,
        description: `访问节点 ${u}，设置 dfn[${u}]=${dfn[u]}，low[${u}]=${low[u]}，入栈`,
        data: { nodes: cloneNodes(nodes), edges },
        variables: [
          { name: 'u', value: u, type: 'primitive' },
          { name: `dfn[${u}]`, value: dfn[u], type: 'primitive' },
          { name: `low[${u}]`, value: low[u], type: 'primitive' },
          { name: 'stack', value: `[${stack.join(', ')}]`, type: 'array' }
        ],
        highlights: { nodes: [u], edges: [] },
        memory: buildGraphMemoryState(
          nodes,
          edges,
          [
            { name: 'u', value: u, type: 'primitive' },
            { name: 'timestamp', value: timestamp, type: 'primitive' }
          ],
          { adjacencyList: adj }
        )
      });

      if (!(await waitWithPause(speedRef.current))) return false;

      // Traverse neighbors
      for (const v of adj.get(u) || []) {
        if (shouldStopRef.current) return false;

        const edgeKey = `${u}-${v}`;

        setGraphState(prev => ({
          ...prev,
          highlightedEdges: new Set([...prev.highlightedEdges, edgeKey]),
          highlightedNodes: new Set([u, v])
        }));

        if (!dfn[v]) {
          // v未被访问
          runner.recordStep({
            lineNumber: 17,
            description: `节点 ${u} → ${v}: ${v} 未被访问，递归DFS`,
            data: { nodes: cloneNodes(nodes), edges },
            variables: [
              { name: 'u', value: u, type: 'primitive' },
              { name: 'v', value: v, type: 'primitive' }
            ],
            highlights: { nodes: [u, v], edges: [edgeKey] },
            memory: buildGraphMemoryState(
              nodes,
              edges,
              [{ name: 'v', value: v, type: 'primitive' }],
              { adjacencyList: adj }
            )
          });

          if (!(await waitWithPause(speedRef.current * 0.7))) return false;

          if (!(await dfs(v))) return false;

          // 回溯更新low[u]
          const oldLow = low[u];
          low[u] = Math.min(low[u], low[v]);

          runner.recordStep({
            lineNumber: 19,
            description: `回溯: low[${u}] = min(${oldLow}, low[${v}]=${low[v]}) = ${low[u]}`,
            data: { nodes: cloneNodes(nodes), edges },
            variables: [
              { name: 'u', value: u, type: 'primitive' },
              { name: `low[${u}]`, value: low[u], type: 'primitive' }
            ],
            highlights: { nodes: [u, v], edges: [] },
            memory: buildGraphMemoryState(
              nodes,
              edges,
              [{ name: 'u', value: u, type: 'primitive' }],
              { adjacencyList: adj }
            )
          });

          if (!(await waitWithPause(speedRef.current * 0.7))) return false;
        } else if (inStack[v]) {
          // v在栈中，回边
          const oldLow = low[u];
          low[u] = Math.min(low[u], dfn[v]);

          runner.recordStep({
            lineNumber: 21,
            description: `回边: 节点 ${v} 在栈中，low[${u}] = min(${oldLow}, dfn[${v}]=${dfn[v]}) = ${low[u]}`,
            data: { nodes: cloneNodes(nodes), edges },
            variables: [
              { name: 'u', value: u, type: 'primitive' },
              { name: 'v', value: v, type: 'primitive' },
              { name: `low[${u}]`, value: low[u], type: 'primitive' }
            ],
            highlights: { nodes: [u, v], edges: [edgeKey] },
            memory: buildGraphMemoryState(
              nodes,
              edges,
              [{ name: 'u', value: u, type: 'primitive' }],
              { adjacencyList: adj }
            )
          });

          if (!(await waitWithPause(speedRef.current * 0.7))) return false;
        }
      }

      // 找到一个SCC的根
      if (low[u] === dfn[u]) {
        const component: number[] = [];
        let v: number;
        
        runner.recordStep({
          lineNumber: 24,
          description: `找到SCC根节点 ${u}: low[${u}]=${low[u]} == dfn[${u}]=${dfn[u]}，开始弹栈`,
          data: { nodes: cloneNodes(nodes), edges },
          variables: [{ name: 'u', value: u, type: 'primitive' }],
          highlights: { nodes: [u], edges: [] },
          memory: buildGraphMemoryState(
            nodes,
            edges,
            [{ name: 'u', value: u, type: 'primitive' }],
            { adjacencyList: adj }
          )
        });

        if (!(await waitWithPause(speedRef.current * 0.7))) return false;

        do {
          v = stack.pop()!;
          inStack[v] = false;
          component.push(v);
          
          const nodeV = nodes.find(n => n.id === v)!;
          nodeV.inStack = false;
          nodeV.component = componentId;

          setGraphState(prev => ({ ...prev, stack: [...stack] }));

          runner.recordStep({
            lineNumber: 26,
            description: `弹出节点 ${v}，加入SCC #${componentId + 1}` + (v === u ? ' (SCC根节点)' : ''),
            data: { nodes: cloneNodes(nodes), edges },
            variables: [
              { name: 'v', value: v, type: 'primitive' },
              { name: 'stack', value: `[${stack.join(', ')}]`, type: 'array' }
            ],
            highlights: { nodes: component, edges: [] },
            memory: buildGraphMemoryState(
              nodes,
              edges,
              [{ name: 'v', value: v, type: 'primitive' }],
              { adjacencyList: adj }
            )
          });

          if (!(await waitWithPause(speedRef.current * 0.5))) return false;
        } while (v !== u);

        components.push(component);
        componentId++;

        setGraphData(prev => ({ ...prev, nodes: cloneNodes(nodes) }));

        runner.recordStep({
          lineNumber: 30,
          description: `SCC #${componentId} 完成: [${component.join(', ')}]` + (component.length === 1 && !adj.get(component[0])?.includes(component[0]) ? ' (单个节点，无自环)' : ''),
          data: { nodes: cloneNodes(nodes), edges },
          variables: [
            { name: 'component', value: `[${component.join(', ')}]`, type: 'array' },
            { name: 'components.size', value: components.length, type: 'primitive' }
          ],
          highlights: { nodes: component, edges: [] },
          memory: buildGraphMemoryState(
            nodes,
            edges,
            [
              { name: 'componentId', value: componentId, type: 'primitive' },
              { name: 'components.size', value: components.length, type: 'primitive' }
            ],
            { adjacencyList: adj }
          )
        });

        if (!(await waitWithPause(speedRef.current))) return false;
      }

      return true;
    };

    // 执行DFS
    for (let i = 0; i < n; i++) {
      if (!dfn[i]) {
        runner.recordStep({
          lineNumber: 34,
          description: `从节点 ${i} 开始新的DFS遍历`,
          data: { nodes: cloneNodes(nodes), edges },
          variables: [{ name: 'i', value: i, type: 'primitive' }],
          highlights: { nodes: [i], edges: [] },
          memory: buildGraphMemoryState(
            nodes,
            edges,
            [{ name: 'i', value: i, type: 'primitive' }],
            { adjacencyList: adj }
          )
        });

        if (!(await waitWithPause(speedRef.current * 0.5))) {
          runner.stop();
          return;
        }

        if (!(await dfs(i))) {
          runner.stop();
          return;
        }
      }
    }

    if (shouldStopRef.current) {
      runner.stop();
      return;
    }

    setGraphState({
      highlightedEdges: new Set(),
      highlightedNodes: new Set(),
      stack: [],
      phase: 'completed'
    });

    runner.recordStep({
      lineNumber: 0,
      description: `Tarjan算法完成！共找到 ${components.length} 个强连通分量: ${components.map((c, i) => `SCC${i + 1}=[${c.join(', ')}]`).join(', ')}`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [
        { name: 'components', value: components.map(c => `[${c.join(', ')}]`).join(', '), type: 'array' },
        { name: 'components.length', value: components.length, type: 'primitive' }
      ],
      highlights: { nodes: nodes.map(n => n.id), edges: [] },
      memory: buildGraphMemoryState(
        nodes,
        edges,
        [{ name: 'components.length', value: components.length, type: 'primitive' }],
        { adjacencyList: adj }
      )
    });

    runner.setCompleted();
  };

  // 并查集 (DSU) 执行
  const runDSU = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;

    runner.start();

    const nodes = [...graphData.nodes];
    const n = nodes.length;

    // DSU数据结构
    const parent: number[] = new Array(n);
    const rank: number[] = new Array(n).fill(0);

    // 初始化：每个元素自成一个集合
    for (let i = 0; i < n; i++) {
      parent[i] = i;
    }

    // 清空边
    const edges: typeof graphData.edges = [];

    // 初始化节点状态
    nodes.forEach(node => {
      node.visited = false;
      node.component = parent[node.id];
    });

    setGraphData(prev => ({ ...prev, nodes: [...nodes], edges: [] }));
    setGraphState({ highlightedEdges: new Set(), highlightedNodes: new Set() });

    runner.recordStep({
      lineNumber: 6,
      description: `初始化DSU：每个元素自成一个集合，父指针 parent[i] = i`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [
        { name: 'parent', value: `[${parent.join(', ')}]`, type: 'array' },
        { name: 'rank', value: `[${rank.join(', ')}]`, type: 'array' }
      ],
      highlights: { nodes: [], edges: [] },
      memory: {
        variables: [
          { name: 'parent', value: parent, type: 'array' },
          { name: 'rank', value: rank, type: 'array' }
        ],
        auxiliaryArrays: [
          { name: 'parent数组', data: parent.map((p, i) => `${i}→${p}`), description: '父指针数组' },
          { name: 'rank数组', data: rank.map((r, i) => `${i}:${r}`), description: '秩数组' }
        ]
      }
    });

    if (!(await waitWithPause(speedRef.current))) {
      runner.stop();
      return;
    }

    // Find操作（带路径压缩）
    const find = async (x: number, isDemo: boolean = false): Promise<number> => {
      if (shouldStopRef.current) return -1;

      if (!isDemo) {
        setGraphState(prev => ({ ...prev, highlightedNodes: new Set([x]) }));
        runner.recordStep({
          lineNumber: 13,
          description: `Find(${x}): 查找元素 ${x} 的根节点`,
          data: { nodes: cloneNodes(nodes), edges },
          variables: [
            { name: 'x', value: x, type: 'primitive' },
            { name: `parent[${x}]`, value: parent[x], type: 'primitive' }
          ],
          highlights: { nodes: [x], edges: [] },
          memory: {
            variables: [
              { name: 'x', value: x, type: 'primitive' },
              { name: 'parent', value: parent, type: 'array' }
            ]
          }
        });

        if (!(await waitWithPause(speedRef.current * 0.7))) return -1;
      }

      if (parent[x] !== x) {
        if (!isDemo) {
          runner.recordStep({
            lineNumber: 14,
            description: `parent[${x}]=${parent[x]} ≠ ${x}，递归查找 parent[${x}]`,
            data: { nodes: cloneNodes(nodes), edges },
            variables: [{ name: 'x', value: x, type: 'primitive' }],
            highlights: { nodes: [x, parent[x]], edges: [] },
            memory: { variables: [{ name: 'x', value: x, type: 'primitive' }] }
          });

          if (!(await waitWithPause(speedRef.current * 0.5))) return -1;
        }

        const root = await find(parent[x], isDemo);
        if (root === -1) return -1;

        if (!isDemo) {
          const oldParent = parent[x];
          parent[x] = root;

          // 更新可视化边
          const edgeIndex = edges.findIndex(e => e.from === x);
          if (edgeIndex >= 0) {
            edges[edgeIndex] = { from: x, to: root };
          }

          nodes.find(n => n.id === x)!.component = root;
          setGraphData(prev => ({ ...prev, nodes: cloneNodes(nodes), edges: [...edges] }));

          runner.recordStep({
            lineNumber: 15,
            description: `路径压缩: parent[${x}] = ${oldParent} → ${root}（直接指向根）`,
            data: { nodes: cloneNodes(nodes), edges },
            variables: [
              { name: 'x', value: x, type: 'primitive' },
              { name: `parent[${x}]`, value: parent[x], type: 'primitive' }
            ],
            highlights: { nodes: [x, root], edges: [] },
            memory: {
              variables: [
                { name: 'x', value: x, type: 'primitive' },
                { name: 'parent', value: parent, type: 'array' }
              ],
              auxiliaryArrays: [
                { name: 'parent数组', data: parent.map((p, i) => `${i}→${p}`), description: '父指针数组' }
              ]
            }
          });

          if (!(await waitWithPause(speedRef.current * 0.7))) return -1;
        }

        return root;
      }

      if (!isDemo) {
        runner.recordStep({
          lineNumber: 13,
          description: `Find(${x}): 找到根节点 ${x}`,
          data: { nodes: cloneNodes(nodes), edges },
          variables: [{ name: 'x', value: x, type: 'primitive' }],
          highlights: { nodes: [x], edges: [] },
          memory: { variables: [{ name: 'x', value: x, type: 'primitive' }] }
        });

        if (!(await waitWithPause(speedRef.current * 0.5))) return -1;
      }

      return x;
    };

    // Union操作（按秩合并）
    const union = async (x: number, y: number): Promise<boolean> => {
      if (shouldStopRef.current) return false;

      setGraphState(prev => ({ ...prev, highlightedNodes: new Set([x, y]) }));

      runner.recordStep({
        lineNumber: 21,
        description: `Union(${x}, ${y}): 合并包含 ${x} 和 ${y} 的集合`,
        data: { nodes: cloneNodes(nodes), edges },
        variables: [
          { name: 'x', value: x, type: 'primitive' },
          { name: 'y', value: y, type: 'primitive' }
        ],
        highlights: { nodes: [x, y], edges: [] },
        memory: {
          variables: [
            { name: 'x', value: x, type: 'primitive' },
            { name: 'y', value: y, type: 'primitive' }
          ]
        }
      });

      if (!(await waitWithPause(speedRef.current))) return false;

      const rootX = await find(x);
      if (rootX === -1) return false;

      const rootY = await find(y);
      if (rootY === -1) return false;

      if (rootX === rootY) {
        runner.recordStep({
          lineNumber: 24,
          description: `根节点相同(${rootX})，${x} 和 ${y} 已在同一集合，无需合并`,
          data: { nodes: cloneNodes(nodes), edges },
          variables: [
            { name: 'rootX', value: rootX, type: 'primitive' },
            { name: 'rootY', value: rootY, type: 'primitive' }
          ],
          highlights: { nodes: [rootX], edges: [] },
          memory: {
            variables: [
              { name: 'rootX', value: rootX, type: 'primitive' },
              { name: 'rootY', value: rootY, type: 'primitive' }
            ]
          }
        });

        if (!(await waitWithPause(speedRef.current))) return false;
        return false;
      }

      // 按秩合并
      runner.recordStep({
        lineNumber: 27,
        description: `按秩合并: rank[${rootX}]=${rank[rootX]}, rank[${rootY}]=${rank[rootY]}`,
        data: { nodes: cloneNodes(nodes), edges },
        variables: [
          { name: 'rootX', value: rootX, type: 'primitive' },
          { name: 'rootY', value: rootY, type: 'primitive' },
          { name: `rank[${rootX}]`, value: rank[rootX], type: 'primitive' },
          { name: `rank[${rootY}]`, value: rank[rootY], type: 'primitive' }
        ],
        highlights: { nodes: [rootX, rootY], edges: [] },
        memory: {
          variables: [
            { name: 'rootX', value: rootX, type: 'primitive' },
            { name: 'rootY', value: rootY, type: 'primitive' },
            { name: 'rank', value: rank, type: 'array' }
          ]
        }
      });

      if (!(await waitWithPause(speedRef.current * 0.7))) return false;

      if (rank[rootX] < rank[rootY]) {
        parent[rootX] = rootY;
        edges.push({ from: rootX, to: rootY });
        nodes.find(n => n.id === rootX)!.component = rootY;

        setGraphData(prev => ({ ...prev, nodes: cloneNodes(nodes), edges: [...edges] }));

        runner.recordStep({
          lineNumber: 28,
          description: `rank[${rootX}] < rank[${rootY}]，将 ${rootX} 的父指向 ${rootY}`,
          data: { nodes: cloneNodes(nodes), edges },
          variables: [
            { name: `parent[${rootX}]`, value: parent[rootX], type: 'primitive' }
          ],
          highlights: { nodes: [rootX, rootY], edges: [`${rootX}-${rootY}`] },
          memory: {
            variables: [
              { name: 'parent', value: parent, type: 'array' },
              { name: 'rank', value: rank, type: 'array' }
            ],
            auxiliaryArrays: [
              { name: 'parent数组', data: parent.map((p, i) => `${i}→${p}`), description: '父指针数组' }
            ]
          }
        });
      } else if (rank[rootX] > rank[rootY]) {
        parent[rootY] = rootX;
        edges.push({ from: rootY, to: rootX });
        nodes.find(n => n.id === rootY)!.component = rootX;

        setGraphData(prev => ({ ...prev, nodes: cloneNodes(nodes), edges: [...edges] }));

        runner.recordStep({
          lineNumber: 30,
          description: `rank[${rootX}] > rank[${rootY}]，将 ${rootY} 的父指向 ${rootX}`,
          data: { nodes: cloneNodes(nodes), edges },
          variables: [
            { name: `parent[${rootY}]`, value: parent[rootY], type: 'primitive' }
          ],
          highlights: { nodes: [rootX, rootY], edges: [`${rootY}-${rootX}`] },
          memory: {
            variables: [
              { name: 'parent', value: parent, type: 'array' },
              { name: 'rank', value: rank, type: 'array' }
            ],
            auxiliaryArrays: [
              { name: 'parent数组', data: parent.map((p, i) => `${i}→${p}`), description: '父指针数组' }
            ]
          }
        });
      } else {
        parent[rootY] = rootX;
        rank[rootX]++;
        edges.push({ from: rootY, to: rootX });
        nodes.find(n => n.id === rootY)!.component = rootX;

        setGraphData(prev => ({ ...prev, nodes: cloneNodes(nodes), edges: [...edges] }));

        runner.recordStep({
          lineNumber: 33,
          description: `rank相等，将 ${rootY} 的父指向 ${rootX}，rank[${rootX}]++ → ${rank[rootX]}`,
          data: { nodes: cloneNodes(nodes), edges },
          variables: [
            { name: `parent[${rootY}]`, value: parent[rootY], type: 'primitive' },
            { name: `rank[${rootX}]`, value: rank[rootX], type: 'primitive' }
          ],
          highlights: { nodes: [rootX, rootY], edges: [`${rootY}-${rootX}`] },
          memory: {
            variables: [
              { name: 'parent', value: parent, type: 'array' },
              { name: 'rank', value: rank, type: 'array' }
            ],
            auxiliaryArrays: [
              { name: 'parent数组', data: parent.map((p, i) => `${i}→${p}`), description: '父指针数组' },
              { name: 'rank数组', data: rank.map((r, i) => `${i}:${r}`), description: '秩数组' }
            ]
          }
        });
      }

      if (!(await waitWithPause(speedRef.current))) return false;
      return true;
    };

    // 执行一系列Union操作
    const unionPairs = [
      [0, 1], [2, 3], [4, 5], [6, 7], [8, 9],
      [0, 2], [4, 6], [1, 3],
      [0, 4], [5, 9],
      [0, 8]
    ];

    let unionCount = 0;
    for (const [x, y] of unionPairs) {
      if (unionCount >= 6) break;
      if (x >= n || y >= n) continue;

      const result = await union(x, y);
      if (!result && result !== false) {
        runner.stop();
        return;
      }
      
      if (result) {
        unionCount++;
      }

      // 暂停一下显示结果
      runner.recordStep({
        lineNumber: 0,
        description: `Union(${x}, ${y}) 完成。当前父指针: [${parent.join(', ')}]`,
        data: { nodes: cloneNodes(nodes), edges: [...edges] },
        variables: [
          { name: 'parent', value: `[${parent.join(', ')}]`, type: 'array' },
          { name: 'rank', value: `[${rank.join(', ')}]`, type: 'array' }
        ],
        highlights: { nodes: [], edges: [] },
        memory: {
          variables: [
            { name: 'parent', value: parent, type: 'array' },
            { name: 'rank', value: rank, type: 'array' }
          ],
          auxiliaryArrays: [
            { name: 'parent数组', data: parent.map((p, i) => `${i}→${p}`), description: '父指针数组' },
            { name: 'rank数组', data: rank.map((r, i) => `${i}:${r}`), description: '秩数组' }
          ]
        }
      });

      if (!(await waitWithPause(speedRef.current))) {
        runner.stop();
        return;
      }
    }

    // 演示路径压缩
    runner.recordStep({
      lineNumber: 0,
      description: '演示路径压缩：对节点 3 执行 Find 操作',
      data: { nodes: cloneNodes(nodes), edges: [...edges] },
      variables: [],
      highlights: { nodes: [3], edges: [] },
      memory: { variables: [] }
    });

    if (!(await waitWithPause(speedRef.current))) {
      runner.stop();
      return;
    }

    await find(3);

    if (shouldStopRef.current) {
      runner.stop();
      return;
    }

    setGraphState({
      highlightedEdges: new Set(),
      highlightedNodes: new Set(),
      phase: 'completed'
    });

    runner.recordStep({
      lineNumber: 0,
      description: `DSU操作完成！最终父指针: [${parent.join(', ')}]，秩数组: [${rank.join(', ')}]`,
      data: { nodes: cloneNodes(nodes), edges: [...edges] },
      variables: [
        { name: 'parent', value: `[${parent.join(', ')}]`, type: 'array' },
        { name: 'rank', value: `[${rank.join(', ')}]`, type: 'array' }
      ],
      highlights: { nodes: nodes.map(n => n.id), edges: edges.map(e => `${e.from}-${e.to}`) },
      memory: {
        variables: [
          { name: 'parent', value: parent, type: 'array' },
          { name: 'rank', value: rank, type: 'array' }
        ],
        auxiliaryArrays: [
          { name: 'parent数组', data: parent.map((p, i) => `${i}→${p}`), description: '父指针数组' },
          { name: 'rank数组', data: rank.map((r, i) => `${i}:${r}`), description: '秩数组' }
        ]
      }
    });

    runner.setCompleted();
  };

  // Bellman-Ford shortest path algorithm execution
  const runBellmanFord = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;

    runner.start();

    const nodes = [...graphData.nodes];
    const edges = [...graphData.edges];
    const n = nodes.length;

    // Build adjacency list
    const adj = new Map<number, Array<{ to: number; weight: number }>>();
    nodes.forEach(node => adj.set(node.id, []));
    edges.forEach(edge => {
      if (edge.weight !== undefined) {
        adj.get(edge.from)!.push({ to: edge.to, weight: edge.weight });
      }
    });

    // Initialize distances
    const dist: number[] = new Array(n).fill(Infinity);
    const parent: number[] = new Array(n).fill(-1);
    const start = 0;
    dist[start] = 0;

    nodes.forEach(node => {
      node.distance = node.id === start ? 0 : Infinity;
      node.parent = null;
    });

    setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
    setGraphState({ highlightedEdges: new Set(), highlightedNodes: new Set([start]) });

    runner.recordStep({
      lineNumber: 1,
      description: `初始化完成。起点: ${start}，距离数组初始化`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [
        { name: 'start', value: start, type: 'primitive' },
        { name: 'dist', value: `[${dist.map(d => d === Infinity ? '∞' : d).join(', ')}]`, type: 'array' }
      ],
      highlights: { nodes: [start], edges: [] },
      memory: buildGraphMemoryState(nodes, edges, [{ name: 'start', value: start, type: 'primitive' }], {})
    });

    if (!(await waitWithPause(speedRef.current))) {
      runner.stop();
      return;
    }

    // V-1 rounds of relaxation
    for (let i = 0; i < n - 1; i++) {
      let updated = false;

      for (const edge of edges) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }

        const { from, to, weight } = edge;
        if (weight === undefined) continue;

        const edgeKey = `${from}-${to}`;
        setGraphState(prev => ({
          ...prev,
          highlightedEdges: new Set([edgeKey]),
          highlightedNodes: new Set([from, to])
        }));

        if (dist[from] !== Infinity && dist[from] + weight < dist[to]) {
          const oldDist = dist[to];
          dist[to] = dist[from] + weight;
          parent[to] = from;
          updated = true;

          const nodeTo = nodes.find(n => n.id === to)!;
          nodeTo.distance = dist[to];
          nodeTo.parent = from;

          setGraphData(prev => ({ ...prev, nodes: [...nodes] }));

          runner.recordStep({
            lineNumber: 8,
            description: `松弛边 (${from}→${to}): dist[${to}] = min(${oldDist === Infinity ? '∞' : oldDist}, ${dist[from]} + ${weight}) = ${dist[to]}`,
            data: { nodes: cloneNodes(nodes), edges },
            variables: [
              { name: 'round', value: i + 1, type: 'primitive' },
              { name: `dist[${to}]`, value: dist[to], type: 'primitive' }
            ],
            highlights: { nodes: [from, to], edges: [edgeKey] },
            memory: buildGraphMemoryState(nodes, edges, [{ name: 'round', value: i + 1, type: 'primitive' }], {})
          });

          if (!(await waitWithPause(speedRef.current * 0.7))) {
            runner.stop();
            return;
          }
        }
      }

      if (!updated) {
        runner.recordStep({
          lineNumber: 12,
          description: `第 ${i + 1} 轮无更新，提前结束`,
          data: { nodes: cloneNodes(nodes), edges },
          variables: [{ name: 'round', value: i + 1, type: 'primitive' }],
          highlights: { nodes: [], edges: [] },
          memory: buildGraphMemoryState(nodes, edges, [], {})
        });
        break;
      }
    }

    // Check for negative cycles
    for (const edge of edges) {
      const { from, to, weight } = edge;
      if (weight === undefined) continue;

      if (dist[from] !== Infinity && dist[from] + weight < dist[to]) {
        runner.recordStep({
          lineNumber: 15,
          description: `检测到负权环！边 (${from}→${to}) 仍可松弛`,
          data: { nodes: cloneNodes(nodes), edges },
          variables: [{ name: 'hasNegativeCycle', value: true, type: 'primitive' }],
          highlights: { nodes: [from, to], edges: [`${from}-${to}`] },
          memory: buildGraphMemoryState(nodes, edges, [], {})
        });
        runner.setCompleted();
        return;
      }
    }

    runner.recordStep({
      lineNumber: 18,
      description: `Bellman-Ford完成！最短距离: [${dist.map(d => d === Infinity ? '∞' : d).join(', ')}]`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [{ name: 'dist', value: `[${dist.map(d => d === Infinity ? '∞' : d).join(', ')}]`, type: 'array' }],
      highlights: { nodes: nodes.map(n => n.id), edges: [] },
      memory: buildGraphMemoryState(nodes, edges, [], {})
    });

    runner.setCompleted();
  };

  // SPFA shortest path algorithm execution
  const runSPFA = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;

    runner.start();

    const nodes = [...graphData.nodes];
    const edges = [...graphData.edges];
    const n = nodes.length;

    // Build adjacency list
    const adj = new Map<number, Array<{ to: number; weight: number }>>();
    nodes.forEach(node => adj.set(node.id, []));
    edges.forEach(edge => {
      if (edge.weight !== undefined) {
        adj.get(edge.from)!.push({ to: edge.to, weight: edge.weight });
      }
    });

    // Initialize
    const dist: number[] = new Array(n).fill(Infinity);
    const parent: number[] = new Array(n).fill(-1);
    const inQueue: boolean[] = new Array(n).fill(false);
    const cnt: number[] = new Array(n).fill(0);
    const queue: number[] = [];
    const start = 0;

    dist[start] = 0;
    queue.push(start);
    inQueue[start] = true;
    cnt[start] = 1;

    nodes.forEach(node => {
      node.distance = node.id === start ? 0 : Infinity;
      node.inQueue = node.id === start;
    });

    setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
    setGraphState({ highlightedEdges: new Set(), highlightedNodes: new Set([start]), queue: [...queue] });

    runner.recordStep({
      lineNumber: 1,
      description: `初始化完成。起点 ${start} 入队`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [
        { name: 'start', value: start, type: 'primitive' },
        { name: 'queue', value: `[${queue.join(', ')}]`, type: 'array' }
      ],
      highlights: { nodes: [start], edges: [] },
      memory: buildGraphMemoryState(nodes, edges, [{ name: 'queue', value: queue, type: 'array' }], { queue })
    });

    if (!(await waitWithPause(speedRef.current))) {
      runner.stop();
      return;
    }

    while (queue.length > 0) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }

      const u = queue.shift()!;
      inQueue[u] = false;
      const nodeU = nodes.find(n => n.id === u)!;
      nodeU.inQueue = false;
      nodeU.isProcessing = true;

      setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
      setGraphState(prev => ({ ...prev, queue: [...queue], currentNode: u }));

      runner.recordStep({
        lineNumber: 5,
        description: `取出节点 ${u}，当前队列: [${queue.join(', ')}]`,
        data: { nodes: cloneNodes(nodes), edges },
        variables: [
          { name: 'u', value: u, type: 'primitive' },
          { name: 'dist[u]', value: dist[u], type: 'primitive' }
        ],
        highlights: { nodes: [u], edges: [] },
        memory: buildGraphMemoryState(nodes, edges, [{ name: 'u', value: u, type: 'primitive' }], { queue })
      });

      if (!(await waitWithPause(speedRef.current))) {
        runner.stop();
        return;
      }

      for (const { to: v, weight } of adj.get(u) || []) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }

        const edgeKey = `${u}-${v}`;
        setGraphState(prev => ({
          ...prev,
          highlightedEdges: new Set([edgeKey]),
          highlightedNodes: new Set([u, v])
        }));

        if (dist[u] + weight < dist[v]) {
          const oldDist = dist[v];
          dist[v] = dist[u] + weight;
          parent[v] = u;

          const nodeV = nodes.find(n => n.id === v)!;
          nodeV.distance = dist[v];
          nodeV.parent = u;

          if (!inQueue[v]) {
            queue.push(v);
            inQueue[v] = true;
            cnt[v]++;
            nodeV.inQueue = true;

            if (cnt[v] >= n) {
              runner.recordStep({
                lineNumber: 15,
                description: `检测到负权环！节点 ${v} 入队次数超过 ${n}`,
                data: { nodes: cloneNodes(nodes), edges },
                variables: [{ name: 'hasNegativeCycle', value: true, type: 'primitive' }],
                highlights: { nodes: [v], edges: [] },
                memory: buildGraphMemoryState(nodes, edges, [], { queue })
              });
              runner.setCompleted();
              return;
            }
          }

          setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
          setGraphState(prev => ({ ...prev, queue: [...queue] }));

          runner.recordStep({
            lineNumber: 10,
            description: `松弛: dist[${v}] = ${oldDist === Infinity ? '∞' : oldDist} → ${dist[v]}，${inQueue[v] ? '已在队列' : '入队'}`,
            data: { nodes: cloneNodes(nodes), edges },
            variables: [
              { name: 'v', value: v, type: 'primitive' },
              { name: `dist[${v}]`, value: dist[v], type: 'primitive' }
            ],
            highlights: { nodes: [u, v], edges: [edgeKey] },
            memory: buildGraphMemoryState(nodes, edges, [], { queue })
          });

          if (!(await waitWithPause(speedRef.current * 0.7))) {
            runner.stop();
            return;
          }
        }
      }

      nodeU.isProcessing = false;
      setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
    }

    runner.recordStep({
      lineNumber: 18,
      description: `SPFA完成！最短距离: [${dist.map(d => d === Infinity ? '∞' : d).join(', ')}]`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [{ name: 'dist', value: `[${dist.map(d => d === Infinity ? '∞' : d).join(', ')}]`, type: 'array' }],
      highlights: { nodes: nodes.map(n => n.id), edges: [] },
      memory: buildGraphMemoryState(nodes, edges, [], {})
    });

    runner.setCompleted();
  };

  // Dijkstra shortest path algorithm execution
  const runDijkstra = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;

    runner.start();

    const nodes = [...graphData.nodes];
    const edges = [...graphData.edges];
    const n = nodes.length;

    // Build adjacency list
    const adj = new Map<number, Array<{ to: number; weight: number }>>();
    nodes.forEach(node => adj.set(node.id, []));
    edges.forEach(edge => {
      if (edge.weight !== undefined) {
        adj.get(edge.from)!.push({ to: edge.to, weight: edge.weight });
      }
    });

    // Initialize
    const dist: number[] = new Array(n).fill(Infinity);
    const parent: number[] = new Array(n).fill(-1);
    const visited: boolean[] = new Array(n).fill(false);
    const start = 0;

    dist[start] = 0;

    nodes.forEach(node => {
      node.distance = node.id === start ? 0 : Infinity;
      node.visited = false;
      node.parent = null;
    });

    setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
    setGraphState({ highlightedEdges: new Set(), highlightedNodes: new Set([start]) });

    runner.recordStep({
      lineNumber: 1,
      description: `初始化完成。起点: ${start}，距离设为0，其他为∞`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [
        { name: 'start', value: start, type: 'primitive' },
        { name: 'dist', value: `[${dist.map(d => d === Infinity ? '∞' : d).join(', ')}]`, type: 'array' }
      ],
      highlights: { nodes: [start], edges: [] },
      memory: buildGraphMemoryState(nodes, edges, [{ name: 'start', value: start, type: 'primitive' }], {})
    });

    if (!(await waitWithPause(speedRef.current))) {
      runner.stop();
      return;
    }

    // Main loop
    for (let i = 0; i < n; i++) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }

      // Find minimum distance node
      let minDist = Infinity;
      let u = -1;
      for (let j = 0; j < n; j++) {
        if (!visited[j] && dist[j] < minDist) {
          minDist = dist[j];
          u = j;
        }
      }

      if (u === -1) break;

      visited[u] = true;
      const nodeU = nodes.find(n => n.id === u)!;
      nodeU.visited = true;
      nodeU.isProcessing = true;

      setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
      setGraphState(prev => ({ ...prev, highlightedNodes: new Set([u]), currentNode: u }));

      runner.recordStep({
        lineNumber: 5,
        description: `选取最小距离节点 ${u}，距离 = ${dist[u]}`,
        data: { nodes: cloneNodes(nodes), edges },
        variables: [
          { name: 'u', value: u, type: 'primitive' },
          { name: 'dist[u]', value: dist[u], type: 'primitive' }
        ],
        highlights: { nodes: [u], edges: [] },
        memory: buildGraphMemoryState(nodes, edges, [{ name: 'u', value: u, type: 'primitive' }], {})
      });

      if (!(await waitWithPause(speedRef.current))) {
        runner.stop();
        return;
      }

      // Relax neighbors
      for (const { to: v, weight } of adj.get(u) || []) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }

        const edgeKey = `${u}-${v}`;
        setGraphState(prev => ({
          ...prev,
          highlightedEdges: new Set([edgeKey]),
          highlightedNodes: new Set([u, v])
        }));

        if (!visited[v] && dist[u] + weight < dist[v]) {
          const oldDist = dist[v];
          dist[v] = dist[u] + weight;
          parent[v] = u;

          const nodeV = nodes.find(n => n.id === v)!;
          nodeV.distance = dist[v];
          nodeV.parent = u;

          setGraphData(prev => ({ ...prev, nodes: [...nodes] }));

          runner.recordStep({
            lineNumber: 9,
            description: `松弛: dist[${v}] = min(${oldDist === Infinity ? '∞' : oldDist}, ${dist[u]} + ${weight}) = ${dist[v]}`,
            data: { nodes: cloneNodes(nodes), edges },
            variables: [
              { name: 'v', value: v, type: 'primitive' },
              { name: `dist[${v}]`, value: dist[v], type: 'primitive' }
            ],
            highlights: { nodes: [u, v], edges: [edgeKey] },
            memory: buildGraphMemoryState(nodes, edges, [], {})
          });

          if (!(await waitWithPause(speedRef.current * 0.7))) {
            runner.stop();
            return;
          }
        }
      }

      nodeU.isProcessing = false;
      setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
    }

    runner.recordStep({
      lineNumber: 12,
      description: `Dijkstra完成！最短距离: [${dist.map(d => d === Infinity ? '∞' : d).join(', ')}]`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [{ name: 'dist', value: `[${dist.map(d => d === Infinity ? '∞' : d).join(', ')}]`, type: 'array' }],
      highlights: { nodes: nodes.map(n => n.id), edges: [] },
      memory: buildGraphMemoryState(nodes, edges, [], {})
    });

    runner.setCompleted();
  };

  // A* pathfinding algorithm execution
  const runAStar = async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;

    runner.start();

    const nodes = [...graphData.nodes];
    const edges = [...graphData.edges];
    const n = nodes.length;

    // Build adjacency list
    const adj = new Map<number, Array<{ to: number; weight: number }>>();
    nodes.forEach(node => adj.set(node.id, []));
    edges.forEach(edge => {
      if (edge.weight !== undefined) {
        adj.get(edge.from)!.push({ to: edge.to, weight: edge.weight });
      }
    });

    // Initialize
    const start = 0;
    const goal = n - 1;

    const gScore: number[] = new Array(n).fill(Infinity);
    const fScore: number[] = new Array(n).fill(Infinity);
    const parent: number[] = new Array(n).fill(-1);
    const inOpenSet: boolean[] = new Array(n).fill(false);
    const closedSet: Set<number> = new Set();

    gScore[start] = 0;
    // Heuristic: distance to goal (using node positions)
    const heuristic = (node: number) => {
      const nodeN = nodes.find(n => n.id === node);
      const goalN = nodes.find(n => n.id === goal);
      if (!nodeN || !goalN) return 0;
      return Math.abs(nodeN.x - goalN.x) + Math.abs(nodeN.y - goalN.y);
    };
    fScore[start] = heuristic(start);
    inOpenSet[start] = true;

    nodes.forEach(node => {
      node.distance = node.id === start ? 0 : Infinity;
      node.visited = false;
    });

    setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
    setGraphState({ highlightedEdges: new Set(), highlightedNodes: new Set([start, goal]) });

    runner.recordStep({
      lineNumber: 1,
      description: `初始化完成。起点: ${start}，终点: ${goal}`,
      data: { nodes: cloneNodes(nodes), edges },
      variables: [
        { name: 'start', value: start, type: 'primitive' },
        { name: 'goal', value: goal, type: 'primitive' },
        { name: 'gScore[start]', value: 0, type: 'primitive' },
        { name: 'fScore[start]', value: fScore[start], type: 'primitive' }
      ],
      highlights: { nodes: [start, goal], edges: [] },
      memory: buildGraphMemoryState(nodes, edges, [], {})
    });

    if (!(await waitWithPause(speedRef.current))) {
      runner.stop();
      return;
    }

    let found = false;

    while (Object.values(inOpenSet).some(v => v)) {
      if (shouldStopRef.current) {
        runner.stop();
        return;
      }

      // Find node with minimum fScore in openSet
      let minF = Infinity;
      let current = -1;
      for (let i = 0; i < n; i++) {
        if (inOpenSet[i] && fScore[i] < minF) {
          minF = fScore[i];
          current = i;
        }
      }

      if (current === -1) break;

      // Check if reached goal
      if (current === goal) {
        found = true;
        const path: number[] = [];
        let node = goal;
        while (node !== -1) {
          path.unshift(node);
          node = parent[node];
        }

        runner.recordStep({
          lineNumber: 10,
          description: `找到路径！路径: [${path.join(' → ')}]，总代价: ${gScore[goal]}`,
          data: { nodes: cloneNodes(nodes), edges },
          variables: [
            { name: 'path', value: `[${path.join(', ')}]`, type: 'array' },
            { name: 'cost', value: gScore[goal], type: 'primitive' }
          ],
          highlights: { nodes: path, edges: [] },
          memory: buildGraphMemoryState(nodes, edges, [], {})
        });
        break;
      }

      inOpenSet[current] = false;
      closedSet.add(current);

      const nodeCurrent = nodes.find(n => n.id === current)!;
      nodeCurrent.visited = true;
      nodeCurrent.isProcessing = true;

      setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
      setGraphState(prev => ({ ...prev, highlightedNodes: new Set([current]), currentNode: current }));

      runner.recordStep({
        lineNumber: 5,
        description: `处理节点 ${current}，g=${gScore[current].toFixed(1)}，h=${heuristic(current).toFixed(1)}，f=${fScore[current].toFixed(1)}`,
        data: { nodes: cloneNodes(nodes), edges },
        variables: [
          { name: 'current', value: current, type: 'primitive' },
          { name: 'gScore[current]', value: gScore[current], type: 'primitive' },
          { name: 'fScore[current]', value: fScore[current], type: 'primitive' }
        ],
        highlights: { nodes: [current], edges: [] },
        memory: buildGraphMemoryState(nodes, edges, [], {})
      });

      if (!(await waitWithPause(speedRef.current))) {
        runner.stop();
        return;
      }

      // Process neighbors
      for (const { to: neighbor, weight } of adj.get(current) || []) {
        if (shouldStopRef.current) {
          runner.stop();
          return;
        }

        if (closedSet.has(neighbor)) continue;

        const edgeKey = `${current}-${neighbor}`;
        setGraphState(prev => ({
          ...prev,
          highlightedEdges: new Set([edgeKey]),
          highlightedNodes: new Set([current, neighbor])
        }));

        const tentativeG = gScore[current] + weight;

        if (tentativeG < gScore[neighbor]) {
          parent[neighbor] = current;
          gScore[neighbor] = tentativeG;
          fScore[neighbor] = tentativeG + heuristic(neighbor);
          inOpenSet[neighbor] = true;

          const nodeNeighbor = nodes.find(n => n.id === neighbor)!;
          nodeNeighbor.distance = tentativeG;
          nodeNeighbor.parent = current;

          setGraphData(prev => ({ ...prev, nodes: [...nodes] }));

          runner.recordStep({
            lineNumber: 8,
            description: `更新邻居 ${neighbor}: g=${tentativeG.toFixed(1)}，h=${heuristic(neighbor).toFixed(1)}，f=${fScore[neighbor].toFixed(1)}`,
            data: { nodes: cloneNodes(nodes), edges },
            variables: [
              { name: 'neighbor', value: neighbor, type: 'primitive' },
              { name: 'gScore[neighbor]', value: gScore[neighbor], type: 'primitive' },
              { name: 'fScore[neighbor]', value: fScore[neighbor], type: 'primitive' }
            ],
            highlights: { nodes: [current, neighbor], edges: [edgeKey] },
            memory: buildGraphMemoryState(nodes, edges, [], {})
          });

          if (!(await waitWithPause(speedRef.current * 0.7))) {
            runner.stop();
            return;
          }
        }
      }

      nodeCurrent.isProcessing = false;
      setGraphData(prev => ({ ...prev, nodes: [...nodes] }));
    }

    if (!found) {
      runner.recordStep({
        lineNumber: 15,
        description: `未找到从 ${start} 到 ${goal} 的路径`,
        data: { nodes: cloneNodes(nodes), edges },
        variables: [],
        highlights: { nodes: [], edges: [] },
        memory: buildGraphMemoryState(nodes, edges, [], {})
      });
    }

    runner.setCompleted();
  };

  // Start execution
  const handleStart = async () => {
    if (runner.isRunning) return;
    
    // 如果已完成，重置数据到初始状态
    if (runner.isCompleted) {
      runner.clearSteps();
      if (initialArrayRef.current.length > 0) {
        setSortingData({
          array: [...initialArrayRef.current],
          comparing: [],
          swapping: [],
          sorted: []
        });
        // 等待数据更新
        await new Promise(r => setTimeout(r, 50));
      }
    }
    
    if (currentAlgo.id === 'bubble') {
      await runBubbleSort();
    } else if (currentAlgo.id === 'selection') {
      await runSelectionSort();
    } else if (currentAlgo.id === 'insertion') {
      await runInsertionSort();
    } else if (currentAlgo.id === 'merge') {
      await runMergeSort();
    } else if (currentAlgo.id === 'shell') {
      await runShellSort();
    } else if (currentAlgo.id === 'quick') {
      await runQuickSort();
    } else if (currentAlgo.id === 'heap') {
      await runHeapSort();
    } else if (currentAlgo.id === 'timsort') {
      await runTimSort();
    } else if (currentAlgo.id === 'bucket') {
      await runBucketSort();
    } else if (currentAlgo.id === 'counting') {
      await runCountingSort();
    } else if (currentAlgo.id === 'radix') {
      await runRadixSort();
    } else if (currentAlgo.id === 'topo') {
      await runTopologicalSort();
    } else if (currentAlgo.id === 'kruskal') {
      await runKruskal();
    } else if (currentAlgo.id === 'prim') {
      await runPrim();
    } else if (currentAlgo.id === 'bfs') {
      await runBFS();
    } else if (currentAlgo.id === 'dfs') {
      await runDFS();
    } else if (currentAlgo.id === 'tarjan') {
      await runTarjanSCC();
    } else if (currentAlgo.id === 'dsu') {
      await runDSU();
    } else if (currentAlgo.id === 'bellmanford') {
      await runBellmanFord();
    } else if (currentAlgo.id === 'spfa') {
      await runSPFA();
    } else if (currentAlgo.id === 'dijkstra') {
      await runDijkstra();
    } else if (currentAlgo.id === 'astar') {
      await runAStar();
    } else if (currentAlgo.id === 'floyd') {
      await runFloydWarshall();
    }
  };

  // 停止执行
  const handleStop = () => {
    shouldStopRef.current = true;
    isPausedRef.current = false;
    runner.stop();
    // 重置数据
    setTimeout(() => generateData(), 100);
  };

  // 处理数组大小变化
  const handleArraySizeChange = (newSize: number) => {
    if (newSize < 2 || newSize > 100) return;
    setArraySize(newSize);
    // 重新生成数据
    if (!runner.isRunning) {
      const data = generateSortingData({ 
        size: newSize, 
        pattern: 'random',
        minValue: 10,
        maxValue: 99
      });
      setSortingData(data);
      runner.clearSteps();
    }
  };

  // 处理步骤复盘
  const handleStepForward = () => {
    if (!runner.isReviewMode && runner.isCompleted) {
      runner.enterReviewMode();
    }
    const step = runner.stepForward();
    if (step) {
      if (currentAlgo.category === 'sorting') {
        restoreSortingStateFromStep(step);
      } else if (currentAlgo.category === 'graph') {
        restoreGraphStateFromStep(step);
      }
    }
  };

  const handleStepBackward = () => {
    const step = runner.stepBackward();
    if (step) {
      if (currentAlgo.category === 'sorting') {
        restoreSortingStateFromStep(step);
      } else if (currentAlgo.category === 'graph') {
        restoreGraphStateFromStep(step);
      }
    }
  };

  return (
    <div className={`algo-playground ${isFullscreen ? 'fullscreen' : ''}`} ref={playgroundRef}>
      {isFullscreen ? (
        // 全屏布局
        <div className="fullscreen-layout">
          {/* 顶部栏 */}
          <div className="fullscreen-header">
            <div className="header-left">
              <button 
                className="exit-fullscreen-btn" 
                onClick={() => setIsFullscreen(false)}
                title="退出全屏"
              >
                <Minimize2 size={18} />
              </button>
              <select
                className="algo-select"
                value={currentAlgo.id}
                onChange={(e) => {
                  const algo = categoryAlgorithms.find(a => a.id === e.target.value);
                  if (algo) onAlgorithmChange(algo);
                }}
                disabled={runner.isRunning}
              >
                {categoryAlgorithms.map(algo => (
                  <option key={algo.id} value={algo.id}>{algo.name}</option>
                ))}
              </select>
            </div>
            
            {/* 中间：步骤描述 */}
            <div className="header-center">
              <div className="step-description" title={runner.state.message}>
                {runner.state.message || '准备就绪，点击"开始"运行算法'}
              </div>
            </div>
            
            <div className="header-right">
              <div className="complexity-badges">
                <span className="viz-badge">{currentAlgo.timeComplexity}</span>
                <span className="viz-badge secondary">{currentAlgo.spaceComplexity}</span>
              </div>
            </div>
          </div>
          
          {/* 中间三栏布局 */}
          <div className="fullscreen-main">
            {/* 左侧：代码面板 */}
            <div className="fullscreen-code">
              <CodePanel 
                code={currentAlgo.code} 
                currentLine={runner.state.currentLine} 
              />
            </div>
            
            {/* 中间：可视化画布 */}
            <div className="fullscreen-canvas">
              {currentAlgo.category === 'sorting' && (
                <ArrayVisualizer data={sortingData} />
              )}
              {currentAlgo.category === 'graph' && (
                <GraphVisualizer 
                  nodes={graphData.nodes} 
                  edges={graphData.edges} 
                  state={graphState}
                />
              )}
            </div>
            
            {/* 右侧：内存可视化 */}
            <div className="fullscreen-memory">
              {currentAlgo.category === 'sorting' && (
                <MemoryVisualizer memory={runner.currentStep?.memory} />
              )}
              {currentAlgo.category === 'graph' && (
                <MemoryVisualizer memory={runner.currentStep?.memory} />
              )}
            </div>
          </div>
          
          {/* 底部：控制面板 */}
          <div className="fullscreen-controls">
            <div className="toolbar-group">
              {!runner.isRunning ? (
                <button className="toolbar-btn primary" onClick={handleStart} title="开始">
                  <Play size={20} />
                </button>
              ) : runner.isPaused ? (
                <button className="toolbar-btn primary" onClick={runner.resume} title="继续">
                  <Play size={20} />
                </button>
              ) : (
                <button className="toolbar-btn" onClick={runner.pause} title="暂停">
                  <Pause size={20} />
                </button>
              )}
              <button className="toolbar-btn danger" onClick={handleStop} disabled={!runner.isRunning} title="停止">
                <RotateCcw size={20} />
              </button>
            </div>
            
            <div className="toolbar-divider" />
            
            <div className="toolbar-group">
              <button className="toolbar-btn" onClick={handleStepBackward} disabled={!runner.canStepBackward} title="后退">
                <SkipBack size={18} />
              </button>
              <span className="toolbar-step">{runner.state.currentStep} / {runner.state.totalSteps || '-'}</span>
              <button className="toolbar-btn" onClick={handleStepForward} disabled={!runner.canStepForward} title="前进">
                <SkipForward size={18} />
              </button>
            </div>
            
            <div className="toolbar-divider" />
            
            <div className="toolbar-group">
              <button className="toolbar-btn" onClick={generateData} disabled={runner.isRunning} title="新数据">
                <Shuffle size={18} />
              </button>
            </div>
            
            <div className="toolbar-spacer" />
            
            <div className="toolbar-group speed-group">
              <span className="toolbar-label">速度</span>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={runner.speed}
                onChange={(e) => runner.setSpeed(parseInt(e.target.value))}
                disabled={runner.isRunning}
                className="speed-slider large"
                style={{ '--value': `${((runner.speed - 10) / 990) * 100}%` } as React.CSSProperties}
              />
              <span className="speed-display">{runner.speed}ms/步</span>
            </div>
            
            {currentAlgo.category === 'sorting' && (
              <>
                <div className="toolbar-divider" />
                <div className="toolbar-group">
                  <span className="toolbar-label">数组大小</span>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={arraySize}
                    onChange={(e) => handleArraySizeChange(parseInt(e.target.value))}
                    disabled={runner.isRunning}
                    className="speed-slider"
                    style={{ '--value': `${((arraySize - 5) / (100 - 5)) * 100}%` } as React.CSSProperties}
                  />
                  <span className="slider-value">{arraySize}</span>
                </div>
                
                <div className="toolbar-divider" />
                <div className="toolbar-group">
                  <button 
                    className="toolbar-btn" 
                    onClick={() => setIsImportModalOpen(true)} 
                    disabled={runner.isRunning}
                    title="导入数组"
                  >
                    <Upload size={18} />
                  </button>
                </div>
              </>
            )}
            
            {currentAlgo.id === 'topo' && (
              <>
                <div className="toolbar-divider" />
                <div className="toolbar-group">
                  <span className="toolbar-label">图形模式</span>
                  <select
                    className="toolbar-select"
                    value={dagPattern}
                    onChange={(e) => {
                      setDagPattern(e.target.value as any);
                      if (!runner.isRunning) {
                        const data = generateDAG({ 
                          nodeCount: 10, 
                          layerCount: 4, 
                          edgeDensity: 0.4,
                          pattern: e.target.value as any
                        });
                        setGraphData(data);
                        runner.clearSteps();
                      }
                    }}
                    disabled={runner.isRunning}
                  >
                    <option value="random">随机</option>
                    <option value="linear">线性链</option>
                    <option value="diamond">菱形</option>
                    <option value="hourglass">沙漏形</option>
                    <option value="butterfly">蝴蝶形</option>
                  </select>
                </div>
                
                <div className="toolbar-divider" />
                <div className="toolbar-group">
                  <button 
                    className="toolbar-btn" 
                    onClick={() => setIsGraphImportModalOpen(true)} 
                    disabled={runner.isRunning}
                    title="导入图数据"
                  >
                    <Upload size={18} />
                  </button>
                </div>
              </>
            )}
            
            {(currentAlgo.id === 'bellmanford' || currentAlgo.id === 'spfa') && (
              <>
                <div className="toolbar-divider" />
                <div className="toolbar-group">
                  <span className="toolbar-label">图类型</span>
                  <select
                    className="toolbar-select"
                    value={negativeGraphPattern}
                    onChange={(e) => {
                      setNegativeGraphPattern(e.target.value as any);
                      if (!runner.isRunning) {
                        const pattern = e.target.value as any;
                        if (pattern === 'random') {
                          const data = generateNegativeWeightGraph({
                            nodeCount: 6,
                            edgeCount: 10,
                            minWeight: -8,
                            maxWeight: 10,
                            negativeRatio: 0.3,
                            ensureNegativeCycle: false,
                            pattern: 'random'
                          });
                          setGraphData(data);
                        } else {
                          const data = generateTeachingGraph(pattern);
                          setGraphData(data);
                        }
                        runner.clearSteps();
                      }
                    }}
                    disabled={runner.isRunning}
                  >
                    <option value="simple">简单教学图</option>
                    <option value="complex">复杂多路径</option>
                    <option value="negative-cycle">负权环检测</option>
                    <option value="random">随机生成</option>
                  </select>
                </div>
              </>
            )}
            
            <div className="toolbar-divider" />
            
            <div className="toolbar-group">
              <button 
                className="toolbar-btn" 
                onClick={() => setIsCodeModalOpen(true)} 
                title="查看代码模板"
              >
                <FileCode size={18} />
              </button>
              <button 
                className="toolbar-btn" 
                onClick={() => setIsChartModalOpen(true)} 
                title="查看复杂度分析"
              >
                <BarChart3 size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        // 正常布局
        <>
      <div className="playground-visualization">
        <div className="viz-header">
          <h2 className="viz-title">{currentAlgo.name}</h2>
          <div className="viz-header-actions">
            <button 
              className="viz-action-btn"
              onClick={() => setIsCodeModalOpen(true)}
              title="查看代码模板"
            >
              <FileCode size={18} />
              <span>代码</span>
            </button>
            <button 
              className="viz-action-btn"
              onClick={() => setIsChartModalOpen(true)}
              title="查看复杂度分析"
            >
              <BarChart3 size={18} />
              <span>复杂度</span>
            </button>
            <div className="viz-badges">
              <span className="viz-badge">{currentAlgo.timeComplexity}</span>
              <span className="viz-badge secondary">{currentAlgo.spaceComplexity}</span>
            </div>
          </div>
        </div>
        
        {/* 工具栏 - 图标化控制 */}
        <div className="viz-toolbar">
          <div className="toolbar-group">
            {!runner.isRunning ? (
              <button className="toolbar-btn primary" onClick={handleStart} title="开始">
                <Play size={20} />
              </button>
            ) : runner.isPaused ? (
              <button className="toolbar-btn primary" onClick={runner.resume} title="继续">
                <Play size={20} />
              </button>
            ) : (
              <button className="toolbar-btn" onClick={runner.pause} title="暂停">
                <Pause size={20} />
              </button>
            )}
            <button className="toolbar-btn danger" onClick={handleStop} disabled={!runner.isRunning} title="停止">
              <RotateCcw size={20} />
            </button>
          </div>
          
          <div className="toolbar-divider" />
          
          <div className="toolbar-group">
            <button className="toolbar-btn" onClick={handleStepBackward} disabled={!runner.canStepBackward} title="后退">
              <SkipBack size={18} />
            </button>
            <span className="toolbar-step">{runner.state.currentStep} / {runner.state.totalSteps || '-'}</span>
            <button className="toolbar-btn" onClick={handleStepForward} disabled={!runner.canStepForward} title="前进">
              <SkipForward size={18} />
            </button>
          </div>
          
          <div className="toolbar-divider" />
          
          <div className="toolbar-group">
            <button className="toolbar-btn" onClick={generateData} disabled={runner.isRunning} title="新数据">
              <Shuffle size={18} />
            </button>
          </div>
          
          <div className="toolbar-spacer" />
          
          <div className="toolbar-group speed-group">
            <span className="toolbar-label">速度</span>
            <input
              type="range"
              min="1"
              max="100"
              value={101 - Math.round(runner.speed / 10)}
              onChange={(e) => runner.setSpeed(1010 - parseInt(e.target.value) * 10)}
              disabled={runner.isRunning}
              className="speed-slider"
              style={{ '--value': `${101 - Math.round(runner.speed / 10)}%` } as React.CSSProperties}
            />
          </div>
          
          <div className="toolbar-divider" />
          
          <div className="toolbar-group">
            <button 
              className="toolbar-btn" 
              onClick={() => setIsFullscreen(!isFullscreen)} 
              title={isFullscreen ? "退出全屏" : "全屏"}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>
        
        <div className="viz-canvas">
          {currentAlgo.category === 'sorting' && (
            <ArrayVisualizer data={sortingData} />
          )}
          {currentAlgo.category === 'graph' && (
            <GraphVisualizer 
              nodes={graphData.nodes} 
              edges={graphData.edges} 
              state={graphState}
            />
          )}
        </div>
        
        <div className="viz-status">
          <div className="status-message">
            {runner.state.message || '准备就绪 - 点击"开始"运行算法'}
          </div>
          {currentAlgo.category === 'sorting' && (
            <div className="viz-status-control">
              <span className="status-label">数组大小</span>
              <input
                type="range"
                min="5"
                max="50"
                value={arraySize}
                onChange={(e) => handleArraySizeChange(parseInt(e.target.value))}
                disabled={runner.isRunning}
                style={{ '--value': `${((arraySize - 5) / (50 - 5)) * 100}%` } as React.CSSProperties}
              />
              <span className="status-value">{arraySize}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 右侧信息面板 */}
      <div className="playground-controls">
        {/* 算法选择 */}
        <div className="panel-section algo-select-section">
          <h3 className="section-title">
            <BookOpen size={16} />
            选择算法
          </h3>
          <select
            className="algo-select"
            value={currentAlgo.id}
            onChange={(e) => {
              const algo = categoryAlgorithms.find(a => a.id === e.target.value);
              if (algo) onAlgorithmChange(algo);
            }}
            disabled={runner.isRunning}
          >
            {categoryAlgorithms.map(algo => (
              <option key={algo.id} value={algo.id}>{algo.name}</option>
            ))}
          </select>
          <p className="algo-description">{currentAlgo.description}</p>
          <div className="algo-complexity-inline">
            <span>时间: {currentAlgo.timeComplexity}</span>
            <span>空间: {currentAlgo.spaceComplexity}</span>
          </div>
        </div>
        
        {/* 内存可视化面板 */}
        {currentAlgo.category === 'sorting' && (
          <MemoryVisualizer memory={runner.currentStep?.memory} />
        )}
        {currentAlgo.category === 'graph' && (
          <MemoryVisualizer memory={runner.currentStep?.memory} />
        )}
        
        <CodePanel 
          code={currentAlgo.code} 
          currentLine={runner.state.currentLine}
        />
        
        <Legend category={currentAlgo.category} />
      </div>
      </>
      )}
      
      {/* 代码模板弹窗 */}
      <CodeTemplateModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        algorithmName={currentAlgo.name}
        templates={getCodeTemplates(currentAlgo.id)}
      />
      
      {/* 复杂度图表弹窗 */}
      <ComplexityChartModal
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        algorithmName={currentAlgo.name}
        timeComplexity={currentAlgo.timeComplexity}
        spaceComplexity={currentAlgo.spaceComplexity}
      />
      
      {/* 数组导入弹窗 */}
      {isImportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsImportModalOpen(false)}>
          <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <Upload size={18} />
                导入数组
              </h3>
              <button 
                className="modal-close-btn" 
                onClick={() => setIsImportModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p className="import-hint">
                请输入数组内容，格式: <code>[1, 2, 3, 4, 5]</code> 或 <code>1,2,3,4,5</code>
              </p>
              <p className="import-hint">
                数值范围: 1-999，至少2个元素，最多100个元素
              </p>
              <textarea
                className="import-input"
                value={importInput}
                onChange={(e) => setImportInput(e.target.value)}
                placeholder="例如: [10, 25, 15, 30, 5]"
                rows={3}
              />
              {importError && (
                <div className="import-error">
                  <X size={14} />
                  {importError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="control-btn secondary" 
                onClick={() => setIsImportModalOpen(false)}
              >
                取消
              </button>
              <button 
                className="control-btn primary" 
                onClick={handleImportArray}
              >
                <Check size={16} />
                确认导入
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 图导入弹窗 */}
      {isGraphImportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsGraphImportModalOpen(false)}>
          <div className="modal-content import-modal graph-import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <Upload size={18} />
                导入图数据
              </h3>
              <button 
                className="modal-close-btn" 
                onClick={() => setIsGraphImportModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p className="import-hint">
                支持格式1 - 边列表: <code>0-&gt;1, 0-&gt;2, 1-&gt;3, 2-&gt;3</code>
              </p>
              <p className="import-hint">
                支持格式2 - JSON: <code>{'{"nodes": 4, "edges": [[0,1], [0,2], [1,3], [2,3]]}'}</code>
              </p>
              <p className="import-hint">
                最多20个节点，将自动检测环并分层布局
              </p>
              <textarea
                className="import-input"
                value={graphImportInput}
                onChange={(e) => setGraphImportInput(e.target.value)}
                placeholder="例如: 0->1, 0->2, 1->3, 2->3"
                rows={5}
              />
              {graphImportError && (
                <div className="import-error">
                  <X size={14} />
                  {graphImportError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="control-btn secondary" 
                onClick={() => setIsGraphImportModalOpen(false)}
              >
                取消
              </button>
              <button 
                className="control-btn primary" 
                onClick={handleGraphImport}
              >
                <Check size={16} />
                确认导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============ 主页面 ============
export default function AlgoVizPage() {
  const [currentAlgo, setCurrentAlgo] = useState<AlgorithmDefinition>(ALL_ALGORITHMS[0]);

  return (
    <div className="algo-page">
      <div className="algo-header">
        <h1 className="algo-title">
          <Zap className="algo-title-icon" />
          算法可视化实验室
        </h1>
        <p className="algo-subtitle">交互式学习经典算法，代码与动画逐帧同步</p>
      </div>

      {/* 分类导航 */}
      <div className="algo-categories">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`algo-category-btn ${currentAlgo.category === cat.id ? 'active' : ''}`}
            onClick={() => {
              const algos = getAlgorithmsByCategory(cat.id);
              if (algos.length > 0) {
                setCurrentAlgo(algos[0]);
              }
            }}
          >
            {cat.icon}
            <span className="category-name">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* 算法游乐场 */}
      <AlgorithmPlayground 
        currentAlgo={currentAlgo} 
        onAlgorithmChange={setCurrentAlgo}
      />

      {/* 评论区 - 整个算法可视化页面共用 */}
      <div className="algo-comment-section">
        <CommentSection postId="algo-visualization" />
      </div>

      <Footer data={{ 
        copyright: `© ${new Date().getFullYear()} SAKURAIN. All rights reserved.`, 
        slogan: '探索技术的无限可能', 
        links: [] 
      }} />
    </div>
  );
}

// 导出模块
export * from './types';
export * from './algorithms';
export * from './utils/dataGenerators';
export { useAlgorithmRunner };
export * from './components';
