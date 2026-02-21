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
  Play, Pause, RotateCcw, SkipBack, SkipForward, Shuffle, BookOpen
} from 'lucide-react';
import { Footer } from '@/components/sections/Footer';
import { CommentSection } from '@/pages/Blog/components/CommentSection';

// 导入模块
import { ALL_ALGORITHMS, getAlgorithmsByCategory, getCodeTemplates } from './algorithms';
import { useAlgorithmRunner } from './hooks/useAlgorithmRunner';
import { generateSortingData, generateDAG, generateSCCGraph } from './utils/dataGenerators';

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
  MemoryCell
} from './types';

import './algo-visualizer.css';

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
  
  // 执行器 - 默认速度300ms
  const runner = useAlgorithmRunner({ initialSpeed: 300 });
  
  // 数据状态
  const [sortingData, setSortingData] = useState<SortingData>({ array: [], comparing: [], swapping: [], sorted: [] });
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [], directed: true, weighted: false });
  const [graphState, setGraphState] = useState<GraphState>({ highlightedEdges: new Set(), highlightedNodes: new Set() });
  
  // 数组大小状态（用于排序算法）
  const [arraySize, setArraySize] = useState<number>(12);
  
  // 弹窗状态
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);

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

  // 步骤变化时恢复状态（复盘模式）
  useEffect(() => {
    if (runner.isReviewMode && runner.currentStep) {
      restoreSortingStateFromStep(runner.currentStep);
    }
  }, [runner.currentStep, runner.isReviewMode, restoreSortingStateFromStep]);

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
      const data = generateDAG({ nodeCount: 9, layerCount: 4, edgeDensity: 0.35 });
      setGraphData(data);
    } else if (currentAlgo.id === 'scc') {
      const data = generateSCCGraph({ sccCount: 3, minNodesPerSCC: 3, maxNodesPerSCC: 4 });
      setGraphData(data);
    }
    
    setGraphState({ highlightedEdges: new Set(), highlightedNodes: new Set() });
  }, [currentAlgo.id, currentAlgo.category, arraySize, runner]);

  // 初始化数据 - 只执行一次
  useEffect(() => {
    generateData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 切换算法时重新生成数据
  useEffect(() => {
    generateData();
  }, [currentAlgo.id]);

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

  // 开始执行
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
    if (newSize < 5 || newSize > 50) return;
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
      restoreSortingStateFromStep(step);
    }
  };

  const handleStepBackward = () => {
    const step = runner.stepBackward();
    if (step) {
      restoreSortingStateFromStep(step);
    }
  };

  return (
    <div className="algo-playground">
      {/* 左侧可视化 */}
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
            />
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
        
        <CodePanel 
          code={currentAlgo.code} 
          currentLine={runner.state.currentLine}
        />
        
        <Legend category={currentAlgo.category} />
      </div>
      
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
