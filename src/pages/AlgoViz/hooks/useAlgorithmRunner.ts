/**
 * 算法执行器 Hook
 * 提供播放、暂停、单步、调速等功能
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ExecutionState, AlgorithmStep } from '../types';

interface UseAlgorithmRunnerOptions {
  initialSpeed?: number;
}

export function useAlgorithmRunner(options: UseAlgorithmRunnerOptions = {}) {
  const { initialSpeed = 300 } = options;

  const [state, setState] = useState<ExecutionState>({
    isRunning: false,
    isPaused: false,
    isCompleted: false,
    currentStep: 0,
    totalSteps: 0,
    currentLine: 0,
    message: '',
    variables: []
  });

  // 速度范围: 10ms - 1000ms (越小越快)
  const [speed, setSpeedState] = useState<number>(initialSpeed);
  const [steps, setSteps] = useState<AlgorithmStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  
  // 复盘模式
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef<boolean>(false);
  const resumeRef = useRef<(() => void) | null>(null);

  // 同步暂停状态到 ref
  useEffect(() => {
    pausedRef.current = state.isPaused;
  }, [state.isPaused]);

  // 设置速度 (10ms - 1000ms)
  const setSpeed = useCallback((newSpeed: number) => {
    setSpeedState(Math.max(10, Math.min(1000, newSpeed)));
  }, []);

  // 等待函数 - 支持暂停
  const wait = useCallback(async (ms: number): Promise<boolean> => {
    return new Promise((resolve) => {
      // 检查是否已经暂停
      if (pausedRef.current) {
        // 保存 resolve 函数，等恢复时调用
        resumeRef.current = () => {
          setTimeout(() => resolve(true), ms);
        };
        return;
      }
      
      setTimeout(() => resolve(true), ms);
    });
  }, []);

  // 开始执行
  const start = useCallback(() => {
    setIsReviewMode(false);
    setState(s => ({
      ...s,
      isRunning: true,
      isPaused: false,
      isCompleted: false,
      message: '正在执行...'
    }));
    pausedRef.current = false;
  }, []);

  // 暂停
  const pause = useCallback(() => {
    setState(s => ({
      ...s,
      isPaused: true,
      message: '已暂停 - 点击"继续"继续执行'
    }));
    pausedRef.current = true;
  }, []);

  // 继续
  const resume = useCallback(() => {
    setState(s => ({
      ...s,
      isPaused: false,
      message: '正在执行...'
    }));
    pausedRef.current = false;
    
    // 如果有等待的 resume，调用它
    if (resumeRef.current) {
      resumeRef.current();
      resumeRef.current = null;
    }
  }, []);

  // 停止
  const stop = useCallback(() => {
    setState({
      isRunning: false,
      isPaused: false,
      isCompleted: false,
      currentStep: 0,
      totalSteps: 0,
      currentLine: 0,
      message: '已停止',
      variables: []
    });
    setCurrentStepIndex(-1);
    setSteps([]);
    setIsReviewMode(false);
    pausedRef.current = false;
    resumeRef.current = null;
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 设置完成
  const setCompleted = useCallback(() => {
    setState(s => ({
      ...s,
      isRunning: false,
      isPaused: false,
      isCompleted: true,
      message: '执行完成！可以点击"单步前进/后退"复盘'
    }));
    pausedRef.current = false;
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 记录步骤
  const recordStep = useCallback((step: Omit<AlgorithmStep, 'id'>) => {
    setSteps(prev => {
      const newStep: AlgorithmStep = { ...step, id: prev.length };
      const newSteps = [...prev, newStep];
      setState(s => ({
        ...s,
        totalSteps: newSteps.length,
        currentLine: step.lineNumber,
        currentStep: newSteps.length,
        message: step.description
      }));
      return newSteps;
    });
  }, []);

  // 清除步骤
  const clearSteps = useCallback(() => {
    setSteps([]);
    setCurrentStepIndex(-1);
    setState(s => ({
      ...s,
      totalSteps: 0,
      currentStep: 0,
      currentLine: 0,
      variables: []
    }));
  }, []);

  // 进入复盘模式
  const enterReviewMode = useCallback(() => {
    if (steps.length === 0) return;
    setIsReviewMode(true);
    setState(s => ({
      ...s,
      isRunning: false,
      isPaused: false,
      message: '复盘模式 - 使用单步按钮逐帧查看'
    }));
  }, [steps.length]);

  // 检查是否可以前进/后退
  const canStepForward = currentStepIndex < steps.length - 1;
  const canStepBackward = currentStepIndex > 0;

  // 前进一步
  const stepForward = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      const newIndex = currentStepIndex + 1;
      setCurrentStepIndex(newIndex);
      const step = steps[newIndex];
      setState(s => ({
        ...s,
        currentStep: newIndex + 1,
        currentLine: step.lineNumber,
        message: step.description,
        variables: step.variables
      }));
      return step;
    }
    return null;
  }, [currentStepIndex, steps]);

  // 后退一步
  const stepBackward = useCallback(() => {
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1;
      setCurrentStepIndex(newIndex);
      const step = steps[newIndex];
      setState(s => ({
        ...s,
        currentStep: newIndex + 1,
        currentLine: step.lineNumber,
        message: step.description,
        variables: step.variables
      }));
      return step;
    }
    return null;
  }, [currentStepIndex, steps]);

  // 跳转到指定步骤
  const jumpToStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
      const step = steps[index];
      setState(s => ({
        ...s,
        currentStep: index + 1,
        currentLine: step.lineNumber,
        message: step.description,
        variables: step.variables
      }));
      return step;
    }
    return null;
  }, [steps]);

  return {
    state,
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    isCompleted: state.isCompleted,
    isReviewMode,
    speed,
    steps,
    currentStep: steps[currentStepIndex] || null,
    currentStepIndex,
    totalSteps: steps.length,
    canStepForward,
    canStepBackward,
    start,
    pause,
    resume,
    stop,
    setSpeed,
    setCompleted,
    recordStep,
    clearSteps,
    stepForward,
    stepBackward,
    jumpToStep,
    enterReviewMode,
    wait
  };
}
