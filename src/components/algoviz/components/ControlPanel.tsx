/**
 * Algorithm visualization platform - control panel component.
 * Includes playback controls, speed adjustment and algorithm selection.
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
import { useTranslation } from '@/hooks';
import type { AlgorithmDefinition } from '../types';

interface ControlPanelProps {
  // Algorithm selection
  algorithms: AlgorithmDefinition[];
  currentAlgorithm: AlgorithmDefinition;
  onAlgorithmChange: (algo: AlgorithmDefinition) => void;

  // Playback control
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

  // Speed control
  speed: number;
  onSpeedChange: (speed: number) => void;

  // Status info
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
  const { t, tReplace } = useTranslation();
  // Speed conversion: larger slider value means faster playback (smaller delay).
  // Slider range 1-100 maps to delay 1000ms-10ms.
  // Fix: right side (large value) = faster (small delay).
  const speedSliderValue = Math.round((1010 - speed) / 10);

  const handleSpeedChange = (value: number) => {
    // value: 1-100, larger is faster.
    // Convert to delay: 1000ms - 10ms.
    // Fix: value=100 (far right) → delay=10ms (fastest), value=1 (far left) → delay=1000ms (slowest).
    const delay = 1010 - value * 10;
    onSpeedChange(delay);
  };

  return (
    <div className="control-panel">
      {/* Algorithm selection */}
      <div className="panel-section">
        <h3 className="section-title">
          <BookOpen size={16} />
          {t.algoViz.toolbar.chooseAlgorithm}
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
              {tReplace(t.algoViz.toolbar.timeComplexity, { complexity: currentAlgorithm.timeComplexity || t.common.unknown })}
            </span>
            <span className="complexity-badge secondary">
              {tReplace(t.algoViz.toolbar.spaceComplexity, { complexity: currentAlgorithm.spaceComplexity || t.common.unknown })}
            </span>
          </div>
        </div>
      </div>

      {/* Playback control */}
      <div className="panel-section">
        <h3 className="section-title">
          <Settings2 size={16} />
          {t.algoViz.toolbar.playbackControl}
        </h3>

        <div className="control-buttons">
          {/* Primary playback buttons */}
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
                  <span>{t.algoViz.toolbar.restart}</span>
                </motion.button>
              ) : (
                <motion.button
                  className="control-btn primary large"
                  onClick={onStart}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Play size={20} />
                  <span>{t.algoViz.toolbar.start}</span>
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
                  <span>{t.algoViz.toolbar.resume}</span>
                </motion.button>
              ) : (
                <motion.button
                  className="control-btn"
                  onClick={onPause}
                  whileTap={{ scale: 0.95 }}
                >
                  <Pause size={18} />
                  <span>{t.algoViz.toolbar.pause}</span>
                </motion.button>
              )}

              <motion.button
                className="control-btn danger"
                onClick={onStop}
                whileTap={{ scale: 0.95 }}
              >
                <RotateCcw size={18} />
                <span>{t.algoViz.toolbar.stop}</span>
              </motion.button>
            </>
          )}
        </div>

        {/* Step controls - visible during playback */}
        <div className={`step-controls ${isReviewMode ? 'review-mode' : ''}`}>
          <button
            className="step-btn"
            onClick={onStepBackward}
            disabled={!canStepBackward || isRunning}
            title={t.algoViz.toolbar.stepBackwardTitle}
          >
            <SkipBack size={16} />
          </button>

          <span className="step-info">
            {tReplace(t.algoViz.toolbar.stepInfo, { current: currentStep, total: totalSteps || '-' })}
          </span>

          <button
            className="step-btn"
            onClick={onStepForward}
            disabled={!canStepForward || isRunning}
            title={isCompleted ? t.algoViz.toolbar.reviewModeHint : t.algoViz.toolbar.stepForwardTitle}
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Review mode hint */}
        {isCompleted && !isRunning && (
          <div className="review-hint">
            <History size={14} />
            <span>{t.algoViz.toolbar.reviewModeHint}</span>
          </div>
        )}

        {/* Generate new data button */}
        <motion.button
          className="control-btn secondary"
          onClick={onGenerateData}
          disabled={isRunning}
          whileHover={{ scale: isRunning ? 1 : 1.02 }}
          whileTap={{ scale: isRunning ? 1 : 0.98 }}
        >
          <Shuffle size={18} />
          <span>{t.algoViz.toolbar.generateData}</span>
        </motion.button>
      </div>

      {/* Speed control */}
      <div className="panel-section">
        <h3 className="section-title">{t.algoViz.toolbar.animationSpeed}</h3>

        <div className="speed-control">
          <span className="speed-label">{t.algoViz.toolbar.slow}</span>
          <input
            type="range"
            min="1"
            max="100"
            value={speedSliderValue}
            onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
            disabled={isRunning}
            style={{ '--value': `${speedSliderValue}%` } as React.CSSProperties}
          />
          <span className="speed-label">{t.algoViz.toolbar.fast}</span>
        </div>

        <div className="speed-value">
          {tReplace(t.algoViz.toolbar.delay, { delay: String(speed) })}
          <span className="speed-hint">{tReplace(t.algoViz.toolbar.stepsPerSecond, { count: String(Math.round(1000 / speed)) })}</span>
        </div>
      </div>

      {/* Status info */}
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
