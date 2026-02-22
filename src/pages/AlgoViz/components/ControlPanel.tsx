/**
 * 算法可视化平台 - 控制面板组件
 * 包含播放控制、速度调节、算法选择等
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Shuffle,
  Settings2,
  ChevronRight,
  BookOpen,
  History
} from 'lucide-react';
import type { AlgorithmDefinition } from '../types';

interface ControlPanelProps {
  // 算法选择
  algorithms: AlgorithmDefinition[];
  currentAlgorithm: AlgorithmDefinition;
  onAlgorithmChange: (algo: AlgorithmDefinition) => void;
  
  // 播放控制
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  isReviewMode?: boolean;
  canStepForward: boolean;
  canStepBackward: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onGenerateData: () => void;
  onRestart?: () => void;
  
  // 速度控制
  speed: number;
  onSpeedChange: (speed: number) => void;
  
  // 状态信息
  currentStep: number;
  totalSteps: number;
  message: string;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  algorithms,
  currentAlgorithm,
  onAlgorithmChange,
  isRunning,
  isPaused,
  isCompleted,
  isReviewMode,
  canStepForward,
  canStepBackward,
  onStart,
  onPause,
  onResume,
  onStop,
  onStepForward,
  onStepBackward,
  onGenerateData,
  speed,
  onSpeedChange,
  currentStep,
  totalSteps,
  message
}) => {
  // 速度转换：滑块值越大越快（延迟越小）
  // 滑块范围 1-100，对应延迟 1000ms-10ms
  // 修正：往右（值大）= 更快（延迟小）
  const speedSliderValue = Math.round((1010 - speed) / 10);
  
  const handleSpeedChange = (value: number) => {
    // value: 1-100, 越大越快
    // 转换为 delay: 1000ms - 10ms
    // 修正：value=100（最右）→ delay=10ms（最快），value=1（最左）→ delay=1000ms（最慢）
    const delay = 1010 - value * 10;
    onSpeedChange(delay);
  };

  return (
    <div className="control-panel">
      {/* 算法选择 */}
      <div className="panel-section">
        <h3 className="section-title">
          <BookOpen size={16} />
          选择算法
        </h3>
        
        <select
          className="algo-select"
          value={currentAlgorithm.id}
          onChange={(e) => {
            const algo = algorithms.find(a => a.id === e.target.value);
            if (algo) onAlgorithmChange(algo);
          }}
          disabled={isRunning}
        >
          {algorithms.map(algo => (
            <option key={algo.id} value={algo.id}>
              {algo.name}
            </option>
          ))}
        </select>
        
        <div className="algo-info">
          <p className="algo-description">{currentAlgorithm.description}</p>
          <div className="algo-complexity">
            <span className="complexity-badge">
              时间: {currentAlgorithm.timeComplexity}
            </span>
            <span className="complexity-badge secondary">
              空间: {currentAlgorithm.spaceComplexity}
            </span>
          </div>
        </div>
      </div>

      {/* 播放控制 */}
      <div className="panel-section">
        <h3 className="section-title">
          <Settings2 size={16} />
          播放控制
        </h3>
        
        <div className="control-buttons">
          {/* 主要播放按钮 */}
          {!isRunning ? (
            <>
              {isCompleted ? (
                <motion.button
                  className="control-btn primary large"
                  onClick={onStart}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Play size={20} />
                  <span>重新播放</span>
                </motion.button>
              ) : (
                <motion.button
                  className="control-btn primary large"
                  onClick={onStart}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Play size={20} />
                  <span>开始</span>
                </motion.button>
              )}
            </>
          ) : (
            <>
              {isPaused ? (
                <motion.button
                  className="control-btn primary"
                  onClick={onResume}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play size={18} />
                  <span>继续</span>
                </motion.button>
              ) : (
                <motion.button
                  className="control-btn"
                  onClick={onPause}
                  whileTap={{ scale: 0.95 }}
                >
                  <Pause size={18} />
                  <span>暂停</span>
                </motion.button>
              )}
              
              <motion.button
                className="control-btn danger"
                onClick={onStop}
                whileTap={{ scale: 0.95 }}
              >
                <RotateCcw size={18} />
                <span>停止</span>
              </motion.button>
            </>
          )}
        </div>
        
        {/* 单步控制 - 播放时也可以看到步骤 */}
        <div className={`step-controls ${isReviewMode ? 'review-mode' : ''}`}>
          <button
            className="step-btn"
            onClick={onStepBackward}
            disabled={!canStepBackward || isRunning}
            title="后退一步"
          >
            <SkipBack size={16} />
          </button>
          
          <span className="step-info">
            步骤 {currentStep} / {totalSteps || '-'}
          </span>
          
          <button
            className="step-btn"
            onClick={onStepForward}
            disabled={!canStepForward || isRunning}
            title={isCompleted ? '进入复盘模式' : '前进一步'}
          >
            <SkipForward size={16} />
          </button>
        </div>
        
        {/* 复盘提示 */}
        {isCompleted && !isRunning && (
          <div className="review-hint">
            <History size={14} />
            <span>点击"单步前进"开始复盘</span>
          </div>
        )}
        
        {/* 生成新数据按钮 */}
        <motion.button
          className="control-btn secondary"
          onClick={onGenerateData}
          disabled={isRunning}
          whileHover={{ scale: isRunning ? 1 : 1.02 }}
          whileTap={{ scale: isRunning ? 1 : 0.98 }}
        >
          <Shuffle size={18} />
          <span>生成新数据（手动开始）</span>
        </motion.button>
      </div>

      {/* 速度控制 */}
      <div className="panel-section">
        <h3 className="section-title">动画速度</h3>
        
        <div className="speed-control">
          <span className="speed-label">慢</span>
          <input
            type="range"
            min="1"
            max="100"
            value={speedSliderValue}
            onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
            disabled={isRunning}
            style={{ '--value': `${speedSliderValue}%` } as React.CSSProperties}
          />
          <span className="speed-label">快</span>
        </div>
        
        <div className="speed-value">
          延迟: <strong>{speed}ms</strong> / 步
          <span className="speed-hint">（{Math.round(1000 / speed)} 步/秒）</span>
        </div>
      </div>

      {/* 状态信息 */}
      {message && (
        <div className="panel-section status-section">
          <div className="status-message">
            <ChevronRight size={16} className="status-icon" />
            <span>{message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
