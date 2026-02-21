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
  Zap, Binary, GitBranch, Network, Grid3X3, Brain, FileCode, BarChart3
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
  ControlPanel,
  Legend,
  CodeTemplateModal,
  ComplexityChartModal
} from './components';

// 导入类型
import type { 
  AlgorithmDefinition, 
  AlgorithmCategory, 
  SortingData, 
  GraphData, 
  GraphState,
  AlgorithmStep
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
          sortingState: { comparing: [j, j + 1], swapping: [], sorted: [...sorted] }
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
            sortingState: { comparing: [], swapping: [j, j + 1], sorted: [...sorted] }
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
      sortingState: { comparing: [], swapping: [], sorted: [...sorted] }
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
        sortingState: { comparing: [i], swapping: [], sorted: [...sorted] }
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
          sortingState: { comparing: [minIdx, j], swapping: [], sorted: [...sorted] }
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
            sortingState: { comparing: [minIdx], swapping: [], sorted: [...sorted] }
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
          sortingState: { comparing: [], swapping: [i, minIdx], sorted: [...sorted] }
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
          sortingState: { comparing: [], swapping: [], sorted: [...sorted] }
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
      sortingState: { comparing: [], swapping: [], sorted: [...sorted] }
    });
    
    runner.setCompleted();
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
    }
  };
  
  // 重新开始（生成新数据后播放）
  const handleRestart = async () => {
    if (runner.isRunning) return;
    
    // 清除步骤和状态
    runner.clearSteps();
    shouldStopRef.current = false;
    initialArrayRef.current = []; // 清空初始数组引用
    
    // 直接生成新数据（不使用 generateData 回调以避免异步问题）
    if (currentAlgo.category === 'sorting') {
      const data = generateSortingData({ 
        size: arraySize, 
        pattern: 'random',
        minValue: 10,
        maxValue: 99
      });
      setSortingData(data);
    }
    
    // 等待数据更新
    await new Promise(r => setTimeout(r, 50));
    
    // 开始排序
    if (currentAlgo.id === 'bubble') {
      await runBubbleSort();
    } else if (currentAlgo.id === 'selection') {
      await runSelectionSort();
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
            <div className="array-size-control">
              <label>数组大小: {arraySize}</label>
              <input
                type="range"
                min="5"
                max="50"
                value={arraySize}
                onChange={(e) => handleArraySizeChange(parseInt(e.target.value))}
                disabled={runner.isRunning}
              />
              <span className="size-hint">(5-50)</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 右侧控制面板 */}
      <div className="playground-controls">
        <ControlPanel
          algorithms={categoryAlgorithms}
          currentAlgorithm={currentAlgo}
          onAlgorithmChange={onAlgorithmChange}
          isRunning={runner.isRunning}
          isPaused={runner.isPaused}
          isCompleted={runner.isCompleted}
          isReviewMode={runner.isReviewMode}
          canStepForward={runner.canStepForward}
          canStepBackward={runner.canStepBackward}
          onStart={handleStart}
          onPause={runner.pause}
          onResume={runner.resume}
          onStop={handleStop}
          onStepForward={handleStepForward}
          onStepBackward={handleStepBackward}
          onGenerateData={generateData}
          onRestart={handleRestart}
          speed={runner.speed}
          onSpeedChange={runner.setSpeed}
          currentStep={runner.state.currentStep}
          totalSteps={runner.state.totalSteps}
          message={runner.state.message}
        />
        
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
