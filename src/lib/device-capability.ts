/**
 * 设备能力检测 - 用于识别低性能设备并启用降级模式
 */

export interface DeviceCapability {
  /** 是否为低性能设备 */
  isLowPower: boolean;
  /** 是否为移动设备 */
  isMobile: boolean;
  /** 是否支持 WebGL */
  supportsWebGL: boolean;
  /** 硬件并发数 */
  hardwareConcurrency: number;
  /** 设备内存 (GB) */
  deviceMemory: number;
  /** 屏幕像素比 */
  devicePixelRatio: number;
  /** 是否启用省电模式 */
  isBatterySaving: boolean;
  /** 建议的动画质量级别: 'high' | 'medium' | 'low' */
  recommendedQuality: 'high' | 'medium' | 'low';
}

let cachedCapability: DeviceCapability | null = null;

/**
 * 检测设备能力
 */
export function detectDeviceCapability(): DeviceCapability {
  if (cachedCapability) return cachedCapability;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 1024;

  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  const devicePixelRatio = Math.min(window.devicePixelRatio, 2);

  // 检测 WebGL 支持
  const supportsWebGL = (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  })();

  // 检测是否为低性能设备
  const isLowPower = (() => {
    // CPU 核心数少于4个
    if (hardwareConcurrency < 4) return true;
    // 内存少于4GB
    if (deviceMemory < 4) return true;
    // 移动端通常性能较低
    if (isMobile && hardwareConcurrency < 6) return true;
    return false;
  })();

  // 确定推荐质量级别
  const recommendedQuality: 'high' | 'medium' | 'low' = (() => {
    if (isLowPower || !supportsWebGL) return 'low';
    if (isMobile || hardwareConcurrency < 6 || deviceMemory < 8) return 'medium';
    return 'high';
  })();

  cachedCapability = {
    isLowPower,
    isMobile,
    supportsWebGL,
    hardwareConcurrency,
    deviceMemory,
    devicePixelRatio,
    isBatterySaving: false, // 需要异步检测
    recommendedQuality,
  };

  // 异步检测电池状态
  if ('getBattery' in navigator) {
    (navigator as Navigator & { getBattery: () => Promise<{ charging: boolean; level: number }> })
      .getBattery()
      .then((battery) => {
        if (cachedCapability) {
          cachedCapability.isBatterySaving = !battery.charging && battery.level < 0.2;
          // 如果电量低，进一步降低质量
          if (cachedCapability.isBatterySaving && cachedCapability.recommendedQuality === 'high') {
            cachedCapability.recommendedQuality = 'medium';
          }
        }
      })
      .catch(() => {
        // 忽略电池检测失败
      });
  }

  return cachedCapability;
}

/**
 * 获取设备能力 (同步版本，使用缓存)
 */
export function getDeviceCapability(): DeviceCapability {
  return cachedCapability || detectDeviceCapability();
}

/**
 * 检测是否应该启用重度特效
 */
export function shouldEnableHeavyEffects(): boolean {
  const cap = getDeviceCapability();
  return cap.recommendedQuality === 'high' && !cap.isLowPower;
}

/**
 * 检测是否应该启用 WebGL
 */
export function shouldEnableWebGL(): boolean {
  const cap = getDeviceCapability();
  return cap.supportsWebGL && cap.recommendedQuality !== 'low';
}

/**
 * 获取推荐的粒子数量
 */
export function getRecommendedParticleCount(baseCount: number): number {
  const cap = getDeviceCapability();
  switch (cap.recommendedQuality) {
    case 'low':
      return Math.floor(baseCount * 0.2);
    case 'medium':
      return Math.floor(baseCount * 0.5);
    case 'high':
    default:
      return baseCount;
  }
}

/**
 * 获取推荐的动画帧率
 */
export function getRecommendedFrameRate(): number {
  const cap = getDeviceCapability();
  switch (cap.recommendedQuality) {
    case 'low':
      return 30;
    case 'medium':
      return 45;
    case 'high':
    default:
      return 60;
  }
}

/**
 * 获取推荐的 Canvas DPR
 */
export function getRecommendedDPR(): number {
  const cap = getDeviceCapability();
  switch (cap.recommendedQuality) {
    case 'low':
      return 1;
    case 'medium':
      return Math.min(cap.devicePixelRatio, 1.5);
    case 'high':
    default:
      return cap.devicePixelRatio;
  }
}

/**
 * 监听设备能力变化 (窗口大小变化时)
 */
export function subscribeToCapabilityChanges(callback: (cap: DeviceCapability) => void): () => void {
  const handler = () => {
    cachedCapability = null;
    callback(detectDeviceCapability());
  };

  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}
