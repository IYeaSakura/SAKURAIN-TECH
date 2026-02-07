import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, AlertCircle, Orbit, Eye, EyeOff, Satellite, Type, Globe, FileText, Maximize2, Clock } from 'lucide-react';
import * as Cesium from 'cesium';
import ReactMarkdown from 'react-markdown';

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

// 轨道高度范围 (米) - 真实轨道定义
const ORBIT_RANGES = {
  // 低轨 LEO: 200-2000km
  low: { min: 200000, max: 2000000, label: '低轨 LEO', desc: '200-2000km' },
  // 中轨 MEO: 2000-35786km
  medium: { min: 2000000, max: 35786000, label: '中轨 MEO', desc: '2000-35786km' },
  // 高轨 GEO: 35786km
  high: { min: 35786000, max: 60000000, label: '高轨 GEO', desc: '~35786km' },
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
  raan?: number; // 升交点赤经 (Right Ascension of Ascending Node)，用于确定轨道平面
  markdown?: string; // Markdown 内容，默认为空
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

const USER_ID_KEY = 'danmaku-user-id';

const getUserId = (): string => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

export function DanmakuSatellite({ viewer, isDark }: DanmakuSatelliteProps) {
  const [danmakus, setDanmakus] = useState<Danmaku[]>([]);
  const [inputText, setInputText] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingQuota, setRemainingQuota] = useState({ perMinute: RATE_LIMIT.maxPerMinute, perHour: RATE_LIMIT.maxPerHour });
  const [selectedOrbit, setSelectedOrbit] = useState<OrbitType>('medium');
  
  // Markdown 文本输入
  const [markdownText, setMarkdownText] = useState('');
  const [showMarkdownInput, setShowMarkdownInput] = useState(false);
  
  // Markdown 内容显示
  const [selectedDanmaku, setSelectedDanmaku] = useState<Danmaku | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // 控制模态框显示

  // 可见性控制 - 分别控制文字、卫星、轨道
  const [showText, setShowText] = useState(true);
  const [showSatellite, setShowSatellite] = useState(true);
  const [showOrbitLine, setShowOrbitLine] = useState(true);
  // 总开关
  const [showAll, setShowAll] = useState(true);
  
  // 北斗卫星数据
  const [beidouSatellites, setBeidouSatellites] = useState<Danmaku[]>([]);
  const [showBeidou, setShowBeidou] = useState(false);
  
  // 弹幕列表展开/收起
  const [isDanmakuListOpen, setIsDanmakuListOpen] = useState(false);
  
  // 弹幕列表筛选 - 只显示自己发送的弹幕
  const [filterOwnDanmakus, setFilterOwnDanmakus] = useState(false);

  const userId = useRef(getUserId());
  const entitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const orbitEntitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const rateLimiterRef = useRef(new RateLimiter());
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(false);
  const hasLoadedDanmakusRef = useRef(false); // 标记是否已加载过弹幕数据

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
    const referenceRadius = EARTH_RADIUS + 400000;
    const referenceOmega = 0.0012;
    const omega = referenceOmega * Math.pow(referenceRadius / radius, 1.5);
    // 视觉加速：50倍速（真实轨道很高，需要更大的加速才能看清运动）
    return omega * 50;
  };

  // 随机选择轨道类型（低/中/高轨概率均等 1/3）
  const getRandomOrbitType = (): OrbitType => {
    const types: OrbitType[] = ['low', 'medium', 'high'];
    return types[Math.floor(Math.random() * 3)];
  };

  const generateOrbitParams = useCallback((orbitType?: OrbitType) => {
    // 如果没有指定类型，随机选择（三种轨道概率一致 1/3）
    const type = orbitType || getRandomOrbitType();
    const range = ORBIT_RANGES[type];
    
    // 初始角度：0-360度均匀分布
    const angle = Math.random() * Math.PI * 2;
    
    // 轨道倾角：-90°到+90°均匀分布（从赤道到极地）
    const inclination = (Math.random() - 0.5) * Math.PI;
    
    // 升交点赤经 (RAAN)：0-360度均匀分布，确定轨道平面在空间中的方向
    const raan = Math.random() * Math.PI * 2;
    
    // 高度：在轨道范围内均匀分布
    const altitude = range.min + Math.random() * (range.max - range.min);
    
    // 角速度：根据高度计算（低轨高速，高轨低速）
    const angularVelocity = calculateAngularVelocity(altitude);
    
    // 方向：正向/反向概率均等（50%）
    const speed = angularVelocity * (Math.random() > 0.5 ? 1 : -1);
    
    return { angle, inclination, altitude, speed, orbitType: type, raan };
  }, []);

  // 加载北斗卫星数据（本地JSON）
  const loadBeidouSatellites = useCallback(async () => {
    if (beidouSatellites.length > 0) return; // 已加载过
    
    try {
      debugLog('Loading Beidou satellites...');
      const response = await fetch('/data/beidou-satellites.json');
      if (response.ok) {
        const satellites = await response.json();
        setBeidouSatellites(satellites);
        debugLog('Loaded Beidou satellites:', satellites.length);
      }
    } catch (err) {
      console.error('Failed to load Beidou satellites:', err);
    }
  }, [beidouSatellites.length]);

  const fetchDanmakus = useCallback(async (force = false) => {
    // 如果已经加载过且不是强制刷新，则直接返回（使用内存缓存）
    if (hasLoadedDanmakusRef.current && !force) {
      debugLog('Using cached danmakus from memory, count:', danmakus.length);
      return;
    }
    
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
        // 为旧数据补充轨道参数和timestamp
        const processedData = data.map((d: Partial<Danmaku>) => {
          // 如果服务器返回的数据已有完整的轨道参数，直接使用，不再生成新的
          const hasOrbitParams = d.angle != null && d.inclination != null && d.altitude != null && d.speed != null;
          const orbitParams = hasOrbitParams 
            ? {}  // 使用服务器返回的参数，不生成新的
            : (d.orbitType ? generateOrbitParams(d.orbitType) : generateOrbitParams('medium'));
          return {
            ...orbitParams,
            timestamp: Date.now(), // 如果没有timestamp，使用当前时间
            ...d,
            // 确保必须有这些字段（如果服务器没有返回，则生成默认值）
            id: d.id || `danmaku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: d.text || '',
            userId: d.userId || 'unknown',
            color: d.color || '#60a5fa',
            // 如果服务器没有返回 raan，生成一个随机的
            raan: d.raan != null ? d.raan : Math.random() * Math.PI * 2,
          } as Danmaku;
        });
        setDanmakus(processedData);
        hasLoadedDanmakusRef.current = true; // 标记已加载
      }
    } catch (error) {
      console.error('Failed to fetch danmakus:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [generateOrbitParams, danmakus.length]);

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
        body: JSON.stringify({
          ...newDanmaku,
          markdown: markdownText.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          rateLimiterRef.current.recordSend();
          // 删除之前相同 userId 的弹幕
          setDanmakus(prev => {
            const filtered = prev.filter(d => d.userId !== userId.current);
            return [...filtered, result.danmaku || newDanmaku];
          });
          setInputText('');
          setMarkdownText('');
          setShowMarkdownInput(false);
          setRemainingQuota(rateLimiterRef.current.getRemainingQuota());
          // 不再调用 fetchDanmakus() 重新请求，节省流量和请求次数
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
  }, [selectedOrbit, generateOrbitParams, markdownText]);

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

  // 显示 Markdown 内容（直接从已加载的数据中获取）
  const showDanmakuDetail = useCallback((danmaku: Danmaku) => {
    // 如果点击的是同一个卫星，则关闭显示
    if (selectedDanmaku?.id === danmaku.id) {
      setSelectedDanmaku(null);
      setMarkdownContent(null);
      setIsModalOpen(false);
      return;
    }
    
    setSelectedDanmaku(danmaku);
    // 直接从弹幕数据中获取 markdown，无需额外请求
    setMarkdownContent(danmaku.markdown || null);
    setIsModalOpen(false);
  }, [selectedDanmaku]);

  // 处理卫星点击事件
  useEffect(() => {
    if (!viewer) return;

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
    
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const pickedObject = viewer.scene.pick(click.position);
      
      if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
        const entity = pickedObject.id;
        // 查找对应的弹幕数据
        const allSatellites = showBeidou ? [...danmakus, ...beidouSatellites] : danmakus;
        const danmaku = allSatellites.find(d => {
          const entityFromRef = entitiesRef.current.get(d.id);
          return entityFromRef && entityFromRef.id === entity.id;
        });
        
        if (danmaku) {
          showDanmakuDetail(danmaku);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
    };
  }, [viewer, danmakus, beidouSatellites, showBeidou, showDanmakuDetail]);

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

    // 首次加载时获取数据
    fetchDanmakus();
  }, [fetchDanmakus]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingQuota(rateLimiterRef.current.getRemainingQuota());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 打开输入面板时不再重新请求数据，使用内存缓存
  // 如需刷新数据，可手动添加刷新按钮或定时刷新机制

  // 创建和更新 Cesium 实体
  useEffect(() => {
    if (!viewer) return;

    // 合并用户弹幕和北斗卫星数据（如果启用）
    const allSatellites = showBeidou 
      ? [...danmakus, ...beidouSatellites]
      : danmakus;

    // 计算卫星位置（考虑升交点赤经 RAAN）
    const calculatePosition = (danmaku: Danmaku, elapsedSeconds: number) => {
      const radius = EARTH_RADIUS + danmaku.altitude;
      // speed 已经是 rad/s，直接乘以时间（秒）得到转过的角度
      const currentAngle = danmaku.angle + (danmaku.speed * elapsedSeconds);
      
      // 在轨道平面内的坐标
      const xOrbital = Math.cos(currentAngle) * radius;
      const yOrbital = Math.sin(currentAngle) * radius;
      
      const inclination = danmaku.inclination;
      const raan = danmaku.raan || 0; // 升交点赤经，默认为0
      
      // 应用倾角旋转（绕x轴）和升交点赤经旋转（绕z轴）
      // 步骤1: 应用倾角（绕x轴旋转）
      const yAfterInclination = yOrbital * Math.cos(inclination);
      const zAfterInclination = yOrbital * Math.sin(inclination);
      
      // 步骤2: 应用升交点赤经 RAAN（绕z轴旋转）
      const cosRaan = Math.cos(raan);
      const sinRaan = Math.sin(raan);
      const x = xOrbital * cosRaan - yAfterInclination * sinRaan;
      const y = xOrbital * sinRaan + yAfterInclination * cosRaan;
      const z = zAfterInclination;
      
      return new Cesium.Cartesian3(x, y, z);
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

    // 创建轨道线（考虑升交点赤经 RAAN）
    const createOrbitLine = (danmaku: Danmaku) => {
      const radius = EARTH_RADIUS + danmaku.altitude;
      const inclination = danmaku.inclination;
      const angleOffset = danmaku.angle;
      const raan = danmaku.raan || 0;
      const cosRaan = Math.cos(raan);
      const sinRaan = Math.sin(raan);

      const positions: Cesium.Cartesian3[] = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2 + angleOffset;
        const xOrbital = Math.cos(theta) * radius;
        const yOrbital = Math.sin(theta) * radius;
        
        // 应用倾角（绕x轴）
        const yAfterInclination = yOrbital * Math.cos(inclination);
        const zAfterInclination = yOrbital * Math.sin(inclination);
        
        // 应用升交点赤经 RAAN（绕z轴）
        const x = xOrbital * cosRaan - yAfterInclination * sinRaan;
        const y = xOrbital * sinRaan + yAfterInclination * cosRaan;
        const z = zAfterInclination;
        
        positions.push(new Cesium.Cartesian3(x, y, z));
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

    allSatellites.forEach(danmaku => {
      if (!entitiesRef.current.has(danmaku.id)) {
        const entity = createSatelliteEntity(danmaku);
        if (entity) entitiesRef.current.set(danmaku.id, entity);
      }
      if (!orbitEntitiesRef.current.has(danmaku.id)) {
        const orbitEntity = createOrbitLine(danmaku);
        if (orbitEntity) orbitEntitiesRef.current.set(danmaku.id, orbitEntity);
      }
    });

    const currentIds = new Set(allSatellites.map(d => d.id));
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
  }, [viewer, danmakus, beidouSatellites, showBeidou, showText, showSatellite, showOrbitLine, showAll]);

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
              {showAll ? `卫星 (${danmakus.length + (showBeidou ? beidouSatellites.length : 0)})` : '已隐藏'}
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

            {/* 北斗开关 */}
            <button
              onClick={() => {
                if (!showBeidou) {
                  loadBeidouSatellites();
                }
                setShowBeidou(prev => !prev);
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: showBeidou ? '1px solid rgba(234, 179, 8, 0.5)' : '1px solid rgba(96, 165, 250, 0.2)',
                color: showBeidou ? '#eab308' : '#64748b',
              }}
              title="北斗卫星"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="text-xs">北斗</span>
            </button>

            {/* 弹幕列表开关 */}
            <button
              onClick={() => setIsDanmakuListOpen(prev => !prev)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: isDanmakuListOpen ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid rgba(96, 165, 250, 0.2)',
                color: isDanmakuListOpen ? '#60a5fa' : '#64748b',
              }}
              title="弹幕列表"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="text-xs">列表</span>
            </button>
          </div>
        )}

        {/* 弹幕列表 */}
        {isDanmakuListOpen && (
          <div
            className="flex flex-col rounded-lg backdrop-blur-sm overflow-hidden"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              minWidth: '280px',
              maxHeight: '400px',
            }}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'rgba(96, 165, 250, 0.2)' }}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: '#60a5fa' }} />
                <span className="text-sm font-medium" style={{ color: '#60a5fa' }}>弹幕列表</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(96, 165, 250, 0.2)', color: '#94a3b8' }}>
                  {filterOwnDanmakus ? danmakus.filter(d => d.userId === userId.current).length : danmakus.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilterOwnDanmakus(prev => !prev)}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors"
                  title={filterOwnDanmakus ? '显示所有弹幕' : '只显示我的弹幕'}
                >
                  <Eye className="w-3.5 h-3.5" style={{ color: filterOwnDanmakus ? '#60a5fa' : '#64748b' }} />
                </button>
                <button
                  onClick={() => setIsDanmakuListOpen(false)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {(() => {
                const filteredDanmakus = filterOwnDanmakus 
                  ? danmakus.filter(d => d.userId === userId.current)
                  : danmakus;
                
                if (filteredDanmakus.length === 0) {
                  return (
                    <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
                      {filterOwnDanmakus ? '暂无我的弹幕' : '暂无弹幕'}
                    </div>
                  );
                }
                
                return filteredDanmakus
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((danmaku) => {
                    const isOwnDanmaku = danmaku.userId === userId.current;
                    return (
                      <div
                        key={danmaku.id}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 transition-colors border-b"
                        style={{ borderColor: 'rgba(96, 165, 250, 0.1)' }}
                      >
                        <button
                          onClick={() => {
                            setSelectedDanmaku(danmaku);
                            setMarkdownContent(danmaku.markdown || null);
                            setIsModalOpen(false);
                            setIsDanmakuListOpen(false);
                          }}
                          className="flex items-center gap-2 flex-1 min-w-0"
                        >
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: danmaku.color }} />
                          <span className="flex-1 text-left text-xs truncate" style={{ color: '#e2e8f0' }}>
                            {danmaku.text}
                          </span>
                          <span className="text-[10px] flex-shrink-0" style={{ color: '#64748b' }}>
                            {new Date(danmaku.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </button>
                        {isOwnDanmaku && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDanmaku(danmaku.id);
                            }}
                            className="p-1 rounded hover:bg-red-500/20 transition-colors flex-shrink-0"
                            title="删除弹幕"
                          >
                            <X className="w-3 h-3 text-red-400" />
                          </button>
                        )}
                      </div>
                    );
                  });
              })()}
            </div>
          </div>
        )}

        {/* Markdown 内容侧边栏 - 缩小半透明版本 */}
        {selectedDanmaku && !isModalOpen && (
          <div
            className="fixed right-4 top-1/2 -translate-y-1/2 w-64 z-40 flex flex-col rounded-lg backdrop-blur-sm overflow-hidden"
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(96, 165, 250, 0.2)',
              maxHeight: '320px',
            }}
          >
            {/* 头部 - 包含标题和按钮 */}
            <div className="flex items-center justify-between px-2 py-1.5 border-b" style={{ borderColor: 'rgba(96, 165, 250, 0.15)' }}>
              <div className="flex items-center gap-1.5 min-w-0">
                <Satellite className="w-3 h-3 flex-shrink-0" style={{ color: selectedDanmaku.color }} />
                <span className="font-bold text-xs truncate" style={{ color: selectedDanmaku.color }}>
                  {selectedDanmaku.text}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {/* 弹窗按钮 */}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                  title="放大查看完整内容"
                >
                  <Maximize2 className="w-3 h-3 text-gray-400" />
                </button>
                {/* 关闭按钮 */}
                <button
                  onClick={() => setSelectedDanmaku(null)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* 内容区域 */}
            <div className="flex-1 overflow-auto p-2 text-gray-200 text-xs leading-relaxed">
              {/* 卫星参数信息 */}
              <div className="mb-2 p-1.5 rounded" style={{ background: 'rgba(96, 165, 250, 0.1)' }}>
                <div className="text-[10px] text-gray-400 mb-1">轨道参数</div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                  <span className="text-gray-500">类型:</span>
                  <span className="text-gray-300">{ORBIT_RANGES[selectedDanmaku.orbitType || 'medium'].label}</span>
                  <span className="text-gray-500">高度:</span>
                  <span className="text-gray-300">{(selectedDanmaku.altitude / 1000).toFixed(0)} km</span>
                  <span className="text-gray-500">倾角:</span>
                  <span className="text-gray-300">{(selectedDanmaku.inclination * 180 / Math.PI).toFixed(1)}°</span>
                  <span className="text-gray-500">速度:</span>
                  <span className="text-gray-300">{(selectedDanmaku.speed * 1000).toFixed(2)} rad/s</span>
                </div>
              </div>
              
              {/* Markdown 内容 - 截断显示 */}
              {markdownContent ? (
                <div>
                  <div className="text-[10px] text-gray-400 mb-1">详细内容</div>
                  <div className="line-clamp-6">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="text-xs font-bold text-white mb-1">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xs font-semibold text-white mt-2 mb-0.5">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-[10px] font-medium text-white mt-1 mb-0.5">{children}</h3>,
                        p: ({ children }) => <p className="mb-1 text-gray-300 text-[10px]">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-3 mb-1 space-y-0 text-[10px]">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-3 mb-1 space-y-0 text-[10px]">{children}</ol>,
                        li: ({ children }) => <li className="text-gray-300">{children}</li>,
                        code: ({ children }) => <code className="bg-gray-800 px-0.5 rounded text-[9px] font-mono text-blue-300">{children}</code>,
                        pre: ({ children }) => <pre className="bg-gray-800 p-1 rounded overflow-x-auto mb-1 text-[9px]">{children}</pre>,
                        blockquote: ({ children }) => <blockquote className="border-l border-blue-500 pl-2 italic text-gray-400 my-1 text-[10px]">{children}</blockquote>,
                        a: ({ children, href }) => <a href={href} className="text-blue-400 hover:text-blue-300 underline text-[10px]" target="_blank" rel="noopener noreferrer">{children}</a>,
                        hr: () => <hr className="border-gray-700 my-1" />,
                      }}
                    >{markdownContent.length > 150 ? markdownContent.slice(0, 150) + '...' : markdownContent}</ReactMarkdown>
                  </div>
                  {markdownContent.length > 150 && (
                    <div className="mt-1 text-[10px] text-blue-400 cursor-pointer hover:text-blue-300" onClick={() => setIsModalOpen(true)}>
                      点击查看完整内容 →
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-[10px]">暂无详细内容</p>
              )}
            </div>
          </div>
        )}

        {/* Markdown 内容模态框 - 完整显示 */}
        {isModalOpen && selectedDanmaku && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.7)' }}
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="max-w-2xl w-full max-h-[85vh] overflow-auto rounded-lg backdrop-blur-md p-5"
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(96, 165, 250, 0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Satellite className="w-4 h-4" style={{ color: selectedDanmaku.color }} />
                  <span className="text-base font-bold" style={{ color: selectedDanmaku.color }}>
                    {selectedDanmaku.text}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(96, 165, 250, 0.2)', color: '#94a3b8' }}>
                    {ORBIT_RANGES[selectedDanmaku.orbitType || 'medium'].label}
                  </span>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              
              {/* 完整卫星参数 */}
              <div className="mb-3 p-2 rounded" style={{ background: 'rgba(96, 165, 250, 0.1)' }}>
                <div className="text-xs text-gray-400 mb-1.5">轨道参数</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">轨道类型:</span>
                    <span className="text-gray-300">{ORBIT_RANGES[selectedDanmaku.orbitType || 'medium'].label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">轨道高度:</span>
                    <span className="text-gray-300">{(selectedDanmaku.altitude / 1000).toFixed(0)} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">轨道倾角:</span>
                    <span className="text-gray-300">{(selectedDanmaku.inclination * 180 / Math.PI).toFixed(2)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">角速度:</span>
                    <span className="text-gray-300">{(selectedDanmaku.speed * 1000).toFixed(3)} rad/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">初始角度:</span>
                    <span className="text-gray-300">{(selectedDanmaku.angle * 180 / Math.PI).toFixed(2)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">升交点赤经:</span>
                    <span className="text-gray-300">{((selectedDanmaku.raan || 0) * 180 / Math.PI).toFixed(2)}°</span>
                  </div>
                </div>
              </div>
              
              <div className="text-gray-200 text-sm leading-relaxed">
                {markdownContent ? (
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-semibold text-white mt-3 mb-1.5">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-medium text-white mt-2 mb-1">{children}</h3>,
                      p: ({ children }) => <p className="mb-2 text-gray-300 text-xs">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5 text-xs">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5 text-xs">{children}</ol>,
                      li: ({ children }) => <li className="text-gray-300">{children}</li>,
                      code: ({ children }) => <code className="bg-gray-800 px-1 py-0.5 rounded text-[10px] font-mono text-blue-300">{children}</code>,
                      pre: ({ children }) => <pre className="bg-gray-800 p-2 rounded-lg overflow-x-auto mb-2 text-xs">{children}</pre>,
                      blockquote: ({ children }) => <blockquote className="border-l-2 border-blue-500 pl-3 italic text-gray-400 my-2 text-xs">{children}</blockquote>,
                      a: ({ children, href }) => <a href={href} className="text-blue-400 hover:text-blue-300 underline text-xs" target="_blank" rel="noopener noreferrer">{children}</a>,
                      hr: () => <hr className="border-gray-700 my-2" />,
                    }}
                  >{markdownContent}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500 text-xs">暂无详细内容</p>
                )}
              </div>
            </div>
          </div>
        )}

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
              placeholder="输入弹幕内容（卫星标题）..."
              maxLength={15}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-md text-sm text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(96, 165, 250, 0.3)',
              }}
            />

            {/* Markdown 文本开关 */}
            <button
              onClick={() => setShowMarkdownInput(prev => !prev)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-all duration-200"
              style={{
                background: showMarkdownInput ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                color: showMarkdownInput ? '#60a5fa' : '#94a3b8',
              }}
            >
              <FileText className="w-3.5 h-3.5" />
              {showMarkdownInput ? '收起详细内容' : '添加详细内容 (Markdown)'}
            </button>

            {/* Markdown 输入框 */}
            {showMarkdownInput && (
              <>
                <textarea
                  value={markdownText}
                  onChange={(e) => setMarkdownText(e.target.value)}
                  placeholder="输入 Markdown 格式的详细内容..."
                  rows={4}
                  maxLength={300}
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-md text-sm text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 resize-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(96, 165, 250, 0.3)',
                  }}
                />
                <div className="text-xs text-gray-500 text-right">
                  {markdownText.length}/300
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {inputText.length}/15
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
              <span>限制: {remainingQuota.perMinute}/分</span>
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
