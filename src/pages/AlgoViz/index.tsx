/**
 * Algorithm Visualization Page
 * 
 * Features:
 * - Sorting algorithms: Bubble, Quick, Merge, Heap, Selection, Insertion
 * - Pathfinding: BFS, DFS, Dijkstra, A*
 * - Data structures: Array, Stack, Queue, Binary Tree
 * - Advanced: Topological Sort, Connected Components, Knapsack, LCS
 * - Machine Learning: Perceptron, K-Means, Gradient Descent, Neural Network
 * 
 * @author SAKURAIN
 */

import { useState, useCallback, useRef, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line, Sphere, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import {
  Play,
  Pause,
  RotateCcw,
  Shuffle,
  Zap,
  Grid3X3,
  Binary,
  Layers,
  GitBranch,
  Network,
  Target,
  Brain,
  Code,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { Footer } from '@/components/sections/Footer';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ALGORITHM_CODES, LANGUAGE_LABELS, LANGUAGE_PRISM_NAMES } from './algorithm-codes';
import './algo-visualizer.css';

type AlgorithmCategory = 'sorting' | 'pathfinding' | 'datastructure' | 'advanced' | 'ml';

interface AlgorithmInfo {
  id: string;
  name: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  category: AlgorithmCategory;
}

const ALGORITHMS: AlgorithmInfo[] = [
  { id: 'bubble', name: '冒泡排序', description: '反复交换相邻的逆序元素', timeComplexity: 'O(n²)', spaceComplexity: 'O(1)', category: 'sorting' },
  { id: 'selection', name: '选择排序', description: '每次选择最小元素放到已排序末尾', timeComplexity: 'O(n²)', spaceComplexity: 'O(1)', category: 'sorting' },
  { id: 'insertion', name: '插入排序', description: '逐个将元素插入已排序序列', timeComplexity: 'O(n²)', spaceComplexity: 'O(1)', category: 'sorting' },
  { id: 'quick', name: '快速排序', description: '分治法，使用基准元素划分数组', timeComplexity: 'O(n log n)', spaceComplexity: 'O(log n)', category: 'sorting' },
  { id: 'merge', name: '归并排序', description: '分治法，合并两个有序子数组', timeComplexity: 'O(n log n)', spaceComplexity: 'O(n)', category: 'sorting' },
  { id: 'heap', name: '堆排序', description: '利用二叉堆数据结构排序', timeComplexity: 'O(n log n)', spaceComplexity: 'O(1)', category: 'sorting' },
  { id: 'bfs', name: '广度优先搜索', description: '按层级遍历图，适合最短路径', timeComplexity: 'O(V+E)', spaceComplexity: 'O(V)', category: 'pathfinding' },
  { id: 'dfs', name: '深度优先搜索', description: '沿分支深入探索，适合连通性检测', timeComplexity: 'O(V+E)', spaceComplexity: 'O(V)', category: 'pathfinding' },
  { id: 'dijkstra', name: 'Dijkstra算法', description: '单源最短路径，边权非负', timeComplexity: 'O(V²)', spaceComplexity: 'O(V)', category: 'pathfinding' },
  { id: 'astar', name: 'A*算法', description: '启发式最短路径搜索', timeComplexity: 'O(E log V)', spaceComplexity: 'O(V)', category: 'pathfinding' },
  { id: 'array', name: '动态数组', description: '可扩容数组，均摊O(1)追加', timeComplexity: 'O(1)*', spaceComplexity: 'O(n)', category: 'datastructure' },
  { id: 'stack', name: '栈', description: '后进先出 (LIFO) 数据结构', timeComplexity: 'O(1)', spaceComplexity: 'O(n)', category: 'datastructure' },
  { id: 'queue', name: '队列', description: '先进先出 (FIFO) 数据结构', timeComplexity: 'O(1)', spaceComplexity: 'O(n)', category: 'datastructure' },
  { id: 'bst', name: '二叉搜索树', description: '左子树 < 根 < 右子树', timeComplexity: 'O(log n)*', spaceComplexity: 'O(n)', category: 'datastructure' },
  { id: 'topo', name: '拓扑排序', description: '有向无环图的线性排序', timeComplexity: 'O(V+E)', spaceComplexity: 'O(V)', category: 'advanced' },
  { id: 'scc', name: '强连通分量', description: 'Kosaraju算法找强连通分量', timeComplexity: 'O(V+E)', spaceComplexity: 'O(V)', category: 'advanced' },
  { id: 'knapsack', name: '背包问题', description: '0/1背包动态规划求解', timeComplexity: 'O(nW)', spaceComplexity: 'O(nW)', category: 'advanced' },
  { id: 'lcs', name: '最长公共子序列', description: '动态规划求LCS', timeComplexity: 'O(mn)', spaceComplexity: 'O(mn)', category: 'advanced' },
  { id: 'perceptron', name: '感知机', description: '单层神经网络二分类', timeComplexity: 'O(n×iter)', spaceComplexity: 'O(d)', category: 'ml' },
  { id: 'kmeans', name: 'K-Means聚类', description: '无监督聚类算法', timeComplexity: 'O(n×k×iter)', spaceComplexity: 'O(k×d)', category: 'ml' },
  { id: 'gradient', name: '梯度下降', description: '优化算法，寻找函数最小值', timeComplexity: 'O(n×iter)', spaceComplexity: 'O(d)', category: 'ml' },
  { id: 'neuralnet', name: '神经网络', description: '多层前馈神经网络', timeComplexity: 'O(n×layers)', spaceComplexity: 'O(weights)', category: 'ml' },
];

const SortingVisualizer = ({ speed, onShowCode }: { speed: number; onShowCode: (id: string, name: string) => void }) => {
  const [array, setArray] = useState<number[]>([]);
  const [comparing, setComparing] = useState<number[]>([]);
  const [swapping, setSwapping] = useState<number[]>([]);
  const [sorted, setSorted] = useState<number[]>([]);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<string>('bubble');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const stopRef = useRef(false);
  const pauseRef = useRef(false);

  const arraySize = 30;
  const maxValue = 100;

  const generateArray = useCallback(() => {
    const newArray = Array.from({ length: arraySize }, () => Math.floor(Math.random() * maxValue) + 5);
    setArray(newArray);
    setComparing([]);
    setSwapping([]);
    setSorted([]);
    stopRef.current = true;
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  useEffect(() => {
    generateArray();
  }, [generateArray]);

  // Reset and generate new array when algorithm changes
  useEffect(() => {
    stopRef.current = true;
    setIsRunning(false);
    setIsPaused(false);
    setComparing([]);
    setSwapping([]);
    setSorted([]);
    // Generate new array
    const newArray = Array.from({ length: arraySize }, () => Math.floor(Math.random() * maxValue) + 5);
    setArray(newArray);
  }, [currentAlgorithm]);

  const delay = useCallback((ms: number) => new Promise(resolve => setTimeout(resolve, ms)), []);

  const waitForResume = useCallback(async () => {
    while (pauseRef.current) {
      await delay(100);
    }
  }, [delay]);

  const bubbleSort = useCallback(async () => {
    const arr = [...array];
    const sortedIndices: number[] = [];
    
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        if (stopRef.current) return;
        await waitForResume();
        
        setComparing([j, j + 1]);
        await delay(speed);
        
        if (arr[j] > arr[j + 1]) {
          setSwapping([j, j + 1]);
          await delay(speed);
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          setArray([...arr]);
          setSwapping([]);
        }
      }
      sortedIndices.unshift(arr.length - 1 - i);
      setSorted([...sortedIndices]);
    }
    sortedIndices.unshift(0);
    setSorted(sortedIndices);
    setComparing([]);
  }, [array, speed, delay, waitForResume]);

  const selectionSort = useCallback(async () => {
    const arr = [...array];
    const sortedIndices: number[] = [];
    
    for (let i = 0; i < arr.length - 1; i++) {
      let minIdx = i;
      
      for (let j = i + 1; j < arr.length; j++) {
        if (stopRef.current) return;
        await waitForResume();
        
        setComparing([minIdx, j]);
        await delay(speed);
        
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
        }
      }
      
      if (minIdx !== i) {
        setSwapping([i, minIdx]);
        await delay(speed);
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        setArray([...arr]);
        setSwapping([]);
      }
      
      sortedIndices.push(i);
      setSorted([...sortedIndices]);
    }
    sortedIndices.push(arr.length - 1);
    setSorted(sortedIndices);
    setComparing([]);
  }, [array, speed, delay, waitForResume]);

  const insertionSort = useCallback(async () => {
    const arr = [...array];
    const sortedIndices: number[] = [0];
    
    for (let i = 1; i < arr.length; i++) {
      const key = arr[i];
      let j = i - 1;
      
      setComparing([i]);
      await delay(speed);
      
      while (j >= 0 && arr[j] > key) {
        if (stopRef.current) return;
        await waitForResume();
        
        setComparing([j, j + 1]);
        await delay(speed);
        
        arr[j + 1] = arr[j];
        setArray([...arr]);
        j--;
      }
      
      arr[j + 1] = key;
      setArray([...arr]);
      sortedIndices.push(i);
      setSorted([...sortedIndices.slice(0, i + 1)]);
    }
    
    setSorted(Array.from({ length: arr.length }, (_, i) => i));
    setComparing([]);
  }, [array, speed, delay, waitForResume]);

  const quickSort = useCallback(async () => {
    const arr = [...array];
    const sortedSet: Set<number> = new Set();
    
    const partition = async (low: number, high: number): Promise<number> => {
      const pivot = arr[high];
      let i = low - 1;
      
      for (let j = low; j < high; j++) {
        if (stopRef.current) return -1;
        await waitForResume();
        
        setComparing([j, high]);
        await delay(speed);
        
        if (arr[j] < pivot) {
          i++;
          setSwapping([i, j]);
          await delay(speed);
          [arr[i], arr[j]] = [arr[j], arr[i]];
          setArray([...arr]);
          setSwapping([]);
        }
      }
      
      setSwapping([i + 1, high]);
      await delay(speed);
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      setArray([...arr]);
      setSwapping([]);
      
      return i + 1;
    };
    
    const sort = async (low: number, high: number): Promise<void> => {
      if (low < high && !stopRef.current) {
        const pi = await partition(low, high);
        if (pi === -1) return;
        
        sortedSet.add(pi);
        setSorted([...sortedSet]);
        
        await sort(low, pi - 1);
        await sort(pi + 1, high);
      }
    };
    
    await sort(0, arr.length - 1);
    setSorted(Array.from({ length: arr.length }, (_, i) => i));
    setComparing([]);
  }, [array, speed, delay, waitForResume]);

  const mergeSort = useCallback(async () => {
    const arr = [...array];
    
    const merge = async (left: number, mid: number, right: number): Promise<void> => {
      const leftArr = arr.slice(left, mid + 1);
      const rightArr = arr.slice(mid + 1, right + 1);
      
      let i = 0, j = 0, k = left;
      
      while (i < leftArr.length && j < rightArr.length) {
        if (stopRef.current) return;
        await waitForResume();
        
        setComparing([left + i, mid + 1 + j]);
        await delay(speed);
        
        if (leftArr[i] <= rightArr[j]) {
          arr[k] = leftArr[i];
          i++;
        } else {
          arr[k] = rightArr[j];
          j++;
        }
        setArray([...arr]);
        k++;
      }
      
      while (i < leftArr.length) {
        if (stopRef.current) return;
        arr[k] = leftArr[i];
        setArray([...arr]);
        i++;
        k++;
        await delay(speed / 2);
      }
      
      while (j < rightArr.length) {
        if (stopRef.current) return;
        arr[k] = rightArr[j];
        setArray([...arr]);
        j++;
        k++;
        await delay(speed / 2);
      }
    };
    
    const sort = async (left: number, right: number): Promise<void> => {
      if (left < right && !stopRef.current) {
        const mid = Math.floor((left + right) / 2);
        await sort(left, mid);
        await sort(mid + 1, right);
        await merge(left, mid, right);
      }
    };
    
    await sort(0, arr.length - 1);
    setSorted(Array.from({ length: arr.length }, (_, i) => i));
    setComparing([]);
  }, [array, speed, delay, waitForResume]);

  const heapSort = useCallback(async () => {
    const arr = [...array];
    const n = arr.length;
    const sortedIndices: number[] = [];
    
    const heapify = async (size: number, root: number): Promise<void> => {
      let largest = root;
      const left = 2 * root + 1;
      const right = 2 * root + 2;
      
      if (left < size) {
        setComparing([largest, left]);
        await delay(speed);
        if (arr[left] > arr[largest]) {
          largest = left;
        }
      }
      
      if (right < size) {
        setComparing([largest, right]);
        await delay(speed);
        if (arr[right] > arr[largest]) {
          largest = right;
        }
      }
      
      if (largest !== root) {
        if (stopRef.current) return;
        await waitForResume();
        
        setSwapping([root, largest]);
        await delay(speed);
        [arr[root], arr[largest]] = [arr[largest], arr[root]];
        setArray([...arr]);
        setSwapping([]);
        
        await heapify(size, largest);
      }
    };
    
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      if (stopRef.current) return;
      await heapify(n, i);
    }
    
    for (let i = n - 1; i > 0; i--) {
      if (stopRef.current) return;
      await waitForResume();
      
      setSwapping([0, i]);
      await delay(speed);
      [arr[0], arr[i]] = [arr[i], arr[0]];
      setArray([...arr]);
      setSwapping([]);
      
      sortedIndices.unshift(i);
      setSorted([...sortedIndices]);
      
      await heapify(i, 0);
    }
    
    sortedIndices.unshift(0);
    setSorted(sortedIndices);
    setComparing([]);
  }, [array, speed, delay, waitForResume]);

  const runAlgorithm = useCallback(async () => {
    stopRef.current = false;
    pauseRef.current = false;
    setIsRunning(true);
    setIsPaused(false);
    setSorted([]);
    
    switch (currentAlgorithm) {
      case 'bubble':
        await bubbleSort();
        break;
      case 'selection':
        await selectionSort();
        break;
      case 'insertion':
        await insertionSort();
        break;
      case 'quick':
        await quickSort();
        break;
      case 'merge':
        await mergeSort();
        break;
      case 'heap':
        await heapSort();
        break;
    }
    
    setIsRunning(false);
  }, [currentAlgorithm, bubbleSort, selectionSort, insertionSort, quickSort, mergeSort, heapSort]);

  const handlePause = useCallback(() => {
    pauseRef.current = !pauseRef.current;
    setIsPaused(pauseRef.current);
  }, []);

  const handleStop = useCallback(() => {
    stopRef.current = true;
    pauseRef.current = false;
    setIsRunning(false);
    setIsPaused(false);
    setComparing([]);
    setSwapping([]);
  }, []);

  const currentAlgo = ALGORITHMS.find(a => a.id === currentAlgorithm);

  return (
    <div className="algo-section">
      <div className="algo-controls">
        <div className="algo-select-wrapper">
          <select
            value={currentAlgorithm}
            onChange={(e) => setCurrentAlgorithm(e.target.value)}
            disabled={isRunning}
            className="algo-select"
          >
            {ALGORITHMS.filter(a => a.category === 'sorting').map(algo => (
              <option key={algo.id} value={algo.id}>{algo.name}</option>
            ))}
          </select>
        </div>
        
        <div className="algo-buttons">
          <button 
            onClick={() => onShowCode(currentAlgorithm, currentAlgo?.name || '')} 
            className="algo-btn" 
            title="查看代码"
          >
            <Code size={18} />
          </button>
          <button onClick={generateArray} disabled={isRunning && !isPaused} className="algo-btn" title="生成新数组">
            <Shuffle size={18} />
          </button>
          {!isRunning ? (
            <button onClick={runAlgorithm} className="algo-btn primary" title="开始">
              <Play size={18} />
            </button>
          ) : (
            <>
              <button onClick={handlePause} className="algo-btn" title={isPaused ? '继续' : '暂停'}>
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
              </button>
              <button onClick={handleStop} className="algo-btn danger" title="停止">
                <RotateCcw size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {currentAlgo && (
        <div className="algo-info">
          <div className="algo-info-item">
            <span className="algo-info-label">时间复杂度</span>
            <span className="algo-info-value">{currentAlgo.timeComplexity}</span>
          </div>
          <div className="algo-info-item">
            <span className="algo-info-label">空间复杂度</span>
            <span className="algo-info-value">{currentAlgo.spaceComplexity}</span>
          </div>
        </div>
      )}

      <div className="sorting-container">
        <div className="sorting-bars">
          {array.map((value, idx) => {
            const isComparing = comparing.includes(idx);
            const isSwapping = swapping.includes(idx);
            const isSorted = sorted.includes(idx);
            
            return (
              <motion.div
                key={idx}
                className={`sorting-bar ${isComparing ? 'comparing' : ''} ${isSwapping ? 'swapping' : ''} ${isSorted ? 'sorted' : ''}`}
                style={{ height: `${value}%` }}
                layout
                transition={{ duration: 0.1 }}
              />
            );
          })}
        </div>
      </div>

      <div className="sorting-legend">
        <div className="legend-item">
          <div className="legend-color comparing" />
          <span>比较中</span>
        </div>
        <div className="legend-item">
          <div className="legend-color swapping" />
          <span>交换中</span>
        </div>
        <div className="legend-item">
          <div className="legend-color sorted" />
          <span>已排序</span>
        </div>
      </div>
    </div>
  );
};

type CellType = 'empty' | 'wall' | 'start' | 'end' | 'visited' | 'path';

interface GridCell {
  type: CellType;
  distance: number;
  parentRow: number;
  parentCol: number;
}

const PathfindingVisualizer = ({ speed, onShowCode }: { speed: number; onShowCode: (id: string, name: string) => void }) => {
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [start, setStart] = useState<[number, number]>([1, 1]);
  const [end, setEnd] = useState<[number, number]>([13, 28]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<string>('bfs');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<'wall' | 'start' | 'end'>('wall');
  const [mazeType, setMazeType] = useState<'none' | 'recursive' | 'random' | 'complex'>('random');
  const stopRef = useRef(false);
  
  const rows = 15;
  const cols = 30;

  const initializeGrid = useCallback(() => {
    const newGrid: GridCell[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: GridCell[] = [];
      for (let j = 0; j < cols; j++) {
        row.push({ type: 'empty', distance: Infinity, parentRow: -1, parentCol: -1 });
      }
      newGrid.push(row);
    }
    newGrid[start[0]][start[1]].type = 'start';
    newGrid[end[0]][end[1]].type = 'end';
    setGrid(newGrid);
    stopRef.current = true;
    setIsRunning(false);
    setMazeType('none');
  }, [start, end]);

  // Generate random start and end positions
  const generateRandomPositions = useCallback(() => {
    const newStart: [number, number] = [
      Math.floor(Math.random() * (rows - 4)) + 2,
      Math.floor(Math.random() * (cols / 3)) + 1
    ];
    const newEnd: [number, number] = [
      Math.floor(Math.random() * (rows - 4)) + 2,
      Math.floor(Math.random() * (cols / 3)) + cols * 2 / 3
    ];
    return { newStart, newEnd };
  }, []);

  // Check if two points are connected using BFS
  const isConnected = useCallback((grid: GridCell[][], start: [number, number], end: [number, number]): boolean => {
    const visited: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(false));
    const queue: [number, number][] = [start];
    visited[start[0]][start[1]] = true;
    
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      if (r === end[0] && c === end[1]) return true;
      
      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
          const cellType = grid[nr][nc].type;
          if (cellType === 'empty' || cellType === 'start' || cellType === 'end') {
            visited[nr][nc] = true;
            queue.push([nr, nc]);
          }
        }
      }
    }
    return false;
  }, []);

  // Create a path between two points using BFS pathfinding
  const createPathBetween = useCallback((grid: GridCell[][], start: [number, number], end: [number, number]) => {
    const visited: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(false));
    const parent: Map<string, [number, number]> = new Map();
    const queue: [number, number][] = [start];
    visited[start[0]][start[1]] = true;
    
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      
      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
          visited[nr][nc] = true;
          parent.set(`${nr},${nc}`, [r, c]);
          
          if (nr === end[0] && nc === end[1]) {
            // Reconstruct path and carve it
            let curr: [number, number] = [nr, nc];
            while (parent.has(`${curr[0]},${curr[1]}`)) {
              if (grid[curr[0]][curr[1]].type === 'wall') {
                grid[curr[0]][curr[1]].type = 'empty';
              }
              curr = parent.get(`${curr[0]},${curr[1]}`)!;
            }
            return true;
          }
          queue.push([nr, nc]);
        }
      }
    }
    return false;
  }, []);

  // Generate complex maze with multiple paths
  const generateComplexMaze = useCallback(async (initialStart?: [number, number], initialEnd?: [number, number]) => {
    stopRef.current = false;
    setIsRunning(true);
    
    // Random start and end if not provided
    const { newStart, newEnd } = initialStart && initialEnd 
      ? { newStart: initialStart, newEnd: initialEnd }
      : generateRandomPositions();
    
    setStart(newStart);
    setEnd(newEnd);
    
    // Start with all walls
    const newGrid: GridCell[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: GridCell[] = [];
      for (let j = 0; j < cols; j++) {
        row.push({ type: 'wall', distance: Infinity, parentRow: -1, parentCol: -1 });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    await delay(speed / 2);
    
    // Use recursive backtracking from start
    const visited: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(false));
    const stack: [number, number][] = [[newStart[0], newStart[1]]];
    visited[newStart[0]][newStart[1]] = true;
    newGrid[newStart[0]][newStart[1]].type = 'empty';
    
    const directions: [number, number][] = [[0, 2], [2, 0], [0, -2], [-2, 0]];
    
    while (stack.length > 0) {
      if (stopRef.current) break;
      
      const [row, col] = stack[stack.length - 1];
      const neighbors: [number, number][] = [];
      
      for (const [dr, dc] of directions) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1 && !visited[nr][nc]) {
          neighbors.push([nr, nc]);
        }
      }
      
      if (neighbors.length > 0) {
        const [nr, nc] = neighbors[Math.floor(Math.random() * neighbors.length)];
        const wallRow = row + (nr - row) / 2;
        const wallCol = col + (nc - col) / 2;
        
        newGrid[wallRow][wallCol].type = 'empty';
        newGrid[nr][nc].type = 'empty';
        visited[nr][nc] = true;
        visited[wallRow][wallCol] = true;
        
        stack.push([nr, nc]);
        setGrid([...newGrid]);
        await delay(speed / 8);
      } else {
        stack.pop();
      }
    }
    
    // Clear area around start and end
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const sr = newStart[0] + dr;
        const sc = newStart[1] + dc;
        if (sr >= 0 && sr < rows && sc >= 0 && sc < cols && newGrid[sr][sc].type === 'wall') {
          newGrid[sr][sc].type = 'empty';
        }
        const er = newEnd[0] + dr;
        const ec = newEnd[1] + dc;
        if (er >= 0 && er < rows && ec >= 0 && ec < cols && newGrid[er][ec].type === 'wall') {
          newGrid[er][ec].type = 'empty';
        }
      }
    }
    
    // Ensure start and end are set
    newGrid[newStart[0]][newStart[1]].type = 'start';
    newGrid[newEnd[0]][newEnd[1]].type = 'end';
    
    // Check if start and end are connected, if not create a path
    if (!isConnected(newGrid, newStart, newEnd)) {
      createPathBetween(newGrid, newStart, newEnd);
    }
    
    // Add extra passages for multiple paths
    const extraPassages = Math.floor((rows * cols) / 12);
    for (let i = 0; i < extraPassages; i++) {
      if (stopRef.current) break;
      const r = Math.floor(Math.random() * (rows - 2)) + 1;
      const c = Math.floor(Math.random() * (cols - 2)) + 1;
      if (newGrid[r][c].type === 'wall') {
        let emptyNeighbors = 0;
        if (r > 0 && newGrid[r-1][c].type === 'empty') emptyNeighbors++;
        if (r < rows-1 && newGrid[r+1][c].type === 'empty') emptyNeighbors++;
        if (c > 0 && newGrid[r][c-1].type === 'empty') emptyNeighbors++;
        if (c < cols-1 && newGrid[r][c+1].type === 'empty') emptyNeighbors++;
        
        if (emptyNeighbors >= 2) {
          newGrid[r][c].type = 'empty';
        }
      }
    }
    
    // Final check and ensure connectivity
    newGrid[newStart[0]][newStart[1]].type = 'start';
    newGrid[newEnd[0]][newEnd[1]].type = 'end';
    
    if (!isConnected(newGrid, newStart, newEnd)) {
      createPathBetween(newGrid, newStart, newEnd);
      newGrid[newStart[0]][newStart[1]].type = 'start';
      newGrid[newEnd[0]][newEnd[1]].type = 'end';
    }
    
    setGrid([...newGrid]);
    setMazeType('complex');
    setIsRunning(false);
  }, [speed, generateRandomPositions]);

  // Initialize with complex maze on mount
  useEffect(() => {
    generateComplexMaze();
  }, []);

  // Reset when algorithm changes
  useEffect(() => {
    stopRef.current = true;
    setIsRunning(false);
    // Clear visited and path cells
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => 
        row.map(cell => ({
          ...cell,
          type: cell.type === 'visited' || cell.type === 'path' ? 'empty' : cell.type,
          distance: Infinity,
          parentRow: -1,
          parentCol: -1,
        }))
      );
      return newGrid;
    });
  }, [currentAlgorithm]);

  const delay = useCallback((ms: number) => new Promise(resolve => setTimeout(resolve, ms)), []);

  const generateRecursiveBacktrackingMaze = useCallback(async () => {
    stopRef.current = false;
    setIsRunning(true);
    
    const newGrid: GridCell[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: GridCell[] = [];
      for (let j = 0; j < cols; j++) {
        row.push({ type: 'wall', distance: Infinity, parentRow: -1, parentCol: -1 });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    await delay(speed);
    
    const visited: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(false));
    const stack: [number, number][] = [[1, 1]];
    visited[1][1] = true;
    newGrid[1][1].type = 'empty';
    
    const directions: [number, number][] = [[0, 2], [2, 0], [0, -2], [-2, 0]];
    
    while (stack.length > 0) {
      if (stopRef.current) break;
      
      const [row, col] = stack[stack.length - 1];
      const neighbors: [number, number][] = [];
      
      for (const [dr, dc] of directions) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1 && !visited[nr][nc]) {
          neighbors.push([nr, nc]);
        }
      }
      
      if (neighbors.length > 0) {
        const [nr, nc] = neighbors[Math.floor(Math.random() * neighbors.length)];
        const wallRow = row + (nr - row) / 2;
        const wallCol = col + (nc - col) / 2;
        
        newGrid[wallRow][wallCol].type = 'empty';
        newGrid[nr][nc].type = 'empty';
        visited[nr][nc] = true;
        visited[wallRow][wallCol] = true;
        
        stack.push([nr, nc]);
        setGrid([...newGrid]);
        await delay(speed / 4);
      } else {
        stack.pop();
      }
    }
    
    newGrid[start[0]][start[1]].type = 'start';
    newGrid[end[0]][end[1]].type = 'end';
    setGrid([...newGrid]);
    setMazeType('recursive');
    setIsRunning(false);
  }, [speed, start, end]);

  const generateRandomMaze = useCallback(async () => {
    stopRef.current = false;
    setIsRunning(true);
    
    const newGrid: GridCell[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: GridCell[] = [];
      for (let j = 0; j < cols; j++) {
        const isWall = Math.random() < 0.3;
        row.push({ 
          type: isWall ? 'wall' : 'empty', 
          distance: Infinity, 
          parentRow: -1, 
          parentCol: -1 
        });
      }
      newGrid.push(row);
    }
    
    newGrid[start[0]][start[1]].type = 'start';
    newGrid[end[0]][end[1]].type = 'end';
    
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const r = start[0] + i;
        const c = start[1] + j;
        if (r >= 0 && r < rows && c >= 0 && c < cols && newGrid[r][c].type === 'wall') {
          newGrid[r][c].type = 'empty';
        }
        const er = end[0] + i;
        const ec = end[1] + j;
        if (er >= 0 && er < rows && ec >= 0 && ec < cols && newGrid[er][ec].type === 'wall') {
          newGrid[er][ec].type = 'empty';
        }
      }
    }
    
    setGrid(newGrid);
    setMazeType('random');
    setIsRunning(false);
  }, [start, end]);

  const getNeighbors = useCallback((row: number, col: number): [number, number][] => {
    const neighbors: [number, number][] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push([nr, nc]);
      }
    }
    return neighbors;
  }, []);

  const reconstructPath = useCallback(async (newGrid: GridCell[][], endRow: number, endCol: number) => {
    let currRow = endRow;
    let currCol = endCol;
    
    while (currRow >= 0 && currCol >= 0) {
      const cell = newGrid[currRow][currCol];
      if (cell.type !== 'start' && cell.type !== 'end') {
        newGrid[currRow][currCol].type = 'path';
        setGrid([...newGrid]);
        await delay(speed * 2);
      }
      const prevRow = cell.parentRow;
      const prevCol = cell.parentCol;
      if (prevRow === currRow && prevCol === currCol) break;
      currRow = prevRow;
      currCol = prevCol;
    }
  }, [delay, speed]);

  const bfs = useCallback(async () => {
    const newGrid = grid.map(row => row.map(cell => ({ ...cell, distance: Infinity, parentRow: -1, parentCol: -1 })));
    const queue: [number, number][] = [start];
    newGrid[start[0]][start[1]].distance = 0;
    
    while (queue.length > 0) {
      if (stopRef.current) return;
      
      const [row, col] = queue.shift()!;
      const current = newGrid[row][col];
      
      if (current.type === 'end') {
        await reconstructPath(newGrid, row, col);
        return;
      }
      
      if (current.type === 'empty') {
        newGrid[row][col].type = 'visited';
        setGrid([...newGrid]);
        await delay(speed);
      }
      
      for (const [nr, nc] of getNeighbors(row, col)) {
        const neighbor = newGrid[nr][nc];
        if (neighbor.type !== 'wall' && neighbor.type !== 'visited' && neighbor.type !== 'start' && neighbor.distance === Infinity) {
          neighbor.distance = current.distance + 1;
          neighbor.parentRow = row;
          neighbor.parentCol = col;
          queue.push([nr, nc]);
        }
      }
    }
  }, [grid, start, speed, delay, getNeighbors, reconstructPath]);

  const dfs = useCallback(async () => {
    const newGrid = grid.map(row => row.map(cell => ({ ...cell, distance: Infinity, parentRow: -1, parentCol: -1 })));
    const stack: [number, number][] = [start];
    newGrid[start[0]][start[1]].distance = 0;
    
    while (stack.length > 0) {
      if (stopRef.current) return;
      
      const [row, col] = stack.pop()!;
      const current = newGrid[row][col];
      
      if (current.type === 'end') {
        await reconstructPath(newGrid, row, col);
        return;
      }
      
      if (current.type === 'empty') {
        newGrid[row][col].type = 'visited';
        setGrid([...newGrid]);
        await delay(speed);
      }
      
      for (const [nr, nc] of getNeighbors(row, col)) {
        const neighbor = newGrid[nr][nc];
        if (neighbor.type !== 'wall' && neighbor.type !== 'visited' && neighbor.type !== 'start') {
          neighbor.parentRow = row;
          neighbor.parentCol = col;
          stack.push([nr, nc]);
        }
      }
    }
  }, [grid, start, speed, delay, getNeighbors, reconstructPath]);

  const dijkstra = useCallback(async () => {
    const newGrid = grid.map(row => row.map(cell => ({ ...cell, distance: Infinity, parentRow: -1, parentCol: -1 })));
    const pq: [number, number, number][] = [[0, start[0], start[1]]];
    newGrid[start[0]][start[1]].distance = 0;
    
    while (pq.length > 0) {
      if (stopRef.current) return;
      
      pq.sort((a, b) => a[0] - b[0]);
      const [dist, row, col] = pq.shift()!;
      const current = newGrid[row][col];
      
      if (dist > current.distance) continue;
      
      if (current.type === 'end') {
        await reconstructPath(newGrid, row, col);
        return;
      }
      
      if (current.type === 'empty') {
        newGrid[row][col].type = 'visited';
        setGrid([...newGrid]);
        await delay(speed);
      }
      
      for (const [nr, nc] of getNeighbors(row, col)) {
        const neighbor = newGrid[nr][nc];
        const newDist = dist + 1;
        if (neighbor.type !== 'wall' && neighbor.type !== 'visited' && neighbor.type !== 'start' && newDist < neighbor.distance) {
          neighbor.distance = newDist;
          neighbor.parentRow = row;
          neighbor.parentCol = col;
          pq.push([newDist, nr, nc]);
        }
      }
    }
  }, [grid, start, speed, delay, getNeighbors, reconstructPath]);

  const heuristic = useCallback((row: number, col: number): number => {
    return Math.abs(row - end[0]) + Math.abs(col - end[1]);
  }, [end]);

  const astar = useCallback(async () => {
    const newGrid = grid.map(row => row.map(cell => ({ ...cell, distance: Infinity, parentRow: -1, parentCol: -1 })));
    const openSet: [number, number, number][] = [[heuristic(start[0], start[1]), start[0], start[1]]];
    newGrid[start[0]][start[1]].distance = 0;
    
    while (openSet.length > 0) {
      if (stopRef.current) return;
      
      openSet.sort((a, b) => a[0] - b[0]);
      const [, row, col] = openSet.shift()!;
      const current = newGrid[row][col];
      
      if (current.type === 'end') {
        await reconstructPath(newGrid, row, col);
        return;
      }
      
      if (current.type === 'empty') {
        newGrid[row][col].type = 'visited';
        setGrid([...newGrid]);
        await delay(speed);
      }
      
      for (const [nr, nc] of getNeighbors(row, col)) {
        const neighbor = newGrid[nr][nc];
        const gScore = current.distance + 1;
        if (neighbor.type !== 'wall' && neighbor.type !== 'visited' && neighbor.type !== 'start' && gScore < neighbor.distance) {
          neighbor.distance = gScore;
          neighbor.parentRow = row;
          neighbor.parentCol = col;
          const fScore = gScore + heuristic(nr, nc);
          openSet.push([fScore, nr, nc]);
        }
      }
    }
  }, [grid, start, speed, delay, getNeighbors, heuristic, reconstructPath]);

  const runAlgorithm = useCallback(async () => {
    stopRef.current = false;
    setIsRunning(true);
    
    const newGrid = grid.map(row => row.map(cell => ({
      ...cell,
      type: cell.type === 'visited' || cell.type === 'path' ? 'empty' : cell.type,
      distance: Infinity,
      parentRow: -1,
      parentCol: -1
    })));
    newGrid[start[0]][start[1]].type = 'start';
    newGrid[end[0]][end[1]].type = 'end';
    setGrid(newGrid);
    
    switch (currentAlgorithm) {
      case 'bfs':
        await bfs();
        break;
      case 'dfs':
        await dfs();
        break;
      case 'dijkstra':
        await dijkstra();
        break;
      case 'astar':
        await astar();
        break;
    }
    
    setIsRunning(false);
  }, [currentAlgorithm, grid, start, end, bfs, dfs, dijkstra, astar]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (isRunning) return;
    
    const newGrid = [...grid];
    const cell = newGrid[row][col];
    
    if (drawMode === 'wall') {
      if (cell.type === 'empty') {
        cell.type = 'wall';
      } else if (cell.type === 'wall') {
        cell.type = 'empty';
      }
    } else if (drawMode === 'start' && cell.type !== 'end') {
      newGrid[start[0]][start[1]].type = 'empty';
      cell.type = 'start';
      setStart([row, col]);
    } else if (drawMode === 'end' && cell.type !== 'start') {
      newGrid[end[0]][end[1]].type = 'empty';
      cell.type = 'end';
      setEnd([row, col]);
    }
    
    setGrid(newGrid);
  }, [grid, isRunning, drawMode, start, end]);

  const handleMouseDown = useCallback((row: number, col: number) => {
    if (isRunning) return;
    setIsDrawing(true);
    handleCellClick(row, col);
  }, [isRunning, handleCellClick]);

  const handleMouseEnter = useCallback((row: number, col: number) => {
    if (!isDrawing || isRunning || drawMode !== 'wall') return;
    handleCellClick(row, col);
  }, [isDrawing, isRunning, drawMode, handleCellClick]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const currentAlgo = ALGORITHMS.find(a => a.id === currentAlgorithm);

  return (
    <div className="algo-section">
      <div className="algo-controls">
        <div className="algo-select-wrapper">
          <select
            value={currentAlgorithm}
            onChange={(e) => setCurrentAlgorithm(e.target.value)}
            disabled={isRunning}
            className="algo-select"
          >
            {ALGORITHMS.filter(a => a.category === 'pathfinding').map(algo => (
              <option key={algo.id} value={algo.id}>{algo.name}</option>
            ))}
          </select>
        </div>
        
        <div className="draw-mode-buttons">
          <button 
            onClick={() => setDrawMode('wall')} 
            className={`algo-btn ${drawMode === 'wall' ? 'active' : ''}`}
            title="绘制墙壁"
          >
            <Grid3X3 size={18} />
          </button>
          <button 
            onClick={() => setDrawMode('start')} 
            className={`algo-btn ${drawMode === 'start' ? 'active' : ''}`}
            title="设置起点"
          >
            <Play size={18} />
          </button>
          <button 
            onClick={() => setDrawMode('end')} 
            className={`algo-btn ${drawMode === 'end' ? 'active' : ''}`}
            title="设置终点"
          >
            <Zap size={18} />
          </button>
        </div>
        
        <div className="maze-buttons">
          <button 
            onClick={() => generateComplexMaze()} 
            disabled={isRunning}
            className={`algo-btn ${mazeType === 'complex' ? 'active' : ''}`}
            title="复杂多路迷宫"
          >
            <Network size={18} />
          </button>
          <button 
            onClick={generateRecursiveBacktrackingMaze} 
            disabled={isRunning}
            className={`algo-btn ${mazeType === 'recursive' ? 'active' : ''}`}
            title="递归回溯迷宫"
          >
            <Target size={18} />
          </button>
          <button 
            onClick={generateRandomMaze} 
            disabled={isRunning}
            className={`algo-btn ${mazeType === 'random' ? 'active' : ''}`}
            title="随机迷宫"
          >
            <Shuffle size={18} />
          </button>
        </div>
        
        <div className="algo-buttons">
          <button 
            onClick={() => onShowCode(currentAlgorithm, currentAlgo?.name || '')} 
            className="algo-btn" 
            title="查看代码"
          >
            <Code size={18} />
          </button>
          <button onClick={initializeGrid} disabled={isRunning} className="algo-btn" title="清空网格">
            <RotateCcw size={18} />
          </button>
          <button onClick={runAlgorithm} disabled={isRunning} className="algo-btn primary" title="开始">
            <Play size={18} />
          </button>
        </div>
      </div>

      {currentAlgo && (
        <div className="algo-info">
          <div className="algo-info-item">
            <span className="algo-info-label">时间复杂度</span>
            <span className="algo-info-value">{currentAlgo.timeComplexity}</span>
          </div>
          <div className="algo-info-item">
            <span className="algo-info-label">空间复杂度</span>
            <span className="algo-info-value">{currentAlgo.spaceComplexity}</span>
          </div>
        </div>
      )}

      <div className="pathfinding-container">
        <div 
          className="pathfinding-grid" 
          onMouseLeave={handleMouseUp}
          onMouseUp={handleMouseUp}
        >
          {grid.map((row, rowIdx) => (
            <div key={rowIdx} className="grid-row">
              {row.map((cell, colIdx) => (
                <div
                  key={colIdx}
                  className={`grid-cell ${cell.type}`}
                  onMouseDown={() => handleMouseDown(rowIdx, colIdx)}
                  onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="pathfinding-legend">
        <div className="legend-item">
          <div className="legend-color start" />
          <span>起点</span>
        </div>
        <div className="legend-item">
          <div className="legend-color end" />
          <span>终点</span>
        </div>
        <div className="legend-item">
          <div className="legend-color wall" />
          <span>墙壁</span>
        </div>
        <div className="legend-item">
          <div className="legend-color visited" />
          <span>已访问</span>
        </div>
        <div className="legend-item">
          <div className="legend-color path" />
          <span>路径</span>
        </div>
      </div>
    </div>
  );
};

interface BSTNode {
  value: number;
  left: BSTNode | null;
  right: BSTNode | null;
}

const DataStructureVisualizer = ({ onShowCode }: { onShowCode: (id: string, name: string) => void }) => {
  const [currentDS, setCurrentDS] = useState<string>('array');
  const [array, setArray] = useState<number[]>([5, 3, 8, 1, 9, 2, 7]);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [stack, setStack] = useState<number[]>([]);
  const [queue, setQueue] = useState<number[]>([]);
  const [bst, setBST] = useState<BSTNode | null>(null);
  const [message, setMessage] = useState('');

  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2000);
  }, []);

  const arrayPush = useCallback(() => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      showMessage('请输入有效数字');
      return;
    }
    setArray([...array, val]);
    setHighlightedIndex(array.length);
    setInputValue('');
    showMessage(`已添加 ${val} 到数组末尾`);
  }, [array, inputValue, showMessage]);

  const arrayPop = useCallback(() => {
    if (array.length === 0) {
      showMessage('数组为空');
      return;
    }
    const val = array[array.length - 1];
    setArray(array.slice(0, -1));
    setHighlightedIndex(null);
    showMessage(`已移除 ${val}`);
  }, [array, showMessage]);

  const arrayInsertAt = useCallback((index: number) => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      showMessage('请输入有效数字');
      return;
    }
    const newArray = [...array];
    newArray.splice(index, 0, val);
    setArray(newArray);
    setHighlightedIndex(index);
    setInputValue('');
    showMessage(`已在位置 ${index} 插入 ${val}`);
  }, [array, inputValue, showMessage]);

  const arrayRemoveAt = useCallback((index: number) => {
    if (index < 0 || index >= array.length) {
      showMessage('无效索引');
      return;
    }
    const val = array[index];
    const newArray = [...array];
    newArray.splice(index, 1);
    setArray(newArray);
    setHighlightedIndex(null);
    showMessage(`已移除位置 ${index} 的元素 ${val}`);
  }, [array, showMessage]);

  const stackPush = useCallback(() => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      showMessage('请输入有效数字');
      return;
    }
    setStack([...stack, val]);
    setInputValue('');
    showMessage(`已压入 ${val}`);
  }, [stack, inputValue, showMessage]);

  const stackPop = useCallback(() => {
    if (stack.length === 0) {
      showMessage('栈为空');
      return;
    }
    const val = stack[stack.length - 1];
    setStack(stack.slice(0, -1));
    showMessage(`已弹出 ${val}`);
  }, [stack, showMessage]);

  const queueEnqueue = useCallback(() => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      showMessage('请输入有效数字');
      return;
    }
    setQueue([...queue, val]);
    setInputValue('');
    showMessage(`已入队 ${val}`);
  }, [queue, inputValue, showMessage]);

  const queueDequeue = useCallback(() => {
    if (queue.length === 0) {
      showMessage('队列为空');
      return;
    }
    const val = queue[0];
    setQueue(queue.slice(1));
    showMessage(`已出队 ${val}`);
  }, [queue, showMessage]);

  const insertBST = useCallback((node: BSTNode | null, val: number): BSTNode => {
    if (!node) return { value: val, left: null, right: null };
    if (val < node.value) {
      return { ...node, left: insertBST(node.left, val) };
    } else {
      return { ...node, right: insertBST(node.right, val) };
    }
  }, []);

  const bstInsert = useCallback(() => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      showMessage('请输入有效数字');
      return;
    }
    setBST(prev => insertBST(prev, val));
    setInputValue('');
    showMessage(`已插入 ${val}`);
  }, [inputValue, insertBST, showMessage]);

  const renderBST = useCallback((node: BSTNode | null): React.ReactNode => {
    if (!node) return null;
    
    return (
      <div className="bst-node-container">
        <motion.div
          className="bst-node"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {node.value}
        </motion.div>
        {(node.left || node.right) && (
          <div className="bst-children">
            <div className="bst-child">
              {node.left && renderBST(node.left)}
            </div>
            <div className="bst-child">
              {node.right && renderBST(node.right)}
            </div>
          </div>
        )}
      </div>
    );
  }, []);

  const currentAlgo = ALGORITHMS.find(a => a.id === currentDS);

  return (
    <div className="algo-section">
      <div className="algo-controls">
        <div className="algo-select-wrapper">
          <select
            value={currentDS}
            onChange={(e) => {
              setCurrentDS(e.target.value);
              setHighlightedIndex(null);
            }}
            className="algo-select"
          >
            {ALGORITHMS.filter(a => a.category === 'datastructure').map(algo => (
              <option key={algo.id} value={algo.id}>{algo.name}</option>
            ))}
          </select>
        </div>
        
        <div className="algo-buttons">
          <button 
            onClick={() => onShowCode(currentDS, currentAlgo?.name || '')} 
            className="algo-btn" 
            title="查看代码"
          >
            <Code size={18} />
          </button>
        </div>
        
        <div className="ds-input-group">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入数值"
            className="ds-input"
          />
        </div>
      </div>

      {currentAlgo && (
        <div className="algo-info">
          <div className="algo-info-item">
            <span className="algo-info-label">时间复杂度</span>
            <span className="algo-info-value">{currentAlgo.timeComplexity}</span>
          </div>
          <div className="algo-info-item">
            <span className="algo-info-label">空间复杂度</span>
            <span className="algo-info-value">{currentAlgo.spaceComplexity}</span>
          </div>
        </div>
      )}

      {message && (
        <motion.div
          className="ds-message"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {message}
        </motion.div>
      )}

      <div className="ds-container">
        {currentDS === 'array' && (
          <div className="ds-array">
            <div className="ds-operations">
              <button onClick={arrayPush} className="ds-btn">追加</button>
              <button onClick={arrayPop} className="ds-btn">弹出</button>
              <button onClick={() => arrayInsertAt(0)} className="ds-btn">插入到首位</button>
            </div>
            <div className="array-visualization">
              {array.map((val, idx) => (
                <motion.div
                  key={idx}
                  className={`array-item ${highlightedIndex === idx ? 'highlighted' : ''}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => arrayRemoveAt(idx)}
                  title="点击移除"
                >
                  <span className="array-value">{val}</span>
                  <span className="array-index">{idx}</span>
                </motion.div>
              ))}
              {array.length === 0 && <div className="empty-message">数组为空</div>}
            </div>
          </div>
        )}

        {currentDS === 'stack' && (
          <div className="ds-stack">
            <div className="ds-operations">
              <button onClick={stackPush} className="ds-btn">压入</button>
              <button onClick={stackPop} className="ds-btn">弹出</button>
            </div>
            <div className="stack-visualization">
              <div className="stack-label">栈顶</div>
              {stack.map((val, idx) => (
                <motion.div
                  key={idx}
                  className={`stack-item ${idx === stack.length - 1 ? 'top' : ''}`}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                >
                  {val}
                </motion.div>
              ))}
              {stack.length === 0 && <div className="empty-message">栈为空</div>}
              <div className="stack-label">栈底</div>
            </div>
          </div>
        )}

        {currentDS === 'queue' && (
          <div className="ds-queue">
            <div className="ds-operations">
              <button onClick={queueEnqueue} className="ds-btn">入队</button>
              <button onClick={queueDequeue} className="ds-btn">出队</button>
            </div>
            <div className="queue-visualization">
              <div className="queue-label">队首</div>
              <div className="queue-items">
                {queue.map((val, idx) => (
                  <motion.div
                    key={idx}
                    className={`queue-item ${idx === 0 ? 'front' : ''} ${idx === queue.length - 1 ? 'rear' : ''}`}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                  >
                    {val}
                  </motion.div>
                ))}
                {queue.length === 0 && <div className="empty-message">队列为空</div>}
              </div>
              <div className="queue-label">队尾</div>
            </div>
          </div>
        )}

        {currentDS === 'bst' && (
          <div className="ds-bst">
            <div className="ds-operations">
              <button onClick={bstInsert} className="ds-btn">插入</button>
              <button onClick={() => setBST(null)} className="ds-btn">清空</button>
            </div>
            <div className="bst-visualization">
              {bst ? renderBST(bst) : <div className="empty-message">树为空，请插入节点</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface GraphNode {
  id: number;
  x: number;
  y: number;
  visited: boolean;
  inStack: boolean;
  component: number;
}

interface GraphEdge {
  from: number;
  to: number;
}

const AdvancedAlgorithmsVisualizer = ({ speed, onShowCode }: { speed: number; onShowCode: (id: string, name: string) => void }) => {
  const [currentAlgorithm, setCurrentAlgorithm] = useState<string>('topo');
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string>('');
  const [sortedOrder, setSortedOrder] = useState<number[]>([]);
  
  const [knapsackWeights, setKnapsackWeights] = useState<number[]>([]);
  const [knapsackValues, setKnapsackValues] = useState<number[]>([]);
  const [knapsackCapacity, setKnapsackCapacity] = useState<number>(0);
  const [dpTable, setDpTable] = useState<number[][]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  
  const [lcsStr1, setLcsStr1] = useState<string>('');
  const [lcsStr2, setLcsStr2] = useState<string>('');
  const [lcsTable, setLcsTable] = useState<number[][]>([]);
  const [lcsPath, setLcsPath] = useState<[number, number][]>([]);

  const stopRef = useRef(false);

  const delay = useCallback((ms: number) => new Promise(resolve => setTimeout(resolve, ms)), []);

  // Generate random DAG for topological sort
  const generateRandomDAG = useCallback(() => {
    const nodeCount = 6 + Math.floor(Math.random() * 3); // 6-8 nodes
    const graphNodes: GraphNode[] = [];
    
    // SVG dimensions: 600 x 280
    const svgWidth = 600;
    const svgHeight = 280;
    const padding = 50;
    
    // Position nodes in layers
    const layers = 3;
    const nodesPerLayer = Math.ceil(nodeCount / layers);
    const layerWidth = (svgWidth - 2 * padding) / (layers - 1);
    
    for (let i = 0; i < nodeCount; i++) {
      const layer = Math.floor(i / nodesPerLayer);
      const posInLayer = i % nodesPerLayer;
      const nodesInThisLayer = Math.min(nodesPerLayer, nodeCount - layer * nodesPerLayer);
      const layerHeight = svgHeight - 2 * padding;
      const ySpacing = nodesInThisLayer > 1 ? layerHeight / (nodesInThisLayer - 1) : 0;
      
      const x = padding + layer * layerWidth;
      const y = nodesInThisLayer > 1 
        ? padding + posInLayer * ySpacing 
        : svgHeight / 2;
      
      graphNodes.push({ id: i, x, y, visited: false, inStack: false, component: -1 });
    }
    
    // Generate edges (only forward to ensure DAG)
    const graphEdges: GraphEdge[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const currentLayer = Math.floor(i / nodesPerLayer);
      // Connect to nodes in next layers
      for (let j = i + 1; j < nodeCount; j++) {
        const targetLayer = Math.floor(j / nodesPerLayer);
        if (targetLayer > currentLayer && Math.random() < 0.35) {
          graphEdges.push({ from: i, to: j });
        }
      }
    }
    
    // Ensure at least some edges
    if (graphEdges.length < 3) {
      for (let l = 0; l < layers - 1; l++) {
        const layerStart = l * nodesPerLayer;
        const nextLayerStart = (l + 1) * nodesPerLayer;
        const nextLayerEnd = Math.min(nextLayerStart + nodesPerLayer, nodeCount);
        
        for (let i = layerStart; i < Math.min(layerStart + nodesPerLayer, nodeCount); i++) {
          if (nextLayerStart < nodeCount) {
            const target = nextLayerStart + Math.floor(Math.random() * (nextLayerEnd - nextLayerStart));
            if (target < nodeCount) {
              graphEdges.push({ from: i, to: target });
            }
          }
        }
      }
    }
    
    setNodes(graphNodes);
    setEdges(graphEdges);
    setSortedOrder([]);
    setResult('');
    stopRef.current = true;
    setIsRunning(false);
  }, []);

  // Generate random knapsack problem
  const generateRandomKnapsack = useCallback(() => {
    const itemCount = 5 + Math.floor(Math.random() * 4); // 5-8 items
    const capacity = 10 + Math.floor(Math.random() * 10); // 10-19 capacity
    
    const weights: number[] = [];
    const values: number[] = [];
    
    for (let i = 0; i < itemCount; i++) {
      weights.push(1 + Math.floor(Math.random() * Math.min(capacity / 2, 8)));
      values.push(1 + Math.floor(Math.random() * 15));
    }
    
    setKnapsackWeights(weights);
    setKnapsackValues(values);
    setKnapsackCapacity(capacity);
    setDpTable([]);
    setSelectedItems([]);
    setResult('');
  }, []);

  // Generate random LCS strings
  const generateRandomLCS = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const len1 = 5 + Math.floor(Math.random() * 4); // 5-8 chars
    const len2 = 5 + Math.floor(Math.random() * 4);
    
    let str1 = '';
    let str2 = '';
    
    for (let i = 0; i < len1; i++) {
      str1 += chars[Math.floor(Math.random() * chars.length)];
    }
    for (let i = 0; i < len2; i++) {
      str2 += chars[Math.floor(Math.random() * chars.length)];
    }
    
    setLcsStr1(str1);
    setLcsStr2(str2);
    setLcsTable([]);
    setLcsPath([]);
    setResult('');
  }, []);

  useEffect(() => {
    generateRandomDAG();
    generateRandomKnapsack();
    generateRandomLCS();
  }, [generateRandomDAG, generateRandomKnapsack, generateRandomLCS]);

  // Reset when algorithm changes
  useEffect(() => {
    stopRef.current = true;
    setIsRunning(false);
    setResult('');
    setDpTable([]);
    setLcsTable([]);
    setSelectedItems([]);
    setLcsPath([]);
    setSortedOrder([]);
    
    // Regenerate data based on algorithm
    if (currentAlgorithm === 'topo' || currentAlgorithm === 'scc') {
      generateRandomDAG();
    } else if (currentAlgorithm === 'knapsack') {
      generateRandomKnapsack();
    } else if (currentAlgorithm === 'lcs') {
      generateRandomLCS();
    }
  }, [currentAlgorithm, generateRandomDAG, generateRandomKnapsack, generateRandomLCS]);

  const topologicalSort = useCallback(async () => {
    const newNodes = nodes.map(n => ({ ...n, visited: false, inStack: false }));
    const adj: Map<number, number[]> = new Map();
    const inDegree: Map<number, number> = new Map();
    
    nodes.forEach(n => {
      adj.set(n.id, []);
      inDegree.set(n.id, 0);
    });
    
    edges.forEach(e => {
      adj.get(e.from)!.push(e.to);
      inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
    });
    
    const queue: number[] = [];
    const order: number[] = [];
    
    inDegree.forEach((degree, id) => {
      if (degree === 0) queue.push(id);
    });
    
    while (queue.length > 0) {
      if (stopRef.current) return;
      
      const current = queue.shift()!;
      order.push(current);
      
      const nodeIdx = newNodes.findIndex(n => n.id === current);
      newNodes[nodeIdx].visited = true;
      setNodes([...newNodes]);
      setSortedOrder([...order]);
      await delay(speed);
      
      for (const neighbor of adj.get(current) || []) {
        const newDegree = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }
    
    setResult(`拓扑排序结果: ${order.join(' → ')}`);
  }, [nodes, edges, speed, delay]);

  const kosarajuSCC = useCallback(async () => {
    const newNodes = nodes.map(n => ({ ...n, visited: false, inStack: false, component: -1 }));
    const adj: Map<number, number[]> = new Map();
    const revAdj: Map<number, number[]> = new Map();
    
    nodes.forEach(n => {
      adj.set(n.id, []);
      revAdj.set(n.id, []);
    });
    
    edges.forEach(e => {
      adj.get(e.from)!.push(e.to);
      revAdj.get(e.to)!.push(e.from);
    });
    
    const finishOrder: number[] = [];
    
    const dfs1 = async (nodeId: number): Promise<void> => {
      if (stopRef.current) return;
      
      const nodeIdx = newNodes.findIndex(n => n.id === nodeId);
      if (newNodes[nodeIdx].visited) return;
      
      newNodes[nodeIdx].visited = true;
      newNodes[nodeIdx].inStack = true;
      setNodes([...newNodes]);
      await delay(speed);
      
      for (const neighbor of adj.get(nodeId) || []) {
        await dfs1(neighbor);
      }
      
      newNodes[nodeIdx].inStack = false;
      finishOrder.push(nodeId);
      setNodes([...newNodes]);
    };
    
    for (const node of nodes) {
      if (!newNodes.find(n => n.id === node.id)?.visited) {
        await dfs1(node.id);
      }
    }
    
    newNodes.forEach(n => {
      n.visited = false;
      n.inStack = false;
    });
    setNodes([...newNodes]);
    
    const colors = new Map<number, number>();
    let componentId = 0;
    
    const dfs2 = async (nodeId: number, compId: number): Promise<void> => {
      if (stopRef.current) return;
      
      const nodeIdx = newNodes.findIndex(n => n.id === nodeId);
      if (newNodes[nodeIdx].visited) return;
      
      newNodes[nodeIdx].visited = true;
      newNodes[nodeIdx].component = compId;
      colors.set(nodeId, compId);
      setNodes([...newNodes]);
      await delay(speed);
      
      for (const neighbor of revAdj.get(nodeId) || []) {
        await dfs2(neighbor, compId);
      }
    };
    
    for (const nodeId of finishOrder.reverse()) {
      if (!newNodes.find(n => n.id === nodeId)?.visited) {
        await dfs2(nodeId, componentId);
        componentId++;
      }
    }
    
    setResult(`发现 ${componentId} 个强连通分量`);
  }, [nodes, edges, speed, delay]);

  const knapsackDP = useCallback(async () => {
    const n = knapsackWeights.length;
    const W = knapsackCapacity;
    const dp: number[][] = Array(n + 1).fill(null).map(() => Array(W + 1).fill(0));
    
    for (let i = 1; i <= n; i++) {
      for (let w = 0; w <= W; w++) {
        if (stopRef.current) return;
        
        setDpTable(dp.map(row => [...row]));
        await delay(speed / 2);
        
        if (knapsackWeights[i - 1] <= w) {
          dp[i][w] = Math.max(
            dp[i - 1][w],
            dp[i - 1][w - knapsackWeights[i - 1]] + knapsackValues[i - 1]
          );
        } else {
          dp[i][w] = dp[i - 1][w];
        }
      }
    }
    
    setDpTable(dp.map(row => [...row]));
    
    const selected: number[] = [];
    let w = W;
    for (let i = n; i > 0; i--) {
      if (dp[i][w] !== dp[i - 1][w]) {
        selected.push(i - 1);
        w -= knapsackWeights[i - 1];
      }
    }
    setSelectedItems(selected);
    setResult(`最大价值: ${dp[n][W]}，选中物品: ${selected.map(i => `物品${i + 1}`).join(', ')}`);
  }, [knapsackWeights, knapsackValues, knapsackCapacity, speed, delay]);

  const lcsDP = useCallback(async () => {
    const m = lcsStr1.length;
    const n = lcsStr2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (stopRef.current) return;
        
        setLcsTable(dp.map(row => [...row]));
        await delay(speed / 2);
        
        if (lcsStr1[i - 1] === lcsStr2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    setLcsTable(dp.map(row => [...row]));
    
    const path: [number, number][] = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (lcsStr1[i - 1] === lcsStr2[j - 1]) {
        path.unshift([i, j]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }
    setLcsPath(path);
    
    let lcs = '';
    for (const [pi] of path) {
      lcs += lcsStr1[pi - 1];
    }
    setResult(`LCS长度: ${dp[m][n]}，结果: "${lcs}"`);
  }, [lcsStr1, lcsStr2, speed, delay]);

  const runAlgorithm = useCallback(async () => {
    stopRef.current = false;
    setIsRunning(true);
    setResult('');
    
    switch (currentAlgorithm) {
      case 'topo':
        await topologicalSort();
        break;
      case 'scc':
        await kosarajuSCC();
        break;
      case 'knapsack':
        await knapsackDP();
        break;
      case 'lcs':
        await lcsDP();
        break;
    }
    
    setIsRunning(false);
  }, [currentAlgorithm, topologicalSort, kosarajuSCC, knapsackDP, lcsDP]);

  const handleStop = useCallback(() => {
    stopRef.current = true;
    setIsRunning(false);
  }, []);

  const currentAlgo = ALGORITHMS.find(a => a.id === currentAlgorithm);

  const getComponentColor = (componentId: number): string => {
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    return colors[componentId % colors.length];
  };

  return (
    <div className="algo-section">
      <div className="algo-controls">
        <div className="algo-select-wrapper">
          <select
            value={currentAlgorithm}
            onChange={(e) => {
              setCurrentAlgorithm(e.target.value);
            }}
            disabled={isRunning}
            className="algo-select"
          >
            {ALGORITHMS.filter(a => a.category === 'advanced').map(algo => (
              <option key={algo.id} value={algo.id}>{algo.name}</option>
            ))}
          </select>
        </div>
        
        <div className="algo-buttons">
          <button 
            onClick={() => onShowCode(currentAlgorithm, currentAlgo?.name || '')} 
            className="algo-btn" 
            title="查看代码"
          >
            <Code size={18} />
          </button>
          {(currentAlgorithm === 'topo' || currentAlgorithm === 'scc') && (
            <button onClick={generateRandomDAG} disabled={isRunning} className="algo-btn" title="随机生成图">
              <Shuffle size={18} />
            </button>
          )}
          {currentAlgorithm === 'knapsack' && (
            <button onClick={generateRandomKnapsack} disabled={isRunning} className="algo-btn" title="随机生成背包问题">
              <Shuffle size={18} />
            </button>
          )}
          {currentAlgorithm === 'lcs' && (
            <button onClick={generateRandomLCS} disabled={isRunning} className="algo-btn" title="随机生成字符串">
              <Shuffle size={18} />
            </button>
          )}
          {!isRunning ? (
            <button onClick={runAlgorithm} className="algo-btn primary" title="开始">
              <Play size={18} />
            </button>
          ) : (
            <button onClick={handleStop} className="algo-btn danger" title="停止">
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </div>

      {currentAlgo && (
        <div className="algo-info">
          <div className="algo-info-item">
            <span className="algo-info-label">时间复杂度</span>
            <span className="algo-info-value">{currentAlgo.timeComplexity}</span>
          </div>
          <div className="algo-info-item">
            <span className="algo-info-label">空间复杂度</span>
            <span className="algo-info-value">{currentAlgo.spaceComplexity}</span>
          </div>
        </div>
      )}

      {(currentAlgorithm === 'topo' || currentAlgorithm === 'scc') && (
        <div className="graph-container">
          <svg className="graph-svg" width="600" height="280">
            {edges.map((edge, idx) => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;
              
              const dx = toNode.x - fromNode.x;
              const dy = toNode.y - fromNode.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const offsetX = (dx / len) * 20;
              const offsetY = (dy / len) * 20;
              
              return (
                <g key={idx}>
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-secondary)" />
                    </marker>
                  </defs>
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x - offsetX}
                    y2={toNode.y - offsetY}
                    stroke="var(--text-secondary)"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              );
            })}
            {nodes.map(node => (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="20"
                  fill={
                    node.component >= 0 ? getComponentColor(node.component) :
                    node.visited ? '#3b82f6' :
                    node.inStack ? '#f59e0b' :
                    'var(--bg-secondary)'
                  }
                  stroke={sortedOrder.includes(node.id) ? '#10b981' : 'var(--border-color)'}
                  strokeWidth="3"
                />
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="var(--text-primary)"
                  fontWeight="bold"
                >
                  {node.id}
                </text>
              </g>
            ))}
          </svg>
          
          {sortedOrder.length > 0 && (
            <div className="graph-result">
              排序顺序: {sortedOrder.join(' → ')}
            </div>
          )}
        </div>
      )}

      {currentAlgorithm === 'knapsack' && (
        <div className="dp-container">
          <div className="knapsack-info">
            <div className="knapsack-items">
              <span className="knapsack-label">物品:</span>
              {knapsackWeights.map((w, i) => (
                <span 
                  key={i} 
                  className={`knapsack-item ${selectedItems.includes(i) ? 'selected' : ''}`}
                >
                  物品{i + 1}(重{w}, 值{knapsackValues[i]})
                </span>
              ))}
            </div>
            <div className="knapsack-capacity">背包容量: {knapsackCapacity}</div>
          </div>
          
          {dpTable.length > 0 && (
            <div className="dp-table-container">
              <div className="dp-table">
                <div className="dp-row dp-header">
                  <div className="dp-cell dp-corner">i\w</div>
                  {Array.from({ length: knapsackCapacity + 1 }, (_, j) => (
                    <div key={j} className="dp-cell">{j}</div>
                  ))}
                </div>
                {dpTable.map((row, i) => (
                  <div key={i} className="dp-row">
                    <div className="dp-cell dp-row-header">
                      {i === 0 ? '0' : `物品${i}`}
                    </div>
                    {row.map((cell, j) => (
                      <div 
                        key={j} 
                        className={`dp-cell ${selectedItems.includes(i - 1) && j === knapsackCapacity ? 'dp-selected' : ''}`}
                      >
                        {cell}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {currentAlgorithm === 'lcs' && (
        <div className="dp-container">
          <div className="lcs-info">
            <div className="lcs-string">
              <span className="lcs-label">字符串1:</span>
              <span className="lcs-value">{lcsStr1}</span>
            </div>
            <div className="lcs-string">
              <span className="lcs-label">字符串2:</span>
              <span className="lcs-value">{lcsStr2}</span>
            </div>
          </div>
          
          {lcsTable.length > 0 && (
            <div className="dp-table-container lcs-table-container">
              <div className="dp-table lcs-table">
                <div className="dp-row dp-header">
                  <div className="dp-cell dp-corner"></div>
                  <div className="dp-cell dp-corner"></div>
                  {lcsStr2.split('').map((c, j) => (
                    <div key={j} className="dp-cell dp-char">{c}</div>
                  ))}
                </div>
                <div className="dp-row">
                  <div className="dp-cell dp-corner"></div>
                  {Array.from({ length: lcsStr2.length + 1 }, (_, j) => (
                    <div key={j} className="dp-cell">{lcsTable[0][j]}</div>
                  ))}
                </div>
                {lcsTable.slice(1).map((row, i) => (
                  <div key={i} className="dp-row">
                    <div className="dp-cell dp-char">{lcsStr1[i]}</div>
                    {row.map((cell, j) => {
                      const isPath = lcsPath.some(([pi, pj]) => pi === i + 1 && pj === j);
                      return (
                        <div 
                          key={j} 
                          className={`dp-cell ${isPath ? 'dp-path' : ''}`}
                        >
                          {cell}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="algo-result">
          {result}
        </div>
      )}
    </div>
  );
};

interface DataPoint {
  x: number;
  y: number;
  label: number;
  predicted?: number;
}

interface NeuralNode {
  id: string;
  layer: number;
  value: number;
  bias: number;
}

interface NeuralConnection {
  from: string;
  to: string;
  weight: number;
}

// WebGL 3D Point component for K-Means and Perceptron
const Point3D = ({ position, color, size = 0.08 }: { position: [number, number, number]; color: string; size?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });
  
  return (
    <Sphere ref={meshRef} position={position} args={[size, 16, 16]}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
    </Sphere>
  );
};

// 3D Decision Plane for Perceptron
const DecisionPlane3D = ({ weights }: { weights: number[]; bias: number }) => {
  if (weights.length < 2) return null;
  
  const w0 = weights[0] || 0.5;
  const w1 = weights[1] || 0.5;
  
  return (
    <mesh rotation={[Math.PI / 2, 0, Math.atan2(w1, w0)]} position={[2, 1.5, 0]}>
      <planeGeometry args={[6, 0.02]} />
      <meshStandardMaterial color="#3b82f6" transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
  );
};

// 3D K-Means Visualization
const KMeans3DScene = ({ points, centroids, assignments }: { points: DataPoint[]; centroids: [number, number][]; assignments: number[] }) => {
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      {points.map((point, idx) => (
        <Point3D
          key={`point-${idx}`}
          position={[point.x, point.y, 0]}
          color={colors[assignments[idx] ?? point.label] || '#888888'}
          size={0.06}
        />
      ))}
      
      {centroids.map((centroid, idx) => (
        <group key={`centroid-${idx}`}>
          <Sphere position={[centroid[0], centroid[1], 0]} args={[0.15, 32, 32]}>
            <meshStandardMaterial 
              color={colors[idx]} 
              emissive={colors[idx]} 
              emissiveIntensity={0.5}
              wireframe={false}
            />
          </Sphere>
          <Billboard position={[centroid[0], centroid[1] + 0.3, 0]}>
            <Text fontSize={0.2} color="white" anchorX="center" anchorY="middle">
              {`C${idx + 1}`}
            </Text>
          </Billboard>
        </group>
      ))}
      
      <OrbitControls enablePan enableZoom enableRotate />
      <gridHelper args={[8, 8, '#333333', '#222222']} />
    </>
  );
};

// 3D Gradient Descent Visualization
const GradientDescent3DScene = ({ path, currentX }: { path: number[]; currentX: number }) => {
  const surfacePoints = useMemo(() => {
    const points: [number, number, number][] = [];
    for (let x = -3; x <= 3; x += 0.3) {
      for (let z = -3; z <= 3; z += 0.3) {
        points.push([x, x * x + z * z, z]);
      }
    }
    return points;
  }, []);
  
  const pathPoints = useMemo(() => {
    return path.map((x) => [x, x * x, 0] as [number, number, number]);
  }, [path]);
  
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      {/* Surface points */}
      {surfacePoints.map((point, idx) => (
        <Sphere key={`surface-${idx}`} position={point} args={[0.05, 8, 8]}>
          <meshStandardMaterial color="#3b82f6" transparent opacity={0.3} />
        </Sphere>
      ))}
      
      {/* Gradient path */}
      {pathPoints.length > 1 && (
        <Line points={pathPoints} color="#f59e0b" lineWidth={3} />
      )}
      
      {/* Current position */}
      <Sphere position={[currentX, currentX * currentX, 0]} args={[0.12, 32, 32]}>
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
      </Sphere>
      
      <OrbitControls enablePan enableZoom enableRotate />
    </>
  );
};

// 3D Neural Network Visualization
const NeuralNetwork3DScene = ({ nodes, connections, activations }: { nodes: NeuralNode[]; connections: NeuralConnection[]; activations: Map<string, number> }) => {
  const layerColors = ['#ef4444', '#3b82f6', '#10b981'];
  
  // Calculate node positions dynamically based on actual nodes
  const nodePositions = useMemo(() => {
    const positions = new Map<string, [number, number, number]>();
    
    // Group nodes by layer
    const layerGroups = new Map<number, NeuralNode[]>();
    nodes.forEach(node => {
      if (!layerGroups.has(node.layer)) {
        layerGroups.set(node.layer, []);
      }
      layerGroups.get(node.layer)!.push(node);
    });
    
    const layerCount = layerGroups.size;
    const layerSpacing = 3;
    const startX = -((layerCount - 1) * layerSpacing) / 2;
    
    layerGroups.forEach((layerNodes, layer) => {
      const nodeCount = layerNodes.length;
      const startY = -((nodeCount - 1) * 1.5) / 2;
      
      layerNodes.forEach((node, idx) => {
        const x = startX + layer * layerSpacing;
        const y = startY + idx * 1.5;
        positions.set(node.id, [x, y, 0]);
      });
    });
    
    return positions;
  }, [nodes]);
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      {/* Connections */}
      {connections.map((conn, idx) => {
        const fromPos = nodePositions.get(conn.from);
        const toPos = nodePositions.get(conn.to);
        if (!fromPos || !toPos) return null;
        
        // Color based on weight sign: positive = green, negative = red
        const weightColor = conn.weight > 0 ? '#10b981' : '#ef4444';
        const activation = activations.get(conn.to) || 0;
        
        return (
          <Line
            key={`conn-${idx}`}
            points={[fromPos, toPos]}
            color={weightColor}
            lineWidth={Math.abs(conn.weight) * 2 + 0.5}
            transparent
            opacity={0.3 + activation * 0.5}
          />
        );
      })}
      
      {/* Nodes */}
      {nodes.map((node) => {
        const pos = nodePositions.get(node.id);
        if (!pos) return null;
        
        const activation = activations.get(node.id) || 0;
        
        return (
          <group key={node.id}>
            <Sphere position={pos} args={[0.3, 32, 32]}>
              <meshStandardMaterial 
                color={layerColors[node.layer % layerColors.length]} 
                emissive={layerColors[node.layer % layerColors.length]}
                emissiveIntensity={0.2 + activation * 0.8}
              />
            </Sphere>
            <Billboard position={[pos[0], pos[1] + 0.5, pos[2]]}>
              <Text fontSize={0.2} color="white" anchorX="center">
                {activation.toFixed(2)}
              </Text>
            </Billboard>
          </group>
        );
      })}
      
      {/* Dynamic Layer labels */}
      {(() => {
        const layerGroups = new Map<number, NeuralNode[]>();
        nodes.forEach(node => {
          if (!layerGroups.has(node.layer)) {
            layerGroups.set(node.layer, []);
          }
          layerGroups.get(node.layer)!.push(node);
        });
        
        const layerCount = layerGroups.size;
        const layerSpacing = 3;
        const startX = -((layerCount - 1) * layerSpacing) / 2;
        const layerNames = ['输入层', '隐藏层', '输出层'];
        
        return Array.from(layerGroups.keys()).map((layer) => {
          const x = startX + layer * layerSpacing;
          return (
            <Billboard key={`label-${layer}`} position={[x, -3, 0]}>
              <Text fontSize={0.3} color="#888888" anchorX="center">
                {layerNames[layer] || `层 ${layer + 1}`}
              </Text>
            </Billboard>
          );
        });
      })()}
      
      <OrbitControls enablePan enableZoom enableRotate />
    </>
  );
};

const MLAlgorithmsVisualizer = ({ speed, onShowCode }: { speed: number; onShowCode: (id: string, name: string) => void }) => {
  const [currentAlgorithm, setCurrentAlgorithm] = useState<string>('perceptron');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string>('');
  const stopRef = useRef(false);

  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [weights, setWeights] = useState<number[]>([0.5, 0.5]);
  const [bias, setBias] = useState<number>(0);
  const [iteration, setIteration] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(0);

  const [kmeansPoints, setKmeansPoints] = useState<DataPoint[]>([]);
  const [centroids, setCentroids] = useState<[number, number][]>([]);
  const [clusterAssignments, setClusterAssignments] = useState<number[]>([]);

  const [gradientCurrentX, setGradientCurrentX] = useState<number>(3);
  const [gradientPath, setGradientPath] = useState<number[]>([]);
  const [learningRate] = useState<number>(0.1);

  const [nnNodes, setNnNodes] = useState<NeuralNode[]>([]);
  const [nnConnections, setNnConnections] = useState<NeuralConnection[]>([]);
  const [nnInput, setNnInput] = useState<number[]>([0.5, 0.5]);
  const [nnOutput, setNnOutput] = useState<number[]>([]);
  const [nnActivations, setNnActivations] = useState<Map<string, number>>(new Map());

  const delay = useCallback((ms: number) => new Promise(resolve => setTimeout(resolve, ms)), []);

  const generateLinearlySeparableData = useCallback(() => {
    const points: DataPoint[] = [];
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 4;
      const y = Math.random() * 4;
      const label = x + y > 4 ? 1 : -1;
      points.push({ x, y, label });
    }
    setDataPoints(points);
    setWeights([Math.random() - 0.5, Math.random() - 0.5]);
    setBias(0);
    setIteration(0);
    setAccuracy(0);
    setResult('');
  }, []);

  const generateKMeansData = useCallback(() => {
    const points: DataPoint[] = [];
    const clusterCenters: [number, number][] = [
      [1, 1], [3, 3], [1, 3]
    ];
    
    for (let i = 0; i < 30; i++) {
      const clusterIdx = i % 3;
      const center = clusterCenters[clusterIdx];
      const x = center[0] + (Math.random() - 0.5) * 1.5;
      const y = center[1] + (Math.random() - 0.5) * 1.5;
      points.push({ x, y, label: clusterIdx });
    }
    
    setKmeansPoints(points);
    setCentroids([[1, 1], [2, 2], [3, 3]]);
    setClusterAssignments([]);
    setResult('');
  }, []);

  const generateGradientData = useCallback(() => {
    setGradientCurrentX(3);
    setGradientPath([3]);
    setResult('');
  }, []);

  const initializeNeuralNetwork = useCallback(() => {
    const nodes: NeuralNode[] = [];
    const connections: NeuralConnection[] = [];
    
    const layers = [2, 3, 2];
    let nodeId = 0;
    
    for (let l = 0; l < layers.length; l++) {
      for (let n = 0; n < layers[l]; n++) {
        nodes.push({
          id: `n${nodeId}`,
          layer: l,
          value: 0,
          bias: Math.random() - 0.5
        });
        nodeId++;
      }
    }
    
    let inputIdx = 0;
    for (let l = 0; l < layers.length - 1; l++) {
      const layerStart = inputIdx;
      const nextLayerStart = inputIdx + layers[l];
      
      for (let i = 0; i < layers[l]; i++) {
        for (let j = 0; j < layers[l + 1]; j++) {
          connections.push({
            from: nodes[layerStart + i].id,
            to: nodes[nextLayerStart + j].id,
            weight: Math.random() - 0.5
          });
        }
      }
      inputIdx = nextLayerStart;
    }
    
    setNnNodes(nodes);
    setNnConnections(connections);
    setNnInput([0.5, 0.5]);
    setNnOutput([]);
    setNnActivations(new Map());
    setResult('');
  }, []);

  useEffect(() => {
    generateLinearlySeparableData();
    generateKMeansData();
    generateGradientData();
    initializeNeuralNetwork();
  }, [generateLinearlySeparableData, generateKMeansData, generateGradientData, initializeNeuralNetwork]);

  const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

  const perceptronAlgorithm = useCallback(async () => {
    stopRef.current = false;
    setIsRunning(true);
    let w = [...weights];
    let b = bias;
    let iter = 0;
    const maxIter = 100;
    
    while (iter < maxIter) {
      if (stopRef.current) break;
      
      let hasError = false;
      let correctCount = 0;
      
      for (const point of dataPoints) {
        const prediction = w[0] * point.x + w[1] * point.y + b >= 0 ? 1 : -1;
        
        if (prediction !== point.label) {
          hasError = true;
          w[0] += 0.1 * point.label * point.x;
          w[1] += 0.1 * point.label * point.y;
          b += 0.1 * point.label;
          
          setWeights([...w]);
          setBias(b);
          
          await delay(speed);
        } else {
          correctCount++;
        }
      }
      
      iter++;
      setIteration(iter);
      setAccuracy(correctCount / dataPoints.length);
      
      if (!hasError) break;
    }
    
    setResult(`训练完成！迭代次数: ${iter}, 准确率: ${(accuracy * 100).toFixed(1)}%`);
    setIsRunning(false);
  }, [dataPoints, weights, bias, speed, delay, accuracy]);

  const kMeansAlgorithm = useCallback(async () => {
    stopRef.current = false;
    setIsRunning(true);
    const k = 3;
    let cents = [...centroids];
    const maxIter = 20;
    
    for (let iter = 0; iter < maxIter; iter++) {
      if (stopRef.current) break;
      
      const assignments: number[] = kmeansPoints.map(point => {
        let minDist = Infinity;
        let cluster = 0;
        for (let i = 0; i < k; i++) {
          const dist = Math.sqrt(
            Math.pow(point.x - cents[i][0], 2) + 
            Math.pow(point.y - cents[i][1], 2)
          );
          if (dist < minDist) {
            minDist = dist;
            cluster = i;
          }
        }
        return cluster;
      });
      
      setClusterAssignments(assignments);
      await delay(speed);
      
      const newCentroids: [number, number][] = [];
      for (let i = 0; i < k; i++) {
        const clusterPoints = kmeansPoints.filter((_, idx) => assignments[idx] === i);
        if (clusterPoints.length > 0) {
          const avgX = clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length;
          const avgY = clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length;
          newCentroids.push([avgX, avgY]);
        } else {
          newCentroids.push(cents[i]);
        }
      }
      
      cents = newCentroids;
      setCentroids([...cents]);
      await delay(speed);
    }
    
    setResult(`聚类完成！发现 ${k} 个簇`);
    setIsRunning(false);
  }, [kmeansPoints, centroids, speed, delay]);

  const gradientDescentAlgorithm = useCallback(async () => {
    stopRef.current = false;
    setIsRunning(true);
    let x = gradientCurrentX;
    const path: number[] = [x];
    
    for (let i = 0; i < 50; i++) {
      if (stopRef.current) break;
      
      const gradient = 2 * x;
      x = x - learningRate * gradient;
      path.push(x);
      
      setGradientCurrentX(x);
      setGradientPath([...path]);
      
      await delay(speed);
      
      if (Math.abs(gradient) < 0.001) break;
    }
    
    setResult(`找到最小值: x = ${x.toFixed(4)}, f(x) = ${(x * x).toFixed(6)}`);
    setIsRunning(false);
  }, [gradientCurrentX, learningRate, speed, delay]);

  const neuralNetworkForward = useCallback(async () => {
    stopRef.current = false;
    setIsRunning(true);
    
    const activations = new Map<string, number>();
    const layers = [2, 3, 2];
    
    const inputNodes = nnNodes.filter(n => n.layer === 0);
    inputNodes.forEach((node, i) => {
      activations.set(node.id, nnInput[i]);
    });
    setNnActivations(new Map(activations));
    await delay(speed);
    
    for (let l = 1; l < layers.length; l++) {
      const layerNodes = nnNodes.filter(n => n.layer === l);
      const prevLayerNodes = nnNodes.filter(n => n.layer === l - 1);
      
      for (const node of layerNodes) {
        let sum = node.bias;
        for (const prevNode of prevLayerNodes) {
          const conn = nnConnections.find(
            c => c.from === prevNode.id && c.to === node.id
          );
          if (conn) {
            sum += (activations.get(prevNode.id) || 0) * conn.weight;
          }
        }
        activations.set(node.id, sigmoid(sum));
      }
      
      setNnActivations(new Map(activations));
      await delay(speed);
    }
    
    const outputNodes = nnNodes.filter(n => n.layer === layers.length - 1);
    const outputs = outputNodes.map(n => activations.get(n.id) || 0);
    setNnOutput(outputs);
    
    setResult(`前向传播完成！输出: [${outputs.map(o => o.toFixed(4)).join(', ')}]`);
    setIsRunning(false);
  }, [nnNodes, nnConnections, nnInput, speed, delay]);

  const runAlgorithm = useCallback(async () => {
    switch (currentAlgorithm) {
      case 'perceptron':
        await perceptronAlgorithm();
        break;
      case 'kmeans':
        await kMeansAlgorithm();
        break;
      case 'gradient':
        await gradientDescentAlgorithm();
        break;
      case 'neuralnet':
        await neuralNetworkForward();
        break;
    }
  }, [currentAlgorithm, perceptronAlgorithm, kMeansAlgorithm, gradientDescentAlgorithm, neuralNetworkForward]);

  const handleStop = useCallback(() => {
    stopRef.current = true;
    setIsRunning(false);
  }, []);

  const currentAlgo = ALGORITHMS.find(a => a.id === currentAlgorithm);

  const regenerateData = useCallback(() => {
    switch (currentAlgorithm) {
      case 'perceptron':
        generateLinearlySeparableData();
        break;
      case 'kmeans':
        generateKMeansData();
        break;
      case 'gradient':
        generateGradientData();
        break;
      case 'neuralnet':
        initializeNeuralNetwork();
        break;
    }
  }, [currentAlgorithm, generateLinearlySeparableData, generateKMeansData, generateGradientData, initializeNeuralNetwork]);

  return (
    <div className="algo-section">
      <div className="algo-controls">
        <div className="algo-select-wrapper">
          <select
            value={currentAlgorithm}
            onChange={(e) => {
              setCurrentAlgorithm(e.target.value);
              setResult('');
            }}
            disabled={isRunning}
            className="algo-select"
          >
            {ALGORITHMS.filter(a => a.category === 'ml').map(algo => (
              <option key={algo.id} value={algo.id}>{algo.name}</option>
            ))}
          </select>
        </div>
        
        <div className="algo-buttons">
          <button 
            onClick={() => onShowCode(currentAlgorithm, currentAlgo?.name || '')} 
            className="algo-btn" 
            title="查看代码"
          >
            <Code size={18} />
          </button>
          <button onClick={regenerateData} disabled={isRunning} className="algo-btn" title="重新生成数据">
            <Shuffle size={18} />
          </button>
          {!isRunning ? (
            <button onClick={runAlgorithm} className="algo-btn primary" title="开始">
              <Play size={18} />
            </button>
          ) : (
            <button onClick={handleStop} className="algo-btn danger" title="停止">
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </div>

      {currentAlgo && (
        <div className="algo-info">
          <div className="algo-info-item">
            <span className="algo-info-label">时间复杂度</span>
            <span className="algo-info-value">{currentAlgo.timeComplexity}</span>
          </div>
          <div className="algo-info-item">
            <span className="algo-info-label">空间复杂度</span>
            <span className="algo-info-value">{currentAlgo.spaceComplexity}</span>
          </div>
        </div>
      )}

      {currentAlgorithm === 'perceptron' && (
        <div className="ml-container">
          <div className="ml-canvas-3d">
            <Canvas camera={{ position: [2, 2, 5], fov: 50 }}>
              <Suspense fallback={null}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                
                {dataPoints.map((point, idx) => (
                  <Point3D
                    key={`perceptron-point-${idx}`}
                    position={[point.x, point.y, 0]}
                    color={point.label === 1 ? '#10b981' : '#ef4444'}
                    size={0.08}
                  />
                ))}
                
                <DecisionPlane3D weights={weights} bias={bias} />
                <gridHelper args={[8, 8, '#333333', '#222222']} />
                <OrbitControls enablePan enableZoom enableRotate />
              </Suspense>
            </Canvas>
          </div>
          <div className="ml-stats">
            <div className="ml-stat-item">
              <span className="ml-stat-label">迭代次数</span>
              <span className="ml-stat-value">{iteration}</span>
            </div>
            <div className="ml-stat-item">
              <span className="ml-stat-label">准确率</span>
              <span className="ml-stat-value">{(accuracy * 100).toFixed(1)}%</span>
            </div>
            <div className="ml-stat-item">
              <span className="ml-stat-label">权重</span>
              <span className="ml-stat-value">[{weights.map(w => w.toFixed(2)).join(', ')}]</span>
            </div>
          </div>
          <div className="ml-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#10b981' }} />
              <span>正类 (+1)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#ef4444' }} />
              <span>负类 (-1)</span>
            </div>
          </div>
        </div>
      )}

      {currentAlgorithm === 'kmeans' && (
        <div className="ml-container">
          <div className="ml-canvas-3d">
            <Canvas camera={{ position: [2, 2, 6], fov: 50 }}>
              <Suspense fallback={null}>
                <KMeans3DScene 
                  points={kmeansPoints} 
                  centroids={centroids} 
                  assignments={clusterAssignments} 
                />
              </Suspense>
            </Canvas>
          </div>
          <div className="ml-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#ef4444' }} />
              <span>簇 1</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#3b82f6' }} />
              <span>簇 2</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#10b981' }} />
              <span>簇 3</span>
            </div>
          </div>
        </div>
      )}

      {currentAlgorithm === 'gradient' && (
        <div className="ml-container">
          <div className="ml-canvas-3d">
            <Canvas camera={{ position: [0, 8, 8], fov: 50 }}>
              <Suspense fallback={null}>
                <GradientDescent3DScene path={gradientPath} currentX={gradientCurrentX} />
              </Suspense>
            </Canvas>
          </div>
          <div className="ml-stats">
            <div className="ml-stat-item">
              <span className="ml-stat-label">当前 x</span>
              <span className="ml-stat-value">{gradientCurrentX.toFixed(4)}</span>
            </div>
            <div className="ml-stat-item">
              <span className="ml-stat-label">f(x)</span>
              <span className="ml-stat-value">{(gradientCurrentX * gradientCurrentX).toFixed(6)}</span>
            </div>
            <div className="ml-stat-item">
              <span className="ml-stat-label">学习率</span>
              <span className="ml-stat-value">{learningRate}</span>
            </div>
          </div>
        </div>
      )}

      {currentAlgorithm === 'neuralnet' && (
        <div className="ml-container">
          <div className="ml-canvas-3d">
            <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
              <Suspense fallback={null}>
                <NeuralNetwork3DScene 
                  nodes={nnNodes} 
                  connections={nnConnections} 
                  activations={nnActivations} 
                />
              </Suspense>
            </Canvas>
          </div>
          <div className="ml-stats">
            <div className="ml-stat-item">
              <span className="ml-stat-label">输入</span>
              <span className="ml-stat-value">[{nnInput.map(v => v.toFixed(2)).join(', ')}]</span>
            </div>
            <div className="ml-stat-item">
              <span className="ml-stat-label">输出</span>
              <span className="ml-stat-value">[{nnOutput.map(v => v.toFixed(4)).join(', ')}]</span>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="algo-result">
          {result}
        </div>
      )}
    </div>
  );
};

const AlgoVisualizerPage = () => {
  const [activeCategory, setActiveCategory] = useState<AlgorithmCategory>('sorting');
  const [speed, setSpeed] = useState(50);
  const [codeModal, setCodeModal] = useState<{ id: string; name: string } | null>(null);

  const handleShowCode = useCallback((id: string, name: string) => {
    setCodeModal({ id, name });
  }, []);

  const handleCloseCode = useCallback(() => {
    setCodeModal(null);
  }, []);

  const categories = [
    { id: 'sorting' as const, name: '排序算法', icon: Layers, description: '可视化排序过程' },
    { id: 'pathfinding' as const, name: '寻路算法', icon: GitBranch, description: '图搜索与最短路径' },
    { id: 'datastructure' as const, name: '数据结构', icon: Binary, description: '交互式数据结构' },
    { id: 'advanced' as const, name: '高级算法', icon: Network, description: '图算法与动态规划' },
    { id: 'ml' as const, name: '机器学习', icon: Brain, description: '神经网络与优化算法' },
  ];

  return (
    <div className="algo-page">
      <div className="algo-header">
        <h1 className="algo-title">
          <span className="algo-title-icon">⚡</span>
          算法可视化
        </h1>
        <p className="algo-subtitle">
          交互式算法演示，直观理解排序、寻路、数据结构、高级算法与机器学习
        </p>
      </div>

      <div className="algo-categories">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`algo-category-btn ${activeCategory === cat.id ? 'active' : ''}`}
          >
            <cat.icon size={20} />
            <span className="category-name">{cat.name}</span>
            <span className="category-desc">{cat.description}</span>
          </button>
        ))}
      </div>

      <div className="algo-speed-control">
        <label>速度</label>
        <input
          type="range"
          min="10"
          max="310"
          value={310 - speed}
          onChange={(e) => setSpeed(310 - parseInt(e.target.value))}
          className="speed-slider"
        />
        <span className="speed-value">{Math.round((310 - speed) / 200 * 100)}%</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeCategory === 'sorting' && <SortingVisualizer speed={speed} onShowCode={handleShowCode} />}
          {activeCategory === 'pathfinding' && <PathfindingVisualizer speed={speed} onShowCode={handleShowCode} />}
          {activeCategory === 'datastructure' && <DataStructureVisualizer onShowCode={handleShowCode} />}
          {activeCategory === 'advanced' && <AdvancedAlgorithmsVisualizer speed={speed} onShowCode={handleShowCode} />}
          {activeCategory === 'ml' && <MLAlgorithmsVisualizer speed={speed} onShowCode={handleShowCode} />}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {codeModal && (
          <CodeModal
            algorithmId={codeModal.id}
            algorithmName={codeModal.name}
            onClose={handleCloseCode}
          />
        )}
      </AnimatePresence>

      <Footer data={{
        copyright: '© 2024 SAKURAIN. All rights reserved.',
        slogan: '专注博弈论算法工程化与大规模数据分析',
        links: [
          { label: 'GitHub', href: 'https://github.com/sakurain' },
          { label: 'Email', href: 'mailto:contact@sakurain.net' },
        ],
      }} />
    </div>
  );
};

interface CodeModalProps {
  algorithmId: string;
  algorithmName: string;
  onClose: () => void;
}

const CodeModal: React.FC<CodeModalProps> = ({ algorithmId, algorithmName, onClose }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python');
  const [copied, setCopied] = useState(false);
  
  const algorithmCode = ALGORITHM_CODES.find(code => code.id === algorithmId);
  
  const handleCopy = useCallback(() => {
    if (algorithmCode?.languages[selectedLanguage]) {
      navigator.clipboard.writeText(algorithmCode.languages[selectedLanguage]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [algorithmCode, selectedLanguage]);
  
  if (!algorithmCode) {
    return null;
  }
  
  return (
    <motion.div
      className="code-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="code-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="code-modal-header">
          <h3 className="code-modal-title">
            <Code size={20} />
            {algorithmName} - 算法实现
          </h3>
          <button onClick={onClose} className="code-modal-close">
            <X size={20} />
          </button>
        </div>
        
        <div className="code-modal-languages">
          {Object.keys(algorithmCode.languages).map(lang => (
            <button
              key={lang}
              className={`code-lang-btn ${selectedLanguage === lang ? 'active' : ''}`}
              onClick={() => setSelectedLanguage(lang)}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
        
        <div className="code-modal-content">
          <div className="code-copy-btn" onClick={handleCopy}>
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </div>
          <SyntaxHighlighter
            language={LANGUAGE_PRISM_NAMES[selectedLanguage]}
            style={oneDark}
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            }}
            showLineNumbers
          >
            {algorithmCode.languages[selectedLanguage]}
          </SyntaxHighlighter>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AlgoVisualizerPage;
