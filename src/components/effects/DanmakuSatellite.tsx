import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, X, AlertCircle, Orbit } from 'lucide-react';
import * as Cesium from 'cesium';

// API 基础路径 - 根据环境判断
const API_BASE_URL = import.meta.env.DEV 
  ? '/api/danmaku' 
  : '/api/danmaku';

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
const MIN_ALTITUDE = 500000; // 最低轨道高度 500km
const MAX_ALTITUDE = 1500000; // 最高轨道高度 1500km

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
  const [showDanmaku, setShowDanmaku] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingQuota, setRemainingQuota] = useState({ perMinute: RATE_LIMIT.maxPerMinute, perHour: RATE_LIMIT.maxPerHour });
  
  const userId = useRef(`user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const entitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const rateLimiterRef = useRef(new RateLimiter());
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(false);

  debugLog('Component mounted, API_BASE_URL:', API_BASE_URL);

  const colors = isDark ? [
    '#60a5fa', '#fbbf24', '#4ec9b0', '#f472b6', '#a78bfa', '#34d399',
    '#f87171', '#fb923c', '#a3e635', '#22d3ee', '#e879f9', '#818cf8',
  ] : [
    '#0E639C', '#6A9955', '#569CD6', '#CE9178', '#4EC9B0', '#D4A017',
    '#dc2626', '#ea580c', '#65a30d', '#0891b2', '#c026d3', '#4f46e5',
  ];

  const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

  const [showOrbits, setShowOrbits] = useState(true);
  const orbitEntitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());

  const generateOrbitParams = () => {
    const angle = Math.random() * Math.PI * 2;
    const inclination = (Math.random() - 0.5) * Math.PI / 1.5;
    // 近地轨道：500km - 1500km
    const altitude = MIN_ALTITUDE + Math.random() * (MAX_ALTITUDE - MIN_ALTITUDE);
    // 速度根据轨道高度调整（越低越快）
    const baseSpeed = 2 + Math.random();
    const speed = baseSpeed * (Math.random() > 0.5 ? 1 : -1);
    return { angle, inclination, altitude, speed };
  };

  const fetchDanmakus = useCallback(async () => {
    // 防止重复请求
    if (isFetchingRef.current) {
      debugLog('Fetch already in progress, skipping');
      return;
    }
    
    const url = `${API_BASE_URL}/list`;
    debugLog('Fetching danmakus from:', url);
    
    isFetchingRef.current = true;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      debugLog('Fetch response status:', response.status, response.statusText);
      if (response.ok) {
        const data = await response.json();
        debugLog('Fetched danmakus count:', data.length);
        const processedData = data.map((d: Partial<Danmaku>) => ({
          ...generateOrbitParams(),
          ...d,
        }));
        setDanmakus(processedData);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch danmakus, status:', response.status, errorText);
      }
    } catch (error) {
      console.error('Failed to fetch danmakus:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const addDanmaku = useCallback(async (text: string) => {
    if (!text.trim()) return;
    debugLog('Adding danmaku:', text);

    const rateCheck = rateLimiterRef.current.canSend();
    if (!rateCheck.allowed) {
      setErrorMessage(rateCheck.message || '发送太频繁');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const orbitParams = generateOrbitParams();
    const newDanmaku: Danmaku = {
      id: `danmaku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      userId: userId.current,
      timestamp: Date.now(),
      color: getRandomColor(),
      ...orbitParams,
    };

    const url = `${API_BASE_URL}/add`;
    debugLog('Sending POST to:', url, 'body:', newDanmaku);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(newDanmaku),
      });

      debugLog('Add response status:', response.status, response.statusText);
      debugLog('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        debugLog('Add success, result:', result);
        if (result.success) {
          rateLimiterRef.current.recordSend();
          setDanmakus(prev => [...prev, result.danmaku || newDanmaku]);
          setInputText('');
          setRemainingQuota(rateLimiterRef.current.getRemainingQuota());
        }
      } else {
        let errorMessage = '发送失败，请重试';
        try {
          const errorData = await response.json();
          debugLog('Error response body:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          debugLog('Error response text:', errorText);
        }
        setErrorMessage(errorMessage);
        setTimeout(() => setErrorMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to add danmaku, network error:', error);
      setErrorMessage('网络错误，请检查连接');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDanmaku = useCallback(async (id: string) => {
    const url = `${API_BASE_URL}/delete`;
    debugLog('Deleting danmaku:', id, 'url:', url);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      debugLog('Delete response status:', response.status);
      if (response.ok) {
        setDanmakus(prev => prev.filter(d => d.id !== id));
      } else {
        const errorText = await response.text();
        console.error('Failed to delete danmaku, status:', response.status, errorText);
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

  const toggleDanmaku = useCallback(() => {
    setShowDanmaku(prev => !prev);
  }, []);

  const toggleOrbits = useCallback(() => {
    setShowOrbits(prev => !prev);
  }, []);

  useEffect(() => {
    // 防止 React StrictMode 双重执行导致的重复请求
    if (isMountedRef.current) return;
    isMountedRef.current = true;
    
    debugLog('Initial fetch triggered');
    fetchDanmakus();
    
    pollingIntervalRef.current = setInterval(() => {
      fetchDanmakus();
    }, 5000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = undefined;
      }
    };
  }, []);  // 空依赖数组，只在组件挂载时执行

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingQuota(rateLimiterRef.current.getRemainingQuota());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!viewer) return;

    const calculatePosition = (danmaku: Danmaku, elapsedSeconds: number) => {
      const radius = EARTH_RADIUS + danmaku.altitude;
      const currentAngle = danmaku.angle + (danmaku.speed * elapsedSeconds * 0.001);
      const x = Math.cos(currentAngle) * radius;
      const y = Math.sin(currentAngle) * radius;
      const inclination = danmaku.inclination;
      const rotatedY = y * Math.cos(inclination);
      const rotatedZ = y * Math.sin(inclination);
      return new Cesium.Cartesian3(x, rotatedY, rotatedZ);
    };

    const createDanmakuEntity = (danmaku: Danmaku) => {
      const entity = viewer.entities.add({
        position: new Cesium.CallbackProperty(() => {
          const now = Date.now();
          const elapsed = (now - danmaku.timestamp) / 1000;
          return calculatePosition(danmaku, elapsed);
        }, false) as unknown as Cesium.PositionProperty,
        point: {
          pixelSize: 6,
          color: Cesium.Color.fromCssColorString(danmaku.color),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.5e7, 1.5, 5.0e7, 0.8),
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
          show: showDanmaku,
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
      
      // 生成轨道上的点
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
          width: 1,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.fromCssColorString(danmaku.color).withAlpha(0.3),
            dashLength: 16,
          }),
          show: showOrbits,
        },
      });
      return entity;
    };

    danmakus.forEach(danmaku => {
      if (!entitiesRef.current.has(danmaku.id)) {
        const entity = createDanmakuEntity(danmaku);
        if (entity) {
          entitiesRef.current.set(danmaku.id, entity);
        }
      }
      // 创建轨道线
      if (!orbitEntitiesRef.current.has(danmaku.id)) {
        const orbitEntity = createOrbitLine(danmaku);
        if (orbitEntity) {
          orbitEntitiesRef.current.set(danmaku.id, orbitEntity);
        }
      }
    });

    // 清理已删除的弹幕实体和轨道
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
      if (entity.label) {
        entity.label.show = new Cesium.ConstantProperty(showDanmaku);
      }
    });
    orbitEntitiesRef.current.forEach((entity) => {
      if (entity.polyline) {
        entity.polyline.show = new Cesium.ConstantProperty(showOrbits);
      }
    });

    return () => {
      entitiesRef.current.forEach((entity) => {
        viewer.entities.remove(entity);
      });
      entitiesRef.current.clear();
      orbitEntitiesRef.current.forEach((entity) => {
        viewer.entities.remove(entity);
      });
      orbitEntitiesRef.current.clear();
    };
  }, [viewer, danmakus, showDanmaku, showOrbits]);

  const myDanmakus = danmakus.filter(d => d.userId === userId.current);

  return (
    <div className="absolute bottom-4 left-4 z-30">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDanmaku}
            className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              color: '#60a5fa',
            }}
            title={showDanmaku ? '隐藏弹幕' : '显示弹幕'}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">
              {showDanmaku ? `弹幕开 (${danmakus.length})` : '弹幕关'}
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

          <button
            onClick={toggleOrbits}
            className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: showOrbits 
                ? '1px solid rgba(96, 165, 250, 0.5)' 
                : '1px solid rgba(96, 165, 250, 0.2)',
              color: showOrbits ? '#60a5fa' : '#94a3b8',
            }}
            title={showOrbits ? '隐藏轨道' : '显示轨道'}
          >
            <Orbit className="w-4 h-4" />
          </button>
        </div>

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
                      <span
                        className="flex-1 truncate"
                        style={{ color: danmaku.color }}
                      >
                        {danmaku.text}
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
