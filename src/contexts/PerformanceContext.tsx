import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getDeviceCapability,
  subscribeToCapabilityChanges,
  type DeviceCapability,
} from '@/lib/device-capability';

type PerformanceMode = 'auto' | 'high' | 'medium' | 'low';

interface PerformanceContextType {
  /** 当前性能模式 */
  mode: PerformanceMode;
  /** 设备能力信息 */
  deviceCapability: DeviceCapability;
  /** 实际生效的质量级别 */
  effectiveQuality: 'high' | 'medium' | 'low';
  /** 是否启用重度特效 */
  enableHeavyEffects: boolean;
  /** 是否启用 WebGL */
  enableWebGL: boolean;
  /** 是否启用鼠标特效 */
  enableMouseEffects: boolean;
  /** 是否启用粒子效果 */
  enableParticles: boolean;
  /** 是否启用背景动画 */
  enableBackgroundAnimations: boolean;
  /** 推荐的动画帧率 */
  targetFrameRate: number;
  /** 推荐的 Canvas DPR */
  canvasDPR: number;
  /** 设置性能模式 */
  setMode: (mode: PerformanceMode) => void;
  /** 获取推荐的粒子数量 */
  getParticleCount: (baseCount: number) => number;
  /** 强制降低性能 (如检测到卡顿) */
  forceLowerQuality: () => void;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

// 本地存储键名
const STORAGE_KEY = 'sakurain-performance-mode';

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  // 从本地存储读取用户设置
  const [mode, setModeState] = useState<PerformanceMode>(() => {
    if (typeof window === 'undefined') return 'auto';
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as PerformanceMode) || 'auto';
  });

  const [deviceCapability, setDeviceCapability] = useState<DeviceCapability>(getDeviceCapability);

  // 计算实际生效的质量级别
  const effectiveQuality = useMemo(() => {
    if (mode !== 'auto') return mode;
    return deviceCapability.recommendedQuality;
  }, [mode, deviceCapability]);

  // 计算各功能的启用状态
  const features = useMemo(() => {
    const quality = effectiveQuality;
    return {
      enableHeavyEffects: quality === 'high',
      enableWebGL: quality !== 'low' && deviceCapability.supportsWebGL,
      enableMouseEffects: quality !== 'low',
      enableParticles: quality !== 'low',
      enableBackgroundAnimations: true, // 背景动画始终启用，但强度根据质量调整
      targetFrameRate: quality === 'low' ? 30 : quality === 'medium' ? 45 : 60,
      canvasDPR: quality === 'low' ? 1 : quality === 'medium' ? 1.5 : Math.min(deviceCapability.devicePixelRatio, 2),
    };
  }, [effectiveQuality, deviceCapability]);

  // 设置模式时保存到本地存储
  const setMode = useCallback((newMode: PerformanceMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newMode);
    }
  }, []);

  // 获取推荐的粒子数量
  const getParticleCount = useCallback((baseCount: number) => {
    switch (effectiveQuality) {
      case 'low':
        return Math.floor(baseCount * 0.15);
      case 'medium':
        return Math.floor(baseCount * 0.4);
      case 'high':
      default:
        return baseCount;
    }
  }, [effectiveQuality]);

  // 强制降低性能 (检测到卡顿时调用)
  const forceLowerQuality = useCallback(() => {
    if (effectiveQuality === 'high') {
      setMode('medium');
    } else if (effectiveQuality === 'medium') {
      setMode('low');
    }
  }, [effectiveQuality, setMode]);

  // 监听设备能力变化
  useEffect(() => {
    if (mode === 'auto') {
      return subscribeToCapabilityChanges(setDeviceCapability);
    }
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      deviceCapability,
      effectiveQuality,
      ...features,
      setMode,
      getParticleCount,
      forceLowerQuality,
    }),
    [mode, deviceCapability, effectiveQuality, features, setMode, getParticleCount, forceLowerQuality]
  );

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

// 便捷钩子
export function useIsLowPower() {
  const { effectiveQuality } = usePerformance();
  return effectiveQuality === 'low';
}

export function useShouldEnableHeavyEffects() {
  const { enableHeavyEffects } = usePerformance();
  return enableHeavyEffects;
}

export function useShouldEnableWebGL() {
  const { enableWebGL } = usePerformance();
  return enableWebGL;
}
