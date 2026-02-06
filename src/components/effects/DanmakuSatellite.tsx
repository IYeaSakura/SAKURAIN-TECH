import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, AlertCircle, Orbit, Eye, EyeOff, Satellite, Type } from 'lucide-react';
import * as Cesium from 'cesium';

// API 基础路径
const API_BASE_URL = '/api/danmaku';

// 调试日志
const debugLog = (...args: unknown[]) => {
  console.log('[Danmaku]', ...args);
};

// 频率限制配置
const RATE_LIMIT = {
  minInterval: 5000,
  maxPerMinute: 10,
  maxPerHour: 50,
};

// 地球和轨道常量
const EARTH_RADIUS = 6371000; // 地球半径 (米)

// 轨道高度范围 (米) - 拉大范围让差异更明显
const ORBIT_RANGES = {
  low: { min: 300000, max: 500000, label: '低轨', desc: '300-500km' },      // 低轨: 近地轨道
  medium: { min: 1500000, max: 2500000, label: '中轨', desc: '1500-2500km' }, // 中轨: 中地球轨道 (默认)
  high: { min: 5000000, max: 8000000, label: '高轨', desc: '5000-8000km' },  // 高轨: 高地球轨道
};

type OrbitType = 'low' | 'medium' | 'high';

interface Danmaku {
  id: string;
  text: string;
  userId: string;
  timestamp: number;
  angle: number;
  speed: number;
  color: string;
  inclination: number;
  altitude: number;
  orbitType: OrbitType;
}

interface DanmakuSatelliteProps {
  viewer: Cesium.Viewer | null;
  isDark: boolean;
}

class RateLimiter {
  private records: number[] = [];
  private lastSendTime: number = 0;

  canSend(): { allowed: boolean; waitTime?: number; message?: string } {
    const now = Date.now();
    const timeSinceLastSend = now - this.lastSendTime;
    if (timeSinceLastSend < RATE_LIMIT.minInterval) {
      return {
        allowed: false,
        waitTime: RATE_LIMIT.minInterval - timeSinceLastSend,
        message: `发送太频繁，请等待 ${Math.ceil((RATE_LIMIT.minInterval - timeSinceLastSend) / 1000)} 秒`,
      };
    }
    this.records = this.records.filter(time => now - time < 3600000);
    const recentRecords = this.records.filter(time => now - time < 60000);
    if (recentRecords.length >= RATE_LIMIT.maxPerMinute) {
      return { allowed: false, message: '发送太频繁，请稍后再试' };
    }
    return { allowed: true };
  }

  recordSend(): void {
    this.lastSendTime = Date.now();
    this.records.push(this.lastSendTime);
  }

  getRemainingQuota(): { perMinute: number; perHour: number } {
    const now = Date.now();
    this.records = this.records.filter(time => now - time < 3600000);
    const recentRecords = this.records.filter(time => now - time < 60000);
    return {
      perMinute: RATE_LIMIT.maxPerMinute - recentRecords.length,
      perHour: RATE_LIMIT.maxPerHour - this.records.length,
    };
  }
}

export function DanmakuSatellite({ viewer, isDark }: DanmakuSatelliteProps) {
  const [danmakus, setDanmakus] = useState<Danmaku[]>([]);
  const [inputText, setInputText] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingQuota, setRemainingQuota] = useState({ perMinute: RATE_LIMIT.maxPerMinute, perHour: RATE_LIMIT.maxPerHour });
  const [selectedOrbit, setSelectedOrbit] = useState<OrbitType>('medium');
  
  // 可见性控制 - 分别控制文字、卫星、轨道
  const [showText, setShowText] = useState(true);
  const [showSatellite, setShowSatellite] = useState(true);
  const [showOrbitLine, setShowOrbitLine] = useState(true);
  // 总开关
  const [showAll, setShowAll] = useState(true);
  
  const userId = useRef(`user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const entitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const orbitEntitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const rateLimiterRef = useRef(new RateLimiter());
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(false);

  const colors = isDark ? [
    '#60a5fa', '#fbbf24', '#4ec9b0', '#f472b6', '#a78bfa', '#34d399',
    '#f87171', '#fb923c', '#a3e635', '#22d3ee', '#e879f9', '#818cf8',
  ] : [
    '#0E639C', '#6A9955', '#569CD6', '#CE9178', '#4EC9B0', '#D4A017',
    '#dc2626', '#ea580c', '#65a30d', '#0891b2', '#c026d3', '#4f46e5',
  ];

  const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

  // 根据开普勒定律计算角速度：ω ∝ r^(-3/2)
  // 返回每秒转过的角度（弧度）
  const calculateAngularVelocity = (altitude: number): number => {
    const radius = EARTH_RADIUS + altitude;
    // 参考低轨(400km)周期约90分钟，角速度约 2π/5400 ≈ 0.00116 rad/s
    // 使用比例关系：ω = ω₀ × (r₀/r)^(3/2)
    const referenceRadius = EARTH_RADIUS + 400000; // 400km参考轨道
    const referenceOmega = 0.0012; // 参考角速度 rad/s
    const omega = referenceOmega * Math.pow(referenceRadius / radius, 1.5);
    return omega;
  };

  const generateOrbitParams = useCallback((orbitType: OrbitType = 'medium') => {
    const range = ORBIT_RANGES[orbitType];
    const angle = Math.random() * Math.PI * 2;
    const inclination = (Math.random() - 0.5) * Math.PI / 1.5;
    const altitude = range.min + Math.random() * (range.max - range.min);
    // 使用物理规律计算角速度（低轨高速短周期，高轨低速长周期）
    const angularVelocity = calculateAngularVelocity(altitude);
    const speed = angularVelocity * (Math.random() > 0.5 ? 1 : -1);
    return { angle, inclination, altitude, speed, orbitType };
  }, []);

  const fetchDanmakus = useCallback(async () => {
    if (isFetchingRef.current) return;
    
    const url = `${API_BASE_URL}/list`;
    debugLog('Fetching danmakus from:', url);
    
    isFetchingRef.current = true;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        debugLog('Fetched danmakus count:', data.length);
        // 为旧数据补充轨道类型
        const processedData = data.map((d: Partial<Danmaku>) => ({
          ...generateOrbitParams(d.orbitType || 'medium'),
          ...d,
        }));
        setDanmakus(processedData);
      }
    } catch (error) {
      console.error('Failed to fetch danmakus:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [generateOrbitParams]);

  const addDanmaku = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const rateCheck = rateLimiterRef.current.canSend();
    if (!rateCheck.allowed) {
      setErrorMessage(rateCheck.message || '发送太频繁');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const orbitParams = generateOrbitParams(selectedOrbit);
    const newDanmaku: Danmaku = {
      id: `danmaku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      userId: userId.current,
      timestamp: Date.now(),
      color: getRandomColor(),
      ...orbitParams,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(newDanmaku),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          rateLimiterRef.current.recordSend();
          setDanmakus(prev => [...prev, result.danmaku || newDanmaku]);
          setInputText('');
          setRemainingQuota(rateLimiterRef.current.getRemainingQuota());
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrorMessage(errorData.error || '发送失败');
        setTimeout(() => setErrorMessage(null), 3000);
      }
    } catch (error) {
      setErrorMessage('网络错误');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrbit, generateOrbitParams]);

  const deleteDanmaku = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setDanmakus(prev => prev.filter(d => d.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete danmaku:', error);
    }
  }, []);

  const handleSend = useCallback(() => {
    if (inputText.trim() && !isLoading) {
      addDanmaku(inputText);
    }
  }, [inputText, isLoading, addDanmaku]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // 总开关控制所有
  const toggleAll = useCallback(() => {
    const newValue = !showAll;
    setShowAll(newValue);
    setShowText(newValue);
    setShowSatellite(newValue);
    setShowOrbitLine(newValue);
  }, [showAll]);

  useEffect(() => {
    if (isMountedRef.current) return;
    isMountedRef.current = true;
    
    fetchDanmakus();
    // 减少请求频率：每30秒轮询一次，避免频繁请求
    pollingIntervalRef.current = setInterval(fetchDanmakus, 30000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = undefined;
      }
    };
  }, [fetchDanmakus]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingQuota(rateLimiterRef.current.getRemainingQuota());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 创建和更新 Cesium 实体
  useEffect(() => {
    if (!viewer) return;

    // 计算卫星位置
    // speed 是角速度（弧度/秒），符合开普勒定律：低轨高速短周期，高轨低速长周期
    const calculatePosition = (danmaku: Danmaku, elapsedSeconds: number) => {
      const radius = EARTH_RADIUS + danmaku.altitude;
      // speed 已经是 rad/s，直接乘以时间（秒）得到转过的角度
      const currentAngle = danmaku.angle + (danmaku.speed * elapsedSeconds);
      const x = Math.cos(currentAngle) * radius;
      const y = Math.sin(currentAngle) * radius;
      const inclination = danmaku.inclination;
      const rotatedY = y * Math.cos(inclination);
      const rotatedZ = y * Math.sin(inclination);
      return new Cesium.Cartesian3(x, rotatedY, rotatedZ);
    };

    // 创建卫星实体（包含文字和点）
    const createSatelliteEntity = (danmaku: Danmaku) => {
      const entity = viewer.entities.add({
        position: new Cesium.CallbackProperty(() => {
          const now = Date.now();
          const elapsed = (now - danmaku.timestamp) / 1000;
          return calculatePosition(danmaku, elapsed);
        }, false) as unknown as Cesium.PositionProperty,
        point: {
          pixelSize: 8,
          color: Cesium.Color.fromCssColorString(danmaku.color),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.5e7, 1.5, 5.0e7, 0.8),
          show: showSatellite && showAll,
        },
        label: {
          text: danmaku.text,
          font: 'bold 14px "Microsoft YaHei", sans-serif',
          fillColor: Cesium.Color.fromCssColorString(danmaku.color),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -25),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          show: showText && showAll,
          scaleByDistance: new Cesium.NearFarScalar(1.5e7, 1.0, 5.0e7, 0.7),
          translucencyByDistance: new Cesium.NearFarScalar(3.0e7, 1.0, 5.0e7, 0.5),
        },
      });
      return entity;
    };

    // 创建轨道线
    const createOrbitLine = (danmaku: Danmaku) => {
      const radius = EARTH_RADIUS + danmaku.altitude;
      const inclination = danmaku.inclination;
      const angleOffset = danmaku.angle;
      
      const positions: Cesium.Cartesian3[] = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2 + angleOffset;
        const x = Math.cos(theta) * radius;
        const y = Math.sin(theta) * radius;
        const rotatedY = y * Math.cos(inclination);
        const rotatedZ = y * Math.sin(inclination);
        positions.push(new Cesium.Cartesian3(x, rotatedY, rotatedZ));
      }

      const entity = viewer.entities.add({
        polyline: {
          positions: positions,
          width: 1.5,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.fromCssColorString(danmaku.color).withAlpha(0.4),
            dashLength: 16,
          }),
          show: showOrbitLine && showAll,
        },
      });
      return entity;
    };

    danmakus.forEach(danmaku => {
      if (!entitiesRef.current.has(danmaku.id)) {
        const entity = createSatelliteEntity(danmaku);
        if (entity) entitiesRef.current.set(danmaku.id, entity);
      }
      if (!orbitEntitiesRef.current.has(danmaku.id)) {
        const orbitEntity = createOrbitLine(danmaku);
        if (orbitEntity) orbitEntitiesRef.current.set(danmaku.id, orbitEntity);
      }
    });

    const currentIds = new Set(danmakus.map(d => d.id));
    entitiesRef.current.forEach((entity, id) => {
      if (!currentIds.has(id)) {
        viewer.entities.remove(entity);
        entitiesRef.current.delete(id);
      }
    });
    orbitEntitiesRef.current.forEach((entity, id) => {
      if (!currentIds.has(id)) {
        viewer.entities.remove(entity);
        orbitEntitiesRef.current.delete(id);
      }
    });

    // 更新可见性
    entitiesRef.current.forEach((entity) => {
      if (entity.point) entity.point.show = new Cesium.ConstantProperty(showSatellite && showAll);
      if (entity.label) entity.label.show = new Cesium.ConstantProperty(showText && showAll);
    });
    orbitEntitiesRef.current.forEach((entity) => {
      if (entity.polyline) entity.polyline.show = new Cesium.ConstantProperty(showOrbitLine && showAll);
    });

    return () => {
      entitiesRef.current.forEach((entity) => viewer.entities.remove(entity));
      entitiesRef.current.clear();
      orbitEntitiesRef.current.forEach((entity) => viewer.entities.remove(entity));
      orbitEntitiesRef.current.clear();
    };
  }, [viewer, danmakus, showText, showSatellite, showOrbitLine, showAll]);

  const myDanmakus = danmakus.filter(d => d.userId === userId.current);

  return (
    // 移到左上角，避免遮挡左下角数据
    <div className="absolute top-4 left-4 z-30">
      <div className="flex flex-col gap-2">
        {/* 主控制栏 */}
        <div className="flex items-center gap-2">
          {/* 总开关 */}
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: showAll ? 'rgba(96, 165, 250, 0.3)' : 'rgba(0, 0, 0, 0.5)',
              border: showAll ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid rgba(96, 165, 250, 0.2)',
              color: showAll ? '#60a5fa' : '#94a3b8',
            }}
            title={showAll ? '隐藏全部' : '显示全部'}
          >
            {showAll ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {showAll ? `弹幕 (${danmakus.length})` : '已隐藏'}
            </span>
          </button>
          
          <button
            onClick={() => setIsInputVisible(!isInputVisible)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              color: '#60a5fa',
            }}
            title="发送弹幕"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* 详细控制栏 - 只在显示全部时显示 */}
        {showAll && (
          <div className="flex items-center gap-2 justify-end">
            {/* 文字开关 */}
            <button
              onClick={() => setShowText(prev => !prev)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: showText ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid rgba(96, 165, 250, 0.2)',
                color: showText ? '#60a5fa' : '#64748b',
              }}
              title="文字"
            >
              <Type className="w-3.5 h-3.5" />
              <span className="text-xs">字</span>
            </button>

            {/* 卫星开关 */}
            <button
              onClick={() => setShowSatellite(prev => !prev)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: showSatellite ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid rgba(96, 165, 250, 0.2)',
                color: showSatellite ? '#60a5fa' : '#64748b',
              }}
              title="卫星"
            >
              <Satellite className="w-3.5 h-3.5" />
              <span className="text-xs">星</span>
            </button>

            {/* 轨道开关 */}
            <button
              onClick={() => setShowOrbitLine(prev => !prev)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: showOrbitLine ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid rgba(96, 165, 250, 0.2)',
                color: showOrbitLine ? '#60a5fa' : '#64748b',
              }}
              title="轨道"
            >
              <Orbit className="w-3.5 h-3.5" />
              <span className="text-xs">轨</span>
            </button>
          </div>
        )}

        {/* 输入面板 */}
        {isInputVisible && (
          <div
            className="flex flex-col gap-2 p-3 rounded-lg backdrop-blur-sm"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              minWidth: '280px',
            }}
          >
            {errorMessage && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded text-sm" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            
            {/* 轨道高度选择 */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-gray-400">轨道高度</span>
              <div className="flex gap-2">
                {(Object.keys(ORBIT_RANGES) as OrbitType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedOrbit(type)}
                    className="flex-1 px-2 py-1.5 rounded text-xs transition-all duration-200"
                    style={{
                      background: selectedOrbit === type ? 'rgba(96, 165, 250, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      border: selectedOrbit === type ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: selectedOrbit === type ? '#60a5fa' : '#94a3b8',
                    }}
                  >
                    <div className="font-medium">{ORBIT_RANGES[type].label}</div>
                    <div className="text-[10px] opacity-70">{ORBIT_RANGES[type].desc}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入弹幕内容..."
              maxLength={50}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-md text-sm text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(96, 165, 250, 0.3)',
              }}
            />
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {inputText.length}/50
              </span>
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: inputText.trim() && !isLoading ? 'rgba(96, 165, 250, 0.3)' : 'rgba(96, 165, 250, 0.1)',
                  border: '1px solid rgba(96, 165, 250, 0.3)',
                  color: '#60a5fa',
                }}
              >
                {isLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#60a5fa', borderTopColor: 'transparent' }} />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    发送
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <span>剩余: {remainingQuota.perMinute}/分</span>
              <span>{remainingQuota.perHour}/时</span>
            </div>

            {myDanmakus.length > 0 && (
              <div className="mt-2 pt-2 border-t" style={{ borderColor: 'rgba(96, 165, 250, 0.2)' }}>
                <div className="text-xs text-gray-400 mb-2">我的弹幕 (可删除)</div>
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                  {myDanmakus.map(danmaku => (
                    <div
                      key={danmaku.id}
                      className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm"
                      style={{
                        background: 'rgba(96, 165, 250, 0.1)',
                        border: '1px solid rgba(96, 165, 250, 0.2)',
                      }}
                    >
                      <span className="flex-1 truncate" style={{ color: danmaku.color }}>
                        [{ORBIT_RANGES[danmaku.orbitType || 'medium'].label}] {danmaku.text}
                      </span>
                      <button
                        onClick={() => deleteDanmaku(danmaku.id)}
                        className="p-1 rounded hover:bg-red-500/20 transition-colors"
                        style={{ color: '#ef4444' }}
                        title="删除"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DanmakuSatellite;
