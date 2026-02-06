import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, X } from 'lucide-react';
import * as Cesium from 'cesium';

const API_BASE_URL = '/api/danmaku';

interface Danmaku {
  id: string;
  text: string;
  userId: string;
  timestamp: number;
  angle: number;
  speed: number;
  color: string;
}

interface DanmakuSatelliteProps {
  viewer: Cesium.Viewer | null;
  isDark: boolean;
}

export function DanmakuSatellite({ viewer, isDark }: DanmakuSatelliteProps) {
  const [danmakus, setDanmakus] = useState<Danmaku[]>([]);
  const [showDanmaku, setShowDanmaku] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const userId = useRef(`user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const entitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const colors = isDark ? [
    '#60a5fa',
    '#fbbf24',
    '#4ec9b0',
    '#f472b6',
    '#a78bfa',
    '#34d399',
  ] : [
    '#0E639C',
    '#6A9955',
    '#569CD6',
    '#CE9178',
    '#4EC9B0',
    '#D4A017',
  ];

  const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

  const fetchDanmakus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/list`);
      if (response.ok) {
        const data = await response.json();
        setDanmakus(data);
      }
    } catch (error) {
      console.error('Failed to fetch danmakus:', error);
    }
  }, []);

  const addDanmaku = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsLoading(true);
    const newDanmaku: Danmaku = {
      id: `danmaku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      userId: userId.current,
      timestamp: Date.now(),
      angle: Math.random() * Math.PI * 2,
      speed: 0.0001 + Math.random() * 0.0002,
      color: getRandomColor(),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDanmaku),
      });

      if (response.ok) {
        setDanmakus(prev => [...prev, newDanmaku]);
        setInputText('');
      }
    } catch (error) {
      console.error('Failed to add danmaku:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDanmaku = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

  const toggleDanmaku = useCallback(() => {
    setShowDanmaku(prev => !prev);
  }, []);

  useEffect(() => {
    fetchDanmakus();

    pollingIntervalRef.current = setInterval(() => {
      fetchDanmakus();
    }, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchDanmakus]);

  useEffect(() => {
    if (!viewer) return;

    const createDanmakuEntity = (danmaku: Danmaku) => {
      const entity = viewer.entities.add({
        position: new Cesium.CallbackProperty(() => {
          const now = Date.now();
          const elapsed = now - danmaku.timestamp;
          const currentAngle = danmaku.angle + danmaku.speed * elapsed;
          
          const radius = 25000000;
          const x = Math.cos(currentAngle) * radius;
          const y = Math.sin(currentAngle) * radius;
          const z = 0;

          return Cesium.Cartesian3.fromDegrees(
            Cesium.Math.toDegrees(Math.atan2(y, x)),
            Cesium.Math.toDegrees(Math.asin(z / radius)),
            300000
          );
        }, false) as any,
        point: {
          pixelSize: 4,
          color: Cesium.Color.fromCssColorString(danmaku.color),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: danmaku.text,
          font: '14px sans-serif',
          fillColor: Cesium.Color.fromCssColorString(danmaku.color),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -20),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          show: showDanmaku,
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
    });

    return () => {
      entitiesRef.current.forEach((entity) => {
        viewer.entities.remove(entity);
      });
      entitiesRef.current.clear();
    };
  }, [viewer, danmakus, showDanmaku]);

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
              {showDanmaku ? '弹幕开' : '弹幕关'}
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

        {isInputVisible && (
          <div
            className="flex flex-col gap-2 p-3 rounded-lg backdrop-blur-sm"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              minWidth: '280px',
            }}
          >
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

            {danmakus.filter(d => d.userId === userId.current).length > 0 && (
              <div className="mt-2 pt-2 border-t" style={{ borderColor: 'rgba(96, 165, 250, 0.2)' }}>
                <div className="text-xs text-gray-400 mb-2">我的弹幕 (可删除)</div>
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                  {danmakus
                    .filter(d => d.userId === userId.current)
                    .map(danmaku => (
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
